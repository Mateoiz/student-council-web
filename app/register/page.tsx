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

.flair-college {
  transition: border-color 0.2s ease, background 0.2s ease;
  cursor: pointer;
}
.flair-college:hover {
  border-color: #06402B;
  background: rgba(255,255,255,0.55);
}
.flair-dd-item { transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease; cursor: pointer; }
.flair-dd-item:hover { background: rgba(17,17,17,0.04); }

.flair-college:active, .flair-dd-item:active, .flair-btn:active, .flair-dropdown-trigger:active {
  transform: scale(0.98);
}
.flair-btn { transition: background 0.15s ease, transform 0.1s ease; }

.flair-input, .flair-dropdown-trigger {
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
.flair-input.flair-invalid, .flair-dropdown-trigger.flair-invalid {
  border-color: #dc2626 !important;
  background: rgba(220,38,38,0.03) !important;
}

.flair-chevron { transition: transform 0.3s ease; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
@keyframes flair-pulse {
  0%, 100% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1.1); }
}

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

const getYearLevels = (prog: string | null) => {
  if (!prog) return [];
  if (prog === "dvm") return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"];
  if (["ba-psych", "beed", "bsed"].includes(prog)) return ["1st Year", "2nd Year", "3rd Year"];
  return ["1st Year", "2nd Year", "3rd Year", "4th Year"];
};

