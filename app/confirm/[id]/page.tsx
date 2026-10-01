"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

/* ─── Injected CSS (Matches Flair Theme) ───────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

@keyframes confirm-reveal-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.confirm-reveal { opacity: 0; animation: confirm-reveal-in 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

@keyframes flair-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(6, 64, 43, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(6, 64, 43, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 64, 43, 0); }
}

.flair-btn { transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease, border-color 0.15s ease; cursor: pointer; }
.flair-btn:active { transform: scale(0.98); }
.flair-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.flair-input {
  font-size: 16px; 
  transition: border-color 0.25s ease, background 0.25s ease;
  -webkit-appearance: none;
  appearance: none;
}
.flair-input:focus {
  outline: none;
  border-color: #06402B !important;
  background: rgba(6,64,43,0.04) !important;
}

@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
  .print-break-inside-avoid { break-inside: avoid; }
}
`;

const HEADER_H = "5rem";
const CREAM = "#F4EFE6";
const DARK  = "#111111";
const GREEN = "#06402B";
const BLUE  = "#1d4ed8";

const dg   = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss   = { fontFamily: "'Source Serif 4', serif" } as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;

const fmtTime = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
};

export default function ConfirmPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<"not_found" | "network" | null>(null);

  const [downloadingPng, setDownloadingPng] = useState(false);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const qrWrapRef = useRef<HTMLDivElement>(null);

  // Edit Block Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editBlock, setEditBlock] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  // Init CSS with unique ID
  useEffect(() => {
    const cssId = "flair-confirm-css";
    if (!document.getElementById(cssId)) {
      const el = document.createElement("style");
      el.id = cssId;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  const fetchRegistration = useCallback(async () => {
    if (!id) return;
    try {
      const { data: row, error } = await supabase
        .from("flair_registrations")
        .select("*")
        .eq("id", id as string)
        .single();

      if (error || !row) {
        setErrorState("not_found");
      } else {
        setData(row);
      }
    } catch {
      setErrorState("network");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegistration();

    // Listen to real-time status updates when door scanner scans this ticket
    if (id) {
      const channel = supabase
        .channel(`flair_ticket_${id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "flair_registrations",
            filter: `id=eq.${id}`,
          },
          (payload) => {
            if (payload.new) setData(payload.new);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchRegistration]);

  useEffect(() => {
    try {
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [new File([""], "test.png", { type: "image/png" })] })
      ) {
        setCanShare(true);
      }
    } catch {}
  }, []);

  const handleCopyCode = () => {
    if (!data) return;
    const refCode = data.id.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    const trimmed = editBlock.trim().replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (!trimmed) {
      setEditError("Block can't be empty.");
      return;
    }
    if (trimmed.length > 40) {
      setEditError("Too long (max 40 characters).");
      return;
    }
    setSavingEdit(true);
    setEditError("");
    try {
      const { error } = await supabase
        .from("flair_registrations")
        .update({ block: trimmed })
        .eq("id", data.id);

      if (error) throw error;

      setData((prev: any) => ({ ...prev, block: trimmed }));
      setEditOpen(false);
    } catch {
      setEditError("Couldn't save — check your connection and try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveOrSharePng = async () => {
    const svgEl = qrWrapRef.current?.querySelector("svg");
    if (!svgEl || !data) return;
    setDownloadingPng(true);

    try {
      const refCode = data.id.slice(0, 8).toUpperCase();
      const QR_SIZE = 600;
      const PADDING = 64;
      const H_TOP = 80;
      const H_FOOT = 100;
      const W = QR_SIZE + PADDING * 2;
      const H = H_TOP + QR_SIZE + PADDING + H_FOOT;

      const cloned = svgEl.cloneNode(true) as SVGSVGElement;
      cloned.setAttribute("width", String(QR_SIZE));
      cloned.setAttribute("height", String(QR_SIZE));
      if (!cloned.getAttribute("viewBox")) cloned.setAttribute("viewBox", `0 0 ${QR_SIZE} ${QR_SIZE}`);

      cloned.querySelectorAll<SVGElement>("*").forEach((el) => {
        const fill = getComputedStyle(el).fill;
        if (fill && fill !== "none") el.setAttribute("fill", fill);
      });

      const svgString = new XMLSerializer().serializeToString(cloned);
      const svgB64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = reject;
        i.src = svgB64;
      });

      const canvas = document.createElement("canvas");
      const SCALE = 2;
      canvas.width = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(SCALE, SCALE);

      // Background
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, W, H);

      // Header strip
      ctx.fillStyle = GREEN;
      ctx.fillRect(0, 0, W, H_TOP);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("FLAIR · USC FROSH WALK 2026", W / 2, H_TOP / 2 + 7);

      // QR area
      ctx.drawImage(img, PADDING, H_TOP, QR_SIZE, QR_SIZE);
      ctx.strokeStyle = "rgba(17,17,17,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(PADDING, H_TOP, QR_SIZE, QR_SIZE);

      // Footer
      const footerY = H_TOP + QR_SIZE + 20;
      ctx.fillStyle = "#888888";
      ctx.font = "14px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("REFERENCE CODE", W / 2, footerY + 22);
      ctx.fillStyle = DARK;
      ctx.font = "bold 36px 'IBM Plex Mono', monospace";
      ctx.fillText(refCode, W / 2, footerY + 64);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });

      const file = new File([blob], `flair-qr-${refCode}.png`, { type: "image/png" });
      let shared = false;

      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "FLAIR Entry QR Code",
              text: `My FLAIR Frosh Walk Pass (${refCode})`,
              files: [file],
            });
            shared = true;
          }
        } catch (e: any) {
          if (e?.name === "AbortError") {
            setDownloadingPng(false);
            return;
          }
        }
      }

      if (shared) {
        setDownloadingPng(false);
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      if (isIOS) {
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `flair-qr-${refCode}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
      }
    } catch {
      alert("Couldn't generate the pass image automatically. Please take a screenshot of your screen instead.");
    } finally {
      setDownloadingPng(false);
    }
  };

  /* ── Loading / Error States ── */
  if (loading) {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <Navbar />
        <div style={{ width: 32, height: 32, borderRadius: "50%", border: `3px solid ${GREEN}`, borderTopColor: "transparent", animation: "spin 0.9s linear infinite" }} />
        <p style={{ ...mono, fontSize: "0.75rem", color: DARK, letterSpacing: "0.2em", textTransform: "uppercase" }}>Loading your pass…</p>
      </div>
    );
  }

  if (errorState === "network" || errorState === "not_found") {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "clamp(7rem, 12vw, 9rem) 2rem 2rem", textAlign: "center" }}>
        <Navbar />
        <h2 style={{ ...dg, fontSize: "2rem", color: DARK }}>{errorState === "network" ? "CONNECTION ERROR" : "PASS NOT FOUND"}</h2>
        <p style={{ ...ss, color: "#666", fontSize: "1rem", maxWidth: "26rem", margin: 0, fontWeight: 300 }}>
          {errorState === "network" ? "We couldn't load your entry pass. Please check your internet connection." : "We couldn't find a registration matching this link."}
        </p>
        <button
          onClick={() => (errorState === "network" ? fetchRegistration() : router.push("/register"))}
          className="flair-btn"
          style={{ ...mono, padding: "0.85rem 1.75rem", background: DARK, color: CREAM, border: "none", borderRadius: 4, letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem" }}
        >
          {errorState === "network" ? "Try Again" : "Register Now"}
        </button>
      </div>
    );
  }

  /* ── Computed Attendance Flags ── */
  const qrValue = `flair:${data.id}`;
  const refCode = data.id.slice(0, 8).toUpperCase();
  const isCheckedOut = Boolean(data.checked_out_at || data.status === "checked_out");
  const isCheckedIn = Boolean(!isCheckedOut && (data.checked_in_at || data.status === "checked_in"));

  return (
    <div
      style={{
        background: CREAM,
        color: DARK,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: `calc(${HEADER_H} + env(safe-area-inset-top) + 1.25rem) clamp(1rem, 3.5vw, 1.5rem) calc(2.5rem + env(safe-area-inset-bottom))`,
        ...ss,
      }}
    >
      <Navbar />

      {/* Top Navbar Shield Buffer */}
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

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Top Breadcrumb */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="flair-btn"
            style={{
              ...mono,
              background: "none",
              border: "none",
              padding: "0.3rem 0",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            ← Registration Hub
          </button>
          <span
            style={{
              ...mono,
              fontSize: "0.6rem",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              padding: "0.25rem 0.6rem",
              borderRadius: 4,
              background: GREEN,
              color: CREAM,
              fontWeight: 600,
            }}
          >
            {data.college || "USC"}
          </span>
        </div>

        {/* Main Ticket Card */}
        <div
          className="confirm-reveal print-break-inside-avoid"
          style={{
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid rgba(17,17,17,0.1)",
            borderTop: `4px solid ${GREEN}`,
            boxShadow: "0 16px 40px rgba(17,17,17,0.07)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {/* Top Event Header + QR Code */}
          <div style={{ padding: "1.75rem 1.5rem 1.4rem", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.55rem" }}>
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: isCheckedOut ? BLUE : isCheckedIn ? GREEN : "#ca8a04",
                  animation: !isCheckedOut ? "flair-pulse 2s infinite" : "none",
                }}
              />
              <span
                style={{
                  ...mono,
                  fontSize: "0.6rem",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: isCheckedOut ? BLUE : isCheckedIn ? GREEN : "#ca8a04",
                  fontWeight: 600,
                }}
              >
                {isCheckedOut ? "Attendance Complete" : isCheckedIn ? "Checked In · Inside Event" : "Entry Pass Active"}
              </span>
            </div>

            <h1 style={{ ...dg, fontSize: "clamp(1.5rem, 5vw, 1.85rem)", margin: "0 0 0.2rem", lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              FLAIR 2026
            </h1>
            <p style={{ fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: GREEN, margin: "0 0 1.25rem" }}>
              USC Frosh Walk Pass
            </p>

            {/* QR Wrapper */}
            <div
              ref={qrWrapRef}
              style={{
                display: "inline-flex",
                padding: "1rem",
                background: "#ffffff",
                border: "1px solid rgba(17,17,17,0.12)",
                borderRadius: 8,
                boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <QRCode
                value={qrValue}
                size={208}
                level="M"
                fgColor={DARK}
                bgColor="#ffffff"
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>

            {/* Copyable Reference Pill */}
            <div style={{ marginTop: "0.9rem", display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flair-btn no-print"
                title="Copy reference code"
                style={{
                  ...mono,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.35rem 0.75rem",
                  borderRadius: 4,
                  border: "1px dashed rgba(17,17,17,0.2)",
                  background: "rgba(17,17,17,0.02)",
                  color: "#555",
                  fontSize: "0.65rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                <span>Ref: <strong style={{ color: DARK }}>{refCode}</strong></span>
                <span style={{ color: copied ? GREEN : "#888", fontSize: "0.6rem" }}>
                  {copied ? "✓ Copied" : "Copy"}
                </span>
              </button>
            </div>
          </div>

          {/* Perforated Divider */}
          <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
            <span
              aria-hidden
              style={{
                position: "absolute",
                left: -12,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: CREAM,
                borderRight: "1px solid rgba(17,17,17,0.1)",
              }}
            />
            <div style={{ width: "100%", borderTop: "1.5px dashed rgba(17,17,17,0.14)", margin: "0 16px" }} />
            <span
              aria-hidden
              style={{
                position: "absolute",
                right: -12,
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: CREAM,
                borderLeft: "1px solid rgba(17,17,17,0.1)",
              }}
            />
          </div>

          {/* Bottom Attendee Info & Timestamps */}
          <div style={{ padding: "1.1rem 1.5rem 1.6rem" }}>
            <div style={{ textAlign: "center", marginBottom: "1.15rem" }}>
              <p style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.2rem", color: DARK }}>
                {data.full_name}
              </p>
              <p style={{ ...mono, fontSize: "0.78rem", color: "#555", margin: "0 0 0.35rem", letterSpacing: "0.05em" }}>
                {data.id_number}
              </p>
              <p style={{ fontSize: "0.85rem", color: "#666", margin: 0, fontWeight: 300 }}>
                {data.college ? `${data.college} · ` : ""}{data.program}
              </p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", marginTop: "0.25rem" }}>
                <span style={{ ...mono, fontSize: "0.68rem", color: "#888", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  {data.year_level} · Block {data.block}
                </span>
                <button
                  type="button"
                  onClick={() => { setEditBlock(data.block); setEditOpen(true); }}
                  className="flair-btn no-print"
                  style={{
                    ...mono,
                    fontSize: "0.55rem",
                    background: "rgba(17,17,17,0.05)",
                    border: "1px solid rgba(17,17,17,0.15)",
                    padding: "0.15rem 0.35rem",
                    borderRadius: 3,
                    color: DARK,
                  }}
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Check-In / Check-Out Door Scan Tracker */}
            <div
              role="status"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "0.5rem",
                marginBottom: "1.1rem",
              }}
            >
              <div
                style={{
                  padding: "0.65rem 0.75rem",
                  borderRadius: 6,
                  background: data.checked_in_at ? "rgba(6,64,43,0.07)" : "rgba(17,17,17,0.03)",
                  border: `1px solid ${data.checked_in_at ? "rgba(6,64,43,0.22)" : "rgba(17,17,17,0.08)"}`,
                  textAlign: "left",
                }}
              >
                <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: data.checked_in_at ? GREEN : "#888" }}>
                  01 · Check In
                </span>
                <span style={{ ...mono, display: "block", fontSize: "0.72rem", fontWeight: 600, color: data.checked_in_at ? GREEN : "#555", marginTop: "0.2rem" }}>
                  {fmtTime(data.checked_in_at) ?? "Pending"}
                </span>
              </div>

              <div
                style={{
                  padding: "0.65rem 0.75rem",
                  borderRadius: 6,
                  background: data.checked_out_at ? "rgba(29,78,216,0.07)" : "rgba(17,17,17,0.03)",
                  border: `1px solid ${data.checked_out_at ? "rgba(29,78,216,0.22)" : "rgba(17,17,17,0.08)"}`,
                  textAlign: "left",
                }}
              >
                <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: data.checked_out_at ? BLUE : "#888" }}>
                  02 · Check Out
                </span>
                <span style={{ ...mono, display: "block", fontSize: "0.72rem", fontWeight: 600, color: data.checked_out_at ? BLUE : "#555", marginTop: "0.2rem" }}>
                  {fmtTime(data.checked_out_at) ?? "Pending"}
                </span>
              </div>
            </div>

            {/* Save PNG Action */}
            <button
              type="button"
              onClick={handleSaveOrSharePng}
              disabled={downloadingPng}
              className="flair-btn no-print"
              style={{
                ...mono,
                width: "100%",
                padding: "0.9rem 1rem",
                background: DARK,
                color: CREAM,
                border: "none",
                borderRadius: 6,
                fontSize: "0.7rem",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                fontWeight: 500,
              }}
            >
              {downloadingPng ? "Saving Pass..." : canShare ? "Save / Share Pass (PNG)" : "Download Pass (PNG)"}
            </button>

            <p style={{ fontSize: "0.78rem", color: "#888", margin: "0.85rem 0 0", textAlign: "center", lineHeight: 1.45, fontWeight: 300 }}>
              Screenshot or save this ticket. Show it to organizers at the gate upon entry and exit.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Block Section Modal */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !savingEdit && setEditOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(17, 17, 17, 0.45)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", width: "100%", maxWidth: 360, borderRadius: 8, padding: "1.75rem", boxShadow: "0 24px 48px rgba(0,0,0,0.12)", border: "1px solid rgba(17,17,17,0.1)" }}>
            <h2 style={{ ...dg, fontSize: "1.2rem", margin: "0 0 0.4rem 0" }}>Edit Section</h2>
            <p style={{ ...ss, fontSize: "0.85rem", color: "#666", marginBottom: "1.25rem", lineHeight: 1.5, fontWeight: 300 }}>
              You can update your block/section. Your student ID remains locked to your QR code.
            </p>

            <label style={{ display: "block", marginBottom: "1.25rem" }}>
              <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Block / Section</span>
              <input
                className="flair-input"
                value={editBlock}
                onChange={(e) => setEditBlock(e.target.value)}
                style={{ width: "100%", background: "rgba(17,17,17,0.03)", border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, padding: "0.8rem 0.9rem", color: DARK, fontFamily: "'Source Serif 4', serif" }}
                autoFocus
              />
              {editError && <span style={{ ...mono, display: "block", marginTop: "0.4rem", fontSize: "0.68rem", color: "#dc2626" }}>{editError}</span>}
            </label>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={savingEdit}
                className="flair-btn"
                style={{ flex: 1, ...mono, padding: "0.75rem", background: "rgba(17,17,17,0.05)", color: DARK, border: "none", borderRadius: 4, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flair-btn"
                style={{ flex: 1, ...mono, padding: "0.75rem", background: DARK, color: CREAM, border: "none", borderRadius: 4, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                {savingEdit ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}