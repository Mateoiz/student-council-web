"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabase";

type Row = {
  id: string;
  full_name: string;
  id_number: string;
  college: string | null;
  college_name?: string | null;
  program: string;
  year_level: string;
  block: string;
  status: string | null;
  checked_in_at: string | null;
  checked_out_at: string | null;
};

const CREAM = "#F4EFE6";
const DARK = "#111111";
const RED = "#dc2626";
const GREEN = "#06402B";
const BLUE = "#1d4ed8";
const HEADER_H = "5rem";

const COLLEGE_COLORS: Record<string, string> = {
  CAST: "#dc2626",
  CBMA: "#ca8a04",
  COED: "#2563eb",
  CVMAS: "#06402B",
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_COLUMNS =
  "id, full_name, id_number, college, program, year_level, block, status, checked_in_at, checked_out_at";

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }

@keyframes pass-rise {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pass-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.45); }
  70%  { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
  100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
}
@keyframes pass-spin {
  to { transform: rotate(360deg); }
}

.pass-card {
  animation: pass-rise 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.pass-btn {
  transition: transform 0.1s ease, background 0.2s ease, border-color 0.2s ease, opacity 0.2s ease;
  cursor: pointer;
}
.pass-btn:active { transform: scale(0.98); }
.pass-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

@media print {
  body { background: white !important; }
  .no-print { display: none !important; }
}
`;

const dg = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss = { fontFamily: "'Source Serif 4', serif" } as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;

const fmtTime = (s: string | null | undefined) => {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });
};

export default function SeminarConfirmPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const rawId = typeof params?.id === "string" ? params.id.trim() : "";

  const [row, setRow] = useState<Row | null>(null);
  const [missing, setMissing] = useState(false);
  const [netError, setNetError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const qrWrapRef = useRef<HTMLDivElement>(null);
  const inFlightRef = useRef(false);

  // Inject fonts & animations
  useEffect(() => {
    let el = document.getElementById("cast-confirm-css") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "cast-confirm-css";
      document.head.appendChild(el);
    }
    el.textContent = STYLES;
  }, []);

  // Web Share capability detection
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

  const load = useCallback(async () => {
    if (!rawId || !UUID_REGEX.test(rawId)) {
      setMissing(true);
      return;
    }
    if (inFlightRef.current) return;
    if (typeof document !== "undefined" && document.hidden) return;

    inFlightRef.current = true;
    try {
      const queryPromise = supabase
        .from("cast_seminar_registrations")
        .select(SAFE_COLUMNS)
        .eq("id", rawId)
        .single();

      const timeoutPromise = new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 8000)
      );

      const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

      if (error || !data) {
        if (error?.code === "PGRST116") setMissing(true);
        else setNetError(true);
        return;
      }

      setNetError(false);
      setMissing(false);
      setRow(data as Row);
    } catch {
      setNetError(true);
    } finally {
      inFlightRef.current = false;
    }
  }, [rawId]);

  useEffect(() => {
    load();

    // Real-time door attendance updates
    if (rawId && UUID_REGEX.test(rawId)) {
      const channel = supabase
        .channel(`cast_seminar_pass_${rawId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "cast_seminar_registrations",
            filter: `id=eq.${rawId}`,
          },
          (payload) => {
            if (payload.new) {
              setRow(payload.new as Row);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [rawId, load]);

  const refCode = row ? row.id.slice(0, 8).toUpperCase() : "";
  const collegeColor = (row?.college && COLLEGE_COLORS[row.college]) || RED;
  const isCheckedOut = Boolean(row?.checked_out_at || row?.status === "checked_out");
  const isCheckedIn = Boolean(!isCheckedOut && (row?.checked_in_at || row?.status === "checked_in"));

  const handleCopyRef = async () => {
    if (!refCode) return;
    try {
      await navigator.clipboard.writeText(refCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  // High-res pass image export with Web Share support
  const handleDownloadPass = async () => {
    if (!row || !qrWrapRef.current || downloading) return;
    const svgEl = qrWrapRef.current.querySelector("svg");
    if (!svgEl) return;

    setDownloading(true);
    try {
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = rej;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 900;
      canvas.height = 1280;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Card
      const cx = 60, cy = 60, cw = 780, ch = 1160;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(cx, cy, cw, ch);

      // Top red accent bar
      ctx.fillStyle = RED;
      ctx.fillRect(cx, cy, cw, 14);

      // Header text
      ctx.fillStyle = RED;
      ctx.font = "600 20px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("CAST SEMINAR · OFFICIAL ENTRY PASS", canvas.width / 2, cy + 75);

      ctx.fillStyle = DARK;
      ctx.font = "bold 40px 'Dela Gothic One', sans-serif";
      ctx.fillText("Suicide Prevention Month", canvas.width / 2, cy + 135);
      ctx.font = "italic 32px 'Source Serif 4', serif";
      ctx.fillStyle = RED;
      ctx.fillText("Awareness Seminar", canvas.width / 2, cy + 180);

      // QR Code box
      const qrSize = 440;
      const qrX = (canvas.width - qrSize) / 2;
      const qrY = cy + 230;
      ctx.strokeStyle = "rgba(17,17,17,0.12)";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 24, qrY - 24, qrSize + 48, qrSize + 48);
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
      URL.revokeObjectURL(url);

      // Reference code pill
      ctx.fillStyle = "#666666";
      ctx.font = "500 22px 'IBM Plex Mono', monospace";
      ctx.fillText(`REF CODE: ${refCode}`, canvas.width / 2, qrY + qrSize + 68);

      // Dashed divider
      const divY = qrY + qrSize + 110;
      ctx.setLineDash([10, 10]);
      ctx.strokeStyle = "rgba(17,17,17,0.18)";
      ctx.beginPath();
      ctx.moveTo(cx + 40, divY);
      ctx.lineTo(cx + cw - 40, divY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Student Details
      ctx.fillStyle = DARK;
      ctx.font = "600 38px 'Source Serif 4', serif";
      ctx.fillText(row.full_name, canvas.width / 2, divY + 70);

      ctx.fillStyle = "#444444";
      ctx.font = "500 28px 'IBM Plex Mono', monospace";
      ctx.fillText(row.id_number, canvas.width / 2, divY + 115);

      ctx.fillStyle = "#666666";
      ctx.font = "400 25px 'Source Serif 4', serif";
      const metaLine = `${row.college ? `${row.college} · ` : ""}${row.program}`;
      ctx.fillText(metaLine, canvas.width / 2, divY + 162);
      ctx.fillText(`${row.year_level} · Block ${row.block}`, canvas.width / 2, divY + 198);

      ctx.fillStyle = "#888888";
      ctx.font = "400 19px 'IBM Plex Mono', monospace";
      ctx.fillText("SCAN AT THE DOOR FOR CHECK-IN & CHECK-OUT", canvas.width / 2, cy + ch - 42);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
      });

      const file = new File([blob], `CAST-Seminar-Pass-${row.id_number || refCode}.png`, { type: "image/png" });
      let shared = false;

      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "CAST Seminar Entry Pass",
              text: `My CAST Seminar Pass (${refCode})`,
              files: [file],
            });
            shared = true;
          }
        } catch (e: any) {
          if (e?.name === "AbortError") {
            setDownloading(false);
            return;
          }
        }
      }

      if (shared) {
        setDownloading(false);
        return;
      }

      const blobUrl = URL.createObjectURL(blob);
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

      if (isIOS) {
        window.open(blobUrl, "_blank");
        setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
      } else {
        const link = document.createElement("a");
        link.download = `CAST-Seminar-Pass-${row.id_number || refCode}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5_000);
      }
    } catch {
      alert("Couldn't generate image. Please take a screenshot instead.");
    } finally {
      setDownloading(false);
    }
  };

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
        padding: `calc(${HEADER_H} + env(safe-area-inset-top) + 1.25rem) 1.1rem calc(2.5rem + env(safe-area-inset-bottom))`,
      }}
    >
=
      {/* Fixed top shield buffer preventing fixed navbar overlap during scroll */}
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
        {/* Top back link */}
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="pass-btn"
            style={{
              ...mono,
              background: "none",
              border: "none",
              padding: "0.35rem 0",
              fontSize: "0.68rem",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            ← Registration Portal
          </button>
          {row?.college && (
            <span
              style={{
                ...mono,
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                padding: "0.25rem 0.6rem",
                borderRadius: 4,
                background: collegeColor,
                color: CREAM,
                fontWeight: 600,
              }}
            >
              {row.college}
            </span>
          )}
        </div>

        {/* Main Ticket Card */}
        <div
          className="pass-card"
          style={{
            background: "#ffffff",
            borderRadius: 10,
            border: "1px solid rgba(17,17,17,0.1)",
            borderTop: `4px solid ${RED}`,
            boxShadow: "0 16px 40px rgba(17,17,17,0.07)",
            overflow: "hidden",
            position: "relative",
            ...ss,
          }}
        >
          {/* Loading State */}
          {!row && !missing && (
            <div style={{ padding: "3.5rem 1.75rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  border: `3px solid ${RED}`,
                  borderTopColor: "transparent",
                  animation: "pass-spin 0.9s linear infinite",
                }}
              />
              <p style={{ ...mono, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#777", margin: 0 }}>
                {netError ? "Connection slow — retrying..." : "Generating your pass..."}
              </p>
            </div>
          )}

          {/* Missing / Invalid State */}
          {missing && (
            <div style={{ padding: "2.5rem 1.75rem", textAlign: "center" }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "rgba(220,38,38,0.08)",
                  color: RED,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.25rem",
                  marginBottom: "1rem",
                }}
              >
                ✕
              </div>
              <p style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.24em", textTransform: "uppercase", color: RED, margin: "0 0 0.4rem" }}>
                Pass Not Found
              </p>
              <h1 style={{ ...dg, fontSize: "1.35rem", margin: "0 0 0.6rem" }}>Invalid Registration Link</h1>
              <p style={{ fontSize: "0.88rem", color: "#666", lineHeight: 1.55, margin: "0 0 1.5rem", fontWeight: 300 }}>
                We couldn&apos;t find a seminar registration matching this pass ID.
              </p>
              <button
                type="button"
                onClick={() => router.push("/cast-seminar")}
                className="pass-btn"
                style={{
                  ...mono,
                  width: "100%",
                  padding: "0.95rem 1.25rem",
                  background: DARK,
                  color: CREAM,
                  border: "none",
                  borderRadius: 6,
                  fontSize: "0.72rem",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                Register for Seminar
              </button>
            </div>
          )}

          {/* Active Ticket Content */}
          {row && (
            <>
              {/* Top Section: Event Title + QR */}
              <div style={{ padding: "1.75rem 1.5rem 1.4rem", textAlign: "center" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem", marginBottom: "0.55rem" }}>
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: isCheckedOut ? BLUE : isCheckedIn ? GREEN : RED,
                      animation: !isCheckedOut ? "pass-pulse 2s infinite" : "none",
                    }}
                  />
                  <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.26em", textTransform: "uppercase", color: RED, fontWeight: 500 }}>
                    {isCheckedOut ? "Attendance Complete" : isCheckedIn ? "Checked In · Inside Venue" : "You're Registered"}
                  </span>
                </div>

                <h1 style={{ ...dg, fontSize: "clamp(1.2rem, 4.8vw, 1.45rem)", margin: "0 0 0.25rem", lineHeight: 1.15, letterSpacing: "-0.01em" }}>
                  Suicide Prevention Month
                </h1>
                <p style={{ ...ss, fontStyle: "italic", fontWeight: 300, fontSize: "1.05rem", color: RED, margin: "0 0 1.35rem" }}>
                  CAST Awareness Seminar Pass
                </p>

                {/* QR Frame */}
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
                  <QRCode value={`seminar:${row.id}`} size={208} level="M" />
                </div>

                {/* Copyable Manual Reference Code */}
                <div className="no-print" style={{ marginTop: "0.9rem", display: "flex", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={handleCopyRef}
                    className="pass-btn"
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

              {/* Perforated Ticket Divider */}
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

              {/* Bottom Section: Student Info & Attendance Status */}
              <div style={{ padding: "1.1rem 1.5rem 1.6rem" }}>
                <div style={{ textAlign: "center", marginBottom: "1.15rem" }}>
                  <p style={{ fontSize: "1.15rem", fontWeight: 600, margin: "0 0 0.2rem", color: DARK }}>
                    {row.full_name}
                  </p>
                  <p style={{ ...mono, fontSize: "0.78rem", color: "#555", margin: "0 0 0.35rem", letterSpacing: "0.05em" }}>
                    {row.id_number}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "#666", margin: 0, fontWeight: 300 }}>
                    {row.college ? `${row.college} · ` : ""}{row.program}
                  </p>
                  <p style={{ ...mono, fontSize: "0.68rem", color: "#888", margin: "0.25rem 0 0", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    {row.year_level} · Block {row.block}
                  </p>
                </div>

                {/* Two-Step Check-In / Check-Out Tracker */}
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
                      background: row.checked_in_at ? "rgba(6,64,43,0.07)" : "rgba(17,17,17,0.03)",
                      border: `1px solid ${row.checked_in_at ? "rgba(6,64,43,0.22)" : "rgba(17,17,17,0.08)"}`,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: row.checked_in_at ? GREEN : "#888" }}>
                      01 · Check In
                    </span>
                    <span style={{ ...mono, display: "block", fontSize: "0.72rem", fontWeight: 600, color: row.checked_in_at ? GREEN : "#555", marginTop: "0.2rem" }}>
                      {fmtTime(row.checked_in_at) ?? "Pending"}
                    </span>
                  </div>

                  <div
                    style={{
                      padding: "0.65rem 0.75rem",
                      borderRadius: 6,
                      background: row.checked_out_at ? "rgba(29,78,216,0.07)" : "rgba(17,17,17,0.03)",
                      border: `1px solid ${row.checked_out_at ? "rgba(29,78,216,0.22)" : "rgba(17,17,17,0.08)"}`,
                      textAlign: "left",
                    }}
                  >
                    <span style={{ ...mono, display: "block", fontSize: "0.55rem", letterSpacing: "0.18em", textTransform: "uppercase", color: row.checked_out_at ? BLUE : "#888" }}>
                      02 · Check Out
                    </span>
                    <span style={{ ...mono, display: "block", fontSize: "0.72rem", fontWeight: 600, color: row.checked_out_at ? BLUE : "#555", marginTop: "0.2rem" }}>
                      {fmtTime(row.checked_out_at) ?? "Pending"}
                    </span>
                  </div>
                </div>

                {/* Save PNG Pass Button */}
                <button
                  type="button"
                  onClick={handleDownloadPass}
                  disabled={downloading}
                  className="pass-btn no-print"
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
                  {downloading ? "Saving Pass..." : canShare ? "Save / Share Pass (PNG)" : "Download Pass (PNG)"}
                </button>

                <p style={{ fontSize: "0.78rem", color: "#888", margin: "0.85rem 0 0", textAlign: "center", lineHeight: 1.45, fontWeight: 300 }}>
                  Save or screenshot this pass. Present it at the door when you arrive and again before leaving.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}