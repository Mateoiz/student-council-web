"use client";

import { useState, useCallback, memo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Calculator,
  Eraser,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  X,
  Star,
  Medal,
  ChevronDown,
} from "lucide-react";

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const CREAM = "#F4EFE6";
const DARK  = "#111111";
const GREEN = "#005c00";

/* ─── Injected CSS ──────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

@keyframes dlsau-reveal-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0);    }
}
.dlsau-reveal { opacity: 0; }
.dlsau-reveal.in-view {
  animation: dlsau-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.tools-input:focus {
  outline: none;
  border-color: ${GREEN};
  box-shadow: 0 0 0 3px rgba(0,92,0,0.08);
}

.tools-chevron { transition: transform 0.22s ease; }
.tools-chevron.open { transform: rotate(180deg); }

.tools-breakdown-cell + .tools-breakdown-cell {
  border-left: 1px solid rgba(17,17,17,0.08);
}
`;

/* ─── Font shorthand objects ────────────────────────────────────────────── */
const dg   = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss   = { fontFamily: "'Source Serif 4', serif" }       as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" }    as const;

/* ─── GPA logic ─────────────────────────────────────────────────────────── */
const getGpaFromScore = (score: number, program: string): number => {
  if (program === "BSA") {
    if (score >= 98) return 4.0; if (score >= 95) return 3.5;
    if (score >= 91) return 3.0; if (score >= 87) return 2.5;
    if (score >= 82) return 2.0; if (score >= 77) return 1.5;
    if (score >= 72) return 1.0; return 0.0;
  }
  if (program === "DVM") {
    if (score >= 97) return 4.0; if (score >= 93) return 3.5;
    if (score >= 89) return 3.0; if (score >= 85) return 2.5;
    if (score >= 80) return 2.0; if (score >= 75) return 1.5;
    if (score >= 70) return 1.0; return 0.0;
  }
  if (score >= 97) return 4.0; if (score >= 91) return 3.5;
  if (score >= 85) return 3.0; if (score >= 78) return 2.5;
  if (score >= 72) return 2.0; if (score >= 66) return 1.5;
  if (score >= 60) return 1.0; return 0.0;
};

const gpaDescriptor = (gpa: number): string => {
  if (gpa >= 4.0) return "Excellent";  if (gpa >= 3.5) return "Superior";
  if (gpa >= 3.0) return "Very Good";  if (gpa >= 2.5) return "Good";
  if (gpa >= 2.0) return "Satisfactory"; if (gpa >= 1.5) return "Fair";
  if (gpa >= 1.0) return "Passed";     return "Failed";
};

const getDeansList = (gpa: number): string | null => {
  if (gpa >= 3.7) return "With Highest Honors";
  if (gpa >= 3.4) return "With High Honors";
  if (gpa >= 3.0) return "With Honors";
  return null;
};

/* ─── Data structures ───────────────────────────────────────────────────── */
interface RowState { raw: string; total: string; weight: string; }

const EMPTY_ROWS = (): Record<string, RowState> => ({
  midterms:      { raw: "", total: "100", weight: "30" },
  finals:        { raw: "", total: "100", weight: "30" },
  finalProduct:  { raw: "", total: "100", weight: "20" },
  classStanding: { raw: "", total: "N/A", weight: "20" },
});

const PROGRAMS = ["Standard", "BSA", "DVM"] as const;
type Program = (typeof PROGRAMS)[number];

const PROGRAM_LABELS: Record<Program, string> = {
  Standard: "Standard", BSA: "BS Accountancy", DVM: "Vet. Medicine",
};

