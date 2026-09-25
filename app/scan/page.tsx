"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

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

type ScanResult =
  | { state: "idle" }
  | { state: "scanning" }
  | { state: "loading" }
  | { state: "already_attended"; data: any }
  | { state: "success"; data: any }
  | { state: "not_found" }
  | { state: "error"; message: string };

type ScanMode = "camera" | "upload";

type RecentScan = {
  name: string;
  idNumber?: string;
  status: "checked_in" | "duplicate" | "not_found" | "error";
  time: number;
};

type SessionStats = { scanned: number; checkedIn: number; duplicate: number; error: number };

const EMPTY_STATS: SessionStats = { scanned: 0, checkedIn: 0, duplicate: 0, error: 0 };
const CREAM = "#F4EFE6";
const DARK  = "#111111";
const GREEN = "#06402B";

const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
const ss   = { fontFamily: "'Source Serif 4', serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// ─── Local Storage Helpers ────────────────────────────────────────────────────

function loadStats(): SessionStats {
  if (typeof window === "undefined") return EMPTY_STATS;
  try { return JSON.parse(sessionStorage.getItem("flair_scan_stats") || "null") || EMPTY_STATS; } 
  catch { return EMPTY_STATS; }
}

function loadRecent(): RecentScan[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(sessionStorage.getItem("flair_recent_scans") || "null") || []; } 
  catch { return []; }
}

function timeAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─── Main Scanner Component ───────────────────────────────────────────────────

