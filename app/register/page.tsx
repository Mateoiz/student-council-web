"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

* { -webkit-tap-highlight-color: transparent; }

@keyframes flair-reveal-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.flair-reveal { opacity: 0; }
.flair-reveal.in-view { animation: flair-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes flair-slide-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
.flair-step { animation: flair-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes flair-dropdown-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.flair-dropdown-menu { animation: flair-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes flair-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}
.flair-shake { animation: flair-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

/* desktop hover states */
.flair-college {
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}
.flair-college:hover {
  border-color: #06402B;
  background: rgba(255,255,255,0.55);
}
.flair-dd-item { transition: background 0.2s ease, border-color 0.2s ease; cursor: pointer; }
.flair-dd-item:hover { background: rgba(17,17,17,0.04); }

/* touch press states */
.flair-college:active, .flair-dd-item:active, .flair-btn:active, .flair-dropdown-trigger:active {
  transform: scale(0.98);
}
.flair-btn { transition: background 0.15s ease, transform 0.1s ease; }

.flair-input, .flair-dropdown-trigger {
  font-size: 16px; /* stops iOS Safari auto-zoom-on-focus */
  transition: border-color 0.25s ease, background 0.25s ease;
  -webkit-appearance: none;
  appearance: none;
}
.flair-input:focus {
  outline: none;
  border-color: #06402B !important;
  background: rgba(6,64,43,0.04) !important;
}
.flair-input.flair-invalid, .flair-dropdown-trigger.flair-invalid {
  border-color: #dc2626 !important;
  background: rgba(220,38,38,0.03) !important;
}

.flair-chevron { transition: transform 0.3s ease; }

.flair-dropdown-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(17,17,17,0.03);
  border: 1px solid rgba(17,17,17,0.1);
  border-radius: 4px;
  padding: 0.9rem 1rem;
  color: #111111;
  text-align: left;
  outline: none;
}
.flair-dropdown-trigger:focus {
  border-color: #06402B !important;
  background: rgba(6,64,43,0.04) !important;
}
.flair-dropdown-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.flair-choice {
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease, border-color 0.2s ease;
}
.flair-choice:hover { transform: translateY(-4px); }
.flair-choice:active { transform: scale(0.985); }
.flair-choice-primary:hover { box-shadow: 0 18px 40px rgba(6,64,43,0.32); }
.flair-choice-secondary:hover { border-color: #dc2626 !important; box-shadow: 0 10px 24px rgba(220,38,38,0.10); }

@keyframes flair-pulse {
  0%   { box-shadow: 0 0 0 0 rgba(244,239,230,0.6); }
  70%  { box-shadow: 0 0 0 9px rgba(244,239,230,0); }
  100% { box-shadow: 0 0 0 0 rgba(244,239,230,0); }
}
.flair-live-dot { animation: flair-pulse 1.8s infinite; }

@keyframes flair-arrow {
  0%, 100% { transform: translateX(0); }
  50%      { transform: translateX(6px); }
}
.flair-choice-primary:hover .flair-arrow { animation: flair-arrow 0.9s ease-in-out infinite; }

/* ── Frosh Night: theme transition, accordion, switch, dropzone ── */
.flair-night-zone { transition: background-color 0.5s cubic-bezier(0.22, 1, 0.36, 1), color 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s ease, box-shadow 0.5s ease; }
.flair-dropzone { transition: border-color 0.25s ease, background-color 0.25s ease, transform 0.15s ease; cursor: pointer; }
.flair-dropzone:hover { border-color: #F59E0B !important; background-color: rgba(245, 158, 11, 0.1) !important; }
.flair-dropzone:active { transform: scale(0.99); }
`;

/* ─── Data & Constants ─────────────────────────────────────────────────────── */
export type CollegeId = "CAST" | "CBMA" | "COED" | "CVMAS";
export type AttendanceType = "both" | "flair_only" | "ga_only";

const COLLEGES: { id: CollegeId; name: string; color: string }[] = [
  { id: "CAST",  name: "College of Arts, Sciences, and Technology",             color: "#dc2626" },
  { id: "CBMA",  name: "College of Business, Management & Accountancy",         color: "#ca8a04" },
  { id: "COED",  name: "College of Education",                                  color: "#2563eb" },
  { id: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#06402B" },
];

const PROGRAMS_BY_COLLEGE: Record<CollegeId, { id: string; label: string }[]> = {
  CAST: [
    { id: "ba-psych", label: "BA Psychology" },
    { id: "bs-cpe",   label: "BS Computer Engineering" },
    { id: "bs-cs",    label: "BS Computer Science" },
  ],
  CBMA: [
    { id: "bs-accountancy", label: "BS Accountancy" },
    { id: "bsba-fm",        label: "BSBA - Financial Management" },
    { id: "bsba-mm",        label: "BSBA - Marketing Management" },
    { id: "bs-hm",          label: "BS Hospitality Management" },
    { id: "bs-tm",          label: "BS Tourism Management" },
  ],
  COED: [
    { id: "beed", label: "Bachelor of Elementary Education" },
    { id: "bsed", label: "Bachelor of Secondary Education" },
  ],
  CVMAS: [
    { id: "dvm",         label: "Doctor of Veterinary Medicine" },
    { id: "bs-foodtech", label: "BS Food Technology" },
    { id: "bs-agri",     label: "BS Agriculture" },
  ],
};

function getAttendanceOptions(college: CollegeId | null): { id: AttendanceType; label: string }[] {
  const c = college ?? "College";
  return [
    { id: "both",       label: `Both FLAIR Frosh Walk & ${c} General Assembly` },
    { id: "flair_only", label: `FLAIR Frosh Walk Only` },
    { id: "ga_only",    label: `${c} General Assembly Only` },
  ];
}

const CONSENT_PDF_URL = "/frosh-night-parents-consent.pdf";
const CONSENT_BUCKET = "flair-consents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DRAFT_KEY = "flair_register_frosh_v3";
const SEMINAR_ROUTE = "/cast-seminar";
const ID_REGEX = /^20\d{2}-\d{2}-\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+63|0)9\d{9}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ''.,\- ]+$/;
const BLOCK_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9'\- ]+$/;

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "0,0,0";
}

function formatName(s: string) {
  return s.replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());
}
function formatBlockStr(s: string) {
  return s.replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());
}

/** Strips accents (e.g. ñ -> n) and non-letters for clean comparison */
function normalizeAlpha(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

/** Validates firstname.surname@dlsau.edu.ph and cross-checks it against the entered full name. */
function validateDlsauEmail(rawEmail: string, rawFullName: string): string | null {
  const e = rawEmail.trim().toLowerCase();
  if (!e) return "Email is required.";
  if (!EMAIL_RE.test(e)) return "Enter a valid email address.";

  const [localPart, domain] = e.split("@");
  if (domain !== "dlsau.edu.ph") {
    return "Must use your official @dlsau.edu.ph email.";
  }

  if (!localPart.includes(".") || localPart.includes("_")) {
    return "Must follow format: firstname.surname@dlsau.edu.ph";
  }

  const parts = localPart.split(".");
  if (parts.length < 2 || !parts[0] || !parts[parts.length - 1]) {
    return "Must follow format: firstname.surname@dlsau.edu.ph";
  }

  const emailFirst = normalizeAlpha(parts[0]);
  const emailLast = normalizeAlpha(parts.slice(1).join(""));

  const nameTrimmed = rawFullName.trim();
  if (nameTrimmed.length < 3) return null;

  const SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);
  const rawTokens = nameTrimmed
    .split(/\s+/)
    .map(tok => normalizeAlpha(tok))
    .filter(Boolean);

  const coreTokens = rawTokens.filter((tok, idx) => {
    if (idx > 0 && SUFFIXES.has(tok)) return false;
    if (idx > 0 && idx < rawTokens.length - 1 && tok.length === 1) return false;
    return true;
  });

  if (coreTokens.length < 2) {
    return "Please enter both your first name and surname to verify your email.";
  }

  const firstToken = coreTokens[0];
  const combinedFirstTokens = coreTokens.slice(0, -1).join("");

  const firstMatches =
    emailFirst === firstToken ||
    combinedFirstTokens.startsWith(emailFirst) ||
    emailFirst.startsWith(firstToken);

  if (!firstMatches) {
    return `Email first name ("${parts[0]}") does not match your entered first name.`;
  }

  const lastToken = coreTokens[coreTokens.length - 1];
  const lastTwoTokens = coreTokens.length >= 3 ? coreTokens.slice(-2).join("") : lastToken;
  const lastThreeTokens = coreTokens.length >= 4 ? coreTokens.slice(-3).join("") : lastTwoTokens;

  const lastMatches =
    emailLast === lastToken ||
    emailLast === lastTwoTokens ||
    emailLast === lastThreeTokens ||
    lastTwoTokens.endsWith(emailLast) ||
    emailLast.endsWith(lastToken);

  if (!lastMatches) {
    return `Email surname ("${parts.slice(1).join(".")}") does not match your entered surname.`;
  }

  return null;
}

/* ─── Custom Dropdown ──────────────────────────────────────────────────────── */
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setIsMobile(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [breakpoint]);
  return isMobile;
}

type DropdownOption = { id: string; label: string };

function CustomDropdown({
  value, options, placeholder, disabledPlaceholder, disabled, invalid, onChange, onOpen,
}: {
  value: string | null; options: DropdownOption[]; placeholder: string; disabledPlaceholder?: string;
  disabled?: boolean; invalid?: boolean; onChange: (id: string) => void; onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => { document.removeEventListener("mousedown", onDocClick); document.removeEventListener("keydown", onEsc); };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: open ? 100 : "auto" }}>
      <button type="button" className={`flair-dropdown-trigger${invalid ? " flair-invalid" : ""}`} disabled={disabled}
        onClick={() => { if (disabled) return; setOpen(o => !o); if (!open) onOpen?.(); }}
        style={{ fontFamily: "'Source Serif 4', serif", background: "#fff" }}>
        <span style={{ color: selected ? "#111111" : "#999" }}>
          {selected ? selected.label : disabled ? (disabledPlaceholder ?? placeholder) : placeholder}
        </span>
        <span className="flair-chevron" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", transform: open ? "rotate(180deg)" : "rotate(0deg)", marginLeft: "0.5rem", flexShrink: 0 }}>
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div className="flair-dropdown-menu" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 999,
          background: "#fff", border: "1px solid rgba(17,17,17,0.12)", borderRadius: 4,
          boxShadow: "0 12px 32px rgba(0,0,0,0.18)", overflow: "hidden", maxHeight: "260px", overflowY: "auto",
        }} role="listbox">
          {options.map(o => (
            <div key={o.id} className="flair-dd-item" role="option" aria-selected={o.id === value}
              onClick={e => { e.stopPropagation(); onChange(o.id); setOpen(false); }}
              style={{ padding: "0.8rem 1rem", fontFamily: "'Source Serif 4', serif", fontSize: "0.9rem", background: o.id === value ? "rgba(6,64,43,0.06)" : "#fff", color: "#111111", borderBottom: "1px solid rgba(17,17,17,0.06)" }}>
              {o.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: "#dc2626", fontFamily: "'IBM Plex Mono', monospace" }}>
      {children}
    </span>
  );
}

/* ─── Frosh Night Section ──────────────────────────────────────────────────── */
function FroshNightSection({
  attending,
  onToggle,
  file,
  onFileSelect,
  error,
  isMobile,
  mono,
  ss,
  dg,
}: {
  attending: boolean;
  onToggle: () => void;
  file: File | null;
  onFileSelect: (f: File | null) => void;
  error: string | null;
  isMobile?: boolean;
  mono: React.CSSProperties;
  ss: React.CSSProperties;
  dg: React.CSSProperties;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const GOLD = "#F59E0B";
  const NIGHT_BG = "#0B0B0E";
  const CREAM = "#F4EFE6";

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    onFileSelect(files[0]);
  };

  return (
    <div
      className="flair-night-zone"
      style={{
        marginTop: "1.25rem",
        borderRadius: 8,
        padding: isMobile ? "1.15rem" : "1.35rem 1.5rem",
        backgroundColor: attending ? NIGHT_BG : "rgba(17,17,17,0.03)",
        color: attending ? CREAM : "#111111",
        border: attending ? "1px solid rgba(245, 158, 11, 0.45)" : "1px solid rgba(17,17,17,0.12)",
        boxShadow: attending ? "0 20px 48px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.06)" : "none",
        position: "relative",
        zIndex: 1,
        overflow: "hidden",
      }}
    >
      {/* Subtle Ambient Radial Glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-35%",
          right: "-15%",
          width: 240,
          height: 240,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 70%)",
          opacity: attending ? 1 : 0,
          transition: "opacity 0.55s ease",
          pointerEvents: "none",
        }}
      />

      {/* Toggle Header */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={attending}
        onClick={onToggle}
        onKeyDown={e => (e.key === "Enter" || e.key === " ") && onToggle()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          cursor: "pointer",
          position: "relative",
          zIndex: 2,
          userSelect: "none",
        }}
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem", flexWrap: "wrap" }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: attending ? GOLD : "rgba(17,17,17,0.35)",
                transition: "background-color 0.35s ease",
              }}
            />
            <span
              style={{
                ...mono,
                fontSize: "0.56rem",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: attending ? GOLD : "#666",
                fontWeight: 500,
                transition: "color 0.35s ease",
              }}
            >
              Oct 6 · 5:00 PM – 8:00 PM · IAC
            </span>
          </div>
          <div style={{ ...dg, fontSize: isMobile ? "0.98rem" : "1.05rem", color: attending ? CREAM : "#111111", transition: "color 0.35s ease" }}>
            I will attend Frosh Night
          </div>
          <p style={{ ...ss, fontSize: "0.8rem", color: attending ? "rgba(244,239,230,0.68)" : "#666", margin: "0.2rem 0 0", fontWeight: 300, lineHeight: 1.45, transition: "color 0.35s ease" }}>
            Culminating evening activity. Requires a signed Parent/Guardian&apos;s Consent Reply Slip.
          </p>
        </div>

        {/* Animated Switch */}
        <div
          style={{
            position: "relative",
            width: 48,
            height: 26,
            borderRadius: 999,
            backgroundColor: attending ? GOLD : "rgba(17,17,17,0.18)",
            transition: "background-color 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 3,
              left: 3,
              width: 20,
              height: 20,
              borderRadius: "50%",
              backgroundColor: attending ? NIGHT_BG : "#ffffff",
              transform: attending ? "translateX(22px)" : "translateX(0px)",
              transition: "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
            }}
          />
        </div>
      </div>

      {/* Smooth Grid Accordion Drawer */}
      <div
        aria-hidden={!attending}
        style={{
          display: "grid",
          gridTemplateRows: attending ? "1fr" : "0fr",
          opacity: attending ? 1 : 0,
          pointerEvents: attending ? "auto" : "none",
          transition: "grid-template-rows 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1)",
          position: "relative",
          zIndex: 2,
        }}
      >
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div style={{ paddingTop: "1.15rem", marginTop: "1.15rem", borderTop: "1px solid rgba(244,239,230,0.12)" }}>

            {/* Strict Entry Notice */}
            <div
              style={{
                background: "rgba(220, 38, 38, 0.12)",
                border: "1px solid rgba(248, 113, 113, 0.3)",
                borderLeft: "3px solid #EF4444",
                borderRadius: 4,
                padding: "0.75rem 0.85rem",
                marginBottom: "1rem",
              }}
            >
              <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#F87171", display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
                Mandatory Requirement · Office of Student Affairs
              </span>
              <p style={{ ...ss, fontSize: "0.78rem", lineHeight: 1.5, color: "rgba(244,239,230,0.9)", margin: 0, fontWeight: 300 }}>
                Only college students with a duly signed <strong>Parent/Guardian&apos;s Consent Reply Slip</strong> are permitted to join. Without a valid upload, your Frosh Night entrance is <strong>void</strong>.
              </p>
            </div>

            {/* Step 1: Download Template */}
            <div
              style={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                alignItems: isMobile ? "stretch" : "center",
                justifyContent: "space-between",
                gap: "0.75rem",
                marginBottom: "1rem",
                background: "rgba(255,255,255,0.035)",
                padding: "0.85rem 0.95rem",
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div>
                <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: "0.15rem" }}>
                  01 · Blank Consent Form
                </span>
                <span style={{ ...ss, fontSize: "0.8rem", color: "rgba(244,239,230,0.85)", fontWeight: 300 }}>
                  Download the official PDF and have your parent/guardian sign the Reply Slip.
                </span>
              </div>
              <a
                href={CONSENT_PDF_URL}
                download="FROSH_NIGHT_PARENTS_CONSENT.pdf"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="flair-btn"
                style={{
                  ...mono,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  fontSize: "0.64rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: isMobile ? "0.75rem 1rem" : "0.6rem 0.95rem",
                  borderRadius: 4,
                  background: GOLD,
                  color: NIGHT_BG,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </a>
            </div>

            {/* Step 2: Upload Signed Copy */}
            <div>
              <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GOLD, display: "block", marginBottom: "0.45rem" }}>
                02 · Upload Signed Reply Slip (Required)
              </span>

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                onChange={e => handleFiles(e.target.files)}
                style={{ display: "none" }}
              />

              <div
                className="flair-dropzone"
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => {
                  e.preventDefault();
                  setDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                style={{
                  border: `1.5px dashed ${error ? "#ef4444" : dragging || file ? GOLD : "rgba(244,239,230,0.24)"}`,
                  backgroundColor: dragging ? "rgba(245,158,11,0.1)" : file ? "rgba(16,185,129,0.08)" : "rgba(255,255,255,0.025)",
                  borderRadius: 6,
                  padding: isMobile ? "1.1rem 0.9rem" : "1.2rem 1rem",
                  textAlign: "center",
                }}
              >
                {file ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", textAlign: "left" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <span style={{ ...mono, fontSize: "0.56rem", color: "#34d399", letterSpacing: "0.16em", textTransform: "uppercase", display: "block", marginBottom: "0.15rem" }}>
                        Signed Consent Attached
                      </span>
                      <span style={{ ...ss, fontSize: "0.84rem", color: CREAM, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        onFileSelect(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      style={{
                        ...mono,
                        fontSize: "0.6rem",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "0.45rem 0.7rem",
                        borderRadius: 4,
                        border: "1px solid rgba(244,239,230,0.25)",
                        background: "transparent",
                        color: CREAM,
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.35rem" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.9 }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <polyline points="9 15 12 12 15 15" />
                    </svg>
                    <p style={{ ...ss, fontSize: "0.84rem", color: CREAM, margin: 0 }}>
                      <strong>Tap to select file</strong> {isMobile ? "" : "or drag and drop here"}
                    </p>
                    <p style={{ ...mono, fontSize: "0.56rem", color: "rgba(244,239,230,0.45)", margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      PDF, JPG, or PNG · Max 10MB
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <span style={{ display: "block", marginTop: "0.45rem", fontSize: "0.72rem", color: "#f87171", fontFamily: "'IBM Plex Mono', monospace" }}>
                  {error}
                </span>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const TOTAL_STEPS = 4;

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function FlairRegisterPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [mode, setMode] = useState<"choose" | "flair">("choose");
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [college, setCollege] = useState<CollegeId | null>(null);
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("both");
  const [attendingFroshNight, setAttendingFroshNight] = useState(false);
  const [consentFile, setConsentFile] = useState<File | null>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [block, setBlock] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idError, setIdError] = useState("");
  const [idChecking, setIdChecking] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [shakeStep, setShakeStep] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const submitLockRef = useRef(false);
  const draftClearedRef = useRef(false);
  const idCheckTokenRef = useRef(0);
  const hydratedRef = useRef(false);

  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#06402B";
  const accent = college ? COLLEGES.find(c => c.id === college)?.color ?? GREEN : GREEN;

  // Init CSS
  useEffect(() => {
    const id = "flair-css";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = STYLES.replace(/\u00A0/g, " ");
  }, []);

  // Intersection Observer
  useEffect(() => {
    if (isMobile !== false || mode !== "flair") return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.12 },
    );
    const t = setTimeout(() => document.querySelectorAll(".flair-reveal").forEach(el => io.observe(el)), 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [isMobile, mode]);

  // Draft Restore
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.fullName) setFullName(d.fullName);
        if (d.email) setEmail(d.email);
        if (d.contactNumber) setContactNumber(d.contactNumber);
        if (d.idNumber) setIdNumber(d.idNumber);
        if (d.college) setCollege(d.college);
        if (d.attendanceType) setAttendanceType(d.attendanceType);
        if (d.program) setProgram(d.program);
        if (d.block) setBlock(d.block);
        if (typeof d.step === "number") setStep(d.step);
        setMode("flair");
        setDraftRestored(true);
      }
    } catch {}
    hydratedRef.current = true;
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (!hydratedRef.current || draftClearedRef.current) return;
    const hasContent = fullName || email || contactNumber || idNumber || college || block;
    if (!hasContent) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName, email, contactNumber, idNumber, college, attendanceType, program, block, step }));
    } catch {}
  }, [fullName, email, contactNumber, idNumber, college, attendanceType, program, block, step]);

  const clearDraft = useCallback(() => {
    draftClearedRef.current = true;
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);

  // ID Formatter & Live Validate
  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    let f = digits.slice(0, 12);
    if (f.length > 6) f = `${f.slice(0, 4)}-${f.slice(4, 6)}-${f.slice(6)}`;
    else if (f.length > 4) f = `${f.slice(0, 4)}-${f.slice(4)}`;
    setIdNumber(f);
  };

  useEffect(() => {
    const trimmed = idNumber.trim();
    if (!trimmed || !ID_REGEX.test(trimmed)) {
      setIdError("");
      setIdChecking(false);
      return;
    }
    const token = ++idCheckTokenRef.current;
    setIdChecking(true);
    setIdError("");

    const t = setTimeout(async () => {
      try {
        const { data, error: qErr } = await supabase.from("flair_registrations").select("id").eq("id_number", trimmed).limit(1);
        if (idCheckTokenRef.current !== token) return;
        if (qErr) throw qErr;
        setIdError(data && data.length > 0 ? "This ID number is already registered." : "");
      } catch {
        if (idCheckTokenRef.current === token) setIdError("Couldn't verify ID — check connection.");
      } finally {
        if (idCheckTokenRef.current === token) setIdChecking(false);
      }
    }, 550);

    return () => clearTimeout(t);
  }, [idNumber]);

  // Validation Checkers
  const nameError = useMemo(() => {
    const t = fullName.trim();
    if (!t) return "Full name is required.";
    if (t.length < 3) return "Name looks too short.";
    if (!NAME_REGEX.test(t)) return "Use letters and basic punctuation only.";
    if (t.split(/\s+/).filter(Boolean).length < 2) return "Enter your full name (First Name & Surname).";
    return null;
  }, [fullName]);

  const emailError = useMemo(() => {
    return validateDlsauEmail(email, fullName);
  }, [email, fullName]);

  const phoneError = useMemo(() => {
    const t = contactNumber.trim();
    if (!t) return "Contact number is required.";
    if (!PHONE_RE.test(t)) return "Enter a valid PH number (e.g. 09XXXXXXXXX).";
    return null;
  }, [contactNumber]);

  const idFormatError = useMemo(() => {
    if (!idNumber) return "ID number is required.";
    if (!ID_REGEX.test(idNumber)) return "Use format 20XX-XX-XXXXXX.";
    if (idError) return idError;
    return null;
  }, [idNumber, idError]);

  const blockError = useMemo(() => {
    const t = block.trim();
    if (!t) return "Block/Section is required.";
    if (!BLOCK_REGEX.test(t)) return "Use letters, numbers, spaces, dashes only.";
    return null;
  }, [block]);

  const consentError = useMemo(() => {
    if (!attendingFroshNight) return null;
    if (!consentFile) return "Signed Parent/Guardian's Consent form is required for Frosh Night.";
    if (consentFile.size > MAX_FILE_SIZE) return "File is too large (max 10MB).";
    const validType = consentFile.type === "application/pdf" || consentFile.type.startsWith("image/");
    if (!validType) return "Please upload a PDF or image file (JPG/PNG).";
    return null;
  }, [attendingFroshNight, consentFile]);

  const attendanceOptions = useMemo(() => getAttendanceOptions(college), [college]);

  const stepErrors = [
    !!nameError || !!emailError || !!phoneError,    // Step 0
    !!idFormatError || idChecking,                  // Step 1
    !college || !attendanceType || !!consentError,  // Step 2
    !program || !!blockError,                       // Step 3
  ];

  const canSubmit =
    !nameError && !emailError && !phoneError && !idFormatError && !idChecking &&
    !!college && !!attendanceType && !consentError && !!program && !blockError;

  const touch = (field: string) => setTouched(t => (t[field] ? t : { ...t, [field]: true }));

  function inputStyle(invalid: boolean) {
    return {
      width: "100%",
      background: "rgba(17,17,17,0.03)",
      border: `1px solid ${invalid ? "#dc2626" : "rgba(17,17,17,0.1)"}`,
      borderRadius: 4,
      padding: "0.9rem 1rem",
      color: DARK,
      ...ss,
    } as React.CSSProperties;
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setAttemptedSubmit(true);
    if (!canSubmit || isSubmitting || submitLockRef.current) return;

    submitLockRef.current = true;
    setIsSubmitting(true);

    const cleanName = formatName(fullName);
    const cleanEmail = email.trim().toLowerCase();
    const cleanId = idNumber.trim();
    const cleanBlock = formatBlockStr(block);
    const collegeMeta = COLLEGES.find(c => c.id === college);
    const programLabel = college ? PROGRAMS_BY_COLLEGE[college].find(p => p.id === program)?.label ?? program : program;

    const attendingFlair = attendanceType === "both" || attendanceType === "flair_only";
    const attendingGa = attendanceType === "both" || attendanceType === "ga_only";

    try {
      const submitPromise = (async () => {
        let uploadedConsentUrl: string | null = null;

        if (attendingFroshNight && consentFile) {
          const ext = consentFile.name.split(".").pop()?.toLowerCase() || "pdf";
          const filePath = `${cleanId}-${Date.now()}.${ext}`;
          const { error: upErr } = await supabase.storage
            .from(CONSENT_BUCKET)
            .upload(filePath, consentFile, { upsert: true });

          if (upErr) throw new Error("consent-upload-failed");

          const { data: pubData } = supabase.storage
            .from(CONSENT_BUCKET)
            .getPublicUrl(filePath);

          uploadedConsentUrl = pubData.publicUrl;
        }

        const { data: inserted, error: insertErr } = await supabase.from("flair_registrations").insert([{
          full_name: cleanName,
          email: cleanEmail,
          contact_number: contactNumber,
          id_number: cleanId,
          college,
          college_name: collegeMeta?.name ?? null,
          program: programLabel,
          year_level: "1st Year",
          block: cleanBlock,
          attending_flair: attendingFlair,
          attending_ga: attendingGa,
          attending_frosh_night: attendingFroshNight,
          parent_consent_url: uploadedConsentUrl,
          status: "pre_registered",
          ga_status: attendingGa ? "pre_registered" : "not_attending",
        }]).select("id").single();

        if (insertErr) throw insertErr;
        return inserted;
      })();

      const timeoutMs = attendingFroshNight ? 30000 : 10000;
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("network-timeout")), timeoutMs));
      const row = await Promise.race([submitPromise, timeoutPromise]) as any;

      clearDraft();
      router.push(`/confirm/${row.id}`);
    } catch (err: any) {
      if (err.message === "duplicate-id" || err.code === "23505") alert("This ID number is already registered.");
      else if (err.message === "consent-upload-failed") alert("Couldn't upload your consent form. Please check your connection and try again.");
      else alert("Something went wrong. Please check your connection and try again.");
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (isMobile === null) return null;

  if (mode === "choose") {
    return (
      <Chooser
        isMobile={!!isMobile}
        onFlair={() => setMode("flair")}
        onSeminar={() => router.push(SEMINAR_ROUTE)}
      />
    );
  }

  /* ═══════════════════════════ MOBILE: Stepper ═══════════════════════════ */
  if (isMobile) {
    const showErrors = attemptedSubmit || touched[`step${step}`];
    const STEP_TITLES = ["Your Details", "Student ID", "College & Night", "Academic Program"];
    const mobileNightActive = step === 2 && attendingFroshNight;
    const mBg = mobileNightActive ? "#0D0D11" : CREAM;
    const mText = mobileNightActive ? CREAM : DARK;
    const mAccent = mobileNightActive ? "#F59E0B" : accent;

    function goNext() {
      setTouched(t => ({ ...t, [`step${step}`]: true }));
      if (stepErrors[step]) {
        setShakeStep(true);
        setTimeout(() => setShakeStep(false), 400);
        return;
      }
      if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
      else handleSubmit();
    }

    return (
      <div className="flair-night-zone" style={{ backgroundColor: mBg, color: mText, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: "calc(clamp(4.25rem, 12vw, 5.25rem) + env(safe-area-inset-top))", display: "flex", flexDirection: "column", flex: 1 }}>
          {/* Adaptive Mobile Sub-Navbar */}
          <div className="flair-night-zone" style={{ position: "sticky", top: 0, zIndex: 20, backgroundColor: mBg, borderBottom: `1px solid ${mobileNightActive ? "rgba(244,239,230,0.1)" : "rgba(17,17,17,0.08)"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem clamp(1rem, 4vw, 1.5rem)" }}>
              <button onClick={() => (step > 0 ? setStep(s => s - 1) : setMode("choose"))} className="flair-btn" aria-label="Go back"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: mobileNightActive ? "rgba(244,239,230,0.1)" : "rgba(17,17,17,0.06)", color: mText, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ‹
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...mono, display: "block", fontSize: "clamp(0.5rem, 2.2vw, 0.58rem)", letterSpacing: "0.28em", textTransform: "uppercase", color: mAccent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.35s ease" }}>
                  Frosh Walk & College GA 2026
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ ...dg, fontSize: "clamp(0.9rem, 3.8vw, 1.05rem)", letterSpacing: "-0.02em", color: mText }}>FLAIR</span>
                  <span style={{ ...ss, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(0.85rem, 3.5vw, 1rem)", color: mAccent }}>frosh pass</span>
                </div>
              </div>
              <span style={{ ...mono, fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", letterSpacing: "0.12em", color: mText, background: mobileNightActive ? "rgba(244,239,230,0.08)" : "rgba(17,17,17,0.05)", padding: "0.3rem 0.55rem", borderRadius: 4, flexShrink: 0 }}>
                0{step + 1}/0{TOTAL_STEPS}
              </span>
            </div>
            <div style={{ height: 3, background: mobileNightActive ? "rgba(244,239,230,0.1)" : "rgba(17,17,17,0.08)" }}>
              <div style={{ height: "100%", width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: mAccent, transition: "width 0.3s ease, background 0.35s ease" }} />
            </div>
          </div>

          {/* Mobile Page Heading Banner */}
          <div style={{ padding: "clamp(1.25rem, 4.5vw, 1.75rem) clamp(1.1rem, 4.5vw, 1.75rem) 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.55rem" }}>
              <span style={{ display: "block", height: 1, width: "1.75rem", background: mAccent, flexShrink: 0, transition: "background 0.35s ease" }} />
              <span style={{ ...mono, fontSize: "clamp(0.55rem, 2.3vw, 0.62rem)", letterSpacing: "0.3em", textTransform: "uppercase", color: mAccent, transition: "color 0.35s ease" }}>
                Step 0{step + 1} · {STEP_TITLES[step]}
              </span>
            </div>
            {step === 0 && (
              <h1 style={{ margin: "0 0 0.35rem", lineHeight: 0.95 }}>
                <span style={{ ...dg, fontSize: "clamp(1.85rem, 8vw, 2.5rem)", letterSpacing: "-0.025em", color: DARK }}>FLAIR </span>
                <span style={{ ...ss, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(1.65rem, 7vw, 2.2rem)", color: GREEN }}>registration</span>
              </h1>
            )}
          </div>

          <div key={step} className={`flair-step${shakeStep ? " flair-shake" : ""}`} style={{ flex: 1, padding: "clamp(1rem, 3.5vw, 1.5rem) clamp(1.1rem, 4.5vw, 1.75rem) 2rem", overflowY: "auto" }}>

            {step === 0 && (
              <>
                <h2 style={{ ...dg, fontSize: "clamp(1.3rem, 5.5vw, 1.6rem)", margin: "0 0 0.35rem" }}>Your Details</h2>
                <p style={{ ...ss, fontSize: "clamp(0.82rem, 3.4vw, 0.92rem)", color: "#777", fontWeight: 300, marginBottom: "1.5rem" }}>Use your official DLSAU email matching your full name.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Full name (First Name & Surname)</span>
                    <input className={`flair-input${showErrors && nameError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && nameError))}
                      value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")}
                      placeholder="Juan Dela Cruz" autoFocus />
                    {(showErrors || touched.fullName) && <ErrorText>{nameError}</ErrorText>}
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>DLSAU Email (firstname.surname@dlsau.edu.ph)</span>
                    <input className={`flair-input${showErrors && emailError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && emailError))}
                      type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch("email")}
                      placeholder="juan.delacruz@dlsau.edu.ph" />
                    {(showErrors || touched.email) && <ErrorText>{emailError}</ErrorText>}
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Contact Number</span>
                    <input className={`flair-input${showErrors && phoneError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && phoneError))}
                      type="tel" inputMode="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value.replace(/[^\d+]/g, ""))} onBlur={() => touch("contactNumber")}
                      placeholder="0917 123 4567" />
                    {(showErrors || touched.contactNumber) && <ErrorText>{phoneError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Student ID</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Double-check this, it permanently links to your QR.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>ID Number</span>
                    <input className={`flair-input${showErrors && idFormatError ? " flair-invalid" : ""}`} style={{ ...inputStyle(!!(showErrors && idFormatError)), fontFamily: "'IBM Plex Mono', monospace" }}
                      type="text" inputMode="numeric" value={idNumber} onChange={handleIdChange} onBlur={() => touch("idNumber")}
                      placeholder="20XX-XX-XXXXXX" autoFocus />

                    {idChecking && <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: "#888", fontFamily: "'IBM Plex Mono', monospace" }}>Checking database...</span>}
                    {!idChecking && (showErrors || touched.idNumber) && <ErrorText>{idFormatError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>College & Events</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: mobileNightActive ? "rgba(244,239,230,0.65)" : "#777", fontWeight: 300, marginBottom: "1.5rem", transition: "color 0.35s ease" }}>
                  Select your college, General Assembly, and Frosh Night attendance.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {COLLEGES.map(c => (
                    <div key={c.id} className="flair-college" onClick={() => { setCollege(c.id); setProgram(null); touch("college"); }}
                      style={{
                        padding: "1rem 1.1rem",
                        borderRadius: 4,
                        border: `1px solid ${college === c.id ? c.color : mobileNightActive ? "rgba(244,239,230,0.14)" : "rgba(17,17,17,0.1)"}`,
                        background: college === c.id ? `rgba(${hexRgb(c.color)},${mobileNightActive ? "0.16" : "0.07"})` : mobileNightActive ? "rgba(255,255,255,0.025)" : "transparent",
                      }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ ...dg, fontSize: "1rem", display: "block", color: mText }}>{c.id}</span>
                          <span style={{ ...ss, fontSize: "0.78rem", color: mobileNightActive ? "rgba(244,239,230,0.65)" : "#666", fontWeight: 300 }}>{c.name}</span>
                        </div>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem", border: `2px solid ${college === c.id ? c.color : "rgba(150,150,150,0.35)"}`, background: college === c.id ? c.color : "transparent" }} />
                      </div>
                    </div>
                  ))}
                  {showErrors && !college && <ErrorText>Please select a college.</ErrorText>}
                </div>

                {college && (
                  <div
                    className="flair-step"
                    style={{
                      position: "relative",
                      zIndex: 30,
                      marginTop: "1.25rem",
                      padding: "1rem",
                      borderRadius: 6,
                      background: mobileNightActive ? "rgba(255,255,255,0.04)" : `rgba(${hexRgb(accent)}, 0.05)`,
                      border: `1px solid ${mobileNightActive ? "rgba(244,239,230,0.16)" : `rgba(${hexRgb(accent)}, 0.25)`}`,
                    }}
                  >
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.18em", textTransform: "uppercase", color: mAccent, display: "block", marginBottom: "0.5rem", fontWeight: 500 }}>
                      {college} General Assembly Attendance
                    </span>
                    <CustomDropdown
                      value={attendanceType}
                      options={attendanceOptions}
                      placeholder="Select attendance"
                      onChange={id => setAttendanceType(id as AttendanceType)}
                    />
                  </div>
                )}

                <FroshNightSection
                  attending={attendingFroshNight}
                  onToggle={() => {
                    setAttendingFroshNight(v => !v);
                    touch("consent");
                  }}
                  file={consentFile}
                  onFileSelect={f => {
                    setConsentFile(f);
                    touch("consent");
                  }}
                  error={(showErrors || touched.consent) ? consentError : null}
                  isMobile
                  mono={mono}
                  ss={ss}
                  dg={dg}
                />
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Academic Info</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Select your degree program and section.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Program</span>
                    <CustomDropdown value={program}
                      options={college ? PROGRAMS_BY_COLLEGE[college].map(p => ({ id: p.id, label: p.label })) : []}
                      placeholder="Select program" disabledPlaceholder="Pick a college first" disabled={!college}
                      invalid={showErrors && !program}
                      onChange={id => {
                        setProgram(id);
                        touch("program");
                      }} />
                    {showErrors && !program && <ErrorText>Please select a program.</ErrorText>}
                  </label>

                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Block / Section</span>
                    <input className={`flair-input${showErrors && blockError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && blockError))}
                      value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")}
                      placeholder="e.g. Block A or 1-A" />
                    {(showErrors || touched.block) && <ErrorText>{blockError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

          </div>

          <div className="flair-night-zone" style={{ position: "sticky", bottom: 0, zIndex: 20, backgroundColor: mBg, borderTop: `1px solid ${mobileNightActive ? "rgba(244,239,230,0.1)" : "rgba(17,17,17,0.08)"}`, padding: "0.85rem 1.1rem", paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))" }}>
            <button className="flair-btn" disabled={isSubmitting || idChecking} onClick={goNext}
              style={{
                ...mono,
                width: "100%",
                fontSize: "0.8rem",
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                padding: "1rem",
                borderRadius: 4,
                border: "none",
                background: !stepErrors[step] ? (mobileNightActive ? "#F59E0B" : DARK) : (mobileNightActive ? "rgba(244,239,230,0.2)" : "rgba(17,17,17,0.55)"),
                color: !stepErrors[step] && mobileNightActive ? "#0B0B0E" : CREAM,
                fontWeight: mobileNightActive ? 600 : 500,
                minHeight: 48,
              }}>
              {isSubmitting ? "Submitting…" : step === TOTAL_STEPS - 1 ? "Complete Registration" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════ DESKTOP: Long-scroll Form ═══════════════════════════ */
  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden", minHeight: "100dvh" }}>

      <div style={{ padding: "clamp(4.5rem, 10vw, 6.5rem) clamp(2rem, 5vw, 5.5rem) 2rem" }}>
        <button type="button" onClick={() => setMode("choose")}
          style={{ ...mono, background: "none", border: "none", cursor: "pointer", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", marginBottom: "1.5rem", padding: 0 }}>
          ← Back
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>USC Frosh Walk & College GA 2026</span>
        </div>
        <h1 style={{ margin: 0 }}>
          <span style={{ ...dg, display: "block", fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: DARK }}>FLAIR</span>
          <span style={{ ...ss, display: "block", fontSize: "clamp(2.2rem, 7vw, 5.5rem)", lineHeight: 0.95, fontStyle: "italic", fontWeight: 300, color: GREEN, paddingLeft: "clamp(0.3rem, 3vw, 3rem)", marginTop: "0.4rem" }}>registration</span>
        </h1>
        <p style={{ ...ss, marginTop: "2.5rem", marginLeft: "clamp(0.3rem, 3vw, 3rem)", maxWidth: "36rem", fontSize: "1rem", lineHeight: 1.8, color: "rgba(17,17,17,0.5)", fontWeight: 300 }}>
          Welcome, Froshies! Register to receive your official QR code for entry at both the FLAIR Frosh Walk and your College General Assembly.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 clamp(2rem, 5vw, 5.5rem) 6rem" }}>

        {draftRestored && (
          <div className="flair-reveal" style={{ marginBottom: "2rem", padding: "1rem 1.5rem", background: "rgba(17,17,17,0.03)", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ ...ss, fontWeight: 600, fontSize: "0.9rem" }}>Draft restored.</p>
              <p style={{ ...ss, fontSize: "0.8rem", color: "#666", marginTop: "0.2rem" }}>Your previous progress was saved automatically.</p>
            </div>
          </div>
        )}

        <div className="flair-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="01" title="Your Details" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Full name (First Name & Surname)" mono={mono}>
              <input className={`flair-input${attemptedSubmit && nameError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && nameError))}
                value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")} placeholder="Juan Dela Cruz" />
              {(attemptedSubmit || touched.fullName) && <ErrorText>{nameError}</ErrorText>}
            </Field>
            <Field label="DLSAU Email (firstname.surname@dlsau.edu.ph)" mono={mono}>
              <input className={`flair-input${attemptedSubmit && emailError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && emailError))}
                type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch("email")} placeholder="juan.delacruz@dlsau.edu.ph" />
              {(attemptedSubmit || touched.email) && <ErrorText>{emailError}</ErrorText>}
            </Field>
            <Field label="Contact Number" mono={mono}>
              <input className={`flair-input${attemptedSubmit && phoneError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && phoneError))}
                type="tel" value={contactNumber} onChange={e => setContactNumber(e.target.value.replace(/[^\d+]/g, ""))} onBlur={() => touch("contactNumber")} placeholder="0917 123 4567" />
              {(attemptedSubmit || touched.contactNumber) && <ErrorText>{phoneError}</ErrorText>}
            </Field>
          </div>
        </div>

        <div className="flair-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="02" title="Student ID" />
          <div style={{ maxWidth: "24rem", marginTop: "1.5rem" }}>
            <Field label="ID Number (20XX-XX-XXXXXX)" mono={mono}>
              <input className={`flair-input${attemptedSubmit && idFormatError ? " flair-invalid" : ""}`} style={{ ...inputStyle(!!(attemptedSubmit && idFormatError)), fontFamily: "'IBM Plex Mono', monospace" }}
                type="text" value={idNumber} onChange={handleIdChange} onBlur={() => touch("idNumber")} placeholder="2026-00-000000" />
              {idChecking && <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: "#888", fontFamily: "'IBM Plex Mono', monospace" }}>Checking database...</span>}
              {!idChecking && (attemptedSubmit || touched.idNumber) && <ErrorText>{idFormatError}</ErrorText>}
            </Field>
            <p style={{ ...ss, fontSize: "0.85rem", color: "#666", fontWeight: 300, marginTop: "1rem" }}>Your student ID connects directly to your QR pass.</p>
          </div>
        </div>

        <div
          className="flair-reveal flair-night-zone"
          style={{
            marginBottom: "3.5rem",
            position: "relative",
            zIndex: 20,
            padding: "2rem",
            marginInline: "-2rem",
            borderRadius: 12,
            backgroundColor: attendingFroshNight ? "#111115" : "transparent",
            color: attendingFroshNight ? CREAM : DARK,
            boxShadow: attendingFroshNight ? "0 24px 60px rgba(0,0,0,0.22)" : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.75rem", borderBottom: `2px solid ${attendingFroshNight ? "rgba(244,239,230,0.2)" : "#111111"}`, transition: "border-color 0.45s ease" }}>
            <span style={{ ...mono, fontSize: "0.7rem", color: attendingFroshNight ? "#F59E0B" : GREEN, transition: "color 0.35s ease" }}>03</span>
            <span style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>
              Select College, GA & Frosh Night
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {COLLEGES.map(c => {
              const active = college === c.id;
              return (
                <div key={c.id} className="flair-college" onClick={() => { setCollege(c.id); setProgram(null); touch("college"); }}
                  style={{
                    padding: "1.5rem",
                    border: `1px solid ${active ? c.color : attendingFroshNight ? "rgba(244,239,230,0.14)" : "rgba(17,17,17,0.1)"}`,
                    background: active ? `rgba(${hexRgb(c.color)},0.14)` : attendingFroshNight ? "rgba(255,255,255,0.03)" : "transparent",
                    borderRadius: 4,
                  }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <span style={{ ...dg, fontSize: "1.1rem", color: attendingFroshNight ? CREAM : DARK }}>{c.id}</span>
                    <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? c.color : "rgba(150,150,150,0.4)"}`, background: active ? c.color : "transparent" }} />
                  </div>
                  <p style={{ ...ss, fontSize: "0.82rem", color: attendingFroshNight ? "rgba(244,239,230,0.65)" : "#666", lineHeight: 1.5, fontWeight: 300 }}>{c.name}</p>
                </div>
              );
            })}
          </div>
          {attemptedSubmit && !college && <ErrorText>Please select a college.</ErrorText>}

          {college && (
            <div
              className="flair-step"
              style={{
                position: "relative",
                zIndex: 30,
                marginTop: "1.5rem",
                maxWidth: "42rem",
                padding: "1.25rem 1.5rem",
                borderRadius: 6,
                background: attendingFroshNight ? "rgba(255,255,255,0.04)" : `rgba(${hexRgb(accent)}, 0.05)`,
                border: `1px solid ${attendingFroshNight ? "rgba(255,255,255,0.14)" : `rgba(${hexRgb(accent)}, 0.25)`}`,
              }}
            >
              <Field label={`${college} General Assembly Attendance`} mono={mono}>
                <CustomDropdown
                  value={attendanceType}
                  options={attendanceOptions}
                  placeholder="Select attendance"
                  onChange={id => setAttendanceType(id as AttendanceType)}
                />
              </Field>
              <p style={{ ...ss, fontSize: "0.82rem", color: attendingFroshNight ? "rgba(244,239,230,0.65)" : "#666", fontWeight: 300, margin: "0.6rem 0 0" }}>
                One QR pass works for both the FLAIR arena doors and your {college} General Assembly.
              </p>
            </div>
          )}

          <div style={{ maxWidth: "42rem", marginTop: "1.25rem", position: "relative", zIndex: 1 }}>
            <FroshNightSection
              attending={attendingFroshNight}
              onToggle={() => {
                setAttendingFroshNight(v => !v);
                touch("consent");
              }}
              file={consentFile}
              onFileSelect={f => {
                setConsentFile(f);
                touch("consent");
              }}
              error={(attemptedSubmit || touched.consent) ? consentError : null}
              mono={mono}
              ss={ss}
              dg={dg}
            />
          </div>
        </div>

        <div className="flair-reveal" style={{ marginBottom: "3.5rem", position: "relative", zIndex: 10 }}>
          <SectionLabel mono={mono} green={GREEN} step="04" title="Program & Section" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Program" mono={mono}>
              <CustomDropdown value={program}
                options={college ? PROGRAMS_BY_COLLEGE[college].map(p => ({ id: p.id, label: p.label })) : []}
                placeholder="Select program" disabledPlaceholder="Select a college first" disabled={!college}
                invalid={attemptedSubmit && !program}
                onChange={id => {
                  setProgram(id);
                  touch("program");
                }} />
              {attemptedSubmit && !program && <ErrorText>Please select a program.</ErrorText>}
            </Field>

            <Field label="Block / Section" mono={mono}>
              <input className={`flair-input${attemptedSubmit && blockError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && blockError))}
                value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")} placeholder="e.g. Block A or 1-A" />
              {(attemptedSubmit || touched.block) && <ErrorText>{blockError}</ErrorText>}
            </Field>
          </div>
        </div>

        <div className="flair-reveal">
          <button type="submit" disabled={isSubmitting || idChecking}
            style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "1rem 2.5rem", borderRadius: 4, border: "none", background: canSubmit ? DARK : "rgba(17,17,17,0.55)", color: CREAM, cursor: (isSubmitting || idChecking) ? "not-allowed" : "pointer", transition: "background 0.25s ease" }}>
            {isSubmitting ? "Generating QR..." : "Complete Registration"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ─── Small Subcomponents ──────────────────────────────────────────────────── */
function SectionLabel({ mono, green, step, title }: { mono: object; green: string; step: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "0.75rem", borderBottom: "2px solid #111111" }}>
      <span style={{ ...mono, fontSize: "0.7rem", color: green }}>{step}</span>
      <span style={{ ...mono, fontSize: "0.65rem", letterSpacing: "0.3em", textTransform: "uppercase" }}>{title}</span>
    </div>
  );
}

function Field({ label, mono, children }: { label: string; mono: object; children: React.ReactNode }) {
  return (
    <label style={{ display: "block" }}>
      <span style={{ ...mono, fontSize: "0.62rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>{label}</span>
      {children}
    </label>
  );
}

function Chooser({ isMobile, onFlair, onSeminar }: { isMobile: boolean; onFlair: () => void; onSeminar: () => void }) {
  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };
  const CREAM = "#F4EFE6", DARK = "#111111", GREEN = "#06402B", RED = "#dc2626";

  return (
    <div style={{ background: CREAM, color: DARK, minHeight: "100dvh", display: "flex", flexDirection: "column", justifyContent: isMobile ? "flex-start" : "center",
      padding: isMobile
        ? "calc(clamp(5rem, 15vw, 6.5rem) + env(safe-area-inset-top)) clamp(1.1rem, 4.5vw, 1.75rem) calc(2.25rem + env(safe-area-inset-bottom))"
        : "clamp(5.5rem, 9vw, 7rem) clamp(2rem, 5vw, 5.5rem) 4rem" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", marginBottom: "clamp(0.85rem, 3vw, 1.25rem)" }}>
        <span style={{ display: "block", height: 1, width: isMobile ? "1.75rem" : "2.5rem", background: GREEN, flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: "clamp(0.55rem, 2.2vw, 0.6rem)", letterSpacing: "0.38em", textTransform: "uppercase", color: GREEN }}>
          Event Registration Portal
        </span>
      </div>
      <h1 style={{ ...dg, margin: 0, fontSize: isMobile ? "clamp(1.85rem, 8vw, 2.4rem)" : "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: 1.02, letterSpacing: "-0.02em" }}>
        What are you<br />
        <span style={{ ...ss, fontStyle: "italic", fontWeight: 300, color: GREEN }}>signing up for?</span>
      </h1>
      <div style={{
        display: "grid", marginTop: isMobile ? "1.75rem" : "3rem", gap: isMobile ? "0.9rem" : "1.5rem",
        gridTemplateColumns: isMobile ? "1fr" : "1.7fr 1fr", alignItems: "stretch",
      }}>
        {/* PRIMARY: FLAIR + GA */}
        <div className="flair-choice flair-choice-primary" role="button" tabIndex={0}
          onClick={onFlair} onKeyDown={e => (e.key === "Enter" || e.key === " ") && onFlair()}
          style={{ background: GREEN, color: CREAM, borderRadius: 6, position: "relative", overflow: "hidden",
            padding: isMobile ? "1.6rem 1.4rem" : "2.5rem 2.25rem", minHeight: isMobile ? 210 : 320,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            boxShadow: "0 10px 28px rgba(6,64,43,0.22)" }}>
          <span aria-hidden style={{ ...dg, position: "absolute", right: "-0.05em", bottom: "-0.2em", fontSize: isMobile ? "7rem" : "12rem", lineHeight: 1, color: "rgba(244,239,230,0.06)", pointerEvents: "none" }}>FLAIR</span>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span className="flair-live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: CREAM }} />
            <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.25em", textTransform: "uppercase" }}>Open now · Frosh Walk & GA</span>
          </div>

          <div style={{ position: "relative" }}>
            <div style={{ ...dg, fontSize: isMobile ? "2.1rem" : "clamp(2.6rem, 4.5vw, 4rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}>
              FLAIR & GA<br />
              <span style={{ ...ss, fontStyle: "italic", fontWeight: 300, fontSize: "0.7em" }}>frosh pass</span>
            </div>
            <p style={{ ...ss, fontWeight: 300, fontSize: "0.9rem", lineHeight: 1.6, opacity: 0.8, marginTop: "0.9rem", maxWidth: "26rem" }}>
              Get your official Frosh Walk QR code for the gate and your College General Assembly.
            </p>
            <div style={{ ...mono, display: "inline-flex", alignItems: "center", gap: "0.75rem", marginTop: "1.25rem", padding: "0.85rem 1.4rem", background: CREAM, color: GREEN, borderRadius: 4, fontSize: "0.72rem", letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 500 }}>
              Register now <span className="flair-arrow">→</span>
            </div>
          </div>
        </div>

        {/* SECONDARY: CAST seminar */}
        <div className="flair-choice flair-choice-secondary" role="button" tabIndex={0}
          onClick={onSeminar} onKeyDown={e => (e.key === "Enter" || e.key === " ") && onSeminar()}
          style={{ border: "1px solid rgba(17,17,17,0.14)", borderLeft: `4px solid ${RED}`, background: "rgba(255,255,255,0.4)", borderRadius: 6,
            padding: isMobile ? "1.25rem 1.2rem" : "2rem 1.6rem",
            display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1.25rem" }}>
          <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.25em", textTransform: "uppercase", color: RED }}>CAST · Seminar</span>
          <div>
            <div style={{ ...dg, fontSize: isMobile ? "1.05rem" : "1.25rem", lineHeight: 1.15 }}>
              Suicide Prevention Month Seminar
            </div>
            <p style={{ ...ss, fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.6, color: "#666", marginTop: "0.6rem" }}>
              Reserve your slot for the CAST awareness seminar.
            </p>
          </div>
          <span style={{ ...mono, fontSize: "0.68rem", letterSpacing: "0.15em", textTransform: "uppercase", color: DARK }}>
            Join seminar →
          </span>
        </div>
      </div>
    </div>
  );
}