"use client";

import { useEffect, useState } from "react";
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

/* desktop hover states */
.lyv-college:hover, .lyv-committee:hover { border-color: rgba(17,17,17,0.35); }
.lyv-college { transition: background 0.35s ease, border-color 0.35s ease, transform 0.35s ease; cursor: pointer; }
.lyv-committee, .lyv-sub, .lyv-option { transition: background 0.2s ease, border-color 0.2s ease; cursor: pointer; }

/* touch press states (only meaningfully trigger on touch devices) */
.lyv-college:active, .lyv-committee:active, .lyv-sub:active, .lyv-option:active, .lyv-btn:active {
  transform: scale(0.98);
}
.lyv-btn { transition: background 0.15s ease, transform 0.1s ease; }

.lyv-input, .lyv-textarea, .lyv-select {
  font-size: 16px; /* stops iOS Safari auto-zoom-on-focus */
  transition: border-color 0.25s ease, background 0.25s ease;
  -webkit-appearance: none;
  appearance: none;
}
.lyv-input:focus, .lyv-textarea:focus, .lyv-select:focus {
  outline: none;
  border-color: #16a34a !important;
  background: rgba(22,163,74,0.04) !important;
}

.lyv-chevron { transition: transform 0.3s ease; }
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const colleges = [
  { id: "CAST",  name: "College of Arts, Science, and Technology", color: "#dc2626" },
  { id: "CBMA",  name: "College of Business Management & Accountancy", color: "#ca8a04" },
  { id: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#16a34a" },
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
  const GREEN = "#16a34a";
  const accent = colleges.find(c => c.id === college)?.color ?? GREEN;

  const canSubmit = !!(name && email && college && program && yearLevel && committee && description.trim().length > 0);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSubmit || submitting || honeypot) return;
    setSubmitting(true);

    const { error } = await supabase.from("lyv_applications").insert([{
      name,
      email,
      program: college ? programsByCollege[college].find(p => p.id === program)?.label : null,
      year_level: yearLevel,
      college,
      committee,
      description,
    }]);

    setSubmitting(false);
    if (error) {
      console.error("Submission failed:", error.message);
      alert("Something went wrong. Please try again.");
      return;
    }
    setSubmitted(true);
  }

  const inputStyle = {
    width: "100%",
    background: "rgba(17,17,17,0.03)",
    border: "1.5px solid rgba(17,17,17,0.15)",
    borderRadius: 6,
    padding: "0.9rem 1rem",
    color: DARK,
    ...ss,
  };

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
    const stepValid = [
      name.trim() && email.trim(),
      !!college,
      !!program && !!yearLevel,
      !!committee,
      description.trim().length > 0,
    ][step];

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

          <div key={step} className="lyv-step" style={{ flex: 1, padding: "1.75rem 1.1rem 2rem", overflowY: "auto" }}>
            {honeypotField}

            {step === 0 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Who's applying?</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Let's start with the basics.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Full name</span>
                    <input className="lyv-input" style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" autoFocus />
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Email</span>
                    <input className="lyv-input" style={inputStyle} type="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan.delacruz@dlsau.edu.ph" />
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
                    <div key={c.id} className="lyv-option" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); }}
                      style={{ padding: "1rem 1.1rem", borderRadius: 10, border: `1.5px solid ${college === c.id ? c.color : "rgba(17,17,17,0.13)"}`, background: college === c.id ? `rgba(${hexRgb(c.color)},0.07)` : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div>
                          <span style={{ ...dg, fontSize: "1rem", display: "block" }}>{c.id}</span>
                          <span style={{ ...ss, fontSize: "0.78rem", color: "#666", fontWeight: 300 }}>{c.name}</span>
                        </div>
                        <span style={{ width: 18, height: 18, borderRadius: "50%", flexShrink: 0, marginLeft: "0.75rem", border: `2px solid ${college === c.id ? c.color : "rgba(17,17,17,0.25)"}`, background: college === c.id ? c.color : "transparent" }} />
                      </div>
                    </div>
                  ))}
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
                    <select className="lyv-select" style={inputStyle} value={program ?? ""} onChange={e => { setProgram(e.target.value || null); setYearLevel(null); }}>
                      <option value="" disabled>Select program</option>
                      {college && programsByCollege[college].map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </label>
                  <label>
                    <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "#888", display: "block", marginBottom: "0.5rem" }}>Year level</span>
                    <select className="lyv-select" style={inputStyle} value={yearLevel ?? ""} onChange={e => setYearLevel(e.target.value || null)} disabled={!program}>
                      <option value="" disabled>{program ? "Select year" : "Pick a program first"}</option>
                      {program && college && Array.from({ length: programsByCollege[college].find(p => p.id === program)!.years }, (_, i) => i + 1)
                        .map(y => <option key={y} value={y}>{`Year ${y}`}</option>)}
                    </select>
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
                    <div key={c.id} className="lyv-committee" onClick={() => setCommittee(c.id)}
                      style={{ padding: "1rem 1.1rem", borderRadius: 10, border: `1.5px solid ${committee === c.id ? accent : "rgba(17,17,17,0.13)"}`, background: committee === c.id ? `rgba(${hexRgb(accent)},0.07)` : "transparent" }}>
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
                    style={{ padding: "1rem 1.1rem", borderRadius: 10, border: `1.5px solid ${committee?.startsWith("multimedia") ? accent : "rgba(17,17,17,0.13)"}`, background: committee?.startsWith("multimedia") ? `rgba(${hexRgb(accent)},0.07)` : "transparent" }}>
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
                          <div key={m.id} className="lyv-sub" onClick={e => { e.stopPropagation(); setCommittee(m.id); }}
                            style={{ padding: "0.85rem 1rem", borderRadius: 8, border: `1.5px solid ${committee === m.id ? accent : "rgba(17,17,17,0.12)"}`, background: committee === m.id ? `rgba(${hexRgb(accent)},0.08)` : "rgba(17,17,17,0.02)" }}>
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
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 style={{ ...dg, fontSize: "1.5rem", marginBottom: "0.4rem" }}>Tell us about you</h2>
                <p style={{ ...ss, fontSize: "0.85rem", color: "#777", fontWeight: 300, marginBottom: "1.75rem" }}>Skills, experience, or why this committee.</p>
                <textarea className="lyv-textarea" style={{ ...inputStyle, minHeight: "160px", resize: "vertical" }}
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. I've handled event photography for two campus orgs..." autoFocus />
              </>
            )}
          </div>

          <div style={{ position: "sticky", bottom: 0, background: CREAM, borderTop: "1px solid rgba(17,17,17,0.08)", padding: "0.85rem 1.1rem", paddingBottom: "calc(0.85rem + env(safe-area-inset-bottom))" }}>
            <button className="lyv-btn" disabled={!stepValid || submitting}
              onClick={() => { if (!stepValid) return; step < TOTAL_STEPS - 1 ? setStep(s => s + 1) : handleSubmit(); }}
              style={{ ...mono, width: "100%", fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "1rem", borderRadius: 10, border: "none", background: stepValid ? DARK : "rgba(17,17,17,0.25)", color: CREAM, minHeight: 48 }}>
              {submitting ? "Submitting…" : step === TOTAL_STEPS - 1 ? "Submit application" : "Continue"}
            </button>
          </div>
        </div>
        
        {/* Make sure footer comes last in the stack */}
        <Footer />
      </div>
    );
  }

  /* ═══════════════════════════ DESKTOP: original long-scroll form ═══════════════════════════ */
  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>
      <Navbar />

      <section style={{
        minHeight: "70vh", background: DARK, color: CREAM,
        display: "flex", flexDirection: "column", justifyContent: "center",
        position: "relative", overflow: "hidden",
        padding: "clamp(6rem, 12vw, 8rem) clamp(2rem, 5vw, 5.5rem) 3rem",
      }}>
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", pointerEvents: "none" }}>
          <span style={{ ...dg, fontSize: "clamp(6rem, 22vw, 20rem)", color: "transparent", WebkitTextStroke: "1px rgba(255,255,255,0.04)", letterSpacing: "-0.04em", lineHeight: 0.85, whiteSpace: "nowrap" }}>LYV</span>
        </div>
        <div style={{ position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
            <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>Volunteer Intake</span>
          </div>
          <h1 style={{ margin: 0 }}>
            <span style={{ ...dg, display: "block", fontSize: "clamp(3rem, 10vw, 8rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: CREAM }}>LYV</span>
            <span style={{ ...ss, display: "block", fontSize: "clamp(2.2rem, 7vw, 5.5rem)", lineHeight: 0.95, fontStyle: "italic", fontWeight: 300, color: GREEN, paddingLeft: "clamp(0.3rem, 3vw, 3rem)", marginTop: "0.4rem" }}>application</span>
          </h1>
          <p style={{ ...ss, marginTop: "2.5rem", marginLeft: "clamp(0.3rem, 3vw, 3rem)", maxWidth: "34rem", fontSize: "1rem", lineHeight: 1.8, color: "rgba(244,239,230,0.5)", fontWeight: 300 }}>
            Pick your college, choose the committee where you want to serve, and tell us why. One form, every branch of the council.
          </p>
        </div>
      </section>

      <form onSubmit={handleSubmit} style={{ padding: "4.5rem clamp(2rem, 5vw, 5.5rem) 6rem" }}>
        {honeypotField}

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="01" title="Applicant Info" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Full name" mono={mono}>
              <input className="lyv-input" style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Juan Dela Cruz" required />
            </Field>
            <Field label="Email address" mono={mono}>
              <input className="lyv-input" style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="juan.delacruz@dlsau.edu.ph" required />
            </Field>
          </div>
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="02" title="Select College" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginTop: "1.5rem" }}>
            {colleges.map(c => {
              const active = college === c.id;
              return (
                <div key={c.id} className="lyv-college" onClick={() => { setCollege(c.id); setProgram(null); setYearLevel(null); }}
                  style={{ padding: "1.5rem", border: `1.5px solid ${active ? c.color : "rgba(17,17,17,0.15)"}`, background: active ? `rgba(${hexRgb(c.color)},0.07)` : "transparent", borderRadius: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.6rem" }}>
                    <span style={{ ...dg, fontSize: "1.1rem", color: DARK }}>{c.id}</span>
                    <span style={{ display: "block", width: 14, height: 14, borderRadius: "50%", border: `2px solid ${active ? c.color : "rgba(17,17,17,0.25)"}`, background: active ? c.color : "transparent" }} />
                  </div>
                  <p style={{ ...ss, fontSize: "0.82rem", color: "#666", lineHeight: 1.5, fontWeight: 300 }}>{c.name}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="03" title="Program & Year" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem", marginTop: "1.5rem" }}>
            <Field label="Program" mono={mono}>
              <select className="lyv-select" style={inputStyle} value={program ?? ""} onChange={e => { setProgram(e.target.value || null); setYearLevel(null); }} disabled={!college} required>
                <option value="" disabled>{college ? "Select program" : "Select a college first"}</option>
                {college && programsByCollege[college].map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </Field>
            <Field label="Year Level" mono={mono}>
              <select className="lyv-select" style={inputStyle} value={yearLevel ?? ""} onChange={e => setYearLevel(e.target.value || null)} disabled={!program} required>
                <option value="" disabled>{program ? "Select year" : "Select a program first"}</option>
                {program && college && Array.from({ length: programsByCollege[college].find(p => p.id === program)!.years }, (_, i) => i + 1)
                  .map(y => <option key={y} value={y}>{`Year ${y}`}</option>)}
              </select>
            </Field>
          </div>
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="04" title="Select Committee" />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1.5rem" }}>
            {committees.map(c => (
              <CommitteeRow key={c.id} active={committee === c.id} label={c.label} desc={c.desc} onClick={() => setCommittee(c.id)} dg={dg} ss={ss} color={accent} />
            ))}
            <div className="lyv-committee" onClick={() => setMultimediaOpen(o => !o)}
              style={{ padding: "1.1rem 1.3rem", border: `1.5px solid ${committee?.startsWith("multimedia") ? accent : "rgba(17,17,17,0.15)"}`, borderRadius: 4, background: committee?.startsWith("multimedia") ? `rgba(${hexRgb(accent)},0.05)` : "transparent" }}>
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
                    <div key={m.id} className="lyv-sub" onClick={e => { e.stopPropagation(); setCommittee(m.id); }}
                      style={{ padding: "0.85rem 1rem", border: `1.5px solid ${committee === m.id ? accent : "rgba(17,17,17,0.12)"}`, borderRadius: 4, background: committee === m.id ? `rgba(${hexRgb(accent)},0.08)` : "rgba(17,17,17,0.02)" }}>
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
        </div>

        <div className="lyv-reveal" style={{ marginBottom: "3.5rem" }}>
          <SectionLabel mono={mono} green={GREEN} step="05" title="Tell Us About Your Work" />
          <p style={{ ...ss, fontSize: "0.85rem", color: "#666", fontWeight: 300, marginTop: "0.75rem", marginBottom: "1rem", maxWidth: "36rem" }}>
            Briefly describe relevant experience, skills, or why you want to serve in this committee.
          </p>
          <textarea className="lyv-textarea" style={{ ...inputStyle, minHeight: "140px", resize: "vertical" }}
            value={description} onChange={e => setDescription(e.target.value)}
            placeholder="e.g. I've handled event photography for two campus orgs and want to bring that to LYV's Documentation team..." required />
        </div>

        <div className="lyv-reveal">
          <button type="submit" disabled={!canSubmit || submitting}
            style={{ ...mono, fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", padding: "1rem 2.5rem", borderRadius: 4, border: "none", background: canSubmit ? DARK : "rgba(17,17,17,0.25)", color: CREAM, cursor: canSubmit && !submitting ? "pointer" : "not-allowed", transition: "background 0.25s ease" }}>
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
      style={{ padding: "1.1rem 1.3rem", borderRadius: 4, border: `1.5px solid ${active ? color : "rgba(17,17,17,0.15)"}`, background: active ? `rgba(${hexRgb(color)},0.05)` : "transparent" }}>
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