export default function ScanPage() {
  const router = useRouter();
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  const autoResumeTimeoutRef = useRef<any>(null);
  const autoResumeIntervalRef = useRef<any>(null);

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

  // ── Feedback (Audio/Vibration) ─────────────────────────────────────────────

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

  const recordScan = useCallback((entry: Omit<RecentScan, "time">) => {
    setSessionStats(prev => {
      const next: SessionStats = {
        scanned: prev.scanned + 1,
        checkedIn: prev.checkedIn + (entry.status === "checked_in" ? 1 : 0),
        duplicate: prev.duplicate + (entry.status === "duplicate" ? 1 : 0),
        error: prev.error + (entry.status === "not_found" || entry.status === "error" ? 1 : 0),
      };
      try { sessionStorage.setItem("flair_scan_stats", JSON.stringify(next)); } catch {}
      return next;
    });
    setRecentScans(prev => {
      const next = [{ ...entry, time: Date.now() }, ...prev].slice(0, 8);
      try { sessionStorage.setItem("flair_recent_scans", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleResetSession = useCallback(() => {
    if (!window.confirm("Reset session counters and scan log? This won't undo any check-ins already recorded.")) return;
    setSessionStats(EMPTY_STATS);
    setRecentScans([]);
    try {
      sessionStorage.removeItem("flair_scan_stats");
      sessionStorage.removeItem("flair_recent_scans");
    } catch {}
  }, []);

  // ── Supabase Resolution & Check-in ─────────────────────────────────────────

  const resolveRefCode = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return null;
    
    // Look for exact ID match or prefix match
    const { data, error } = await supabase
      .from("flair_registrations")
      .select("id")
      .ilike("id", `${cleanCode}%`)
      .limit(1);
      
    if (error || !data || data.length === 0) return null;
    return { id: data[0].id };
  };

  const checkInDocRef = useCallback(async (docId: string) => {
    const { data, error } = await supabase
      .from("flair_registrations")
      .select("*")
      .eq("id", docId)
      .single();

    if (error || !data) {
      setResult({ state: "not_found" });
      recordScan({ name: "Unknown reference", status: "not_found" });
      playFeedback("error");
      return;
    }

    if (data.status === "checked_in") {
      setResult({ state: "already_attended", data });
      recordScan({ name: data.full_name, idNumber: data.id_number, status: "duplicate" });
      playFeedback("duplicate");
      return;
    }

    const { error: updateErr } = await supabase
      .from("flair_registrations")
      .update({ 
        status: "checked_in" 
      })
      .eq("id", docId);

    if (updateErr) throw updateErr;

    const updatedData = { ...data, status: "checked_in" };
    setResult({ state: "success", data: updatedData });
    recordScan({ name: data.full_name, idNumber: data.id_number, status: "checked_in" });
    playFeedback("success");
  }, [recordScan, playFeedback]);

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
    processingRef.current = true; // Lock engaged until explicitly reset

    if (!navigator.onLine) {
      setResult({ state: "error", message: "You are offline. Reconnect to Wi-Fi/Data to scan." });
      recordScan({ name: "Network Error", status: "error" });
      playFeedback("error");
      return;
    }

    if (!rawValue.startsWith("flair:")) {
      setResult({ state: "error", message: "Invalid QR code. Not a Flair registration." });
      recordScan({ name: "Unrecognized format", status: "error" });
      playFeedback("error");
      return;
    }

    const docId = rawValue.replace("flair:", "").trim();
    setResult({ state: "loading" });

    try {
      await checkInDocRef(docId);
} catch (err: any) {
      console.error("Scan Error:", err);
      setResult({ state: "error", message: err.message || err.details || "Failed to update database." });
      recordScan({ name: "System Error", status: "error" });
      playFeedback("error");
    }
  }, [recordScan, playFeedback, checkInDocRef]);

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
      const resolved = await resolveRefCode(code);
      if (!resolved) {
        setResult({ state: "not_found" });
        recordScan({ name: `Code ${code.toUpperCase()}`, status: "not_found" });
        playFeedback("error");
        return;
      }
      await checkInDocRef(resolved.id);
} catch (err: any) {
      console.error("Manual Scan Error:", err);
      setResult({ state: "error", message: err.message || err.details || "Failed to verify code." });
      playFeedback("error");
    }
  }, [recordScan, playFeedback, checkInDocRef]);

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
        { fps: 10, qrbox: { width: 340, height: 340 }, aspectRatio: 1 },
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
    } catch (error) {
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
    } catch (err) {
      setResult({ state: "error", message: "No readable QR code found in this image." });
      recordScan({ name: "Unreadable image", status: "error" });
      playFeedback("error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [processQR, stopScanner, recordScan, playFeedback]);

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

  // Lock body scroll when result sheet is open
  useEffect(() => {
    const isSheetOpen = ["success", "already_attended", "not_found", "error"].includes(result.state);
    if (isSheetOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prevOverflow; };
    }
  }, [result.state]);

  const handleReset = useCallback(() => {
    if (autoResumeTimeoutRef.current) clearTimeout(autoResumeTimeoutRef.current);
    if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
    setAutoCountdown(null);
    setUploadPreview(null);
    
    if (scanMode === "camera") setResult({ state: "scanning" });
    else setResult({ state: "idle" });
    
    processingRef.current = false;
  }, [scanMode]);

  // ── Undo ───────────────────────────────────────────────────────────────────

  const handleUndo = useCallback(async () => {
    if (result.state !== "success") return;
    if (!window.confirm(`Undo check-in for ${result.data.full_name}?`)) return;

    setUndoing(true);
  try {
      await supabase
        .from("flair_registrations")
        .update({ status: "pre_registered" })
        .eq("id", result.data.id);

      setSessionStats(prev => {
        const next = { ...prev, checkedIn: Math.max(0, prev.checkedIn - 1) };
        try { sessionStorage.setItem("flair_scan_stats", JSON.stringify(next)); } catch {}
        return next;
      });
      setRecentScans(prev => {
        const next = prev.filter(s => !(s.time === prev[0]?.time && s.status === "checked_in"));
        try { sessionStorage.setItem("flair_recent_scans", JSON.stringify(next)); } catch {}
        return next;
      });
      handleReset();
    } catch (err) {
      alert("Failed to undo check-in. Try again.");
    } finally {
      setUndoing(false);
    }
  }, [result, handleReset]);

  // ── Auto-Resume Loop ───────────────────────────────────────────────────────

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
    autoResumeTimeoutRef.current = setTimeout(() => { handleReset(); }, 2200);

    return () => {
      if (autoResumeIntervalRef.current) clearInterval(autoResumeIntervalRef.current);
      if (autoResumeTimeoutRef.current) clearTimeout(autoResumeTimeoutRef.current);
      setAutoCountdown(null);
    };
  }, [result.state, autoContinue, scanMode, handleReset]);

  // ── Manual Input ────────────────────────────────────────────────────────────

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
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "1.5rem" }}>🔒</div>
        <div>
          <h2 style={{ ...dg, fontSize: "1.5rem", color: DARK, margin: "0 0 0.5rem" }}>ACCESS RESTRICTED</h2>
          <p style={{ ...ss, fontSize: "0.95rem", color: "#666" }}>You must be logged in as an admin to use the scanner.</p>
        </div>