const GRADE_TABLES: Record<Program, { range: string; gpa: string; desc: string }[]> = {
  Standard: [
    { range: "97–100%", gpa: "4.0", desc: "Excellent" },
    { range: "91–96%",  gpa: "3.5", desc: "Superior" },
    { range: "85–90%",  gpa: "3.0", desc: "Very Good" },
    { range: "78–84%",  gpa: "2.5", desc: "Good" },
    { range: "72–77%",  gpa: "2.0", desc: "Satisfactory" },
    { range: "66–71%",  gpa: "1.5", desc: "Fair" },
    { range: "60–65%",  gpa: "1.0", desc: "Passed" },
    { range: "Below 60%", gpa: "0.0", desc: "Failed" },
  ],
  BSA: [
    { range: "98–100%", gpa: "4.0", desc: "Excellent" },
    { range: "95–97%",  gpa: "3.5", desc: "Superior" },
    { range: "91–94%",  gpa: "3.0", desc: "Very Good" },
    { range: "87–90%",  gpa: "2.5", desc: "Good" },
    { range: "82–86%",  gpa: "2.0", desc: "Satisfactory" },
    { range: "77–81%",  gpa: "1.5", desc: "Fair" },
    { range: "72–76%",  gpa: "1.0", desc: "Passed" },
    { range: "Below 72%", gpa: "0.0", desc: "Failed" },
  ],
  DVM: [
    { range: "97–100%", gpa: "4.0", desc: "Excellent" },
    { range: "93–96%",  gpa: "3.5", desc: "Superior" },
    { range: "89–92%",  gpa: "3.0", desc: "Very Good" },
    { range: "85–88%",  gpa: "2.5", desc: "Good" },
    { range: "80–84%",  gpa: "2.0", desc: "Satisfactory" },
    { range: "75–79%",  gpa: "1.5", desc: "Fair" },
    { range: "70–74%",  gpa: "1.0", desc: "Passed" },
    { range: "Below 70%", gpa: "0.0", desc: "Failed" },
  ],
};

/* ─── GradeRow Component ────────────────────────────────────────────────── */
const GradeRow = memo(({ label, sublabel, values, setValues, type }: {
  label: string; sublabel: string;
  values: RowState; setValues: (v: RowState) => void;
  type: "exam" | "direct";
}) => (
  <div style={{
    display: "grid", gridTemplateColumns: "1fr auto auto auto",
    gap: "0.75rem", alignItems: "center",
    padding: "1rem 0",
    borderBottom: "1px solid rgba(17,17,17,0.07)",
  }}>
    <div>
      <p style={{ ...ss, fontSize: "0.875rem", fontWeight: 600, color: DARK, margin: 0, lineHeight: 1.2 }}>{label}</p>
      <p style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(17,17,17,0.38)", margin: "0.2rem 0 0" }}>{sublabel}</p>
    </div>
    <input
      type="number" placeholder="0" min="0" step="any"
      value={values.raw}
      onChange={e => setValues({ ...values, raw: e.target.value })}
      className="tools-input"
      style={{
        ...mono, width: "4.5rem", padding: "0.5rem",
        textAlign: "center", fontSize: "0.875rem", fontWeight: 500,
        background: CREAM, border: "1px solid rgba(17,17,17,0.15)",
        borderRadius: "4px", color: DARK, transition: "border-color 0.2s, box-shadow 0.2s",
      }}
    />
    {type === "exam" ? (
      <input
        type="number" placeholder="100" min="0" step="any"
        value={values.total}
        onChange={e => setValues({ ...values, total: e.target.value })}
        className="tools-input"
        style={{
          ...mono, width: "4.5rem", padding: "0.5rem",
          textAlign: "center", fontSize: "0.875rem",
          background: CREAM, border: "1px solid rgba(17,17,17,0.15)",
          borderRadius: "4px", color: "rgba(17,17,17,0.5)", transition: "border-color 0.2s, box-shadow 0.2s",
        }}
      />
    ) : (
      <div style={{
        ...mono, width: "4.5rem", padding: "0.5rem",
        textAlign: "center", fontSize: "0.45rem", letterSpacing: "0.1em",
        textTransform: "uppercase", color: "rgba(17,17,17,0.3)",
        background: "rgba(17,17,17,0.04)", borderRadius: "4px", userSelect: "none",
      }}>
        Max 20
      </div>
    )}
    <div style={{ width: "3rem", padding: "0.5rem 0", textAlign: "center", background: "rgba(0,92,0,0.08)", borderRadius: "4px" }}>
      <span style={{ ...mono, fontSize: "0.6rem", fontWeight: 500, color: GREEN }}>{values.weight}%</span>
    </div>
  </div>
));
GradeRow.displayName = "GradeRow";

