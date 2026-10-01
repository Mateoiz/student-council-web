"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle2, LogOut, RotateCcw, AlertTriangle, XCircle } from "lucide-react";
import Navbar from "@/components/Navbar";

/* ─── Injected CSS (Flair Aesthetic) ───────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes flair-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

.flair-btn { 
  transition: background 0.15s ease, transform 0.1s ease, border-color 0.15s ease, color 0.15s ease; 
  cursor: pointer; 
}
.flair-btn:active { transform: scale(0.97); }
.flair-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.flair-input {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px; 
  transition: border-color 0.25s ease, background 0.25s ease;
  appearance: none;
  outline: none;
}
.flair-input:focus {
  border-color: #06402B !important;
  background: rgba(6,64,43,0.04) !important;
}

/* Scanner specific frame styles */
#qr-reader {
  width: 100%;
  height: 100%;
  border: none !important;
}
#qr-reader__scan_region {
  background: #111111;
  min-height: 100%;
}
#qr-reader video {
  object-fit: cover !important;
  width: 100% !important;
  height: 100% !important;
}
#qr-reader__dashboard { display: none !important; }
`;

// ─── Types & Constants ────────────────────────────────────────────────────────

type EventKey = "flair" | "seminar";
type ScanAction = "in" | "out";

const EVENTS: Record<EventKey, { label: string; subtitle: string; table: string; prefix: string; color: string }> = {
  flair: {
    label: "FLAIR",
    subtitle: "USC Frosh Walk 2026",
    table: "flair_registrations",
    prefix: "flair:",
    color: "#06402B",
  },
  seminar: {
    label: "CAST Seminar",
    subtitle: "Suicide Prevention Month Seminar",
    table: "cast_seminar_registrations",
    prefix: "seminar:",
    color: "#dc2626",
  },
};

const ID_REGEX = /^20\d{2}-\d{2}-\d{6}$/;
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEADER_H = "5rem";

type ScanResult =
  | { state: "idle" }
  | { state: "scanning" }
  | { state: "loading" }
  | { state: "already_attended"; data: any; action: ScanAction }
  | { state: "never_checked_in"; data: any }
  | {
      state: "success";
      data: any;
      action: ScanAction;
      timestamp: string;
      prevStatus?: string | null;
      prevCheckedInAt?: string | null;
      prevCheckedOutAt?: string | null;
    }
  | { state: "not_found" }
  | { state: "error"; message: string };

type ScanMode = "camera" | "upload";

type RecentScan = {
  name: string;
  idNumber?: string;
  status: "checked_in" | "checked_out" | "duplicate" | "not_found" | "error";
  time: number;
  timeString: string;
  action: ScanAction;
};

type SessionStats = { scanned: number; checkedIn: number; checkedOut: number; duplicate: number; error: number };

const EMPTY_STATS: SessionStats = { scanned: 0, checkedIn: 0, checkedOut: 0, duplicate: 0, error: 0 };
const CREAM = "#F4EFE6";
const DARK  = "#111111";
const GREEN = "#06402B";
const BLUE  = "#1d4ed8";
const RED   = "#dc2626";

const dg   = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss   = { fontFamily: "'Source Serif 4', serif" } as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTimePH(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function getDuration(startIso?: string | null, endIso?: string | null) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;
  const diffMins = Math.floor((end - start) / (1000 * 60));
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hrs > 0) return `${hrs}h ${mins}m stay`;
  return `${mins} min stay`;
}

// ─── Local Storage Helpers ────────────────────────────────────────────────────

function loadStats(): SessionStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try {
    const raw = JSON.parse(sessionStorage.getItem("flair_scan_stats") || "null");
    return raw ? { ...EMPTY_STATS, ...raw } : EMPTY_STATS;
  } catch {
    return EMPTY_STATS;
  }
}

function loadRecent(): RecentScan[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(sessionStorage.getItem("flair_recent_scans") || "null") || []; } 
  catch { return []; }
}

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const autoResumeTimeoutRef = useRef<any>(null);
  const autoResumeIntervalRef = useRef<any>(null);

  const [eventKey, setEventKey] = useState<EventKey>("flair");
  const [scanAction, setScanAction] = useState<ScanAction>("in");

  const [result, setResult] = useState<ScanResult>({ state: "idle" });
  const [scanMode, setScanMode] = useState<ScanMode>("camera");
  const [justLocked, setJustLocked] = useState(false);

  const [authUser, setAuthUser] = useState<any>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [sessionStats, setSessionStats] = useState<SessionStats>(EMPTY_STATS);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [recentOpen, setRecentOpen] = useState(false);

  const [autoContinue, setAutoContinue] = useState(true);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);

  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const [undoing, setUndoing] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"unknown" | "prompting" | "granted" | "denied" | "unavailable">("unknown");

  const processingRef = useRef(false);
  const activeEvent = EVENTS[eventKey];
  const accent = activeEvent.color;

  // Initialize CSS
  useEffect(() => {
    const id = "flair-scanner-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Online status & Local Storage
  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    setSessionStats(loadStats());
    setRecentScans(loadRecent());

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Check Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthUser(session?.user ?? null);
      setIsCheckingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Feedback (Audio/Vibration)
  const playFeedback = useCallback((type: "success" | "duplicate" | "error") => {
    if (soundOn) {
      try {
        if (!audioCtxRef.current) {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
          audioCtxRef.current = new Ctx();
        }
        const ctx = audioCtxRef.current;
        const now = ctx.currentTime;
        const beep = (freq: number, start: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.0001, now + start);
          gain.gain.exponentialRampToValueAtTime(0.2, now + start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + start);
          osc.stop(now + start + dur + 0.02);
        };
        if (type === "success") { beep(880, 0, 0.12); beep(1320, 0.13, 0.14); }
        else if (type === "duplicate") { beep(600, 0, 0.15); beep(600, 0.2, 0.15); }
        else { beep(220, 0, 0.25); }
      } catch {}
    }
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      if (type === "success") navigator.vibrate(60);
      else if (type === "duplicate") navigator.vibrate([50, 80, 50]);
      else navigator.vibrate([120, 60, 120]);
    }
  }, [soundOn]);

  const recordScan = useCallback((entry: Omit<RecentScan, "time" | "timeString">) => {
    const now = Date.now();
    const timeString = formatTimePH(new Date(now).toISOString());
    setSessionStats(prev => {
      const next: SessionStats = {
        scanned: prev.scanned + 1,
        checkedIn: prev.checkedIn + (entry.status === "checked_in" ? 1 : 0),
        checkedOut: prev.checkedOut + (entry.status === "checked_out" ? 1 : 0),
        duplicate: prev.duplicate + (entry.status === "duplicate" ? 1 : 0),
        error: prev.error + (entry.status === "not_found" || entry.status === "error" ? 1 : 0),
      };
      try { sessionStorage.setItem("flair_scan_stats", JSON.stringify(next)); } catch {}
      return next;
    });
    setRecentScans(prev => {
      const next = [{ ...entry, time: now, timeString }, ...prev].slice(0, 10);
      try { sessionStorage.setItem("flair_recent_scans", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleResetSession = useCallback(() => {
    if (!window.confirm("Reset session counters and scan log? This won't undo any check-ins recorded in the database.")) return;
    setSessionStats(EMPTY_STATS);
    setRecentScans([]);
    try {
      sessionStorage.removeItem("flair_scan_stats");
      sessionStorage.removeItem("flair_recent_scans");
    } catch {}
  }, []);

  // ── Supabase Resolution & Check-in / Check-out ─────────────────────────────

  const resolveManualInput = useCallback(async (rawInput: string) => {
    const clean = rawInput.trim();
    if (!clean) return null;
    const { table } = EVENTS[eventKey];

    // 1. Student ID number (e.g. 2026-01-123456)
    if (ID_REGEX.test(clean)) {
      const { data, error } = await supabase
        .from(table)
        .select("id")
        .eq("id_number", clean)
        .limit(1);
      if (!error && data && data.length > 0) return { id: data[0].id };
      return null;
    }

    // 2. Full UUID
    if (UUID_REGEX.test(clean)) {
      return { id: clean };
    }

    // 3. Fallback: short prefix match against ID or id_number
    const { data, error } = await supabase
      .from(table)
      .select("id, id_number")
      .limit(200);

    if (error || !data) return null;
    const upper = clean.toUpperCase();
    const matched = data.find(
      row =>
        String(row.id).toUpperCase().startsWith(upper) ||
        String(row.id_number ?? "").toUpperCase() === upper
    );
    return matched ? { id: matched.id } : null;
  }, [eventKey]);

  const checkInOrOutDocRef = useCallback(async (docId: string) => {
    const { table } = EVENTS[eventKey];

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", docId)
      .single();

    if (error || !data) {
      setResult({ state: "not_found" });
      recordScan({ name: "Unknown reference", status: "not_found", action: scanAction });
      playFeedback("error");
      return;
    }

    const now = new Date().toISOString();

    // ── CHECK-IN FLOW ──
    if (scanAction === "in") {
      const alreadyIn = data.status === "checked_in" || Boolean(data.checked_in_at);
      if (alreadyIn) {
        setResult({ state: "already_attended", data, action: "in" });
        recordScan({ name: data.full_name, idNumber: data.id_number, status: "duplicate", action: "in" });
        playFeedback("duplicate");
        return;
      }

      const { error: updateErr } = await supabase
        .from(table)
        .update({
          status: "checked_in",
          checked_in_at: now,
        })
        .eq("id", docId);

      if (updateErr) throw updateErr;

      const updatedData = { ...data, status: "checked_in", checked_in_at: now };
      setResult({
        state: "success",
        data: updatedData,
        action: "in",
        timestamp: now,
        prevStatus: data.status ?? "pre_registered",
        prevCheckedInAt: data.checked_in_at ?? null,
        prevCheckedOutAt: data.checked_out_at ?? null,
      });
      recordScan({ name: data.full_name, idNumber: data.id_number, status: "checked_in", action: "in" });
      playFeedback("success");
      return;
    }

    // ── CHECK-OUT FLOW ──
    const hasCheckedIn = Boolean(data.checked_in_at || data.status === "checked_in");
    if (!hasCheckedIn) {
      setResult({ state: "never_checked_in", data });
      recordScan({ name: data.full_name, idNumber: data.id_number, status: "error", action: "out" });
      playFeedback("duplicate");
      return;
    }

    const alreadyCheckedOut = Boolean(data.checked_out_at || data.status === "checked_out");
    if (alreadyCheckedOut) {
      setResult({ state: "already_attended", data, action: "out" });
      recordScan({ name: data.full_name, idNumber: data.id_number, status: "duplicate", action: "out" });
      playFeedback("duplicate");
      return;
    }

    const { error: outErr } = await supabase
      .from(table)
      .update({
        status: "checked_out",
        checked_out_at: now,
      })
      .eq("id", docId);

    if (outErr) throw outErr;

    const updatedData = { ...data, status: "checked_out", checked_out_at: now };
    setResult({
      state: "success",
      data: updatedData,
      action: "out",
      timestamp: now,
      prevStatus: data.status ?? "checked_in",
      prevCheckedInAt: data.checked_in_at ?? null,
      prevCheckedOutAt: data.checked_out_at ?? null,
    });
    recordScan({ name: data.full_name, idNumber: data.id_number, status: "checked_out", action: "out" });
    playFeedback("success");
  }, [eventKey, scanAction, recordScan, playFeedback]);

  // ── Scanner Engine ─────────────────────────────────────────────────────────

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning && typeof scannerRef.current.stop === "function") {
          await scannerRef.current.stop();
        }
        if (typeof scannerRef.current.clear === "function") {
          scannerRef.current.clear();
        }
      } catch (err) { console.warn("Scanner teardown warning:", err); }
      scannerRef.current = null;
    }
  }, []);

  const processQR = useCallback(async (rawValue: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    if (!navigator.onLine) {
      setResult({ state: "error", message: "You are offline. Reconnect to Wi-Fi/Data to scan." });
      recordScan({ name: "Network Error", status: "error", action: scanAction });
      playFeedback("error");
      return;
    }

    const trimmed = rawValue.trim();
    const otherEvent: EventKey = eventKey === "flair" ? "seminar" : "flair";

    if (trimmed.startsWith(EVENTS[otherEvent].prefix)) {
      setResult({
        state: "error",
        message: `This is a ${EVENTS[otherEvent].label} QR code. Switch the active event toggle to ${EVENTS[otherEvent].label}.`,
      });
      recordScan({ name: `Wrong event (${EVENTS[otherEvent].label})`, status: "error", action: scanAction });
      playFeedback("error");
      return;
    }

    let docId = "";
    if (trimmed.startsWith(activeEvent.prefix)) {
      docId = trimmed.slice(activeEvent.prefix.length).trim();
    } else if (UUID_REGEX.test(trimmed)) {
      docId = trimmed;
    } else if (ID_REGEX.test(trimmed)) {
      setResult({ state: "loading" });
      const resolved = await resolveManualInput(trimmed);
      if (!resolved) {
        setResult({ state: "not_found" });
        recordScan({ name: trimmed, status: "not_found", action: scanAction });
        playFeedback("error");
        return;
      }
      docId = resolved.id;
    } else {
      setResult({ state: "error", message: `Invalid QR code. Not a registered ${activeEvent.label} attendee.` });
      recordScan({ name: "Unrecognized format", status: "error", action: scanAction });
      playFeedback("error");
      return;
    }

    setResult({ state: "loading" });

    try {
      await checkInOrOutDocRef(docId);
    } catch (err: any) {
      console.error("Scan Error:", err);
      setResult({ state: "error", message: err.message || err.details || "Failed to update database record." });
      recordScan({ name: "System Error", status: "error", action: scanAction });
      playFeedback("error");
    }
  }, [eventKey, activeEvent, scanAction, recordScan, playFeedback, checkInOrOutDocRef, resolveManualInput]);

  const processManualCode = useCallback(async (code: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    if (!navigator.onLine) {
      setResult({ state: "error", message: "You are offline. Reconnect to scan." });
      playFeedback("error");
      return;
    }

    setResult({ state: "loading" });

    try {
      const resolved = await resolveManualInput(code);
      if (!resolved) {
        setResult({ state: "not_found" });
        recordScan({ name: `Code ${code.toUpperCase()}`, status: "not_found", action: scanAction });
        playFeedback("error");
        return;
      }
      await checkInOrOutDocRef(resolved.id);
    } catch (err: any) {
      console.error("Manual Scan Error:", err);
      setResult({ state: "error", message: err.message || err.details || "Failed to verify code." });
      playFeedback("error");
    }
  }, [scanAction, recordScan, playFeedback, checkInOrOutDocRef, resolveManualInput]);

  const startCameraScanner = useCallback(async () => {
    if (scannerRef.current) return;

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraPermission("unavailable");
      setResult({ state: "error", message: "Camera not supported on this device." });
      return;
    }

    setCameraPermission("prompting");
    setResult({ state: "scanning" });
    setUploadPreview(null);
    processingRef.current = false;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraPermission("granted");
    } catch (err: any) {
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        setResult({ state: "error", message: "Camera access denied. Please allow camera permissions." });
      } else {
        setCameraPermission("unavailable");
        setResult({ state: "error", message: "Couldn't access the camera. Please retry." });
      }
      return;
    } finally {
      stream?.getTracks().forEach(t => t.stop());
    }

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (containerRef.current) containerRef.current.innerHTML = '<div id="qr-reader"></div>';

      const scanner = new Html5Qrcode("qr-reader", { verbose: false });
      await scanner.start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 320, height: 320 }, aspectRatio: 1 },
        (decodedText: string) => {
          if (!processingRef.current) {
            setJustLocked(true);
            setTimeout(() => setJustLocked(false), 500);
          }
          processQR(decodedText);
        },
        () => {}
      );

      scannerRef.current = scanner;
    } catch {
      setResult({ state: "error", message: "Camera initialization failed." });
    }
  }, [processQR]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setResult({ state: "error", message: "Please upload a valid image file." });
      return;
    }

    await stopScanner();
    setIsUploading(true);
    setResult({ state: "loading" });
    setUploadPreview(URL.createObjectURL(file));

    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const qrScanner = new Html5Qrcode("qr-file-reader");
      const decodedText = await qrScanner.scanFile(file, true);
      await qrScanner.clear();

      processingRef.current = false;
      await processQR(decodedText);
    } catch {
      setResult({ state: "error", message: "No readable QR code found in this image." });
      recordScan({ name: "Unreadable image", status: "error", action: scanAction });
      playFeedback("error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [processQR, stopScanner, recordScan, playFeedback, scanAction]);

  const switchMode = useCallback(async (mode: ScanMode) => {
    await stopScanner();
    setResult({ state: "idle" });
    setUploadPreview(null);
    setScanMode(mode);
    processingRef.current = false;
  }, [stopScanner]);

  useEffect(() => {
    if (!authUser || scanMode !== "camera") return;
    startCameraScanner();
    return () => { stopScanner(); };
  }, [authUser, scanMode, startCameraScanner, stopScanner]);

  const handleReset = useCallback(() => {
    if (autoResumeTimeoutRef.current) clearTimeout(autoResumeTimeoutRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    setAutoCountdown(null);
    setUploadPreview(null);

    if (scanMode === "camera") setResult({ state: "scanning" });
    else setResult({ state: "idle" });

    processingRef.current = false;
  }, [scanMode]);

  // Undo Check-in/Check-out
  const handleUndo = useCallback(async () => {
    if (result.state !== "success") return;
    const actionLabel = result.action === "in" ? "check-in" : "check-out";
    if (!window.confirm(`Undo ${actionLabel} for ${result.data.full_name}?`)) return;

    setUndoing(true);
    try {
      const { table } = EVENTS[eventKey];
      const restorePayload =
        result.action === "in"
          ? { status: result.prevStatus ?? "pre_registered", checked_in_at: result.prevCheckedInAt ?? null }
          : { status: result.prevStatus ?? "checked_in", checked_out_at: result.prevCheckedOutAt ?? null };

      await supabase
        .from(table)
        .update(restorePayload)
        .eq("id", result.data.id);

      setSessionStats(prev => {
        const next = {
          ...prev,
          checkedIn: result.action === "in" ? Math.max(0, prev.checkedIn - 1) : prev.checkedIn,
          checkedOut: result.action === "out" ? Math.max(0, prev.checkedOut - 1) : prev.checkedOut,
        };
        try { sessionStorage.setItem("flair_scan_stats", JSON.stringify(next)); } catch {}
        return next;
      });

      setRecentScans(prev => {
        const targetStatus = result.action === "in" ? "checked_in" : "checked_out";
        const next = prev.filter(s => !(s.time === prev[0]?.time && s.status === targetStatus));
        try { sessionStorage.setItem("flair_recent_scans", JSON.stringify(next)); } catch {}
        return next;
      });

      handleReset();
    } catch {
      alert(`Failed to undo ${actionLabel}. Try again.`);
    } finally {
      setUndoing(false);
    }
  }, [result, eventKey, handleReset]);

  // Auto-Resume Timer Loop
  useEffect(() => {
    if (!autoContinue || scanMode !== "camera") return;
    if (result.state !== "success" && result.state !== "already_attended") return;

    let remaining = 2;
    setAutoCountdown(remaining);
    autoResumeIntervalRef.current = setInterval(() => {
      remaining -= 1;
      setAutoCountdown(remaining);
      if (remaining <= 0 && autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    }, 1000);
    autoResumeTimeoutRef.current = setTimeout(() => { handleReset(); }, 2400);

    return () => {
      if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
      if (autoResumeTimeoutRef.current) clearTimeout(autoResumeTimeoutRef.current);
      setAutoCountdown(null);
    };
  }, [result.state, autoContinue, scanMode, handleReset]);

  const handleManualSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const code = manualCode.trim();
    if (!code || manualSubmitting) return;
    setManualSubmitting(true);
    setManualEntryOpen(false);
    setManualCode("");
    await processManualCode(code);
    setManualSubmitting(false);
  }, [manualCode, manualSubmitting, processManualCode]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (isCheckingAuth) {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
        <p style={{ ...mono, fontSize: "0.75rem", color: DARK, letterSpacing: "0.2em", textTransform: "uppercase" }}>Verifying access…</p>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "2rem", textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: RED, fontSize: "1.5rem" }}>🔒</div>
        <div>
          <h2 style={{ ...dg, fontSize: "1.5rem", color: DARK, margin: "0 0 0.5rem" }}>ACCESS RESTRICTED</h2>
          <p style={{ ...ss, fontSize: "0.95rem", color: "#666" }}>You must be logged in as an admin to operate the door scanner.</p>
        </div>
        <button onClick={() => router.push("/admin/login?redirect=/scan")} className="flair-btn" style={{ ...mono, padding: "1rem 2rem", background: GREEN, color: CREAM, border: "none", borderRadius: 4, letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem" }}>
          Log In
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: CREAM,
        color: DARK,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        ...ss,
      }}
    >
      <Navbar />

      {/* Top Navbar Shield */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: `calc(${HEADER_H} + env(safe-area-inset-top))`,
          background: CREAM,
          zIndex: 19,
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
          padding: `calc(${HEADER_H} + env(safe-area-inset-top) + 1.25rem) 1.25rem calc(3.5rem + env(safe-area-inset-bottom))`,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => router.push("/admin/register")}
            className="flair-btn"
            style={{
              ...mono,
              background: "none",
              border: "none",
              padding: 0,
              fontSize: "0.7rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#666",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Register Hub
          </button>
          <span
            style={{
              ...mono,
              fontSize: "0.62rem",
              padding: "0.25rem 0.55rem",
              borderRadius: 4,
              background: isOnline ? "rgba(6,64,43,0.1)" : "rgba(220,38,38,0.1)",
              color: isOnline ? GREEN : RED,
              fontWeight: 600,
              textTransform: "uppercase",
            }}
          >
            {isOnline ? "● Live Network" : "○ Offline"}
          </span>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", margin: "0.25rem 0 0.5rem" }}>
          <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: accent, margin: "0 0 0.25rem", transition: "color 0.2s ease" }}>
            {activeEvent.subtitle}
          </p>
          <h1 style={{ ...dg, fontSize: "clamp(1.8rem, 6.5vw, 2.5rem)", lineHeight: 1, margin: 0 }}>
            DOOR SCANNER
          </h1>
        </div>

        {/* ── Event & Mode Switches ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {/* Event Picker (FLAIR vs CAST Seminar) */}
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(Object.keys(EVENTS) as EventKey[]).map(key => {
              const ev = EVENTS[key];
              const active = eventKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setEventKey(key); handleReset(); }}
                  className="flair-btn"
                  style={{
                    flex: 1,
                    padding: "0.75rem",
                    borderRadius: 6,
                    border: `1.5px solid ${active ? ev.color : "rgba(17,17,17,0.15)"}`,
                    background: active ? ev.color : "#ffffff",
                    color: active ? CREAM : DARK,
                    ...mono,
                    fontSize: "0.7rem",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                  }}
                >
                  {ev.label}
                </button>
              );
            })}
          </div>

          {/* Action Picker (CHECK IN vs CHECK OUT) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              background: "rgba(17,17,17,0.06)",
              padding: "0.3rem",
              borderRadius: 8,
            }}
          >
            <button
              type="button"
              onClick={() => { setScanAction("in"); handleReset(); }}
              className="flair-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0.7rem 0.5rem",
                borderRadius: 6,
                border: "none",
                background: scanAction === "in" ? GREEN : "transparent",
                color: scanAction === "in" ? CREAM : DARK,
                ...mono,
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={15} /> Check-In Mode
            </button>

            <button
              type="button"
              onClick={() => { setScanAction("out"); handleReset(); }}
              className="flair-btn"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                padding: "0.7rem 0.5rem",
                borderRadius: 6,
                border: "none",
                background: scanAction === "out" ? BLUE : "transparent",
                color: scanAction === "out" ? CREAM : DARK,
                ...mono,
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              <LogOut size={15} /> Check-Out Mode
            </button>
          </div>
        </div>

        {/* ── Stats & Controls ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, padding: "0.9rem 1.1rem" }}>
            <div style={{ display: "flex", gap: "1.2rem" }}>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.58rem", color: "#888", letterSpacing: "0.12em", textTransform: "uppercase" }}>Total</span>
                <span style={{ ...mono, fontSize: "1.25rem", fontWeight: 600 }}>{sessionStats.scanned}</span>
              </div>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.58rem", color: GREEN, letterSpacing: "0.12em", textTransform: "uppercase" }}>In</span>
                <span style={{ ...mono, fontSize: "1.25rem", fontWeight: 600, color: GREEN }}>{sessionStats.checkedIn}</span>
              </div>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.58rem", color: BLUE, letterSpacing: "0.12em", textTransform: "uppercase" }}>Out</span>
                <span style={{ ...mono, fontSize: "1.25rem", fontWeight: 600, color: BLUE }}>{sessionStats.checkedOut}</span>
              </div>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.58rem", color: "#ca8a04", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dupes</span>
                <span style={{ ...mono, fontSize: "1.25rem", fontWeight: 600, color: "#ca8a04" }}>{sessionStats.duplicate}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetSession}
              className="flair-btn"
              style={{
                background: "transparent",
                border: "1px solid rgba(17,17,17,0.18)",
                borderRadius: 4,
                padding: "0.4rem 0.65rem",
                ...mono,
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
              }}
            >
              RESET
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              type="button"
              onClick={() => setAutoContinue(!autoContinue)}
              className="flair-btn"
              style={{
                flex: 1,
                padding: "0.65rem",
                background: autoContinue ? "rgba(6,64,43,0.08)" : "transparent",
                border: `1px solid ${autoContinue ? GREEN : "rgba(17,17,17,0.15)"}`,
                color: autoContinue ? GREEN : "#666",
                borderRadius: 4,
                ...mono,
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Auto Resume: {autoContinue ? "ON" : "OFF"}
            </button>
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              className="flair-btn"
              style={{
                flex: 1,
                padding: "0.65rem",
                background: soundOn ? "rgba(6,64,43,0.08)" : "transparent",
                border: `1px solid ${soundOn ? GREEN : "rgba(17,17,17,0.15)"}`,
                color: soundOn ? GREEN : "#666",
                borderRadius: 4,
                ...mono,
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              Audio Beep: {soundOn ? "ON" : "OFF"}
            </button>
          </div>

          <div style={{ display: "flex", background: "rgba(17,17,17,0.04)", borderRadius: 6, padding: "0.25rem" }}>
            <button type="button" onClick={() => switchMode("camera")} className="flair-btn" style={{ flex: 1, padding: "0.65rem", background: scanMode === "camera" ? "#fff" : "transparent", border: "none", borderRadius: 4, boxShadow: scanMode === "camera" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", color: scanMode === "camera" ? DARK : "#888", ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>Camera Scan</button>
            <button type="button" onClick={() => switchMode("upload")} className="flair-btn" style={{ flex: 1, padding: "0.65rem", background: scanMode === "upload" ? "#fff" : "transparent", border: "none", borderRadius: 4, boxShadow: scanMode === "upload" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", color: scanMode === "upload" ? DARK : "#888", ...mono, fontSize: "0.65rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>File / Photo</button>
          </div>
        </div>

        {/* ── Camera / Upload Viewport ── */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: DARK, borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.12)" }}>
          {scanMode === "camera" && (
            <>
              <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
                <div id="qr-reader" />
              </div>

              {(result.state === "scanning" || result.state === "loading") && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <motion.div animate={{ scale: justLocked ? 0.9 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} style={{ width: "70%", height: "70%", border: `4px solid ${justLocked ? (scanAction === "in" ? GREEN : BLUE) : "rgba(255,255,255,0.2)"}`, borderRadius: 16, position: "relative" }}>
                    {!justLocked && result.state === "scanning" && (
                      <motion.div animate={{ y: ["0%", "300%"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatType: "reverse" }} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: scanAction === "in" ? "#10b981" : "#3b82f6", boxShadow: `0 0 16px ${scanAction === "in" ? "#10b981" : "#3b82f6"}`, opacity: 0.9 }} />
                    )}
                  </motion.div>
                </div>
              )}

              {result.state === "scanning" && (
                <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", background: scanAction === "in" ? "rgba(6,64,43,0.85)" : "rgba(29,78,216,0.85)", backdropFilter: "blur(8px)", padding: "0.45rem 1rem", borderRadius: 20, color: "#fff", ...mono, fontSize: "0.62rem", letterSpacing: "0.14em", textTransform: "uppercase", zIndex: 20, whiteSpace: "nowrap" }}>
                  {activeEvent.label} · Mode: {scanAction === "in" ? "Check In" : "Check Out"}
                </div>
              )}
            </>
          )}

          {scanMode === "upload" && (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#ffffff" }}>
              <div id="qr-file-reader" style={{ display: "none" }} />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />

              {uploadPreview ? (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <img src={uploadPreview} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "contain", background: DARK }} />
                  {isUploading && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #fff", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
                    </div>
                  )}
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flair-btn" style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", border: "none", padding: "0.6rem 1.2rem", borderRadius: 20, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", color: DARK }}>
                    Upload Different Image
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="flair-btn" style={{ width: "80%", height: "80%", border: "2px dashed rgba(17,17,17,0.2)", borderRadius: 16, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>📁</span>
                  <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#666" }}>Tap to select QR image</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Manual Entry Form ── */}
        <div>
          {!manualEntryOpen ? (
            <button type="button" onClick={() => setManualEntryOpen(true)} className="flair-btn" style={{ width: "100%", padding: "0.9rem", background: "transparent", border: "1px dashed rgba(17,17,17,0.2)", borderRadius: 8, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", color: "#666", textTransform: "uppercase" }}>
              Trouble scanning? Type student ID or ref code
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                autoFocus
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                placeholder="20XX-XX-XXXXXX or Code"
                disabled={manualSubmitting}
                className="flair-input"
                style={{ flex: 1, padding: "0.85rem", border: `1.5px solid ${accent}`, borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.1em", background: "#ffffff" }}
              />
              <button type="submit" disabled={manualSubmitting || !manualCode.trim()} className="flair-btn" style={{ padding: "0 1.5rem", background: accent, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.7rem", letterSpacing: "0.15em" }}>
                {manualSubmitting ? "..." : "GO"}
              </button>
              <button type="button" onClick={() => { setManualEntryOpen(false); setManualCode(""); }} className="flair-btn" style={{ padding: "0 1rem", background: "rgba(17,17,17,0.06)", color: DARK, border: "none", borderRadius: 8 }}>
                ✕
              </button>
            </form>
          )}
        </div>

        {/* ── Real-Time Recent Log ── */}
        {recentScans.length > 0 && (
          <div style={{ background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, overflow: "hidden" }}>
            <button type="button" onClick={() => setRecentOpen(!recentOpen)} className="flair-btn" style={{ width: "100%", padding: "0.9rem 1.1rem", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", ...mono, fontSize: "0.65rem", letterSpacing: "0.14em", color: "#666", textTransform: "uppercase" }}>
              <span>Recent Door Scans ({recentScans.length})</span>
              <span>{recentOpen ? "▲" : "▼"}</span>
            </button>
            <AnimatePresence>
              {recentOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                  <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    {recentScans.map((scan, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(17,17,17,0.05)", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", overflow: "hidden" }}>
                          <span style={{ fontSize: "0.75rem", flexShrink: 0 }}>
                            {scan.status === "checked_in" ? "🟢" : scan.status === "checked_out" ? "🔵" : scan.status === "duplicate" ? "🟠" : "🔴"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ ...ss, fontSize: "0.85rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scan.name}</p>
                            <div style={{ ...mono, fontSize: "0.62rem", color: "#888", display: "flex", gap: "0.5rem", marginTop: 2 }}>
                              {scan.idNumber && <span>{scan.idNumber}</span>}
                              <span>·</span>
                              <span style={{ color: scan.action === "in" ? GREEN : BLUE, fontWeight: 500 }}>
                                {scan.action === "in" ? "Check-In" : "Check-Out"} ({scan.timeString})
                              </span>
                            </div>
                          </div>
                        </div>
                        <span style={{ ...mono, fontSize: "0.55rem", color: "#aaa", flexShrink: 0, marginLeft: "0.5rem" }}>{timeAgo(scan.time)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Scan Result Modal / Bottom Sheet ── */}
      <AnimatePresence>
        {["success", "already_attended", "never_checked_in", "not_found", "error"].includes(result.state) && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleReset}
              style={{ position: "fixed", inset: 0, background: "rgba(17,17,17,0.55)", backdropFilter: "blur(4px)", zIndex: 40 }}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{
                position: "fixed",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                maxWidth: 520,
                margin: "0 auto",
                padding: "1.5rem",
                paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
                background: "#ffffff",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                boxShadow: "0 -12px 48px rgba(0,0,0,0.18)",
              }}
            >
              <div style={{ width: 40, height: 4, background: "rgba(17,17,17,0.12)", borderRadius: 2, margin: "0 auto 1.25rem" }} />

              {/* SUCCESS RESULT */}
              {result.state === "success" && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: result.action === "in" ? "rgba(6,64,43,0.1)" : "rgba(29,78,216,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: result.action === "in" ? GREEN : BLUE }}>
                      {result.action === "in" ? <CheckCircle2 size={28} /> : <LogOut size={28} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.62rem", color: result.action === "in" ? GREEN : BLUE, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 0.15rem" }}>
                        {result.action === "in" ? "✓ Check-In Confirmed" : "✓ Check-Out Confirmed"} · {activeEvent.label}
                      </p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {result.data.full_name}
                      </p>
                    </div>
                  </div>

                  {/* Registered Timestamps Tracker */}
                  <div style={{ background: "rgba(17,17,17,0.03)", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", border: "1px solid rgba(17,17,17,0.08)" }}>
                    <div style={{ background: "#ffffff", padding: "0.65rem 0.75rem", borderRadius: 6, border: `1px solid ${result.data.checked_in_at ? "rgba(6,64,43,0.2)" : "rgba(17,17,17,0.08)"}` }}>
                      <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: result.data.checked_in_at ? GREEN : "#888" }}>
                        01 · Time In
                      </span>
                      <span style={{ ...mono, display: "block", fontSize: "0.85rem", fontWeight: 600, color: result.data.checked_in_at ? GREEN : "#666", marginTop: "0.2rem" }}>
                        {formatTimePH(result.data.checked_in_at)}
                      </span>
                    </div>

                    <div style={{ background: "#ffffff", padding: "0.65rem 0.75rem", borderRadius: 6, border: `1px solid ${result.data.checked_out_at ? "rgba(29,78,216,0.2)" : "rgba(17,17,17,0.08)"}` }}>
                      <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.14em", textTransform: "uppercase", color: result.data.checked_out_at ? BLUE : "#888" }}>
                        02 · Time Out
                      </span>
                      <span style={{ ...mono, display: "block", fontSize: "0.85rem", fontWeight: 600, color: result.data.checked_out_at ? BLUE : "#666", marginTop: "0.2rem" }}>
                        {formatTimePH(result.data.checked_out_at)}
                      </span>
                    </div>

                    {result.action === "out" && getDuration(result.data.checked_in_at, result.data.checked_out_at) && (
                      <div style={{ gridColumn: "1 / -1", textAlign: "center", ...mono, fontSize: "0.68rem", color: "#666", paddingTop: "0.2rem" }}>
                        Total Duration: <strong style={{ color: DARK }}>{getDuration(result.data.checked_in_at, result.data.checked_out_at)}</strong>
                      </div>
                    )}
                  </div>

                  {/* Student Details Card */}
                  <div style={{ background: "rgba(17,17,17,0.02)", borderRadius: 8, padding: "0.85rem 1rem", marginBottom: "1.25rem", display: "flex", flexDirection: "column", gap: "0.45rem", border: "1px solid rgba(17,17,17,0.06)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.62rem", color: "#888" }}>ID NUMBER</span>
                      <span style={{ ...mono, fontSize: "0.72rem", fontWeight: 600 }}>{result.data.id_number}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.62rem", color: "#888" }}>PROGRAM</span>
                      <span style={{ ...mono, fontSize: "0.72rem", fontWeight: 500 }}>{result.data.college} • {result.data.program}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.62rem", color: "#888" }}>SECTION</span>
                      <span style={{ ...mono, fontSize: "0.72rem", fontWeight: 500 }}>{result.data.year_level} • Block {result.data.block}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button type="button" onClick={handleReset} className="flair-btn" style={{ flex: 1, padding: "1rem", background: DARK, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
                      Scan Next
                    </button>
                    {result.action === "in" && (
                      <button
                        type="button"
                        onClick={() => { setScanAction("out"); handleReset(); }}
                        className="flair-btn"
                        style={{
                          padding: "0 1rem",
                          background: "rgba(29,78,216,0.1)",
                          border: "1px solid rgba(29,78,216,0.25)",
                          color: BLUE,
                          borderRadius: 8,
                          ...mono,
                          fontSize: "0.65rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        Switch to Out
                      </button>
                    )}
                    <button type="button" onClick={handleUndo} disabled={undoing} className="flair-btn" style={{ padding: "0 1rem", background: "transparent", border: "1px solid rgba(17,17,17,0.2)", color: DARK, borderRadius: 8, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {undoing ? "..." : "Undo"}
                    </button>
                  </div>
                </>
              )}

              {/* ALREADY ATTENDED / DUPLICATE */}
              {result.state === "already_attended" && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(202,138,4,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#ca8a04" }}>
                      <AlertTriangle size={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.62rem", color: "#ca8a04", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 0.15rem" }}>
                        {result.action === "in" ? "Already Checked In" : "Already Checked Out"}
                      </p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {result.data.full_name}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(202,138,4,0.06)", border: "1px solid rgba(202,138,4,0.2)", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem" }}>
                    <p style={{ ...ss, fontSize: "0.88rem", color: DARK, margin: "0 0 0.4rem", lineHeight: 1.5 }}>
                      This pass was already processed for <strong>{result.action === "in" ? "entry" : "exit"}</strong> at:
                    </p>
                    <p style={{ ...mono, fontSize: "1rem", fontWeight: 600, color: "#ca8a04", margin: 0 }}>
                      {formatTimePH(result.action === "in" ? result.data.checked_in_at : result.data.checked_out_at)}
                    </p>
                  </div>

                  <button type="button" onClick={handleReset} className="flair-btn" style={{ width: "100%", padding: "1rem", background: DARK, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Scan Next
                  </button>
                </>
              )}

              {/* NEVER CHECKED IN (TRYING TO EXIT BEFORE ARRIVING) */}
              {result.state === "never_checked_in" && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: RED }}>
                      <XCircle size={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.62rem", color: RED, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 0.15rem" }}>
                        No Check-In Recorded
                      </p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, color: DARK, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {result.data.full_name}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(220,38,38,0.06)", border: "1px solid rgba(220,38,38,0.18)", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem" }}>
                    <p style={{ ...ss, fontSize: "0.85rem", color: "#444", margin: 0, lineHeight: 1.5 }}>
                      <strong>{result.data.full_name}</strong> ({result.data.id_number}) hasn&apos;t checked in through the gate yet. Switch to Check In mode first.
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button
                      type="button"
                      onClick={() => { setScanAction("in"); checkInOrOutDocRef(result.data.id); }}
                      className="flair-btn"
                      style={{
                        flex: 1,
                        padding: "1rem",
                        background: GREEN,
                        color: CREAM,
                        border: "none",
                        borderRadius: 8,
                        ...mono,
                        fontSize: "0.72rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      Check In Now
                    </button>
                    <button type="button" onClick={handleReset} className="flair-btn" style={{ padding: "0 1.25rem", background: "rgba(17,17,17,0.06)", color: DARK, border: "none", borderRadius: 8, ...mono, fontSize: "0.68rem" }}>
                      Cancel
                    </button>
                  </div>
                </>
              )}

              {/* NOT FOUND OR SYSTEM ERROR */}
              {(result.state === "not_found" || result.state === "error") && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.25rem" }}>
                    <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: RED }}>
                      <XCircle size={28} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.62rem", color: RED, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, margin: "0 0 0.15rem" }}>
                        Scan Problem
                      </p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, color: DARK }}>
                        {result.state === "not_found" ? "Record Not Found" : "Verification Failed"}
                      </p>
                    </div>
                  </div>

                  <div style={{ background: "rgba(17,17,17,0.03)", borderRadius: 8, padding: "1rem", marginBottom: "1.25rem" }}>
                    <p style={{ ...ss, fontSize: "0.85rem", color: "#666", margin: 0, lineHeight: 1.5 }}>
                      {result.state === "not_found"
                        ? `This QR code or ID does not match any registered ${activeEvent.label} attendee.`
                        : (result as any).message}
                    </p>
                  </div>

                  <button type="button" onClick={handleReset} className="flair-btn" style={{ width: "100%", padding: "1rem", background: RED, color: "#fff", border: "none", borderRadius: 8, ...mono, fontSize: "0.72rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                    Try Again
                  </button>
                </>
              )}

              {/* Auto Continue Progress Indicator */}
              {autoCountdown !== null && (result.state === "success" || result.state === "already_attended") && (
                <div style={{ height: 4, background: "rgba(17,17,17,0.08)", borderRadius: 2, overflow: "hidden", marginTop: "1rem" }}>
                  <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 2.4, ease: "linear" }} style={{ height: "100%", background: DARK, borderRadius: 2 }} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}