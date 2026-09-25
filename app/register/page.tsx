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
`;

/* ─── Data & Constants ─────────────────────────────────────────────────────── */
export type CollegeId = "CAST" | "CBMA" | "COED" | "CVMAS";

const COLLEGES: { id: CollegeId; name: string; color: string }[] = [
  { id: "CAST",  name: "College of Arts, Sciences, and Technology",              color: "#dc2626" },
  { id: "CBMA",  name: "College of Business, Management & Accountancy",          color: "#ca8a04" },
  { id: "COED",  name: "College of Education",                                   color: "#2563eb" },
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

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"];

const DRAFT_KEY = "flair_register_draft_v1";
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

/* ─── Custom Components ────────────────────────────────────────────────────── */
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
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className={`flair-dropdown-trigger${invalid ? " flair-invalid" : ""}`} disabled={disabled}
        onClick={() => { if (disabled) return; setOpen(o => !o); if (!open) onOpen?.(); }}
        style={{ fontFamily: "'Source Serif 4', serif" }}>
        <span style={{ color: selected ? "#111111" : "#999" }}>
          {selected ? selected.label : disabled ? (disabledPlaceholder ?? placeholder) : placeholder}
        </span>
        <span className="flair-chevron" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "0.8rem", transform: open ? "rotate(180deg)" : "rotate(0deg)", marginLeft: "0.5rem", flexShrink: 0 }}>
          ▾
        </span>
      </button>

      {open && !disabled && (
        <div className="flair-dropdown-menu" style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
          background: "#fff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 4,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: "260px", overflowY: "auto",
        }} role="listbox">
          {options.map(o => (
            <div key={o.id} className="flair-dd-item" role="option" aria-selected={o.id === value}
              onClick={() => { onChange(o.id); setOpen(false); }}
              style={{ padding: "0.8rem 1rem", fontFamily: "'Source Serif 4', serif", fontSize: "0.9rem", background: o.id === value ? "rgba(6,64,43,0.06)" : "transparent", color: "#111111", borderBottom: "1px solid rgba(17,17,17,0.06)" }}>
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

const TOTAL_STEPS = 4;

/* ─── Main Component ───────────────────────────────────────────────────────── */
export default function FlairRegisterPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [college, setCollege] = useState<CollegeId | null>(null);
  const [program, setProgram] = useState<string | null>(null);
  const [yearLevel, setYearLevel] = useState<string | null>(null);
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
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  // Intersection Observer for Desktop Reveals
  useEffect(() => {
    if (isMobile !== false) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.12 },
    );
    const t = setTimeout(() => document.querySelectorAll(".flair-reveal").forEach(el => io.observe(el)), 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, [isMobile]);

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
        if (d.program) setProgram(d.program);
        if (d.yearLevel) setYearLevel(d.yearLevel);
        if (d.block) setBlock(d.block);
        if (typeof d.step === "number") setStep(d.step);
        setDraftRestored(true);
      }
    } catch {}
    hydratedRef.current = true;
  }, []);

  // Autosave Draft
  useEffect(() => {
    if (!hydratedRef.current || draftClearedRef.current) return;
    const hasContent = fullName || email || contactNumber || idNumber || college || yearLevel || block;
    if (!hasContent) return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ fullName, email, contactNumber, idNumber, college, program, yearLevel, block, step }));
    } catch {}
  }, [fullName, email, contactNumber, idNumber, college, program, yearLevel, block, step]);

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
    return null;
  }, [fullName]);

  const emailError = useMemo(() => {
    const t = email.trim();
    if (!t) return "Email is required.";
    if (!EMAIL_RE.test(t)) return "Enter a valid email address.";
    return null;
  }, [email]);

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

  const stepErrors = [
    !!nameError || !!emailError || !!phoneError, // Mobile Step 0
    !!idFormatError || idChecking,               // Mobile Step 1
    !college,                                    // Mobile Step 2
    !program || !yearLevel || !!blockError,      // Mobile Step 3
  ];

  const canSubmit = !nameError && !emailError && !phoneError && !idFormatError && !idChecking && !!college && !!program && !!yearLevel && !blockError;

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

    try {
      const submitPromise = (async () => {
        const { data: inserted, error: insertErr } = await supabase.from("flair_registrations").insert([{
          full_name: cleanName,
          email: cleanEmail,
          contact_number: contactNumber,
          id_number: cleanId,
          college,
          college_name: collegeMeta?.name ?? null,
          program: programLabel,
          year_level: yearLevel,
          block: cleanBlock,
          status: "pre_registered",
        }]).select("id").single();

        if (insertErr) throw insertErr;
        return inserted;
      })();
      
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("network-timeout")), 10000));
      const row = await Promise.race([submitPromise, timeoutPromise]) as any;
      
      clearDraft();
      router.push(`/confirm/${row.id}`);
    } catch (err: any) {
      if (err.message === "duplicate-id" || err.code === "23505") alert("This ID number is already registered.");
      else alert("Something went wrong. Please check your connection and try again.");
      setIsSubmitting(false);
      submitLockRef.current = false;
    }
  };

  if (isMobile === null) return null;

  /* ═══════════════════════════ MOBILE: Stepper ═══════════════════════════ */
  if (isMobile) {
    const showErrors = attemptedSubmit || touched[`step${step}`];

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
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column" }}>
        <div style={{ paddingTop: "env(safe-area-inset-top)", display: "flex", flexDirection: "column", flex: 1 }}>
          <div style={{ position: "sticky", top: 0, zIndex: 20, background: CREAM, borderBottom: "1px solid rgba(17,17,17,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.1rem" }}>
              <button onClick={() => step > 0 && setStep(s => s - 1)} disabled={step === 0} className="flair-btn"
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: step === 0 ? "transparent" : "rgba(17,17,17,0.06)", color: step === 0 ? "transparent" : DARK, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                ‹
              </button>
              <span style={{ ...dg, fontSize: "0.85rem", flex: 1 }}>Flair Reg</span>
              <span style={{ ...mono, fontSize: "0.65rem", color: "#888" }}>{step + 1}/{TOTAL_STEPS}</span>
            </div>
            <div style={{ height: 3, background: "rgba(17,17,17,0.08)" }}>
              <div style={{ height: "100%", width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: accent, transition: "width 0.3s ease, background 0.3s ease" }} />
            </div>
          </div>

          <div key={step} className={`flair-step${shakeStep ? " flair-shake" : ""}`} style={{ flex: 1, padding: "1.75rem 1.1rem 2rem", overflowY: "auto" }}>
            
            {step === 0 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Your Details</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Let's start with the basics.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Full name</span>
                    <input className={`flair-input${showErrors && nameError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && nameError))}
                      value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")}
                      placeholder="Juan Dela Cruz" autoFocus />
                    {(showErrors || touched.fullName) && <ErrorText>{nameError}</ErrorText>}
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Email</span>
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
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Double-check this, it links to your QR.</p>
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
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Which college?</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Pick where you're enrolled.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {COLLEGES.map(c => (
                    <div key={c.id} className="flair-college" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); touch("college"); }}
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
                  {showErrors && !college && <ErrorText>Please select a college.</ErrorText>}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Academic Info</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Program, year, and block.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Program</span>
                    <CustomDropdown value={program}
                      options={college ? PROGRAMS_BY_COLLEGE[college].map(p => ({ id: p.id, label: p.label })) : []}
                      placeholder="Select program" disabledPlaceholder="Pick a college first" disabled={!college}
                      invalid={showErrors && !program} onChange={id => { setProgram(id); touch("program"); }} />
                    {showErrors && !program && <ErrorText>Please select a program.</ErrorText>}
                  </label>
                  
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Year Level</span>
                    <CustomDropdown value={yearLevel}
                      options={YEAR_LEVELS.map(y => ({ id: y, label: y }))}
                      placeholder="Select year" disabled={!program} disabledPlaceholder="Pick a program first"
                      invalid={showErrors && !yearLevel} onChange={id => { setYearLevel(id); touch("yearLevel"); }} />
                    {showErrors && !yearLevel && <ErrorText>Please select a year level.</ErrorText>}
                  </label>

                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Block / Section</span>
                    <input className={`flair-input${showErrors && blockError ? " flair-invalid" : ""}`} style={inputStyle(!!(showErrors && blockError))}
                      value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")}
                      placeholder="e.g. 1st Year A" />
                    {(showErrors || touched.block) && <ErrorText>{blockError}</ErrorText>}
                  </label>
                </div>
              </>
            )}

          </div>

          <div style={{ position: "sticky", bottom: 0, background: CREAM, borderTop: "1px solid rgba(17,17,17,0.08)", padding: "0.85rem 1.1rem", paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))" }}>
            <button className="flair-btn" disabled={isSubmitting || idChecking} onClick={goNext}
              style={{ ...mono, width: "100%", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "1rem", borderRadius: 4, border: "none", background: !stepErrors[step] ? DARK : "rgba(17,17,17,0.55)", color: CREAM, minHeight: 48 }}>
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
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>USC Frosh Walk 2026</span>
        </div>
        <h1 style={{ margin: 0 }}>
          <span style={{ ...dg, display: "block", fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: DARK }}>FLAIR</span>
          <span style={{ ...ss, display: "block", fontSize: "clamp(2.2rem, 7vw, 5.5rem)", lineHeight: 0.95, fontStyle: "italic", fontWeight: 300, color: GREEN, paddingLeft: "clamp(0.3rem, 3vw, 3rem)", marginTop: "0.4rem" }}>registration</span>
        </h1>
        <p style={{ ...ss, marginTop: "2.5rem", marginLeft: "clamp(0.3rem, 3vw, 3rem)", maxWidth: "34rem", fontSize: "1rem", lineHeight: 1.8, color: "rgba(17,17,17,0.5)", fontWeight: 300 }}>
          Register to get your official Frosh Walk QR code. Screenshot it after — you'll need it at the gate.
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
            <Field label="Full name" mono={mono}>
              <input className={`flair-input${attemptedSubmit && nameError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && nameError))}
                value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")} placeholder="Juan Dela Cruz" />
              {(attemptedSubmit || touched.fullName) && <ErrorText>{nameError}</ErrorText>}
            </Field>
            <Field label="Email address" mono={mono}>
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
            <p style={{ ...ss, fontSize: "0.85rem", color: "#666", fontWeight: 300, marginTop: "1rem" }}>Your ID number is permanently linked to your QR code and cannot be changed after submission.</p>
          </div>
        </div>

        <div className="flair-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="03" title="Select College" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {COLLEGES.map(c => {
              const active = college === c.id;
              return (
                <div key={c.id} className="flair-college" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); touch("college"); }}
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
          {attemptedSubmit && !college && <ErrorText>Please select a college.</ErrorText>}
        </div>

        {/* Note the explicit relative positioning and elevated z-index here */}
        <div className="flair-reveal" style={{ marginBottom: "3.5rem", position: "relative", zIndex: 10 }}>
          <SectionLabel mono={mono} green={GREEN} step="04" title="Program & Year" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Program" mono={mono}>
              <CustomDropdown value={program}
                options={college ? PROGRAMS_BY_COLLEGE[college].map(p => ({ id: p.id, label: p.label })) : []}
                placeholder="Select program" disabledPlaceholder="Select a college first" disabled={!college}
                invalid={attemptedSubmit && !program} onChange={id => { setProgram(id); touch("program"); }} />
              {attemptedSubmit && !program && <ErrorText>Please select a program.</ErrorText>}
            </Field>

            <Field label="Year Level" mono={mono}>
              <CustomDropdown value={yearLevel}
                options={YEAR_LEVELS.map(y => ({ id: y, label: y }))}
                placeholder="Select year" disabledPlaceholder="Select a program first" disabled={!program}
                invalid={attemptedSubmit && !yearLevel} onChange={id => { setYearLevel(id); touch("yearLevel"); }} />
              {attemptedSubmit && !yearLevel && <ErrorText>Please select a year level.</ErrorText>}
            </Field>

            <Field label="Block / Section" mono={mono}>
              <input className={`flair-input${attemptedSubmit && blockError ? " flair-invalid" : ""}`} style={inputStyle(!!(attemptedSubmit && blockError))}
                value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")} placeholder="e.g. 1st Year A" />
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