const DRAFT_KEY = "flair_register_draft_v1";
const ID_REGEX = /^20\d{2}-\d{2}-\d{6}$/;
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
    function onOutsideClick(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    
    document.addEventListener("mousedown", onOutsideClick);
    document.addEventListener("touchstart", onOutsideClick, { passive: true });
    document.addEventListener("keydown", onEsc);
    
    return () => { 
      document.removeEventListener("mousedown", onOutsideClick); 
      document.removeEventListener("touchstart", onOutsideClick);
      document.removeEventListener("keydown", onEsc); 
    };
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", zIndex: open ? 60 : 1 }}>
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
          background: "rgba(255, 255, 255, 0.92)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(17,17,17,0.1)", borderRadius: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.12)", overflow: "hidden", maxHeight: "260px", overflowY: "auto",
        }} role="listbox">
          {options.map(o => (
            <div key={o.id} className="flair-dd-item" role="option" aria-selected={o.id === value}
              onMouseDown={(e) => e.preventDefault()} // Prevents the trigger from blurring ungracefully
              onClick={() => { onChange(o.id); setOpen(false); }}
              style={{ padding: "0.9rem 1rem", fontFamily: "'Source Serif 4', serif", fontSize: "0.9rem", 
                       background: o.id === value ? "rgba(6,64,43,0.06)" : "transparent", 
                       color: o.id === value ? "#06402B" : "#111111", 
                       fontWeight: o.id === value ? 600 : 400, 
                       borderBottom: "1px solid rgba(17,17,17,0.06)" }}>
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

  const handleProgramChange = (id: string) => {
    setProgram(id);
    touch("program");
    const validYears = getYearLevels(id);
    if (yearLevel && !validYears.includes(yearLevel)) {
      setYearLevel(null);
    }
  };

  // Validation Checkers
  const nameError = useMemo(() => {
    const t = fullName.trim();
    if (!t) return "Full name is required.";
    if (t.length < 3) return "Name looks too short.";
    if (!NAME_REGEX.test(t)) return "Use letters and basic punctuation only.";
    return null;
  }, [fullName]);

  const emailError = useMemo(() => {
    const t = email.trim().toLowerCase();
    if (!t) return "Email is required.";
    
    // Basic structural check
    const emailRegex = /^[a-z0-9_.-]+@[a-z0-9_.-]+\.[a-z]+$/i;
    if (!emailRegex.test(t)) return "Enter a valid email address.";
    
    // Domain Check
    if (!t.endsWith("@dlsau.edu.ph")) return "Must be your @dlsau.edu.ph student email.";

    // Format & Name Alignment Check
    const localPart = t.split("@")[0];
    const parts = localPart.split(".");
    
    if (parts.length < 2) return "Use the firstname.surname format.";

    // Strip numbers out of the email parts to handle duplicates (e.g., ice.ramirez2)
    const eFirst = parts[0].replace(/[0-9]/g, "");
    const eLast = parts.slice(1).join("").replace(/[0-9]/g, ""); 
    
    // Compare the stripped email blocks against the stripped full name string
    const cleanNameStr = fullName.toLowerCase().replace(/[^a-z]/g, "");
    
    // Only strictly validate against the name if they've typed enough of a name to compare
    if (cleanNameStr.length > 3) {
        if (!cleanNameStr.includes(eFirst) || !cleanNameStr.includes(eLast)) {
            return "Email does not match your registered Full Name.";
        }
    }

    return null;
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
      
      // Navigate to the Confirm Page
      router.push(`/confirm/${row.id}`);
      
    } catch (err: any) {
      console.error("Supabase Insert Error:", err);
      if (err.message === "duplicate-id" || err.code === "23505") {
        alert("This ID number is already registered.");
      } else {
        alert(`Failed to register: ${err.message || err.details || "Check console for details."}`);
      }
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

    const stepMeta = [
      { label: "Personal", title: "Your Details", sub: "Let's start with the basics." },
      { label: "Student ID", title: "Student ID", sub: "Double-check this — it links to your QR." },
      { label: "College", title: "Which college?", sub: "Pick where you're enrolled." },
      { label: "Academic", title: "Academic Info", sub: "Program, year, and block." },
    ];

    const currentMeta = stepMeta[step];

    return (
      <div style={{ background: CREAM, minHeight: "100dvh", display: "flex", flexDirection: "column", fontFamily: "'Source Serif 4', serif" }}>
        <div style={{ paddingTop: "calc(env(safe-area-inset-top) + 5.5rem)", display: "flex", flexDirection: "column", flex: 1 }}>

          {/* ── Header ── */}
          <div style={{ position: "sticky", top: "5.5rem", zIndex: 20, background: CREAM }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 1.1rem 0.6rem" }}>
              <button
                onClick={() => step > 0 && setStep(s => s - 1)}
                disabled={step === 0}
                className="flair-btn"
                style={{
                  width: 34, height: 34, borderRadius: "50%", border: "none", flexShrink: 0,
                  background: step === 0 ? "transparent" : "rgba(17,17,17,0.07)",
                  color: step === 0 ? "transparent" : DARK,
                  fontSize: "1.2rem", display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >‹</button>
              <div style={{ flex: 1 }}>
                <div style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.35em", textTransform: "uppercase", color: GREEN, marginBottom: "0.15rem" }}>
                  USC Frosh Walk 2026
                </div>
                <div style={{ ...dg, fontSize: "0.88rem", color: DARK, letterSpacing: "-0.01em" }}>FLAIR</div>
              </div>
              <div style={{ display: "flex", gap: "0.3rem", alignItems: "center" }}>
                {stepMeta.map((s, i) => (
                  <div key={i} style={{
                    width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                    background: i < step ? GREEN : i === step ? accent : "rgba(17,17,17,0.12)",
                    transition: "all 0.35s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                ))}
              </div>
            </div>

            {/* Thin progress line */}
            <div style={{ height: 1.5, background: "rgba(17,17,17,0.07)", margin: "0 1.1rem" }}>
              <div style={{ height: "100%", width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: accent, borderRadius: 2, transition: "width 0.4s cubic-bezier(0.16,1,0.3,1), background 0.3s ease" }} />
            </div>

            {/* Step label strip */}
            <div style={{ display: "flex", padding: "0.55rem 1.1rem 0", gap: "0" }}>
              {stepMeta.map((s, i) => (
                <div key={i} style={{ flex: 1, textAlign: "center" }}>
                  <span style={{
                    ...mono, fontSize: "0.48rem", letterSpacing: "0.15em", textTransform: "uppercase",
                    color: i === step ? accent : i < step ? GREEN : "rgba(17,17,17,0.25)",
                    fontWeight: i === step ? 600 : 400,
                    transition: "color 0.3s ease",
                    display: "block",
                  }}>
                    {i < step ? "✓ " : ""}{s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Step content ── */}
          <div
            key={step}
            className={`flair-step${shakeStep ? " flair-shake" : ""}`}
            style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.1rem 1rem" }}
          >
            {/* Step heading */}
            <div style={{ marginBottom: "1.5rem" }}>
              <h2 style={{ ...dg, fontSize: "1.6rem", marginBottom: "0.25rem", lineHeight: 1, letterSpacing: "-0.02em", color: DARK }}>{currentMeta.title}</h2>
              <p style={{ ...ss, fontSize: "0.85rem", color: "#888", fontWeight: 300, margin: 0 }}>{currentMeta.sub}</p>
            </div>

            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Full name</span>
                  <input
                    className={`flair-input${showErrors && nameError ? " flair-invalid" : ""}`}
                    style={inputStyle(!!(showErrors && nameError))}
                    value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")}
                    placeholder="Juan Dela Cruz" autoFocus
                  />
                  {(showErrors || touched.fullName) && <ErrorText>{nameError}</ErrorText>}
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Email</span>
                  <input
                    className={`flair-input${showErrors && emailError ? " flair-invalid" : ""}`}
                    style={inputStyle(!!(showErrors && emailError))}
                    type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch("email")}
                    placeholder="juan.delacruz@dlsau.edu.ph"
                  />
                  {(showErrors || touched.email) && <ErrorText>{emailError}</ErrorText>}
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Contact Number</span>
                  <input
                    className={`flair-input${showErrors && phoneError ? " flair-invalid" : ""}`}
                    style={inputStyle(!!(showErrors && phoneError))}
                    type="tel" inputMode="tel" value={contactNumber}
                    onChange={e => setContactNumber(e.target.value.replace(/[^\d+]/g, ""))}
                    onBlur={() => touch("contactNumber")}
                    placeholder="09171234567"
                  />
                  {(showErrors || touched.contactNumber) && <ErrorText>{phoneError}</ErrorText>}
                </label>
              </div>
            )}

            {/* ── Step 1: ID ── */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>ID Number</span>
                  <input
                    className={`flair-input${showErrors && idFormatError ? " flair-invalid" : ""}`}
                    style={{ ...inputStyle(!!(showErrors && idFormatError)), fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", fontSize: "1.1rem" }}
                    type="text" inputMode="numeric" value={idNumber} onChange={handleIdChange} onBlur={() => touch("idNumber")}
                    placeholder="20XX-XX-XXXXXX" autoFocus
                  />
                  {idChecking && (
                    <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginTop: "0.5rem", fontSize: "0.72rem", color: "#999", fontFamily: "'IBM Plex Mono', monospace" }}>
                      <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: GREEN, opacity: 0.7, animation: "flair-pulse 1s ease infinite" }} />
                      Checking database…
                    </span>
                  )}
                  {!idChecking && (showErrors || touched.idNumber) && <ErrorText>{idFormatError}</ErrorText>}
                </label>
                <div style={{ padding: "0.85rem 1rem", background: "rgba(6,64,43,0.05)", borderRadius: 6, border: "1px solid rgba(6,64,43,0.12)" }}>
                  <p style={{ ...ss, fontSize: "0.8rem", color: GREEN, fontWeight: 300, margin: 0, lineHeight: 1.65 }}>
                    Your ID is permanently linked to your QR code and cannot be changed after submission.
                  </p>
                </div>
              </div>
            )}

            {/* ── Step 2: College ── */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {COLLEGES.map(c => (
                  <div
                    key={c.id}
                    className="flair-college"
                    onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); touch("college"); }}
                    style={{
                      padding: "0.9rem 1rem",
                      borderRadius: 8,
                      border: `1.5px solid ${college === c.id ? c.color : "rgba(17,17,17,0.09)"}`,
                      background: college === c.id ? `rgba(${hexRgb(c.color)},0.07)` : "rgba(255,255,255,0.5)",
                      display: "flex", alignItems: "center", gap: "0.85rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.18rem" }}>
                        <span style={{ ...dg, fontSize: "0.95rem", color: college === c.id ? c.color : DARK }}>{c.id}</span>
                        {college === c.id && (
                          <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.2em", textTransform: "uppercase", color: c.color, background: `rgba(${hexRgb(c.color)},0.1)`, padding: "0.15rem 0.4rem", borderRadius: 3 }}>
                            Selected
                          </span>
                        )}
                      </div>
                      <span style={{ ...ss, fontSize: "0.75rem", color: "#777", fontWeight: 300, lineHeight: 1.4, display: "block" }}>{c.name}</span>
                    </div>
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${college === c.id ? c.color : "rgba(17,17,17,0.2)"}`,
                      background: college === c.id ? c.color : "transparent",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.2s ease",
                    }}>
                      {college === c.id && <span style={{ color: "#fff", fontSize: "0.6rem", lineHeight: 1 }}>✓</span>}
                    </div>
                  </div>
                ))}
                {showErrors && !college && <ErrorText>Please select a college.</ErrorText>}
              </div>
            )}

            {/* ── Step 3: Academic ── */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {college && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.85rem", background: `rgba(${hexRgb(accent)},0.07)`, border: `1px solid rgba(${hexRgb(accent)},0.15)`, borderRadius: 6, marginBottom: "0.25rem" }}>
                    <span style={{ ...dg, fontSize: "0.8rem", color: accent }}>{college}</span>
                    <span style={{ ...ss, fontSize: "0.75rem", color: "#777", fontWeight: 300 }}>— {COLLEGES.find(c => c.id === college)?.name}</span>
                  </div>
                )}
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Program</span>
                  <CustomDropdown
                    value={program}
                    options={college ? PROGRAMS_BY_COLLEGE[college].map(p => ({ id: p.id, label: p.label })) : []}
                    placeholder="Select program" disabledPlaceholder="Pick a college first" disabled={!college}
                    invalid={showErrors && !program} onChange={handleProgramChange}
                  />
                  {showErrors && !program && <ErrorText>Please select a program.</ErrorText>}
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Year Level</span>
                  <CustomDropdown
                    value={yearLevel}
                    options={getYearLevels(program).map(y => ({ id: y, label: y }))}
                    placeholder="Select year" disabled={!program} disabledPlaceholder="Select a program first"
                    invalid={showErrors && !yearLevel} onChange={id => { setYearLevel(id); touch("yearLevel"); }}
                  />
                  {showErrors && !yearLevel && <ErrorText>Please select a year level.</ErrorText>}
                </label>
                <label style={{ display: "block" }}>
                  <span style={{ ...mono, fontSize: "0.58rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "#999", display: "block", marginBottom: "0.45rem" }}>Block / Section</span>
                  <input
                    className={`flair-input${showErrors && blockError ? " flair-invalid" : ""}`}
                    style={inputStyle(!!(showErrors && blockError))}
                    value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")}
                    placeholder="e.g. 1-A"
                  />
                  {(showErrors || touched.block) && <ErrorText>{blockError}</ErrorText>}
                </label>

                {/* Summary card on last step */}
                {!stepErrors[3] && fullName && (
                  <div style={{ marginTop: "0.5rem", padding: "0.85rem 1rem", background: "rgba(6,64,43,0.04)", border: "1px solid rgba(6,64,43,0.12)", borderRadius: 8 }}>
                    <p style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: GREEN, marginBottom: "0.55rem" }}>Ready to submit</p>
                    <p style={{ ...ss, fontSize: "0.82rem", color: DARK, margin: "0 0 0.2rem", fontWeight: 600 }}>{formatName(fullName)}</p>
                    <p style={{ ...mono, fontSize: "0.72rem", color: "#888", margin: "0 0 0.2rem" }}>{idNumber}</p>
                    <p style={{ ...ss, fontSize: "0.78rem", color: "#777", fontWeight: 300, margin: 0 }}>{PROGRAMS_BY_COLLEGE[college!].find(p => p.id === program)?.label} · {yearLevel} · {block}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Bottom CTA ── */}
          <div style={{
            position: "sticky", bottom: 0,
            background: `linear-gradient(to top, ${CREAM} 80%, transparent)`,
            padding: "1rem 1.1rem",
            paddingBottom: "calc(1rem + env(safe-area-inset-bottom))",
          }}>
            <button
              className="flair-btn"
              disabled={isSubmitting || idChecking}
              onClick={goNext}
              style={{
                ...mono,
                width: "100%",
                fontSize: "0.72rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                padding: "1rem",
                borderRadius: 8,
                border: "none",
                background: stepErrors[step] ? "rgba(17,17,17,0.45)" : DARK,
                color: CREAM,
                minHeight: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                transition: "background 0.25s ease",
              }}
            >
              {isSubmitting
                ? <><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: "50%", border: `2px solid ${CREAM}`, borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} /> Submitting…</>
                : step === TOTAL_STEPS - 1
                  ? <>Complete Registration →</>
                  : <>Continue <span style={{ opacity: 0.6 }}>({step + 1}/{TOTAL_STEPS})</span></>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════ DESKTOP: Long-scroll Form ═══════════════════════════ */
  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden", minHeight: "100dvh" }}>

      <div style={{ padding: "clamp(7rem, 12vw, 9rem) clamp(2rem, 5vw, 5.5rem) 2rem" }}>
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
                invalid={attemptedSubmit && !program} onChange={handleProgramChange} />
              {attemptedSubmit && !program && <ErrorText>Please select a program.</ErrorText>}
            </Field>

            <Field label="Year Level" mono={mono}>
              <CustomDropdown value={yearLevel}
                options={getYearLevels(program).map(y => ({ id: y, label: y }))}
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