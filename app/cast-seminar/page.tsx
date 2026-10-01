"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export type CollegeId = "CAST" | "CBMA" | "COED" | "CVMAS";

const TABLE = "cast_seminar_registrations";
const DRAFT_KEY = "cast_seminar_draft_v2";
const COOLDOWN_KEY = "cast_seminar_last_submit_ts";
const SUBMIT_COOLDOWN_MS = 15_000;

const RED = "#dc2626", CREAM = "#F4EFE6", DARK = "#111111", GREEN = "#15803d";
/** Height of your global fixed site header (USC–CSC bar). */
const HEADER_H = "5rem";
const TOTAL_STEPS = 4;

const COLLEGES: { id: CollegeId; name: string; color: string }[] = [
  { id: "CAST",  name: "College of Arts, Sciences, and Technology",             color: "#dc2626" },
  { id: "CBMA",  name: "College of Business, Management & Accountancy",         color: "#ca8a04" },
  { id: "COED",  name: "College of Education",                                  color: "#2563eb" },
  { id: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#06402B" },
];

const PROGRAMS_BY_COLLEGE: Record<CollegeId, { id: string; label: string; short: string }[]> = {
  CAST: [
    { id: "ba-psych", label: "BA Psychology", short: "BA Psych" },
    { id: "bs-cpe",   label: "BS Computer Engineering", short: "BS CpE" },
    { id: "bs-cs",    label: "BS Computer Science", short: "BS CS" },
  ],
  CBMA: [
    { id: "bs-accountancy", label: "BS Accountancy", short: "BSA" },
    { id: "bsba-fm",        label: "BSBA - Financial Management", short: "BSBA-FM" },
    { id: "bsba-mm",        label: "BSBA - Marketing Management", short: "BSBA-MM" },
    { id: "bs-hm",          label: "BS Hospitality Management", short: "BSHM" },
    { id: "bs-tm",          label: "BS Tourism Management", short: "BSTM" },
  ],
  COED: [
    { id: "beed", label: "Bachelor of Elementary Education", short: "BEEd" },
    { id: "bsed", label: "Bachelor of Secondary Education", short: "BSEd" },
  ],
  CVMAS: [
    { id: "dvm",         label: "Doctor of Veterinary Medicine", short: "DVM" },
    { id: "bs-foodtech", label: "BS Food Technology", short: "BSFT" },
    { id: "bs-agri",     label: "BS Agriculture", short: "BS Agri" },
  ],
};

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"];

function getYearLevelsForProgram(programId: string | null | undefined): string[] {
  if (programId === "beed" || programId === "bsed") return YEAR_LEVELS.slice(0, 3); // COED: 1st–3rd Year
  if (programId === "dvm" || programId === "ba-psych") return YEAR_LEVELS;          // VetMed & Psych: 1st–6th Year
  return YEAR_LEVELS.slice(0, 5);                                                   // Others: 1st–5th Year
}

const STEPS = [
  { t: "Register", d: "Open to all DLSAU colleges. Rizal Hall • Oct 8, 12:30 PM." },
  { t: "Save your QR", d: "Screenshot the QR code on the next screen." },
  { t: "Show it at the door", d: "Scan in when you arrive and scan out when you leave." },
];

const ID_REGEX = /^20\d{2}-\d{2}-\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(?:\+63|0)9\d{9}$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ''.,\- ]+$/;
const BLOCK_REGEX = /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9'\- ]+$/;

const stripControl = (s: string) => s.replace(/[\u0000-\u001F\u007F]/g, "");
const titleCase = (s: string) => s.replace(/\s+/g, " ").trim().replace(/\b\w/g, c => c.toUpperCase());

function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "0,0,0";
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{-webkit-tap-highlight-color:transparent}
.cs-page{background:${CREAM};color:${DARK};min-height:100dvh;overflow-x:clip;box-sizing:border-box;padding-top:calc(${HEADER_H} + env(safe-area-inset-top))}
.cs-page *{box-sizing:border-box}

