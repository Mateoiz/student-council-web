"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

* { -webkit-tap-highlight-color: transparent; }

@keyframes lyv-reveal-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lyv-reveal { opacity: 0; }
.lyv-reveal.in-view { animation: lyv-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes lyv-slide-in {
  from { opacity: 0; transform: translateX(16px); }
  to   { opacity: 1; transform: translateX(0); }
}
.lyv-step { animation: lyv-slide-in 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes lyv-dropdown-in {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.lyv-dropdown-menu { animation: lyv-dropdown-in 0.18s cubic-bezier(0.16, 1, 0.3, 1) both; }

@keyframes lyv-shake {
  10%, 90% { transform: translateX(-1px); }
  20%, 80% { transform: translateX(2px); }
  30%, 50%, 70% { transform: translateX(-3px); }
  40%, 60% { transform: translateX(3px); }
}
.lyv-shake { animation: lyv-shake 0.4s cubic-bezier(.36,.07,.19,.97) both; }

/* desktop hover states */
.lyv-college, .lyv-committee {
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}
.lyv-college:hover, .lyv-committee:hover {
  border-color: #005c00;
  background: rgba(255,255,255,0.55);
}
.lyv-sub, .lyv-option, .lyv-dd-item { transition: background 0.2s ease, border-color 0.2s ease; cursor: pointer; }
.lyv-dd-item:hover { background: rgba(17,17,17,0.04); }

/* touch press states (only meaningfully trigger on touch devices) */
.lyv-college:active, .lyv-committee:active, .lyv-sub:active, .lyv-option:active, .lyv-btn:active, .lyv-dropdown-trigger:active {
  transform: scale(0.98);
}
.lyv-btn { transition: background 0.15s ease, transform 0.1s ease; }

.lyv-input, .lyv-textarea, .lyv-dropdown-trigger {
  font-size: 16px; /* stops iOS Safari auto-zoom-on-focus */
  transition: border-color 0.25s ease, background 0.25s ease;
  -webkit-appearance: none;
  appearance: none;
}
.lyv-input:focus, .lyv-textarea:focus {
  outline: none;
  border-color: #005c00 !important;
  background: rgba(0,92,0,0.04) !important;
}
.lyv-input.lyv-invalid, .lyv-textarea.lyv-invalid, .lyv-dropdown-trigger.lyv-invalid {
  border-color: #dc2626 !important;
  background: rgba(220,38,38,0.03) !important;
}

.lyv-chevron { transition: transform 0.3s ease; }

.lyv-dropdown-trigger {
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
.lyv-dropdown-trigger:focus {
  border-color: #005c00 !important;
  background: rgba(0,92,0,0.04) !important;
}
.lyv-dropdown-trigger:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const colleges = [
  { id: "CAST",  name: "College of Arts, Science, and Technology", color: "#dc2626" },
  { id: "CBMA",  name: "College of Business Management & Accountancy", color: "#ca8a04" },
  { id: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#005c00" },
];

const programsByCollege: Record<string, { id: string; label: string; years: number }[]> = {
  CAST: [
    { id: "ba-psych", label: "BA Psychology", years: 3 },
    { id: "bs-cpe", label: "BS Computer Engineering", years: 3 },
    { id: "bs-cs", label: "BS Computer Science", years: 3 },
  ],
  CBMA: [
    { id: "bs-accountancy", label: "BS Accountancy", years: 3 },
    { id: "bsba-fm", label: "BSBA - Financial Management", years: 3 },
    { id: "bsba-mm", label: "BSBA - Marketing Management", years: 3 },
    { id: "bs-hm", label: "BS Hospitality Management", years: 3 },
    { id: "bs-tm", label: "BS Tourism Management", years: 3 },
  ],
  CVMAS: [
    { id: "dvm", label: "Doctor of Veterinary Medicine", years: 6 },
    { id: "bs-foodtech", label: "BS Food Technology", years: 3 },
    { id: "bs-agri", label: "BS Agriculture", years: 3 },
  ],
};

const committees = [
  { id: "logistics", label: "Logistics", desc: "Coordinating venues, materials, and on-ground event flow." },
  { id: "comms", label: "Communication & Secretariat", desc: "Handling correspondence, documentation of records, and public-facing announcements." },
  { id: "operations", label: "Operations (Martial & Technical)", desc: "Managing discipline, technical setup, and ground operations during events." },
];

const multimediaSub = [
  { id: "multimedia-creatives", label: "Creatives", desc: "Designing visual assets — graphics, layouts, and promotional material." },
  { id: "multimedia-documentation", label: "Documentation", desc: "Capturing photo/video coverage and archiving event records." },
];

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "0,0,0";
}

/* ─── Validation helpers ───────────────────────────────────────────────────── */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateName(v: string): string | null {
  const trimmed = v.trim();
  if (!trimmed) return "Full name is required.";
  if (trimmed.length < 2) return "Name looks too short.";
  if (trimmed.split(/\s+/).length < 2) return "Please enter your first and last name.";
  if (!/^[a-zA-ZñÑ.,'\- ]+$/.test(trimmed)) return "Name contains unexpected characters.";
  return null;
}

function validateEmail(v: string): string | null {
  const trimmed = v.trim();
  if (!trimmed) return "Email is required.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return null;
}

function validateDescription(v: string): string | null {
  const trimmed = v.trim();
  if (!trimmed) return "Tell us a bit about yourself.";
  if (trimmed.length < 20) return "Please write at least a couple of sentences (20+ characters).";
  if (trimmed.length > 1000) return "Keep it under 1000 characters.";
  return null;
}

/* ─── Responsive hook ──────────────────────────────────────────────────────── */
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

/* ─── Custom Dropdown (replaces native <select>) ────────────────────────────── */
type DropdownOption = { id: string; label: string };

function CustomDropdown({
  value,
  options,
  placeholder,
  disabledPlaceholder,
  disabled,
  invalid,
  onChange,
  onOpen,
}: {
  value: string | null;
  options: DropdownOption[];
  placeholder: string;
  disabledPlaceholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  onChange: (id: string) => void;
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        className={`lyv-dropdown-trigger${invalid ? " lyv-invalid" : ""}`}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(o => !o);
          if (!open) onOpen?.();
        }}
        style={{ fontFamily: "'Source Serif 4', serif" }}
      >
        <span style={{ color: selected ? "#111111" : "#999" }}>
          {selected ? selected.label : disabled ? (disabledPlaceholder ?? placeholder) : placeholder}
        </span>
        <span className="lyv-chevron" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", transform: open ? "rotate(180deg)" : "rotate(0deg)", marginLeft: "0.5rem", flexShrink: 0 }}>
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div
          className="lyv-dropdown-menu"
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 30,
            background: "#fff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 4,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: "260px", overflowY: "auto",
          }}
          role="listbox"
        >
          {options.map(o => (
            <div
              key={o.id}
              className="lyv-dd-item"
              role="option"
              aria-selected={o.id === value}
              onClick={() => { onChange(o.id); setOpen(false); }}
              style={{
                padding: "0.8rem 1rem",
                fontFamily: "'Source Serif 4', serif",
                fontSize: "0.9rem",
                background: o.id === value ? "rgba(0,92,0,0.06)" : "transparent",
                color: "#111111",
                borderBottom: "1px solid rgba(17,17,17,0.06)",
              }}
            >
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

const TOTAL_STEPS = 5;

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function LYVApplicationPage() {
  const isMobile = useIsMobile();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [college, setCollege] = useState<string | null>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [yearLevel, setYearLevel] = useState<string | null>(null);
  const [committee, setCommittee] = useState<string | null>(null);
  const [multimediaOpen, setMultimediaOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [shakeStep, setShakeStep] = useState(false);

  // Track which fields the user has interacted with, so errors don't show prematurely
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const touch = (field: string) => setTouched(t => (t[field] ? t : { ...t, [field]: true }));

  useEffect(() => {
    const id = "lyv-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    if (isMobile !== false) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.12 },
    );
    const t = setTimeout(() => document.querySelectorAll(".lyv-reveal").forEach(el => io.observe(el)), 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [isMobile]);

  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#005c00";
  const accent = colleges.find(c => c.id === college)?.color ?? GREEN;

  // ── Validation state ──
  const nameError = validateName(name);
  const emailError = validateEmail(email);
  const collegeError = college ? null : "Please select a college.";
  const programError = program ? null : "Please select a program.";
  const yearLevelError = yearLevel ? null : "Please select a year level.";
  const committeeError = committee ? null : "Please select a committee.";
  const descriptionError = validateDescription(description);

  const stepErrors = [
    !!nameError || !!emailError,
    !!collegeError,
    !!programError || !!yearLevelError,
    !!committeeError,
    !!descriptionError,
  ];

  const canSubmit = !nameError && !emailError && !collegeError && !programError && !yearLevelError && !committeeError && !descriptionError;

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setAttemptedSubmit(true);
    if (honeypot) return; // silent bot drop
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    const { error } = await supabase.from("lyv_applications").insert([{
      name: name.trim(),
      email: email.trim().toLowerCase(),
      program: college ? programsByCollege[college].find(p => p.id === program)?.label : null,
      year_level: yearLevel,
      college,
      committee,
      description: description.trim(),
    }]);

    setSubmitting(false);
    if (error) {
      console.error("Submission failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      alert(`Error: ${error.message || "Unknown error"}`);
      return;
    }
    setSubmitted(true);
  }

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

  const honeypotField = (
    <input
      type="text" name="website" value={honeypot} onChange={e => setHoneypot(e.target.value)}
      tabIndex={-1} autoComplete="off"
      style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      aria-hidden="true"
    />
  );

  /* ═══════════════════════════ SUBMITTED STATE ═══════════════════════════ */
  if (submitted) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh", background: DARK }}>
        <Navbar />
        <div style={{
          flex: 1, color: CREAM, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center",
          marginTop: "76px"
        }}>
          <span style={{ display: "block", width: 8, height: 8, borderRadius: "50%", background: GREEN, marginBottom: "2rem" }} />
          <h1 style={{ ...dg, fontSize: "clamp(2rem, 5vw, 3.5rem)", marginBottom: "1.1rem" }}>APPLICATION SENT</h1>
          <p style={{ ...ss, fontSize: "1rem", lineHeight: 1.8, color: "rgba(244,239,230,0.55)", maxWidth: "28rem", fontWeight: 300 }}>
            Thank you, {name.split(" ")[0]}. Your application for{" "}
            {committee?.startsWith("multimedia")
              ? `Multimedia — ${multimediaSub.find(m => m.id === committee)?.label}`
              : committees.find(c => c.id === committee)?.label}{" "}
            under {college} has been recorded. The council will reach out via {email}.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isMobile === null) return null;

  /* ═══════════════════════════ MOBILE: stepper ═══════════════════════════ */
  if (isMobile) {
    const stepInvalid = stepErrors[step];
    const showErrors = attemptedSubmit || touched[`step${step}`];

    function markStepTouched(s: number) {
      setTouched(t => ({ ...t, [`step${s}`]: true }));
    }

    function goNext() {
      markStepTouched(step);
      if (stepErrors[step]) {
        setShakeStep(true);
        setTimeout(() => setShakeStep(false), 400);
        return;
      }
      if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
      else handleSubmit();
    }

    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <div style={{ paddingTop: "76px", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ position: "sticky", top: "76px", zIndex: 20, background: CREAM, paddingTop: "env(safe-area-inset-top)", borderBottom: "1px solid rgba(17,17,17,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.1rem" }}>
              <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0} className="lyv-btn"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: step === 0 ? "transparent" : "rgba(17,17,17,0.06)", color: step === 0 ? "transparent" : DARK, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ‹
              </button>
              <span style={{ ...dg, fontSize: "0.85rem", flex: 1 }}>LYV Application</span>
              <span style={{ ...mono, fontSize: "0.65rem", color: "#888" }}>{step + 1}/{TOTAL_STEPS}</span>
            </div>
            <div style={{ height: 3, background: "rgba(17,17,17,0.08)" }}>
              <div style={{ height: "100%", width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: accent, transition: "width 0.3s ease, background 0.3s ease" }} />
            </div>
          </div>

          <div key={step} className={`lyv-step${shakeStep ? " lyv-shake" : ""}`} style={{ flex: 1, padding: "1.75rem 1.1rem 2rem", overflowY: "auto" }}>
            {honeypotField}

            {step === 0 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Who's applying?</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Let's start with the basics.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Full name</span>
                    <input
                      className={`lyv-input${showErrors && nameError ? " lyv-invalid" : ""}`}
                      style={inputStyle(!!(showErrors && nameError))}
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={() => touch("name")}
                      placeholder="Juan Dela Cruz"
                      autoFocus
                    />
                    {(showErrors || touched.name) && <ErrorText>{nameError}</ErrorText>}
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Email</span>
                    <input
                      className={`lyv-input${showErrors && emailError ? " lyv-invalid" : ""}`}
                      style={inputStyle(!!(showErrors && emailError))}
                      type="email" inputMode="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => touch("email")}
                      placeholder="juan.delacruz@dlsau.edu.ph"
                    />
                    {(showErrors || touched.email) && <ErrorText>{emailError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Which college?</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Pick where you're enrolled.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {colleges.map(c => (
                    <div key={c.id} className="lyv-option" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); touch("college"); }}
                      style={{ padding: "1rem 1.1rem", borderRadius: 4, border: `1px solid ${college === c.id ? c.color : "rgba(17,17,17,0.1)"}`, background: college === c.id ? `rgba(${hexRgb(c.color)},0.07)` : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ ...dg, fontSize: "1rem", display: "block" }}>{c.id}</span>
                          <span style={{ ...ss, fontSize: "0.78rem", color: "#666", fontWeight: 300 }}>{c.name}</span>
                        </div>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem", border: `2px solid ${college === c.id ? c.color : "rgba(17,17,17,0.25)"}`, background: college === c.id ? c.color : "transparent" }} />
                      </div>
                    </div>
                  ))}
                  {showErrors && <ErrorText>{collegeError}</ErrorText>}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Program & year</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Under {college}.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Program</span>
                    <CustomDropdown
                      value={program}
                      options={college ? programsByCollege[college].map(p => ({ id: p.id, label: p.label })) : []}
                      placeholder="Select program"
                      invalid={showErrors && !!programError}
                      onChange={id => { setProgram(id); setYearLevel(null); touch("program"); }}
                    />
                    {showErrors && <ErrorText>{programError}</ErrorText>}
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Year level</span>
                    <CustomDropdown
                      value={yearLevel}
                      options={program && college ? Array.from({ length: programsByCollege[college].find(p => p.id === program)!.years }, (_, i) => ({ id: String(i + 1), label: `Year ${i + 1}` })) : []}
                      placeholder="Select year"
                      disabledPlaceholder="Pick a program first"
                      disabled={!program}
                      invalid={showErrors && !!yearLevelError}
                      onChange={id => { setYearLevel(id); touch("yearLevel"); }}
                    />
                    {showErrors && <ErrorText>{yearLevelError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Pick a committee</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Where do you want to serve?</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                  {committees.map(c => (
                    <div key={c.id} className="lyv-committee" onClick={() => { setCommittee(c.id); touch("committee"); }}
                      style={{ padding: "1rem 1.1rem", borderRadius: 4, border: `1px solid ${committee === c.id ? accent : "rgba(17,17,17,0.1)"}`, background: committee === c.id ? `rgba(${hexRgb(accent)},0.07)` : "transparent" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ ...dg, fontSize: "0.9rem", display: "block" }}>{c.label}</span>
                          <span style={{ ...ss, fontSize: "0.78rem", color: "#666", fontWeight: 300 }}>{c.desc}</span>
                        </div>
                        <span style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem", border: `2px solid ${committee === c.id ? accent : "rgba(17,17,17,0.25)"}`, background: committee === c.id ? accent : "transparent" }} />
                      </div>
                    </div>
                  ))}
                  <div className="lyv-committee" onClick={() => setMultimediaOpen(o => !o)}
                    style={{ padding: "1rem 1.1rem", borderRadius: 4, border: `1px solid ${committee?.startsWith("multimedia") ? accent : "rgba(17,17,17,0.1)"}`, background: committee?.startsWith("multimedia") ? `rgba(${hexRgb(accent)},0.07)` : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ ...dg, fontSize: "0.9rem", display: "block" }}>Multimedia</span>
                        <span style={{ ...ss, fontSize: "0.78rem", color: "#666", fontWeight: 300 }}>Covers Creatives and Documentation.</span>
                      </div>
                      <span className="lyv-chevron" style={{ ...mono, fontSize: "0.9rem", transform: multimediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                    </div>
                    {multimediaOpen && (
                      <div style={{ marginTop: "0.9rem", paddingLeft: "0.9rem", borderLeft: "2px solid rgba(17,17,17,0.1)", display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                        {multimediaSub.map(m => (
                          <div key={m.id} className="lyv-sub" onClick={e => { e.stopPropagation(); setCommittee(m.id); touch("committee"); }}
                            style={{ padding: "0.85rem 1rem", borderRadius: 4, border: `1px solid ${committee === m.id ? accent : "rgba(17,17,17,0.1)"}`, background: committee === m.id ? `rgba(${hexRgb(accent)},0.08)` : "rgba(17,17,17,0.02)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ ...ss, fontSize: "0.85rem", fontWeight: 600, display: "block" }}>{m.label}</span>
                                <span style={{ ...ss, fontSize: "0.75rem", color: "#666", fontWeight: 300 }}>{m.desc}</span>
                              </div>
                              <span style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem", border: `2px solid ${committee === m.id ? accent : "rgba(17,17,17,0.25)"}`, background: committee === m.id ? accent : "transparent" }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {showErrors && <ErrorText>{committeeError}</ErrorText>}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Tell us about you</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Skills, experience, or why this committee.</p>
                <textarea
                  className={`lyv-textarea${showErrors && descriptionError ? " lyv-invalid" : ""}`}
                  style={{ ...inputStyle(!!(showErrors && descriptionError)), minHeight: "160px", resize: "vertical" }}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  onBlur={() => touch("description")}
                  placeholder="e.g. I've handled event photography for two campus orgs..."
                  autoFocus
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
                  {(showErrors || touched.description) ? <ErrorText>{descriptionError}</ErrorText> : <span />}
                  <span style={{ ...mono, fontSize: "0.68rem", color: description.length > 1000 ? "#dc2626" : "#999" }}>{description.length}/1000</span>
                </div>
              </>
            )}
          </div>

          <div style={{ position: "sticky", bottom: 0, background: CREAM, borderTop: "1px solid rgba(17,17,17,0.08)", padding: "0.85rem 1.1rem", paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))" }}>
            <button className="lyv-btn" disabled={submitting}
              onClick={goNext}
              style={{ ...mono, width: "100%", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "1rem", borderRadius: 4, border: "none", background: !stepInvalid ? DARK : "rgba(17,17,17,0.55)", color: CREAM, minHeight: 48 }}>
              {submitting ? "Submitting…" : step === TOTAL_STEPS - 1 ? "Submit application" : "Continue"}
            </button>
          </div>
        </div>

        <Footer />
      </div>
    );
  }

  /* ═══════════════════════════ DESKTOP: original long-scroll form ═══════════════════════════ */
  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>
      <Navbar />

      <div style={{
        padding: "clamp(6.5rem, 12vw, 8.5rem) clamp(2rem, 5vw, 5.5rem) 2rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>Volunteer Intake</span>
        </div>
        <h1 style={{ margin: 0 }}>
          <span style={{ ...dg, display: "block", fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: DARK }}>LYV</span>
          <span style={{ ...ss, display: "block", fontSize: "clamp(2.2rem, 7vw, 5.5rem)", lineHeight: 0.95, fontStyle: "italic", fontWeight: 300, color: GREEN, paddingLeft: "clamp(0.3rem, 3vw, 3rem)", marginTop: "0.4rem" }}>application</span>
        </h1>
        <p style={{ ...ss, marginTop: "2.5rem", marginLeft: "clamp(0.3rem, 3vw, 3rem)", maxWidth: "34rem", fontSize: "1rem", lineHeight: 1.8, color: "rgba(17,17,17,0.5)", fontWeight: 300 }}>
          Pick your college, choose the committee where you want to serve, and tell us why. One form, every branch of the council.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: "0 clamp(2rem, 5vw, 5.5rem) 6rem" }}>
        {honeypotField}

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="01" title="Applicant Info" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Full name" mono={mono}>
              <input
                className={`lyv-input${attemptedSubmit && nameError ? " lyv-invalid" : ""}`}
                style={inputStyle(!!(attemptedSubmit && nameError))}
                value={name} onChange={e => setName(e.target.value)} onBlur={() => touch("name")}
                placeholder="Juan Dela Cruz"
              />
              {(attemptedSubmit || touched.name) && <ErrorText>{nameError}</ErrorText>}
            </Field>
            <Field label="Email address" mono={mono}>
              <input
                className={`lyv-input${attemptedSubmit && emailError ? " lyv-invalid" : ""}`}
                style={inputStyle(!!(attemptedSubmit && emailError))}
                type="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch("email")}
                placeholder="juan.delacruz@dlsau.edu.ph"
              />
              {(attemptedSubmit || touched.email) && <ErrorText>{emailError}</ErrorText>}
            </Field>
          </div>
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="02" title="Select College" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {colleges.map(c => {
              const active = college === c.id;
              return (
                <div key={c.id} className="lyv-college" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); touch("college"); }}
                  style={{ padding: "1.5rem", border: `1px solid ${active ? c.color : "rgba(17,17,17,0.1)"}`, background: active ? `rgba(${hexRgb(c.color)},0.07)` : "transparent", borderRadius: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <span style={{ ...dg, fontSize: "1.1rem", color: DARK }}>{c.id}</span>
                    <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? c.color : "rgba(17,17,17,0.25)"}`, background: active ? c.color : "transparent" }} />
                  </div>
                  <p style={{ ...ss, fontSize: "0.82rem", color: "#666", lineHeight: 1.5, fontWeight: 300 }}>{c.name}</p>
                </div>
              );
            })}
          </div>
          {attemptedSubmit && <ErrorText>{collegeError}</ErrorText>}
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="03" title="Program & Year" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Program" mono={mono}>
              <CustomDropdown
                value={program}
                options={college ? programsByCollege[college].map(p => ({ id: p.id, label: p.label })) : []}
                placeholder="Select program"
                disabledPlaceholder="Select a college first"
                disabled={!college}
                invalid={attemptedSubmit && !!programError}
                onChange={id => { setProgram(id); setYearLevel(null); touch("program"); }}
              />
              {attemptedSubmit && <ErrorText>{programError}</ErrorText>}
            </Field>
            <Field label="Year Level" mono={mono}>
              <CustomDropdown
                value={yearLevel}
                options={program && college ? Array.from({ length: programsByCollege[college].find(p => p.id === program)!.years }, (_, i) => ({ id: String(i + 1), label: `Year ${i + 1}` })) : []}
                placeholder="Select year"
                disabledPlaceholder="Select a program first"
                disabled={!program}
                invalid={attemptedSubmit && !!yearLevelError}
                onChange={id => { setYearLevel(id); touch("yearLevel"); }}
              />
              {attemptedSubmit && <ErrorText>{yearLevelError}</ErrorText>}
            </Field>
          </div>
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="04" title="Select Committee" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
            {committees.map(c => (
              <CommitteeRow key={c.id} active={committee === c.id} label={c.label} desc={c.desc} onClick={() => { setCommittee(c.id); touch("committee"); }} dg={dg} ss={ss} color={accent} />
            ))}
            <div className="lyv-committee" onClick={() => setMultimediaOpen(o => !o)}
              style={{ padding: "1.1rem 1.3rem", border: `1px solid ${committee?.startsWith("multimedia") ? accent : "rgba(17,17,17,0.1)"}`, borderRadius: 4, background: committee?.startsWith("multimedia") ? `rgba(${hexRgb(accent)},0.05)` : "transparent" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ ...dg, fontSize: "0.95rem" }}>Multimedia</span>
                  <p style={{ ...ss, fontSize: "0.82rem", color: "#666", fontWeight: 300, marginTop: "0.3rem" }}>Covers Creatives and Documentation.</p>
                </div>
                <span className="lyv-chevron" style={{ ...mono, fontSize: "0.9rem", transform: multimediaOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
              </div>
              {multimediaOpen && (
                <div style={{ marginTop: "1rem", paddingLeft: "1rem", borderLeft: "2px solid rgba(17,17,17,0.1)", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {multimediaSub.map(m => (
                    <div key={m.id} className="lyv-sub" onClick={e => { e.stopPropagation(); setCommittee(m.id); touch("committee"); }}
                      style={{ padding: "0.85rem 1rem", border: `1px solid ${committee === m.id ? accent : "rgba(17,17,17,0.1)"}`, borderRadius: 4, background: committee === m.id ? `rgba(${hexRgb(accent)},0.08)` : "rgba(17,17,17,0.02)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ ...ss, fontSize: "0.9rem", fontWeight: 600 }}>{m.label}</span>
                        <span style={{ display: "block", width: 12, height: 12, borderRadius: "50%", border: `2px solid ${committee === m.id ? accent : "rgba(17,17,17,0.25)"}`, background: committee === m.id ? accent : "transparent" }} />
                      </div>
                      <p style={{ ...ss, fontSize: "0.78rem", color: "#666", fontWeight: 300, marginTop: "0.25rem" }}>{m.desc}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {attemptedSubmit && <ErrorText>{committeeError}</ErrorText>}
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="05" title="Tell Us About Your Work" />
          <p style={{ ...ss, fontSize: "0.85rem", color: "#666", fontWeight: 300, marginTop: "0.75rem", marginBottom: "1rem", maxWidth: "36rem" }}>
            Briefly describe relevant experience, skills, or why you want to serve in this committee.
          </p>
          <textarea
            className={`lyv-textarea${attemptedSubmit && descriptionError ? " lyv-invalid" : ""}`}
            style={{ ...inputStyle(!!(attemptedSubmit && descriptionError)), minHeight: "140px", resize: "vertical" }}
            value={description} onChange={e => setDescription(e.target.value)} onBlur={() => touch("description")}
            placeholder="e.g. I've handled event photography for two campus orgs and want to bring that to LYV's Documentation team..."
          />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem" }}>
            {(attemptedSubmit || touched.description) ? <ErrorText>{descriptionError}</ErrorText> : <span />}
            <span style={{ ...mono, fontSize: "0.68rem", color: description.length > 1000 ? "#dc2626" : "#999" }}>{description.length}/1000</span>
          </div>
        </div>

        <div className="lyv-reveal">
          <button type="submit" disabled={submitting}
            style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "1rem 2.5rem", borderRadius: 4, border: "none", background: canSubmit ? DARK : "rgba(17,17,17,0.55)", color: CREAM, cursor: submitting ? "not-allowed" : "pointer", transition: "background 0.25s ease" }}>
            {submitting ? "Submitting…" : "Submit Application"}
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}

/* ─── Small subcomponents (desktop only) ──────────────────────────────────── */
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

function CommitteeRow({ active, label, desc, onClick, dg, ss, color }: { active: boolean; label: string; desc: string; onClick: () => void; dg: object; ss: object; color: string }) {
  return (
    <div className="lyv-committee" onClick={onClick}
      style={{ padding: "1.1rem 1.3rem", borderRadius: 4, border: `1px solid ${active ? color : "rgba(17,17,17,0.1)"}`, background: active ? `rgba(${hexRgb(color)},0.05)` : "transparent" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ ...dg, fontSize: "0.95rem" }}>{label}</span>
          <p style={{ ...ss, fontSize: "0.82rem", color: "#666", fontWeight: 300, marginTop: "0.3rem" }}>{desc}</p>
        </div>
        <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? color : "rgba(17,17,17,0.25)"}`, background: active ? color : "transparent", flexShrink: 0 }} />
      </div>
    </div>
  );
}