<button onClick={() => router.push("/admin/login?redirect=/scan")} className="flair-btn" style={{ ...mono, padding: "1rem 2rem", background: GREEN, color: CREAM, border: "none", borderRadius: 4, letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem" }}>
  Log In
</button>
      </div>
    );
  }

  return (
    <div style={{ background: CREAM, color: DARK, minHeight: "100dvh", display: "flex", flexDirection: "column", padding: "clamp(7rem, 12vw, 9rem) 1.25rem 4rem" }}>
      
      {/* ── Header ── */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: GREEN, marginBottom: "0.5rem" }}>USC Frosh Walk 2026</p>
        <h1 style={{ ...dg, fontSize: "clamp(2rem, 8vw, 3.5rem)", lineHeight: 1, margin: 0 }}>SCANNER.</h1>
      </div>

      <div style={{ width: "100%", maxWidth: "480px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
        {/* ── Stats & Controls ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, padding: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.6rem", color: "#888", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Scanned</span>
                <span style={{ ...mono, fontSize: "1.2rem", fontWeight: 600 }}>{sessionStats.scanned}</span>
              </div>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.6rem", color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>In</span>
                <span style={{ ...mono, fontSize: "1.2rem", fontWeight: 600, color: "#10b981" }}>{sessionStats.checkedIn}</span>
              </div>
              <div>
                <span style={{ ...mono, display: "block", fontSize: "0.6rem", color: "#f59e0b", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Dupes</span>
                <span style={{ ...mono, fontSize: "1.2rem", fontWeight: 600, color: "#f59e0b" }}>{sessionStats.duplicate}</span>
              </div>
            </div>
            <button onClick={handleResetSession} className="flair-btn" style={{ background: "transparent", border: "1px solid rgba(17,17,17,0.2)", borderRadius: 4, padding: "0.4rem 0.6rem", ...mono, fontSize: "0.6rem", letterSpacing: "0.1em" }}>RESET</button>
          </div>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setAutoContinue(!autoContinue)} className="flair-btn" style={{ flex: 1, padding: "0.75rem", background: autoContinue ? "rgba(6,64,43,0.08)" : "transparent", border: `1px solid ${autoContinue ? GREEN : "rgba(17,17,17,0.15)"}`, color: autoContinue ? GREEN : "#666", borderRadius: 4, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Auto {autoContinue ? "ON" : "OFF"}
            </button>
            <button onClick={() => setSoundOn(!soundOn)} className="flair-btn" style={{ flex: 1, padding: "0.75rem", background: soundOn ? "rgba(6,64,43,0.08)" : "transparent", border: `1px solid ${soundOn ? GREEN : "rgba(17,17,17,0.15)"}`, color: soundOn ? GREEN : "#666", borderRadius: 4, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Sound {soundOn ? "ON" : "OFF"}
            </button>
          </div>
          
          <div style={{ display: "flex", background: "rgba(17,17,17,0.04)", borderRadius: 6, padding: "0.25rem" }}>
            <button onClick={() => switchMode("camera")} className="flair-btn" style={{ flex: 1, padding: "0.75rem", background: scanMode === "camera" ? "#fff" : "transparent", border: "none", borderRadius: 4, boxShadow: scanMode === "camera" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", color: scanMode === "camera" ? DARK : "#888", ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Camera</button>
            <button onClick={() => switchMode("upload")} className="flair-btn" style={{ flex: 1, padding: "0.75rem", background: scanMode === "upload" ? "#fff" : "transparent", border: "none", borderRadius: 4, boxShadow: scanMode === "upload" ? "0 2px 8px rgba(0,0,0,0.05)" : "none", color: scanMode === "upload" ? DARK : "#888", ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Upload</button>
          </div>
        </div>

        {/* ── Viewport ── */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "1/1", background: DARK, borderRadius: 8, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.1)" }}>
          
          {scanMode === "camera" && (
            <>
              <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
                <div id="qr-reader" />
              </div>

              {(result.state === "scanning" || result.state === "loading") && (
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <motion.div animate={{ scale: justLocked ? 0.9 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 25 }} style={{ width: "70%", height: "70%", border: `4px solid ${justLocked ? "#10b981" : "rgba(255,255,255,0.2)"}`, borderRadius: 16, position: "relative" }}>
                    {!justLocked && result.state === "scanning" && (
                      <motion.div animate={{ y: ["0%", "300%"] }} transition={{ repeat: Infinity, duration: 2, ease: "linear", repeatType: "reverse" }} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "2px", background: "#10b981", boxShadow: "0 0 16px #10b981", opacity: 0.8 }} />
                    )}
                  </motion.div>
                </div>
              )}

              {result.state === "scanning" && (
                <div style={{ position: "absolute", top: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", padding: "0.5rem 1rem", borderRadius: 20, color: "#fff", ...mono, fontSize: "0.6rem", letterSpacing: "0.1em", textTransform: "uppercase", zIndex: 20 }}>
                  Scanning...
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
                  <button onClick={() => fileInputRef.current?.click()} className="flair-btn" style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", border: "none", padding: "0.6rem 1.2rem", borderRadius: 20, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", color: DARK }}>
                    Upload Different Image
                  </button>
                </div>
              ) : (
                <button onClick={() => fileInputRef.current?.click()} className="flair-btn" style={{ width: "80%", height: "80%", border: "2px dashed rgba(17,17,17,0.2)", borderRadius: 16, background: "transparent", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                  <span style={{ fontSize: "2rem" }}>📁</span>
                  <span style={{ ...mono, fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "#666" }}>Tap to select QR image</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Manual Entry ── */}
        <div>
          {!manualEntryOpen ? (
            <button onClick={() => setManualEntryOpen(true)} className="flair-btn" style={{ width: "100%", padding: "1rem", background: "transparent", border: "1px dashed rgba(17,17,17,0.2)", borderRadius: 8, ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", color: "#666", textTransform: "uppercase" }}>
              Trouble scanning? Enter code manually
            </button>
          ) : (
            <form onSubmit={handleManualSubmit} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                autoFocus
                value={manualCode}
                onChange={e => setManualCode(e.target.value.toUpperCase().replace(/\s+/g, ""))}
                placeholder="REF CODE"
                disabled={manualSubmitting}
                className="flair-input"
                style={{ flex: 1, padding: "1rem", border: "1px solid rgba(17,17,17,0.2)", borderRadius: 8, textTransform: "uppercase", letterSpacing: "0.2em" }}
              />
              <button type="submit" disabled={manualSubmitting || !manualCode.trim()} className="flair-btn" style={{ padding: "0 1.5rem", background: GREEN, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.7rem", letterSpacing: "0.15em" }}>
                {manualSubmitting ? "..." : "GO"}
              </button>
              <button type="button" onClick={() => { setManualEntryOpen(false); setManualCode(""); }} className="flair-btn" style={{ padding: "0 1rem", background: "rgba(17,17,17,0.05)", color: DARK, border: "none", borderRadius: 8 }}>
                ✕
              </button>
            </form>
          )}
        </div>

        {/* ── Recent Scans ── */}
        {recentScans.length > 0 && (
          <div style={{ background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, overflow: "hidden" }}>
            <button onClick={() => setRecentOpen(!recentOpen)} className="flair-btn" style={{ width: "100%", padding: "1rem", background: "transparent", border: "none", display: "flex", justifyContent: "space-between", alignItems: "center", ...mono, fontSize: "0.65rem", letterSpacing: "0.15em", color: "#666", textTransform: "uppercase" }}>
              <span>System Log ({recentScans.length})</span>
              <span>{recentOpen ? "▲" : "▼"}</span>
            </button>
            <AnimatePresence>
              {recentOpen && (
                <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} style={{ overflow: "hidden" }}>
                  <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    {recentScans.map((scan, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(17,17,17,0.05)", paddingBottom: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", overflow: "hidden" }}>
                          <span style={{ fontSize: "0.8rem", flexShrink: 0 }}>
                            {scan.status === "checked_in" ? "🟢" : scan.status === "duplicate" ? "🟠" : "🔴"}
                          </span>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ ...ss, fontSize: "0.85rem", fontWeight: 600, margin: "0 0 0.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scan.name}</p>
                            {scan.idNumber && <p style={{ ...mono, fontSize: "0.6rem", color: "#888" }}>{scan.idNumber}</p>}
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
      </div>

      {/* ── Results Bottom Sheet ── */}
      <AnimatePresence>
        {["success", "already_attended", "not_found", "error"].includes(result.state) && (
          <>
            <motion.div 
              key="backdrop" 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleReset} 
              style={{ position: "fixed", inset: 0, background: "rgba(244,239,230,0.8)", backdropFilter: "blur(4px)", zIndex: 40 }}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: "100%", opacity: 0 }} transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50, padding: "1.5rem", paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))", background: "#ffffff", borderTopLeftRadius: 24, borderTopRightRadius: 24, boxShadow: "0 -12px 48px rgba(0,0,0,0.1)" }}
            >
              <div style={{ width: 40, height: 4, background: "rgba(17,17,17,0.1)", borderRadius: 2, margin: "0 auto 1.5rem" }} />

              {result.state === "success" && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10b981", fontSize: "1.5rem" }}>✓</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.6rem", color: "#10b981", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Checked In</p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.data.full_name}</p>
                    </div>
                  </div>
                  
                  <div style={{ background: "rgba(17,17,17,0.03)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.65rem", color: "#888" }}>ID NUMBER</span>
                      <span style={{ ...mono, fontSize: "0.7rem", fontWeight: 500 }}>{result.data.id_number}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.65rem", color: "#888" }}>PROGRAM</span>
                      <span style={{ ...mono, fontSize: "0.7rem", fontWeight: 500 }}>{result.data.college} • {result.data.program}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ ...mono, fontSize: "0.65rem", color: "#888" }}>SECTION</span>
                      <span style={{ ...mono, fontSize: "0.7rem", fontWeight: 500 }}>{result.data.year_level?.charAt(0)}Y • {result.data.block}</span>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <button onClick={handleReset} className="flair-btn" style={{ flex: 1, padding: "1.1rem", background: DARK, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Scan Next</button>
                    <button onClick={handleUndo} disabled={undoing} className="flair-btn" style={{ padding: "0 1.5rem", background: "transparent", border: "1px solid rgba(17,17,17,0.2)", color: DARK, borderRadius: 8, ...mono, fontSize: "0.65rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>{undoing ? "..." : "Undo"}</button>
                  </div>
                </>
              )}

              {result.state === "already_attended" && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(245,158,11,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#f59e0b", fontSize: "1.5rem" }}>⚠</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.6rem", color: "#f59e0b", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Already In</p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{result.data.full_name}</p>
                    </div>
                  </div>
                  <div style={{ background: "rgba(17,17,17,0.03)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
                    <p style={{ ...ss, fontSize: "0.85rem", color: "#666", margin: 0 }}>This ticket was already scanned at {new Date(result.data.checked_in_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}.</p>
                  </div>
                  <button onClick={handleReset} className="flair-btn" style={{ width: "100%", padding: "1.1rem", background: DARK, color: CREAM, border: "none", borderRadius: 8, ...mono, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Scan Next</button>
                </>
              )}

              {(result.state === "not_found" || result.state === "error") && (
                <>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1.5rem" }}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(220,38,38,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626", fontSize: "1.5rem" }}>✕</div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ ...mono, fontSize: "0.6rem", color: "#dc2626", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.2rem" }}>Error</p>
                      <p style={{ ...ss, fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>{result.state === "not_found" ? "Code Not Found" : "Scan Failed"}</p>
                    </div>
                  </div>
                  <div style={{ background: "rgba(17,17,17,0.03)", borderRadius: 8, padding: "1rem", marginBottom: "1.5rem" }}>
                    <p style={{ ...ss, fontSize: "0.85rem", color: "#666", margin: 0 }}>
                      {result.state === "not_found" ? "This QR code or reference ID does not match any pre-registered attendee." : (result as any).message}
                    </p>
                  </div>
                  <button onClick={handleReset} className="flair-btn" style={{ width: "100%", padding: "1.1rem", background: "#dc2626", color: "#fff", border: "none", borderRadius: 8, ...mono, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>Try Again</button>
                </>
              )}
              
              {/* Auto Continue Progress Bar */}
              {autoCountdown !== null && (result.state === "success" || result.state === "already_attended") && (
                <div style={{ height: 4, background: "rgba(17,17,17,0.1)", borderRadius: 2, overflow: "hidden", marginTop: "1rem" }}>
                  <motion.div initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 2.2, ease: "linear" }} style={{ height: "100%", background: DARK, borderRadius: 2 }} />
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}