/* Desktop / tablet long form */
.cs-shell{max-width:1180px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr);gap:1.75rem;padding:1.25rem clamp(1rem,4vw,2.5rem) 4rem}
.cs-aside{display:flex;flex-direction:column;gap:1.5rem;min-width:0}
.cs-steps{display:none;margin:0;padding:0;list-style:none}
.cs-meter-d{display:none}
.cs-card{background:#fff;border:1px solid rgba(17,17,17,.1);border-radius:8px;padding:clamp(1.1rem,3vw,2rem);display:flex;flex-direction:column;gap:2rem;min-width:0}
.cs-section{display:flex;flex-direction:column;gap:1.1rem;min-width:0}
.cs-section+.cs-section{border-top:1px solid rgba(17,17,17,.08);padding-top:1.75rem}
.cs-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:1.1rem}
.cs-full{grid-column:1/-1}
.cs-h1{font-family:'Dela Gothic One',sans-serif;margin:.6rem 0 0;font-size:clamp(1.55rem,4.6vw,2.9rem);line-height:1.08;letter-spacing:-.02em;overflow-wrap:break-word;word-break:normal;hyphens:manual}

.cs-input{font-size:16px;width:100%;min-height:48px;background:rgba(17,17,17,.03);border:1px solid rgba(17,17,17,.12);border-radius:4px;padding:.8rem 1rem;color:#111;font-family:'Source Serif 4',serif;-webkit-appearance:none;appearance:none;transition:border-color .2s,background .2s}
.cs-input:focus{outline:none;border-color:${RED};background:rgba(220,38,38,.04)}
.cs-input.bad{border-color:${RED};background:rgba(220,38,38,.03)}
.cs-input.ok{border-color:${GREEN}}
.cs-input::placeholder{color:rgba(17,17,17,.35)}

.cs-colleges{display:grid;grid-template-columns:1fr;gap:.75rem}
.cs-college-card{padding:1rem 1.1rem;border-radius:4px;border:1px solid rgba(17,17,17,.12);background:rgba(17,17,17,.02);cursor:pointer;text-align:left;width:100%;transition:border-color .2s,background .2s,transform .1s}
.cs-college-card:hover{border-color:rgba(17,17,17,.35);background:rgba(255,255,255,.7)}
.cs-college-card:active{transform:scale(.98)}
.cs-college-card.bad{border-color:${RED}}

.cs-choices{display:grid;gap:.6rem}
.cs-choices.prog{grid-template-columns:1fr}
.cs-choices.year{grid-template-columns:repeat(3,minmax(0,1fr))}
.cs-tile{font-family:'Source Serif 4',serif;font-size:.95rem;min-height:48px;padding:.7rem .9rem;text-align:left;background:rgba(17,17,17,.03);border:1px solid rgba(17,17,17,.12);border-radius:4px;color:#111;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:.5rem;transition:border-color .2s,background .2s,color .2s,transform .1s}
.cs-tile.year{justify-content:center;text-align:center}
.cs-tile:hover:not(:disabled){border-color:rgba(17,17,17,.4)}
.cs-tile:active:not(:disabled){transform:scale(.98)}
.cs-tile:disabled{opacity:.5;cursor:not-allowed}
.cs-tile[aria-checked="true"]{background:${DARK};border-color:${DARK};color:${CREAM}}
.cs-tile.bad{border-color:${RED}}
.cs-tile .short{display:none;font-family:'IBM Plex Mono',monospace;font-size:.7rem;opacity:.6}
.cs-tile:focus-visible,.cs-college-card:focus-visible,.cs-back:focus-visible,.cs-submit:focus-visible,.cs-round:focus-visible{outline:2px solid ${RED};outline-offset:2px}

.cs-submit{min-height:48px;padding:.9rem 1.6rem;border:none;border-radius:4px;color:${CREAM};font-family:'IBM Plex Mono',monospace;font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;white-space:nowrap;transition:background .2s,transform .1s}
.cs-submit:active{transform:scale(.98)}
.cs-back{font-family:'IBM Plex Mono',monospace;background:none;border:none;cursor:pointer;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:#777;padding:.4rem 0;align-self:flex-start;min-height:44px}
.cs-back:hover{color:${DARK}}
.cs-track{height:4px;border-radius:2px;background:rgba(17,17,17,.1);overflow:hidden}
.cs-fill{height:100%;background:${RED};transition:width .3s ease,background .3s ease}

/* Mobile stepper */
.cs-m{display:flex;flex-direction:column;min-height:calc(100dvh - ${HEADER_H} - env(safe-area-inset-top))}
.cs-mbar{position:sticky;top:calc(${HEADER_H} + env(safe-area-inset-top));z-index:20;background:${CREAM};border-bottom:1px solid rgba(17,17,17,.08)}
.cs-round{width:36px;height:36px;border-radius:50%;border:none;background:rgba(17,17,17,.06);color:${DARK};font-size:1.1rem;display:flex;align-items:center;justify-content:center;flex-shrink:0;cursor:pointer}
.cs-mfoot{position:sticky;bottom:0;background:${CREAM};border-top:1px solid rgba(17,17,17,.08);padding:.85rem 1.1rem calc(.85rem + env(safe-area-inset-top))}
@keyframes cs-in{from{opacity:0;transform:translateX(16px)}to{opacity:1;transform:none}}
@keyframes cs-shake{10%,90%{transform:translateX(-1px)}20%,80%{transform:translateX(2px)}30%,50%,70%{transform:translateX(-3px)}40%,60%{transform:translateX(3px)}}
.cs-step{animation:cs-in .28s cubic-bezier(.16,1,.3,1) both}
.cs-step.shake{animation:cs-shake .4s both}

@media (min-width:640px){
  .cs-grid{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cs-colleges{grid-template-columns:repeat(2,minmax(0,1fr))}
  .cs-choices.prog{grid-template-columns:repeat(auto-fit,minmax(170px,1fr))}
.cs-choices.year{grid-template-columns:repeat(auto-fit,minmax(95px,1fr))}  .cs-tile.year{padding:.7rem .4rem;font-size:.9rem}
  .cs-tile.prog{flex-direction:column;align-items:flex-start;justify-content:center;gap:.15rem}
  .cs-tile .short{display:block}
}
@media (min-width:1000px){
  .cs-shell{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(2rem,5vw,4.5rem);padding-top:2rem;align-items:start}
  .cs-aside{position:sticky;top:calc(${HEADER_H} + 1.5rem)}
  .cs-steps{display:flex;flex-direction:column;gap:1.1rem}
  .cs-meter-d{display:block}
}
@media (min-width:1000px) and (max-height:700px){.cs-aside{position:static}}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
`;

const dg = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss = { fontFamily: "'Source Serif 4', serif" } as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const labelStyle = { ...mono, fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#777", display: "block", marginBottom: "0.5rem" } as const;
const errStyle = { display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: RED, ...mono } as const;

function useIsMobile(breakpoint = 700) {
  const [m, setM] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setM(mq.matches);
    const on = (e: MediaQueryListEvent) => setM(e.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [breakpoint]);
  return m;
}

function Field({ label, error, hint, className, children }: { label: string; error?: string | null; hint?: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <label className={className} style={{ display: "block", minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {error ? <span role="alert" style={errStyle}>{error}</span> : hint}
    </label>
  );
}
function Group({ label, error, className, children }: { label: string; error?: string | null; className?: string; children: React.ReactNode }) {
  return (
    <div className={className} role="radiogroup" aria-label={label} style={{ minWidth: 0 }}>
      <span style={labelStyle}>{label}</span>
      {children}
      {error && <span role="alert" style={errStyle}>{error}</span>}
    </div>
  );
}
function SectionTitle({ title, note }: { title: string; note?: string }) {
  return (
    <div>
      <h2 style={{ ...dg, fontSize: "1.05rem", margin: 0, letterSpacing: "-0.01em" }}>{title}</h2>
      {note && <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, margin: "0.3rem 0 0" }}>{note}</p>}
    </div>
  );
}
function Meter({ done, total, color }: { done: number; total: number; color: string }) {
  return (
    <div>
      <div style={{ ...mono, fontSize: "0.68rem", color: "#777", marginBottom: "0.4rem", display: "flex", justifyContent: "space-between" }}>
        <span>{done === total ? "Ready to submit" : "Form progress"}</span><span>{done}/{total}</span>
      </div>
      <div className="cs-track" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
        <div className="cs-fill" style={{ width: `${(done / total) * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function CastSeminarPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [college, setCollege] = useState<CollegeId | null>(null);
  const [program, setProgram] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [block, setBlock] = useState("");

  const [step, setStep] = useState(0);
  const [shake, setShake] = useState(false);
  const [idError, setIdError] = useState("");
  const [idChecking, setIdChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const hydrated = useRef(false);
  const cleared = useRef(false);
  const submitLock = useRef(false);
  const idToken = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  const accent = college ? COLLEGES.find(c => c.id === college)?.color ?? RED : RED;
  const availablePrograms = college ? PROGRAMS_BY_COLLEGE[college] : [];
  const availableYears = useMemo(() => getYearLevelsForProgram(program), [program]);

  useEffect(() => {
    let el = document.getElementById("cast-css") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "cast-css";
      document.head.appendChild(el);
    }
    el.textContent = STYLES;
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        setFullName(d.fullName ?? "");
        setEmail(d.email ?? "");
        setContactNumber(d.contactNumber ?? "");
        setIdNumber(d.idNumber ?? "");
        if (d.college && COLLEGES.some(c => c.id === d.college)) setCollege(d.college);
        setProgram(d.program ?? "");
        setYearLevel(d.yearLevel ?? "");
        setBlock(d.block ?? "");
        if (typeof d.step === "number") setStep(Math.min(d.step, TOTAL_STEPS - 1));
        setDraftRestored(true);
      }
    } catch {}
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current || cleared.current) return;
    if (!(fullName || email || contactNumber || idNumber || college || program || yearLevel || block)) return;
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ fullName, email, contactNumber, idNumber, college, program, yearLevel, block, step })
      );
    } catch {}
  }, [fullName, email, contactNumber, idNumber, college, program, yearLevel, block, step]);

  const clearDraft = useCallback(() => {
    cleared.current = true;
    try { sessionStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);

  const discardDraft = () => {
    clearDraft();
    setFullName(""); setEmail(""); setContactNumber(""); setIdNumber("");
    setCollege(null); setProgram(""); setYearLevel(""); setBlock("");
    setTouched({}); setAttempted(false); setDraftRestored(false); setStep(0);
    cleared.current = false;
  };

  const handleId = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setIdNumber(
      digits.length > 6
        ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
        : digits.length > 4
        ? `${digits.slice(0, 4)}-${digits.slice(4)}`
        : digits
    );
  };

  useEffect(() => {
    const id = idNumber.trim();
    if (!ID_REGEX.test(id)) { setIdError(""); setIdChecking(false); return; }
    const token = ++idToken.current;
    setIdChecking(true); setIdError("");
    const t = setTimeout(async () => {
      try {
        const { data, error } = await supabase.from(TABLE).select("id").eq("id_number", id).limit(1);
        if (idToken.current !== token) return;
        if (error) throw error;
        setIdError(data?.length ? "This ID number is already registered." : "");
      } catch {
        if (idToken.current === token) setIdError("Couldn't verify ID. Check your connection.");
      } finally {
        if (idToken.current === token) setIdChecking(false);
      }
    }, 550);
    return () => clearTimeout(t);
  }, [idNumber]);

  const errors = useMemo(() => {
    const n = fullName.trim(), e = email.trim(), p = contactNumber.trim(), b = block.trim();
    const validProg = college ? PROGRAMS_BY_COLLEGE[college].some(item => item.id === program) : false;
    const validYear = Boolean(yearLevel) && availableYears.includes(yearLevel);
    return {
      fullName: !n ? "Full name is required." : n.length < 3 ? "Name looks too short." : !NAME_REGEX.test(n) ? "Use letters and basic punctuation only." : null,
      email: !e ? "Email is required." : !EMAIL_RE.test(e) ? "Enter a valid email address." : null,
      contactNumber: !p ? "Contact number is required." : !PHONE_RE.test(p) ? "Enter a valid PH number (09XXXXXXXXX)." : null,
      idNumber: !idNumber ? "ID number is required." : !ID_REGEX.test(idNumber) ? "Use format 20XX-XX-XXXXXX." : idError || null,
      college: college ? null : "Please select a college.",
      program: validProg ? null : "Please select a program.",
      yearLevel: validYear ? null : "Please select a year level.",
      block: !b ? "Block/Section is required." : !BLOCK_REGEX.test(b) ? "Use letters, numbers, spaces, dashes only." : null,
    };
  }, [fullName, email, contactNumber, idNumber, idError, college, program, yearLevel, availableYears, block]);

  const keys = Object.keys(errors) as (keyof typeof errors)[];
  const doneCount = keys.filter(k => !errors[k]).length;
  const canSubmit = doneCount === keys.length && !idChecking;

  const stepInvalid = [
    !!(errors.fullName || errors.email || errors.contactNumber), // Step 0: Details
    !!errors.idNumber || idChecking,                             // Step 1: Student ID
    !!errors.college,                                            // Step 2: College
    !!(errors.program || errors.yearLevel || errors.block),      // Step 3: Academic Info
  ];

  const touch = (k: string) => setTouched(t => ({ ...t, [k]: true }));
  const idOk = ID_REGEX.test(idNumber) && !idChecking && !idError;

  const vis = (k: keyof typeof errors, force = false) => (force || attempted || touched[k]) && errors[k] ? errors[k] : null;
  const cls = (k: keyof typeof errors, force = false) => `cs-input${vis(k, force) ? " bad" : ""}`;

  const submit = async () => {
    setAttempted(true);
    setSubmitError("");

    // 1. Honeypot anti-bot guard
    if (honeypot.trim() !== "") return;

    // 2. Client-side rate limit cooldown
    try {
      const lastTs = Number(sessionStorage.getItem(COOLDOWN_KEY) || "0");
      if (Date.now() - lastTs < SUBMIT_COOLDOWN_MS) {
        setSubmitError("Please wait a few seconds before submitting again.");
        return;
      }
    } catch {}

    // 3. Strict whitelist check against COLLEGES, PROGRAMS_BY_COLLEGE, and program-specific year levels
    const collegeMeta = college ? COLLEGES.find(c => c.id === college) : null;
    const validProgram = college ? PROGRAMS_BY_COLLEGE[college].find(p => p.id === program) : null;
    const validYear = availableYears.includes(yearLevel);

    if (!canSubmit || !collegeMeta || !validProgram || !validYear || isSubmitting || submitLock.current) {
      requestAnimationFrame(() => {
        formRef.current?.querySelector<HTMLElement>('[role="alert"], .bad')?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);

    const cleanName = titleCase(stripControl(fullName)).slice(0, 100);
    const cleanEmail = stripControl(email).trim().toLowerCase().slice(0, 120);
    const cleanPhone = contactNumber.replace(/[^\d+]/g, "").slice(0, 13);
    const cleanId = idNumber.trim();
    const cleanBlock = titleCase(stripControl(block)).slice(0, 30);

    try {
      const submitTask = (async () => {
        const { data: existing, error: checkErr } = await supabase
          .from(TABLE)
          .select("id")
          .eq("id_number", cleanId)
          .limit(1);

        if (checkErr) throw checkErr;
        if (existing && existing.length > 0) {
          const dupErr: any = new Error("duplicate-id");
          dupErr.code = "23505";
          throw dupErr;
        }

        return await supabase.from(TABLE).insert([{
          full_name: cleanName,
          email: cleanEmail,
          contact_number: cleanPhone,
          id_number: cleanId,
          college: collegeMeta.id,
          college_name: collegeMeta.name,
          program: validProgram.label,
          year_level: yearLevel,
          block: cleanBlock,
          status: "pre_registered",
        }]).select("id").single();
      })();

      const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error("timeout")), 10000));
      const { data, error } = (await Promise.race([submitTask, timeout])) as any;
      if (error) throw error;

      try { sessionStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch {}
      clearDraft();
      router.push(`/cast-seminar/confirm/${data.id}`);
    } catch (err: any) {
      if (err?.message === "duplicate-id" || err?.code === "23505") {
        setIdError("This ID number is already registered.");
        setSubmitError("This ID number is already registered.");
      } else {
        setSubmitError("Something went wrong. Check your connection and try again.");
      }
      setIsSubmitting(false);
      submitLock.current = false;
    }
  };

  /* ── Shared field groups (used by both layouts) ── */
  const detailsFields = (f = false) => (
    <>
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label>
          Website
          <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={e => setHoneypot(e.target.value)} />
        </label>
      </div>
      <Field className="cs-full" label="Full name" error={vis("fullName", f)}>
        <input className={cls("fullName", f)} maxLength={100} value={fullName} onChange={e => setFullName(e.target.value)} onBlur={() => touch("fullName")} placeholder="Juan Dela Cruz" autoComplete="name" />
      </Field>
      <Field label="Email address" error={vis("email", f)}>
        <input className={cls("email", f)} type="email" inputMode="email" maxLength={120} value={email} onChange={e => setEmail(e.target.value)} onBlur={() => touch("email")} placeholder="juan.delacruz@dlsau.edu.ph" autoComplete="email" />
      </Field>
      <Field label="Contact number" error={vis("contactNumber", f)}>
        <input className={cls("contactNumber", f)} type="tel" inputMode="tel" maxLength={13} value={contactNumber} onChange={e => setContactNumber(e.target.value.replace(/[^\d+]/g, "").slice(0, 13))} onBlur={() => touch("contactNumber")} placeholder="09171234567" autoComplete="tel" />
      </Field>
    </>
  );

  const idField = (f = false) => (
    <Field className="cs-full" label="ID number (20XX-XX-XXXXXX)" error={idChecking ? null : vis("idNumber", f)}
      hint={idChecking ? <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: "#777", ...mono }}>Checking if it&apos;s registered...</span>
        : idOk ? <span style={{ display: "block", marginTop: "0.4rem", fontSize: "0.75rem", color: GREEN, ...mono }}>ID is available.</span> : null}>
      <input className={`${cls("idNumber", f)}${idOk ? " ok" : ""}`} style={{ ...mono }} inputMode="numeric" value={idNumber} onChange={handleId} onBlur={() => touch("idNumber")} placeholder="2026-00-000000" autoComplete="off" />
    </Field>
  );

  const collegeFields = (f = false) => (
    <Group className="cs-full" label="College" error={vis("college", f)}>
      <div className="cs-colleges">
        {COLLEGES.map(c => {
          const active = college === c.id;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => {
                if (college !== c.id) {
                  setCollege(c.id);
                  setProgram("");
                  setYearLevel("");
                }
                touch("college");
              }}
              className={`cs-college-card${vis("college", f) ? " bad" : ""}`}
              style={{
                borderColor: active ? c.color : undefined,
                background: active ? `rgba(${hexRgb(c.color)}, 0.07)` : undefined,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
                <div>
                  <span style={{ ...dg, fontSize: "1rem", color: DARK, display: "block" }}>{c.id}</span>
                  <span style={{ ...ss, fontSize: "0.8rem", color: "#666", fontWeight: 300, lineHeight: 1.4, display: "block", marginTop: "0.2rem" }}>
                    {c.name}
                  </span>
                </div>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    flexShrink: 0,
                    border: `2px solid ${active ? c.color : "rgba(17,17,17,0.25)"}`,
                    background: active ? c.color : "transparent",
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </Group>
  );

  const academicFields = (f = false) => (
    <>
      <Group className="cs-full" label="Program" error={vis("program", f)}>
        {!college ? (
          <div style={{ ...ss, fontSize: "0.9rem", color: "#888", padding: "0.85rem 1rem", borderRadius: 4, border: "1px dashed rgba(17,17,17,0.18)", background: "rgba(17,17,17,0.02)" }}>
            Select your college first to view available programs.
          </div>
        ) : (
          <div className="cs-choices prog">
            {availablePrograms.map(p => (
              <button key={p.id} type="button" role="radio" aria-checked={program === p.id}
                className={`cs-tile prog${vis("program", f) ? " bad" : ""}`}
                onClick={() => {
                  setProgram(p.id);
                  if (yearLevel && !getYearLevelsForProgram(p.id).includes(yearLevel)) {
                    setYearLevel("");
                  }
                  touch("program");
                }}>
                <span>{p.label}</span><span className="short">{p.short}</span>
              </button>
            ))}
          </div>
        )}
      </Group>
      <Group className="cs-full" label="Year level" error={vis("yearLevel", f)}>
        <div className="cs-choices year">
          {availableYears.map(y => (
            <button key={y} type="button" role="radio" aria-checked={yearLevel === y} disabled={!program}
              className={`cs-tile year${vis("yearLevel", f) ? " bad" : ""}`}
              onClick={() => { setYearLevel(y); touch("yearLevel"); }}>{y}</button>
          ))}
        </div>
      </Group>
      <Field className="cs-full" label="Block / Section" error={vis("block", f)}>
        <input className={cls("block", f)} maxLength={30} value={block} onChange={e => setBlock(e.target.value)} onBlur={() => touch("block")} placeholder="e.g. 1st Year A" />
      </Field>
    </>
  );

  if (isMobile === null) return null;

  /* ═══════════════ MOBILE: stepper ═══════════════ */
  if (isMobile) {
    const force = attempted || !!touched[`step${step}`];
    const goNext = () => {
      setTouched(t => ({ ...t, [`step${step}`]: true }));
      if (stepInvalid[step]) {
        setShake(true); setTimeout(() => setShake(false), 400);
        return;
      }
      if (step < TOTAL_STEPS - 1) setStep(s => s + 1);
      else submit();
    };
    const titles = [
      ["Your Details", "Let's start with the basics to reserve your slot for Rizal Hall (Oct 8, 12:30 PM)."],
      ["Student ID", "Double-check this. It's linked to your QR code."],
      ["Which College?", "Open to all DLSAU students — pick where you're enrolled."],
      ["Academic Info", "Program, year level, and block."],
    ];
    return (
      <div className="cs-page" style={{ paddingTop: `calc(${HEADER_H} + env(safe-area-inset-top))` }}>
        <div aria-hidden style={{ position: "fixed", top: 0, left: 0, right: 0, height: `calc(${HEADER_H} + env(safe-area-inset-top))`, background: CREAM, zIndex: 19, pointerEvents: "none" }} />

        <div className="cs-m">
          <div className="cs-mbar" style={{ position: "sticky", top: `calc(${HEADER_H} + env(safe-area-inset-top))`, zIndex: 20, background: CREAM }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem clamp(1rem, 4vw, 1.5rem)" }}>
              <button type="button" className="cs-round" aria-label="Go back" onClick={() => (step > 0 ? setStep(s => s - 1) : router.push("/register"))}
                style={{ width: 36, height: 36, borderRadius: "50%", border: "none", background: "rgba(17,17,17,0.06)", color: DARK, fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                ‹
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...mono, display: "block", fontSize: "clamp(0.5rem, 2.2vw, 0.58rem)", letterSpacing: "0.24em", textTransform: "uppercase", color: accent, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  CAST · Rizal Hall · Oct 8, 12:30 PM
                </span>
                <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  <span style={{ ...dg, fontSize: "clamp(0.88rem, 3.6vw, 1rem)", letterSpacing: "-0.02em", color: DARK }}>SEMINAR</span>
                  <span style={{ ...ss, fontStyle: "italic", fontWeight: 300, fontSize: "clamp(0.82rem, 3.4vw, 0.95rem)", color: accent }}>registration</span>
                </div>
              </div>
              <span style={{ ...mono, fontSize: "clamp(0.6rem, 2.5vw, 0.68rem)", letterSpacing: "0.12em", color: DARK, background: "rgba(17,17,17,0.05)", padding: "0.3rem 0.55rem", borderRadius: 4, flexShrink: 0 }}>
                0{step + 1}/0{TOTAL_STEPS}
              </span>
            </div>
            <div className="cs-track" style={{ borderRadius: 0, height: 3 }}>
              <div className="cs-fill" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%`, background: accent }} />
            </div>
          </div>

          <form ref={formRef} noValidate onSubmit={e => { e.preventDefault(); goNext(); }} style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div key={step} className={`cs-step${shake ? " shake" : ""}`} style={{ flex: 1, padding: "clamp(1.25rem, 4vw, 1.75rem) clamp(1.1rem, 4.5vw, 1.75rem) 2rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem", marginBottom: "0.55rem" }}>
                <span style={{ display: "block", height: 1, width: "1.75rem", background: accent, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "clamp(0.55rem, 2.3vw, 0.62rem)", letterSpacing: "0.3em", textTransform: "uppercase", color: accent }}>
                  Step 0{step + 1} of 0{TOTAL_STEPS}
                </span>
              </div>

              {draftRestored && step === 0 && (
                <div role="status" style={{ ...ss, marginBottom: "1.25rem", padding: "0.7rem 0.9rem", background: "#fff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 6, fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem" }}>
                  <span><strong>Draft restored.</strong></span>
                  <button type="button" onClick={discardDraft} style={{ ...mono, background: "none", border: "none", color: RED, fontSize: "0.72rem", minHeight: 36 }}>Start over</button>
                </div>
              )}

              <h1 style={{ ...dg, fontSize: "clamp(1.3rem, 5.5vw, 1.6rem)", margin: "0 0 0.35rem", lineHeight: 1.1 }}>{titles[step][0]}</h1>
              <p style={{ ...ss, fontSize: "clamp(0.82rem, 3.4vw, 0.92rem)", color: "#777", fontWeight: 300, margin: "0 0 1.5rem" }}>{titles[step][1]}</p>

              <div className="cs-grid" style={{ gridTemplateColumns: "minmax(0,1fr)" }}>
                {step === 0 && detailsFields(force)}
                {step === 1 && idField(force)}
                {step === 2 && collegeFields(force)}
                {step === 3 && academicFields(force)}
              </div>
              {submitError && step === TOTAL_STEPS - 1 && <p role="alert" style={{ ...mono, fontSize: "0.78rem", color: RED, marginTop: "1rem" }}>{submitError}</p>}
            </div>

            <div className="cs-mfoot">
              <button type="submit" className="cs-submit" disabled={isSubmitting || idChecking}
                style={{ width: "100%", background: stepInvalid[step] ? "rgba(17,17,17,0.55)" : DARK, cursor: isSubmitting || idChecking ? "not-allowed" : "pointer" }}>
                {isSubmitting ? "Registering..." : step === TOTAL_STEPS - 1 ? "Get my QR code" : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ═══════════════ DESKTOP / TABLET: long form ═══════════════ */
  return (
    <div className="cs-page">
      <div aria-hidden style={{ position: "fixed", top: 0, left: 0, right: 0, height: `calc(${HEADER_H} + env(safe-area-inset-top))`, background: CREAM, zIndex: 19, pointerEvents: "none" }} />
      <form ref={formRef} noValidate onSubmit={e => { e.preventDefault(); submit(); }} className="cs-shell">
        <aside className="cs-aside">
          <button type="button" className="cs-back" onClick={() => router.push("/register")}>← Back</button>
          <div style={{ borderLeft: `4px solid ${accent}`, paddingLeft: "1.1rem", minWidth: 0, transition: "border-color 0.25s ease" }}>
            <p style={{ ...mono, fontSize: "0.68rem", letterSpacing: "0.14em", color: accent, margin: 0, textTransform: "uppercase" }}>CAST Seminar · Rizal Hall · October 8, 12:30 PM</p>
            <h1 className="cs-h1">Suicide Prevention Month Seminar</h1>
          </div>
          <p style={{ ...ss, fontWeight: 300, lineHeight: 1.7, color: "rgba(17,17,17,0.65)", maxWidth: "34rem", margin: 0 }}>
            Open to students from all colleges. Join us at <strong>Rizal Hall</strong> on <strong>October 8 at 12:30 PM</strong>. Register to get your seminar QR code — show it at the door to check in and check out.
          </p>
          <ol className="cs-steps">
            {STEPS.map((s, i) => (
              <li key={s.t} style={{ display: "grid", gridTemplateColumns: "2rem 1fr", gap: "0.75rem", alignItems: "start" }}>
                <span style={{ ...mono, fontSize: "0.75rem", width: "1.7rem", height: "1.7rem", borderRadius: "50%", border: `1px solid ${DARK}`, display: "grid", placeItems: "center" }}>{i + 1}</span>
                <div>
                  <div style={{ ...ss, fontWeight: 600 }}>{s.t}</div>
                  <div style={{ ...ss, fontWeight: 300, fontSize: "0.9rem", color: "rgba(17,17,17,.65)", lineHeight: 1.5 }}>{s.d}</div>
                </div>
              </li>
            ))}
          </ol>
          <div className="cs-meter-d"><Meter done={doneCount} total={keys.length} color={accent} /></div>
        </aside>

        <div style={{ minWidth: 0 }}>
          {draftRestored && (
            <div role="status" style={{ ...ss, marginBottom: "1rem", padding: "0.8rem 1rem", background: "#fff", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 6, fontSize: "0.88rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span><strong>Draft restored.</strong> Your progress was saved automatically.</span>
              <button type="button" onClick={discardDraft} style={{ ...mono, background: "none", border: "none", color: RED, cursor: "pointer", fontSize: "0.72rem", minHeight: 36 }}>Start over</button>
            </div>
          )}
          <div className="cs-card">
            <section className="cs-section">
              <SectionTitle title="01 · Your details" note="We'll use these to contact you about the seminar." />
              <div className="cs-grid">{detailsFields()}</div>
            </section>
            <section className="cs-section">
              <SectionTitle title="02 · Student ID" note="Permanently linked to your QR code. It can't be changed after submission." />
              <div className="cs-grid">{idField()}</div>
            </section>
            <section className="cs-section">
              <SectionTitle title="03 · Select college" note="Open to all DLSAU colleges." />
              <div className="cs-grid">{collegeFields()}</div>
            </section>
            <section className="cs-section">
              <SectionTitle title="04 · Program & year" />
              <div className="cs-grid">{academicFields()}</div>
            </section>

            {submitError && <p role="alert" style={{ ...mono, fontSize: "0.78rem", color: RED, margin: 0 }}>{submitError}</p>}
            <button type="submit" className="cs-submit" disabled={isSubmitting || idChecking}
              style={{ width: "100%", background: canSubmit ? DARK : "rgba(17,17,17,0.55)", cursor: isSubmitting || idChecking ? "not-allowed" : "pointer" }}>
              {isSubmitting ? "Registering..." : "Get my QR code"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}