/* ─── Grade Reference Component ─────────────────────────────────────────── */
function GradeReference({ program }: { program: Program }) {
  const [open, setOpen] = useState(false);
  const table = GRADE_TABLES[program];

  return (
    <div style={{ marginTop: "1.5rem", border: "1px solid rgba(17,17,17,0.1)", borderRadius: "4px", overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0.875rem 1.25rem", background: "rgba(17,17,17,0.03)", border: "none", cursor: "pointer",
        }}
      >
        <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(17,17,17,0.45)" }}>
          Grade Reference — {PROGRAM_LABELS[program]}
        </span>
        <ChevronDown size={12} className={`tools-chevron${open ? " open" : ""}`} style={{ color: "rgba(17,17,17,0.35)", flexShrink: 0 }} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.5rem", marginBottom: "0.5rem", padding: "0 0.25rem" }}>
                {["Range", "GPA", "Descriptor"].map(h => (
                  <span key={h} style={{ ...mono, fontSize: "0.45rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(17,17,17,0.35)", textAlign: h !== "Range" ? "center" : "left" }}>{h}</span>
                ))}
              </div>
              {table.map((row, i) => (
                <div key={row.gpa} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0.5rem", padding: "0.5rem 0.25rem", background: i % 2 === 0 ? "rgba(17,17,17,0.025)" : "transparent", borderRadius: "2px" }}>
                  <span style={{ ...mono, fontSize: "0.7rem", color: "rgba(17,17,17,0.55)" }}>{row.range}</span>
                  <span style={{ ...mono, fontSize: "0.7rem", fontWeight: 500, color: GREEN, textAlign: "center", minWidth: "2.5rem" }}>{row.gpa}</span>
                  <span style={{ ...ss, fontSize: "0.72rem", color: "rgba(17,17,17,0.45)", textAlign: "right", minWidth: "5.5rem" }}>{row.desc}</span>
                </div>
              ))}
              
              {/* Dean's List */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                <p style={{ ...mono, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(17,17,17,0.35)", marginBottom: "0.6rem" }}>
                  Dean's List · Sec. 3.2.9
                </p>
                {[
                  { label: "With Highest Honors", range: "3.70 – 4.00" },
                  { label: "With High Honors",    range: "3.40 – 3.69" },
                  { label: "With Honors",         range: "3.00 – 3.39" },
                ].map((h, i) => (
                  <div key={h.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.4rem 0.25rem", background: i % 2 === 0 ? "rgba(17,17,17,0.025)" : "transparent", borderRadius: "2px" }}>
                    <span style={{ ...ss, fontSize: "0.78rem", color: "rgba(17,17,17,0.55)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Star size={8} style={{ color: "#b45309", flexShrink: 0 }} />
                      {h.label}
                    </span>
                    <span style={{ ...mono, fontSize: "0.7rem", color: GREEN, fontWeight: 500 }}>{h.range}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page Component ───────────────────────────────────────────────── */
export default function GradeCalculatorPage() {
  const [program, setProgram] = useState<Program>("Standard");
  const [rows, setRows] = useState(EMPTY_ROWS());
  const [result, setResult] = useState<{ percentage: number | null; gpa: number | null; error: string | null; }>({ percentage: null, gpa: null, error: null });

  useEffect(() => {
    const id = "dlsau-tools-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.1 }
    );
    const t = setTimeout(() => document.querySelectorAll(".dlsau-reveal").forEach(el => io.observe(el)), 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  const setRow = (key: string, val: RowState) => {
    setRows(r => ({ ...r, [key]: val }));
    setResult({ percentage: null, gpa: null, error: null });
  };

  const calculateGrade = useCallback(() => {
    const getPoints = (item: RowState, isDirect = false): number => {
      const raw = parseFloat(item.raw);
      if (isNaN(raw)) return 0;
      if (isDirect) {
        if (!Number.isFinite(raw)) return -5;
        if (raw > 20) return -3;
        if (raw < 0)  return -4;
        return raw;
      }
      const total  = parseFloat(item.total);
      const weight = parseFloat(item.weight);
      if (!Number.isFinite(raw)) return -5;
      if (raw < 0) return -4;
      if (isNaN(total) || total === 0) return raw > 0 ? -1 : 0;
      if (total < 0) return -6;
      if (total > 1000) return -7;
      if (raw > total) return -2;
      if (raw > 1000) return -8;
      return (raw / total) * weight;
    };

    const midPts  = getPoints(rows.midterms);
    const finPts  = getPoints(rows.finals);
    const prodPts = getPoints(rows.finalProduct);
    const csPts   = getPoints(rows.classStanding, true);

    const allEmpty = Object.values(rows).every(r => r.raw.trim() === "");
    if (allEmpty) return setResult({ percentage: null, gpa: null, error: "Please enter at least one score." });

    const errors: Record<number, string> = {
      [-1]: "Enter a valid Total.", [-2]: "Score > Total.", [-3]: "CS max is 20.",
      [-4]: "No negative scores.", [-5]: "Invalid number.", [-6]: "Total < 0.",
      [-7]: "Total too high.",     [-8]: "Score too high.",
    };

    for (const [pts, label] of [
      [midPts, "Midterm"], [finPts, "Finals"], [prodPts, "Product"], [csPts, "CS"],
    ] as [number, string][]) {
      if (pts < 0 && errors[pts])
        return setResult({ percentage: null, gpa: null, error: `${label}: ${errors[pts]}` });
    }

    const totalScore = midPts + finPts + prodPts + csPts;
    if (totalScore > 100) return setResult({ percentage: null, gpa: null, error: "Computed score exceeds 100%." });
    if (totalScore < 0)   return setResult({ percentage: null, gpa: null, error: "Computed score is negative." });
    setResult({ percentage: totalScore, gpa: getGpaFromScore(totalScore, program), error: null });
  }, [rows, program]);

  const reset = () => { setRows(EMPTY_ROWS()); setResult({ percentage: null, gpa: null, error: null }); };

  const gpa = result.gpa;
  const gpaColor = gpa === null ? DARK : gpa >= 3.0 ? GREEN : gpa >= 1.0 ? "#92400e" : "#b91c1c";
  const deansListBadge = gpa !== null ? getDeansList(gpa) : null;

  return (
    <div style={{ background: CREAM, color: DARK, minHeight: "100dvh", overflowX: "hidden" }}>
      <div style={{ maxWidth: "42rem", margin: "0 auto", padding: "clamp(3rem, 8vw, 5rem) clamp(1.5rem, 5vw, 2.5rem) 5rem" }}>
        
        {/* Header & Back Link */}
        <div className="dlsau-reveal" style={{ marginBottom: "3rem" }}>
          <Link href="/tools" style={{ 
            display: "inline-flex", alignItems: "center", gap: "0.4rem", 
            ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase", 
            color: "rgba(17,17,17,0.5)", textDecoration: "none", marginBottom: "2rem",
            transition: "color 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.color = DARK}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(17,17,17,0.5)"}
          >
            <ArrowLeft size={12} /> BACK TO TOOLS
          </Link>
          
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(17,17,17,0.1)" }}>
            <div style={{ background: GREEN, color: "#fff", padding: "0.6rem", borderRadius: "4px" }}>
              <Calculator size={20} strokeWidth={2} />
            </div>
            <div>
              <h1 style={{ ...dg, fontSize: "1.5rem", letterSpacing: "-0.01em", margin: 0, color: DARK, lineHeight: 1.1 }}>Grade Projector</h1>
              <p style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(17,17,17,0.45)", margin: "0.25rem 0 0" }}>
                DLSAU Student Handbook 2025–2026
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Interface */}
        <div className="dlsau-reveal" style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(17,17,17,0.1)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: 2, background: GREEN }} />
          
          <div style={{ padding: "2rem" }} onKeyDown={e => { if (e.key === "Enter") calculateGrade(); }}>
            
            {/* Program selector */}
            <div style={{ display: "flex", gap: "2px", background: "rgba(17,17,17,0.06)", borderRadius: "4px", padding: "3px", marginBottom: "2rem" }}>
              {PROGRAMS.map(p => (
                <button key={p} onClick={() => { setProgram(p); setResult({ percentage: null, gpa: null, error: null }); }}
                  style={{
                    flex: 1, ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase",
                    padding: "0.5rem 0", borderRadius: "3px", border: "none", cursor: "pointer",
                    background: program === p ? GREEN : "transparent",
                    color: program === p ? "#fff" : "rgba(17,17,17,0.5)",
                    transition: "background 0.2s, color 0.2s",
                  }}
                >
                  {PROGRAM_LABELS[p]}
                </button>
              ))}
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: "0.75rem", paddingBottom: "0.75rem", borderBottom: "1px solid rgba(17,17,17,0.2)" }}>
              {["Component", "Score", "Total", "Wt."].map((h, i) => (
                <span key={h} style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(17,17,17,0.4)", textAlign: i === 0 ? "left" : "center" }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            <GradeRow label="Midterm Exam"   sublabel="30% of final grade"   values={rows.midterms}      setValues={v => setRow("midterms", v)}      type="exam" />
            <GradeRow label="Final Exam"     sublabel="30% of final grade"   values={rows.finals}        setValues={v => setRow("finals", v)}        type="exam" />
            <GradeRow label="Final Product"  sublabel="20% of final grade"   values={rows.finalProduct}  setValues={v => setRow("finalProduct", v)}  type="exam" />
            <GradeRow label="Class Standing" sublabel="Direct score, max 20" values={rows.classStanding} setValues={v => setRow("classStanding", v)} type="direct" />

            {/* Actions */}
            <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.75rem" }}>
              <button onClick={calculateGrade}
                style={{
                  flex: 1, ...dg, fontSize: "0.8rem", letterSpacing: "0.04em",
                  padding: "0.875rem", border: "none", borderRadius: "4px",
                  background: GREEN, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = "0.87")}
                onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
              >
                Compute Grade <ArrowRight size={14} />
              </button>
              <button onClick={reset} title="Reset"
                style={{
                  padding: "0.875rem 1rem", border: "1px solid rgba(17,17,17,0.12)",
                  borderRadius: "4px", background: "transparent", cursor: "pointer",
                  color: "rgba(17,17,17,0.45)", transition: "color 0.2s, border-color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.color = "#b91c1c"; e.currentTarget.style.borderColor = "#b91c1c"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "rgba(17,17,17,0.45)"; e.currentTarget.style.borderColor = "rgba(17,17,17,0.12)"; }}
              >
                <Eraser size={16} />
              </button>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {result.error && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginTop: "1rem", padding: "0.875rem", background: "rgba(185,28,28,0.06)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: "4px", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}
                >
                  <AlertTriangle size={14} style={{ color: "#b91c1c", flexShrink: 0, marginTop: 2 }} />
                  <span style={{ ...ss, fontSize: "0.825rem", color: "#b91c1c", flex: 1, fontWeight: 300 }}>{result.error}</span>
                  <button onClick={() => setResult(r => ({ ...r, error: null }))} style={{ background: "none", border: "none", cursor: "pointer", color: "#b91c1c", padding: 0, lineHeight: 1 }}>
                    <X size={14} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Result Panel */}
            <AnimatePresence>
              {gpa !== null && !result.error && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                  <div style={{ marginTop: "1.5rem", border: "1px solid rgba(17,17,17,0.1)", borderRadius: "4px", overflow: "hidden" }}>
                    
                    {/* Main GPA View */}
                    <div style={{ padding: "2rem 1.5rem", textAlign: "center", background: "rgba(17,17,17,0.02)" }}>
                      {deansListBadge && (
                        <motion.div initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.3rem 0.75rem", marginBottom: "1rem", background: "rgba(180,83,9,0.08)", border: "1px solid rgba(180,83,9,0.2)", borderRadius: "2px" }}
                        >
                          <Medal size={10} style={{ color: "#b45309" }} />
                          <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "#b45309" }}>{deansListBadge}</span>
                        </motion.div>
                      )}
                      <p style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(17,17,17,0.38)", marginBottom: "0.5rem" }}>Subject GPA</p>
                      <p style={{ ...dg, fontSize: "5rem", lineHeight: 0.9, color: gpaColor, margin: 0, letterSpacing: "-0.02em" }}>{gpa.toFixed(1)}</p>
                      <p style={{ ...ss, fontSize: "1rem", fontStyle: "italic", fontWeight: 300, color: gpaColor, marginTop: "0.5rem" }}>{gpaDescriptor(gpa)}</p>
                      <p style={{ ...mono, fontSize: "0.7rem", color: "rgba(17,17,17,0.38)", marginTop: "0.4rem" }}>
                        Raw Score: <span style={{ color: DARK, fontWeight: 500 }}>{result.percentage?.toFixed(2)}%</span>
                      </p>
                    </div>

                    {/* Component breakdown */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                      {[
                        { label: "Midterm", row: rows.midterms,      isDirect: false },
                        { label: "Finals",  row: rows.finals,        isDirect: false },
                        { label: "Product", row: rows.finalProduct,  isDirect: false },
                        { label: "CS",      row: rows.classStanding, isDirect: true  },
                      ].map(({ label, row, isDirect }) => {
                        const raw    = parseFloat(row.raw);
                        const total  = parseFloat(row.total);
                        const weight = parseFloat(row.weight);
                        const pts    = !isNaN(raw) ? (isDirect ? raw : (!isNaN(total) && total > 0 ? (raw / total) * weight : 0)) : 0;
                        
                        return (
                          <div key={label} className="tools-breakdown-cell" style={{ textAlign: "center", padding: "0.875rem 0.5rem" }}>
                            <p style={{ ...mono, fontSize: "0.45rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(17,17,17,0.35)", margin: "0 0 0.25rem" }}>{label}</p>
                            <p style={{ ...mono, fontSize: "0.9rem", fontWeight: 500, color: DARK, margin: 0 }}>{pts.toFixed(1)}</p>
                          </div>
                        );
                      })}
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <GradeReference program={program} />
            
          </div>
        </div>

      </div>
    </div>
  );
}