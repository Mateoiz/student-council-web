"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  GraduationCap,
  BookOpen,
  Target,
  Clock,
  Percent,
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
`;

/* ─── Font shorthand objects ────────────────────────────────────────────── */
const ss   = { fontFamily: "'Source Serif 4', serif" }       as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" }    as const;

/* ─── Active Tool Card (Link Route) ─────────────────────────────────────── */
function ActiveToolCard({ title, desc, icon: Icon, href }: {
  title: string; desc: string;
  icon: React.ElementType; href: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        background: "transparent",
        border: "1px solid rgba(17,17,17,0.1)",
        borderRadius: "4px",
        transition: "all 0.2s ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = GREEN;
        e.currentTarget.style.background = "rgba(255,255,255,0.55)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = "rgba(17,17,17,0.1)";
        e.currentTarget.style.background = "transparent";
      }}
      >
        <div style={{ padding: "1.5rem", position: "relative", overflow: "hidden", flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
            <div style={{ border: `1px solid ${GREEN}`, padding: "0.5rem", borderRadius: "4px", color: GREEN, background: "rgba(0,92,0,0.05)" }}>
              <Icon size={20} strokeWidth={1.5} />
            </div>
            {/* Ghost watermark */}
            <Icon size={48} strokeWidth={0.75} style={{ color: "rgba(17,17,17,0.04)", flexShrink: 0 }} />
          </div>
          <h3 style={{ ...mono, fontSize: "1rem", fontWeight: 600, letterSpacing: "0.05em", color: DARK, margin: "0 0 0.5rem" }}>{title}</h3>
          <p style={{ ...ss, fontSize: "0.875rem", lineHeight: 1.5, color: "rgba(17,17,17,0.6)", margin: 0, flex: 1 }}>{desc}</p>
          <div style={{ ...mono, color: GREEN, fontSize: "0.65rem", letterSpacing: "0.15em", marginTop: "2rem", display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600 }}>
            OPEN TOOL <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Coming Soon Card ──────────────────────────────────────────────────── */
function ComingSoonCard({ title, desc, icon: Icon }: {
  title: string; desc: string; icon: React.ElementType;
}) {
  return (
    <div style={{
      border: "1px solid rgba(17,17,17,0.08)",
      borderRadius: "4px",
      padding: "1.5rem",
      position: "relative",
      overflow: "hidden",
      opacity: 0.6,
      cursor: "default",
      display: "flex",
      flexDirection: "column",
      height: "100%"
    }}>
      {/* Diagonal "coming soon" stamp */}
      <div style={{
        position: "absolute", top: "1rem", right: "-1.75rem",
        background: "rgba(17,17,17,0.07)",
        transform: "rotate(35deg)",
        padding: "0.2rem 2.5rem",
      }}>
        <span style={{ ...mono, fontSize: "0.42rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(17,17,17,0.5)" }}>
          Coming Soon
        </span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div style={{ border: "1px solid rgba(17,17,17,0.15)", padding: "0.5rem", borderRadius: "4px", color: "rgba(17,17,17,0.3)", background: "rgba(17,17,17,0.03)" }}>
          <Icon size={20} strokeWidth={1.5} />
        </div>
        <Icon size={48} strokeWidth={0.75} style={{ color: "rgba(17,17,17,0.04)", flexShrink: 0 }} />
      </div>

      <h3 style={{ ...mono, fontSize: "1rem", fontWeight: 600, letterSpacing: "0.05em", color: "rgba(17,17,17,0.4)", margin: "0 0 0.5rem" }}>{title}</h3>
      <p style={{ ...ss, fontSize: "0.875rem", lineHeight: 1.5, color: "rgba(17,17,17,0.35)", margin: 0, flex: 1 }}>{desc}</p>

      <div style={{ ...mono, color: "rgba(17,17,17,0.25)", fontSize: "0.65rem", letterSpacing: "0.15em", marginTop: "2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <Clock size={11} /> IN DEVELOPMENT
      </div>
    </div>
  );
}

/* ─── Tools Page ────────────────────────────────────────────────────────── */
export default function ToolsPage() {
  useEffect(() => {
    const id = "dlsau-tools-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.1 },
    );
    const t = setTimeout(() => document.querySelectorAll(".dlsau-reveal").forEach(el => io.observe(el)), 60);
    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  return (
    <div style={{ background: CREAM, color: DARK, minHeight: "100dvh", overflowX: "hidden" }}>
      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "clamp(3rem, 8vw, 5rem) clamp(1.5rem, 5vw, 2.5rem) 5rem" }}>

        {/* Section header */}
        <div className="dlsau-reveal" style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", paddingBottom: "1.25rem", borderBottom: "1px solid rgba(17,17,17,0.1)" }}>
            <div style={{ background: GREEN, color: "#fff", padding: "0.4rem", borderRadius: "4px" }}>
              <BookOpen size={18} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ ...mono, fontSize: "1rem", fontWeight: 600, letterSpacing: "0.15em", margin: 0, color: DARK }}>
                ACADEMIC TOOLS
              </h2>
              <p style={{ ...ss, fontSize: "0.8rem", color: "rgba(17,17,17,0.45)", margin: "0.2rem 0 0", fontWeight: 300 }}>
                Built on official DLSAU policies · Student Handbook 2025–2026
              </p>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="dlsau-reveal" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "stretch" }}>

          <ActiveToolCard
            title="GRADE CALCULATOR"
            desc="Compute your subject grade using the official DLSAU grading system — supports Standard, BSA, and DVM programs."
            icon={GraduationCap}
            href="/tools/gcalc"
          />

          <ComingSoonCard
            title="GWA CALCULATOR"
            desc="Compute your General Weighted Average across all enrolled subjects and units."
            icon={Percent}
          />

          <ComingSoonCard
            title="TARGET GRADE PLANNER"
            desc="Find out what scores you need in your remaining exams to reach your target GPA."
            icon={Target}
          />


        </div>

        <p style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(17,17,17,0.3)", textAlign: "center", marginTop: "4rem", lineHeight: 2 }}>
          Based on DLSAU Student Handbook 2025–2026, Sec. 3.2<br />
          Always verify with your professor or registrar for official grades.
        </p>
      </div>
    </div>
  );
}