"use client";

import { useEffect } from "react";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes dlsau-tick {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

/* Reveal uses an animation so stagger (animation-delay) never bleeds
   into hover transitions defined on the same element. */
@keyframes dlsau-reveal-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0);    }
}

.dlsau-ticker {
  display: flex;
  width: max-content;
  animation: dlsau-tick 30s linear infinite;
}

.dlsau-reveal {
  opacity: 0;
}
.dlsau-reveal.in-view {
  /* "both" = backwards fill (start state during delay) + forwards fill (hold end state) */
  animation: dlsau-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* College card internals */
.dlsau-card          { transition: background 0.4s ease, border-color 0.4s ease; }
.dlsau-card .bar     { transition: width 0.55s cubic-bezier(0.16, 1, 0.3, 1); }
.dlsau-card:hover .bar { width: 100% !important; }
.dlsau-card .ghost   { transition: opacity 0.4s ease; }
.dlsau-card:hover .ghost { opacity: 0.09 !important; }

/* Program row hover */
.dlsau-prog          { transition: opacity 0.25s ease; }
.dlsau-prog:hover    { opacity: 0.82; }
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const programs = [
  {
    index: "01",
    tag: "Community",
    title: "Samahang Lasalyano",
    body: "The core community of DLSAU student leaders and volunteers dedicated to faith, service, and communion.",
  },
  {
    index: "02",
    tag: "Advocacy",
    title: "Student Rights Advocacy",
    body: "Ensuring every Lasallian voice is heard, protected, and empowered through active policy reform and representation.",
  },
];

const colleges = [
  { acronym: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#16a34a" },
  { acronym: "CBMA", name: "College of Business Management & Accountancy",            color: "#ca8a04" },
  { acronym: "CAST",  name: "College of Arts, Science, and Technology",                color: "#dc2626" },
  { acronym: "COED",  name: "College of Education",                                    color: "#2563eb" },
];

const TICKER = [
  "DLSAU", "Serve", "Lead", "Unite",
  "Faith", "Advocacy", "Service", "Lasallian", "Student Rights", "Community",
];

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "0,0,0";
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  /* Inject fonts + keyframes once */
  useEffect(() => {
    const id = "dlsau-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }

    /* Scroll-reveal observer */
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.12 },
    );
    const t = setTimeout(
      () => document.querySelectorAll(".dlsau-reveal").forEach(el => io.observe(el)),
      60,
    );

    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  /* Shared font tokens */
  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#16a34a";

  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — dark, full-viewport editorial spread
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: "100vh",
        background: DARK,
        color: CREAM,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}>

        {/* Ghost watermark — contained so it never bleeds */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", pointerEvents: "none",
        }}>
          <span style={{
            ...dg,
            fontSize: "clamp(7rem, 26vw, 24rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(255,255,255,0.042)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            userSelect: "none",
            whiteSpace: "nowrap",
          }}>
            DLSAU
          </span>
        </div>

        {/* Rotated spine label */}
        <div aria-hidden="true" style={{
          position: "absolute", left: "1.25rem", top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          whiteSpace: "nowrap",
          ...mono,
          fontSize: "0.5rem", letterSpacing: "0.42em",
          color: "rgba(255,255,255,0.16)", textTransform: "uppercase",
        }}>
          University Student Council · De La Salle Araneta University
        </div>

        {/* Main headline block — top padding clears the fixed Navbar (+ optional banner) */}
        <div style={{
          position: "relative", zIndex: 10,
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "3rem clamp(2rem, 5vw, 5.5rem)",
          paddingTop: "clamp(5rem, 10vw, 8rem)",
        }}>
          {/* Eyebrow rule + label */}
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2.75rem" }}>
            <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
              Our Identity
            </span>
          </div>

          {/* Display headline */}
          <h1 style={{ margin: 0 }}>
            <span style={{
              ...dg,
              display: "block",
              fontSize: "clamp(4rem, 13.5vw, 12.5rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.025em",
              color: CREAM,
            }}>
              BEYOND
            </span>
            <span style={{
              ...ss,
              display: "block",
              fontSize: "clamp(3.2rem, 11vw, 10.5rem)",
              lineHeight: 0.88,
              fontStyle: "italic",
              fontWeight: 300,
              letterSpacing: "-0.01em",
              color: GREEN,
              paddingLeft: "clamp(0.5rem, 4vw, 5rem)",
              marginTop: "0.6rem",
            }}>
              representation
            </span>
          </h1>

          {/* Lede paragraph */}
          <p style={{
            ...ss,
            marginTop: "3.5rem",
            marginLeft: "clamp(0.5rem, 4vw, 5rem)",
            maxWidth: "36rem",
            fontSize: "1.05rem",
            lineHeight: 1.8,
            color: "rgba(244,239,230,0.48)",
            fontWeight: 300,
          }}>
            The University Student Council (USC) and College Student Councils (CSC) act as the highest governing
            student body of De La Salle Araneta University, committed to protecting student rights and
            cultivating a vibrant Lasallian culture.
          </p>
        </div>

        {/* Scrolling ticker */}
        <div style={{
          position: "relative", zIndex: 10,
          borderTop: "1px solid rgba(255,255,255,0.07)",
          overflow: "hidden",
          padding: "0.85rem 0",
          background: "rgba(255,255,255,0.025)",
        }}>
          <div className="dlsau-ticker">
            {[...TICKER, ...TICKER].map((word, i) => (
              <span key={i} style={{
                ...mono,
                fontSize: "0.57rem", letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: i % 3 === 0 ? GREEN : "rgba(255,255,255,0.2)",
                marginRight: "3rem",
                whiteSpace: "nowrap",
              }}>
                {word} {i % 2 === 0 ? "✦" : "·"}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CORE INITIATIVES — cream editorial rows
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: CREAM,
        padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
      }}>
        {/* Section heading */}
        <div
          className="dlsau-reveal"
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            paddingBottom: "2rem",
            borderBottom: `2px solid ${DARK}`,
          }}
        >
          <h2 style={{ ...dg, fontSize: "clamp(2.25rem, 7vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.85 }}>
            CORE<br />INITIATIVES
          </h2>
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888", paddingBottom: "0.3rem" }}>
            02 programs
          </span>
        </div>

        {/* Program rows — animationDelay staggers the reveal without
            affecting the .dlsau-prog hover opacity transition */}
        {programs.map((prog, i) => (
          <div
            key={prog.index}
            className="dlsau-reveal dlsau-prog"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(56px, 84px) 1fr",
              gap: "1.5rem 2.5rem",
              padding: "3.5rem 0",
              borderBottom: "1px solid rgba(17,17,17,0.1)",
              alignItems: "start",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* Outlined index numeral */}
            <span style={{
              ...dg,
              fontSize: "clamp(2.75rem, 6.5vw, 5rem)",
              lineHeight: 1,
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(17,17,17,0.14)",
              letterSpacing: "-0.02em",
              userSelect: "none",
              paddingTop: "0.25rem",
            }}>
              {prog.index}
            </span>

            {/* Content */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.54rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                  {prog.tag}
                </span>
              </div>
              <h3 style={{ ...ss, fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.1, marginBottom: "1rem" }}>
                {prog.title}
              </h3>
              <p style={{ ...ss, fontSize: "1rem", lineHeight: 1.8, color: "#555", fontWeight: 300, maxWidth: "36rem" }}>
                {prog.body}
              </p>
            </div>
          </div>
        ))}
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          COLLEGES — dark section with colour-accent cards
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: DARK,
        color: CREAM,
        padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
      }}>
        {/* Section heading */}
        <div
          className="dlsau-reveal"
          style={{
            display: "flex", alignItems: "flex-end", justifyContent: "space-between",
            paddingBottom: "2rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            marginBottom: "1px",
          }}
        >
          <h2 style={{ ...dg, fontSize: "clamp(2.25rem, 7vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.85, color: CREAM }}>
            OUR<br />COLLEGES
          </h2>
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)", paddingBottom: "0.3rem" }}>
            04 branches
          </span>
        </div>

        {/* Grid — 1px gaps become visible lines against the dark bg */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
          gap: "1px",
          background: "rgba(255,255,255,0.07)",
        }}>
          {colleges.map((college, i) => (
            <div
              key={college.acronym}
              className="dlsau-reveal dlsau-card"
              style={{
                position: "relative",
                padding: "2.5rem",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                overflow: "hidden",
                /* animationDelay staggers the reveal without
                   affecting the dlsau-card hover transitions */
                animationDelay: `${i * 0.07}s`,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = `rgba(${hexRgb(college.color)},0.09)`;
                e.currentTarget.style.borderColor = college.color;
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
              }}
            >
              {/* Background ghost acronym */}
              <span
                className="ghost"
                aria-hidden="true"
                style={{
                  position: "absolute", bottom: "-1rem", right: "-0.25rem",
                  ...dg,
                  fontSize: "5.5rem", lineHeight: 1,
                  color: "rgba(255,255,255,0.04)",
                  opacity: 1,
                  userSelect: "none", pointerEvents: "none",
                }}
              >
                {college.acronym}
              </span>

              {/* Card content */}
              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Animated colour bar */}
                <div
                  className="bar"
                  style={{ height: 2, width: "2rem", background: college.color, marginBottom: "2rem" }}
                />

                <span style={{ ...dg, display: "block", fontSize: "1.35rem", letterSpacing: "-0.01em", color: CREAM, marginBottom: "0.65rem" }}>
                  {college.acronym}
                </span>

                <p style={{ ...ss, fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(244,239,230,0.4)", fontWeight: 300, marginBottom: "2.5rem" }}>
                  {college.name}
                </p>

                <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.42em", textTransform: "uppercase", color: college.color }}>
                    College Student Council
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}