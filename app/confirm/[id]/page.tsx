"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import QRCode from "react-qr-code";
import { supabase } from "@/lib/supabase";

/* ─── Injected CSS (Matches Flair Theme) ───────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

* { -webkit-tap-highlight-color: transparent; }

@keyframes confirm-reveal-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.confirm-reveal { opacity: 0; animation: confirm-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

.flair-btn { transition: background 0.15s ease, transform 0.1s ease, color 0.15s ease; cursor: pointer; }
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

export default function ConfirmPage() {
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

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#06402B";

  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

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
    setLoading(true);
    setErrorState(null);
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
    } catch (err: any) {
      console.error(err);
      setErrorState("network");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRegistration();
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
  }, [fetchRegistration]);

  const handleCopyCode = () => {
    if (!data) return;
    const refCode = data.id.slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = async () => {
    const trimmed = editBlock.trim().replace(/\s+/g, " ").replace(/\b\w/g, c => c.toUpperCase());
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
    } catch (err) {
      console.error(err);
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
      const HEADER_H = 80;
      const FOOTER_H = 100;
      const W = QR_SIZE + PADDING * 2;
      const H = HEADER_H + QR_SIZE + PADDING + FOOTER_H;

      const cloned = svgEl.cloneNode(true) as SVGSVGElement;
      cloned.setAttribute("width",  String(QR_SIZE));
      cloned.setAttribute("height", String(QR_SIZE));
      if (!cloned.getAttribute("viewBox")) cloned.setAttribute("viewBox", `0 0 ${QR_SIZE} ${QR_SIZE}`);
      
      cloned.querySelectorAll<SVGElement>("*").forEach(el => {
        const fill = getComputedStyle(el).fill;
        if (fill && fill !== "none") el.setAttribute("fill", fill);
      });

      const svgString = new XMLSerializer().serializeToString(cloned);
      const svgB64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));

      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image();
        i.onload  = () => resolve(i);
        i.onerror = reject;
        i.src = svgB64;
      });

      const canvas = document.createElement("canvas");
      const SCALE = 2;
      canvas.width  = W * SCALE;
      canvas.height = H * SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.scale(SCALE, SCALE);

      // Background - Cream
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, W, H);

      // Header strip - Dark
      ctx.fillStyle = DARK;
      ctx.fillRect(0, 0, W, HEADER_H);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("FLAIR · USC FROSH WALK 2026", W / 2, HEADER_H / 2 + 7);

      // QR code area
      ctx.drawImage(img, PADDING, HEADER_H, QR_SIZE, QR_SIZE);
      ctx.strokeStyle = "rgba(17,17,17,0.1)";
      ctx.lineWidth = 1;
      ctx.strokeRect(PADDING, HEADER_H, QR_SIZE, QR_SIZE);

      // Footer
      const footerY = HEADER_H + QR_SIZE + 20;
      ctx.fillStyle = "#888888";
      ctx.font = "14px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText("REFERENCE CODE", W / 2, footerY + 22);
      ctx.fillStyle = DARK;
      ctx.font = "bold 36px 'IBM Plex Mono', monospace";
      ctx.fillText(refCode, W / 2, footerY + 64);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/png");
      });

      const file = new File([blob], `flair-qr-${refCode}.png`, { type: "image/png" });
      let shared = false;

      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: "Flair QR Ticket",
              text: `My Flair Registration Code: ${refCode}`,
              files: [file],
            });
            shared = true;
          }
        } catch (e: any) {
          if (e?.name === "AbortError") { setDownloadingPng(false); return; }
        }
      }

      if (shared) { setDownloadingPng(false); return; }

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
    } catch (err) {
      console.error("QR export failed:", err);
      alert("Couldn't generate the image automatically. Tip: Take a screenshot of this page — it works just as well at the entrance.");
    } finally {
      setDownloadingPng(false);
    }
  };

  /* ─── Loading / Error States ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
        <p style={{ ...dg, fontSize: "1.5rem", color: DARK, animation: "pulse 1.5s infinite" }}>LOADING...</p>
      </div>
    );
  }

  if (errorState === "network" || errorState === "not_found") {
    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "clamp(7rem, 12vw, 9rem) 2rem 2rem", textAlign: "center" }}>
        <h2 style={{ ...dg, fontSize: "2.5rem", color: DARK }}>{errorState === "network" ? "CONNECTION ERROR" : "NOT FOUND"}</h2>
        <p style={{ ...ss, color: "#666", fontSize: "1rem" }}>
          {errorState === "network" ? "We couldn't load your ticket. Please check your internet connection." : "This registration does not exist or was deleted."}
        </p>
        {errorState === "network" && (
          <button onClick={fetchRegistration} className="flair-btn" style={{ ...mono, padding: "0.75rem 2rem", background: DARK, color: CREAM, border: "none", borderRadius: 4, letterSpacing: "0.15em", textTransform: "uppercase", fontSize: "0.75rem" }}>
            Try Again
          </button>
        )}
      </div>
    );
  }

  /* ─── Main Success Render ────────────────────────────────────────────────── */
  const qrValue = `flair:${data.id}`;
  const refCode = data.id.slice(0, 8).toUpperCase();
  const detailStyle = { display: "flex", flexDirection: "column" as const, gap: "0.25rem" };

  return (
    <div style={{ background: CREAM, color: DARK, minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", padding: "clamp(7rem, 12vw, 9rem) 1.25rem 4rem" }}>
      
      {/* Header */}
      <div className="no-print" style={{ textAlign: "center", marginBottom: "2rem" }}>
        <p style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: GREEN, marginBottom: "0.5rem" }}>USC Frosh Walk 2026</p>
        <h1 style={{ ...dg, fontSize: "clamp(2rem, 8vw, 3.5rem)", lineHeight: 1, margin: 0 }}>YOU'RE IN.</h1>
      </div>

      {/* Ticket Card */}
      <div className="confirm-reveal print-break-inside-avoid" style={{ width: "100%", maxWidth: "420px", background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.04)" }}>
        
        {/* QR Section */}
        <div style={{ padding: "3rem 2rem 2rem", display: "flex", flexDirection: "column", alignItems: "center", borderBottom: "1px dashed rgba(17,17,17,0.15)" }}>
          <div ref={qrWrapRef} style={{ padding: "1rem", background: "#ffffff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8, marginBottom: "1.5rem" }}>
            <QRCode
              value={qrValue}
              size={200}
              level="H"
              fgColor={DARK}
              bgColor="#ffffff"
              style={{ height: "auto", maxWidth: "100%", width: "100%" }}
            />
          </div>
          <p style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "0.25rem" }}>Reference Code</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <p style={{ ...mono, fontSize: "1.75rem", fontWeight: 500, letterSpacing: "0.15em", color: DARK }}>{refCode}</p>
            <button 
              onClick={handleCopyCode} 
              className="flair-btn no-print" 
              style={{ background: "rgba(17,17,17,0.04)", border: "none", width: 32, height: 32, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: DARK }}
              title="Copy Code"
            >
              {copied ? "✓" : "⎘"}
            </button>
          </div>
        </div>

        {/* Details Section */}
        <div style={{ padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <span style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888" }}>Attendee Details</span>
            <span style={{ ...mono, fontSize: "0.55rem", background: "rgba(6,64,43,0.08)", color: GREEN, padding: "0.2rem 0.5rem", borderRadius: 12, letterSpacing: "0.1em", textTransform: "uppercase" }}>Registered</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={detailStyle}>
              <span style={{ ...mono, fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>Name</span>
              <span style={{ ...ss, fontSize: "1.1rem", fontWeight: 600 }}>{data.full_name}</span>
            </div>
            
            <div style={detailStyle}>
              <span style={{ ...mono, fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>Student ID</span>
              <span style={{ ...ss, fontSize: "1rem" }}>{data.id_number}</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={detailStyle}>
                <span style={{ ...mono, fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>College / Program</span>
                <span style={{ ...ss, fontSize: "0.9rem" }}>{data.college} • {data.program}</span>
              </div>
              <div style={detailStyle}>
                <span style={{ ...mono, fontSize: "0.6rem", color: "#888", textTransform: "uppercase" }}>Year / Block</span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ ...ss, fontSize: "0.9rem" }}>{data.year_level?.charAt(0)}Y • {data.block}</span>
                  <button onClick={() => { setEditBlock(data.block); setEditOpen(true); }} className="flair-btn no-print" style={{ ...mono, fontSize: "0.55rem", background: "transparent", border: "1px solid rgba(17,17,17,0.2)", padding: "0.15rem 0.4rem", borderRadius: 4, cursor: "pointer" }}>EDIT</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Action Buttons */}
      <div className="confirm-reveal no-print" style={{ display: "flex", gap: "0.75rem", width: "100%", maxWidth: "420px", marginTop: "1rem", animationDelay: "0.1s" }}>
        <button 
          onClick={handleSaveOrSharePng} 
          disabled={downloadingPng}
          className="flair-btn"
          style={{ flex: 1, ...mono, padding: "1rem", background: DARK, color: CREAM, border: "none", borderRadius: 8, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase", display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem" }}
        >
          {downloadingPng ? "SAVING..." : (canShare ? "SHARE / SAVE" : "SAVE IMAGE")}
        </button>
        <button 
          onClick={() => window.print()}
          className="flair-btn"
          style={{ flex: 1, ...mono, padding: "1rem", background: "transparent", color: DARK, border: "1px solid rgba(17,17,17,0.2)", borderRadius: 8, fontSize: "0.75rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
        >
          PRINT / PDF
        </button>
      </div>
      
      {/iphone|ipad|ipod/i.test(typeof navigator !== "undefined" ? navigator.userAgent : "") && (
        <p className="no-print confirm-reveal" style={{ ...ss, fontSize: "0.75rem", color: "#888", marginTop: "1.5rem", textAlign: "center", maxWidth: "300px", animationDelay: "0.2s" }}>
          iOS Tip: Tap "Share / Save", scroll down and select "Save Image". Or just take a screenshot.
        </p>
      )}

      {/* Edit Block Modal */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div onClick={() => !savingEdit && setEditOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(244, 239, 230, 0.8)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: "#fff", width: "100%", maxWidth: "380px", borderRadius: 8, padding: "2rem", boxShadow: "0 24px 48px rgba(0,0,0,0.1)", border: "1px solid rgba(17,17,17,0.1)" }}>
            <h2 style={{ ...dg, fontSize: "1.25rem", margin: "0 0 0.5rem 0" }}>Edit Block</h2>
            <p style={{ ...ss, fontSize: "0.85rem", color: "#666", marginBottom: "1.5rem", lineHeight: 1.5 }}>
              You can only correct your block section. Everything else is locked to your QR code.
            </p>
            
            <label style={{ display: "block", marginBottom: "1.5rem" }}>
              <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Block / Section</span>
              <input
                className="flair-input"
                value={editBlock}
                onChange={e => setEditBlock(e.target.value)}
                style={{ width: "100%", background: "rgba(17,17,17,0.03)", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 4, padding: "0.9rem 1rem", color: DARK, fontFamily: "'Source Serif 4', serif" }}
                autoFocus
              />
              {editError && <span style={{ ...mono, display: "block", marginTop: "0.4rem", fontSize: "0.7rem", color: "#dc2626" }}>{editError}</span>}
            </label>

            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button 
                onClick={() => setEditOpen(false)} 
                disabled={savingEdit}
                className="flair-btn"
                style={{ flex: 1, ...mono, padding: "0.8rem", background: "rgba(17,17,17,0.05)", color: DARK, border: "none", borderRadius: 4, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                CANCEL
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={savingEdit}
                className="flair-btn"
                style={{ flex: 1, ...mono, padding: "0.8rem", background: DARK, color: CREAM, border: "none", borderRadius: 4, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                {savingEdit ? "SAVING..." : "SAVE"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}