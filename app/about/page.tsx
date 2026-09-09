"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes dlsau-tick {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes dlsau-reveal-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes dlsau-badge-pop {
  0%,100% { transform: scale(1); }
  45%     { transform: scale(1.04) skewX(-1deg); }
}

.dlsau-ticker {
  display: flex;
  width: max-content;
  animation: dlsau-tick 30s linear infinite;
}
.dlsau-reveal { opacity: 0; }
.dlsau-reveal.in-view {
  animation: dlsau-reveal-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.dlsau-card          { transition: background 0.35s ease, border-color 0.35s ease; }
.dlsau-card .bar     { transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
.dlsau-card:hover .bar { width: 100% !important; }
.dlsau-card .ghost   { transition: opacity 0.35s ease; }
.dlsau-card:hover .ghost { opacity: 0.09 !important; }
.dlsau-card:focus-visible {
  outline: 2px solid var(--card-accent, #005c00);
  outline-offset: 3px;
}

.dlsau-prog-card {
  transition: border-color 0.25s ease, transform 0.25s ease;
}
.dlsau-prog-card:hover { transform: translateY(-3px); }
.dlsau-prog-card .prog-bar {
  transition: width 0.45s cubic-bezier(0.16, 1, 0.3, 1);
}
.dlsau-prog-card:hover .prog-bar { width: 100% !important; }

.dlsau-em {
  position: relative;
  display: inline;
}
.dlsau-em::after {
  content: '';
  position: absolute;
  left: 0; bottom: -0.05em;
  width: 100%; height: 0.08em;
  background: currentColor;
  transform-origin: left;
  transform: scaleX(0);
  transition: transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.8s;
}
.in-view .dlsau-em::after { transform: scaleX(1); }

.dlsau-slogan {
  display: inline-block;
  transition: letter-spacing 0.4s cubic-bezier(0.16,1,0.3,1);
  cursor: default;
}
.dlsau-slogan:hover {
  letter-spacing: 0.045em;
  animation: dlsau-badge-pop 0.55s ease forwards;
}

@media (max-width: 768px) {
  .dlsau-spine { display: none; }
  .dlsau-ticker { animation-duration: 22s; }
}
@media (hover: none) {
  .dlsau-card:hover .bar { width: 2rem !important; }
  .dlsau-card:hover .ghost { opacity: 0.04 !important; }
  .dlsau-prog-card:hover { transform: none; }
  .dlsau-prog-card:hover .prog-bar { width: 1.75rem !important; }
}
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const programs = [
  {
    index: "01",
    tag: "Volunteer Arm",
    title: "Lasallian Youth Volunteers (LYV)",
    body: "The USC's dedicated volunteer corps — built on Faith, Service, and Community. LYV members serve across Events, Social Action, and Mission committees, from campaigns and disaster response to student consultation and career assistance.",
  },
  {
    index: "02",
    tag: "Advocacy",
    title: "Student Rights & Welfare",
    body: "Upholding and defending every student's rights as outlined in the Student Handbook and the Universal Declaration of Human Rights — ensuring representation in all policy-making bodies that concern the student body.",
  },
];

const colleges = [
  { acronym: "CVMAS", name: "College of Veterinary Medicine & Agricultural Sciences", color: "#005c00" },
  { acronym: "CBMA",  name: "College of Business Management & Accountancy",            color: "#ca8a04" },
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

/* ─── Section heading row ──────────────────────────────────────────────────── */
function SectionHead({
  title, sub, dg, mono,
}: { title: React.ReactNode; sub: string; dg: React.CSSProperties; mono: React.CSSProperties }) {
  return (
    <div
      className="dlsau-reveal"
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: "1.25rem",
        borderBottom: "2px solid #111111",
        marginBottom: "1.75rem",
      }}
    >
      <h2 style={{
        ...dg,
        fontSize: "clamp(1.2rem, 2.75vw, 1.9rem)",
        letterSpacing: "-0.02em",
        lineHeight: 1,
        margin: 0,
      }}>
        {title}
      </h2>
      <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888" }}>
        {sub}
      </span>
    </div>
  );
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function AboutPage() {
  useEffect(() => {
    const id = "dlsau-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.1 },
    );
    const t = setTimeout(
      () => document.querySelectorAll(".dlsau-reveal").forEach(el => io.observe(el)),
      60,
    );
    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#005c00";

  return (
    <>
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — tightened; headline on one horizontal baseline
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="About the University Student Council"
        style={{
          minHeight: "100dvh",
          color: DARK,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background photo */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/about/hero-bg.jpg" alt="" fill priority style={{ objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,0.86)" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(244,239,230,0.55) 0%, rgba(244,239,230,0.88) 55%, ${CREAM} 100%)` }} />
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "multiply",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
        </div>

        {/* Ghost watermark */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", pointerEvents: "none" }}>
          <span style={{ ...dg, fontSize: "clamp(7rem, 26vw, 24rem)", color: "transparent", WebkitTextStroke: "1px rgba(17,17,17,0.05)", letterSpacing: "-0.04em", lineHeight: 0.85, userSelect: "none", whiteSpace: "nowrap" }}>
            DLSAU
          </span>
        </div>

        {/* Rotated spine */}
        <div aria-hidden="true" className="dlsau-spine" style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%) rotate(-90deg)", whiteSpace: "nowrap", ...mono, fontSize: "0.5rem", letterSpacing: "0.42em", color: "rgba(17,17,17,0.28)", textTransform: "uppercase" }}>
          University Student Council · De La Salle Araneta University
        </div>

        {/* Headline block */}
        <div style={{
          position: "relative", zIndex: 10,
          flex: 1, display: "flex", flexDirection: "column", justifyContent: "center",
          padding: "clamp(5rem, 10vw, 8rem) clamp(2rem, 5vw, 5.5rem) 2.5rem",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "end", gap: "2rem", marginBottom: "2rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem" }}>
                <span style={{ display: "block", height: 1, width: "1.75rem", background: GREEN, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                  Our Identity
                </span>
              </div>
              {/* Headline — both words on same baseline row */}
              <h1 style={{ margin: 0, display: "flex", alignItems: "baseline", gap: "clamp(0.5rem, 2vw, 1.5rem)", flexWrap: "wrap" }}>
                <span style={{ ...dg, fontSize: "clamp(3rem, 9vw, 8.5rem)", lineHeight: 0.88, letterSpacing: "-0.025em", color: DARK }}>
                  <span className="dlsau-em">BEYOND</span>
                </span>
                <span style={{ ...ss, fontSize: "clamp(2.5rem, 7.5vw, 7.5rem)", lineHeight: 0.9, fontStyle: "italic", fontWeight: 300, letterSpacing: "-0.01em", color: GREEN }}>
                  representation.
                </span>
              </h1>
            </div>
          </div>

          {/* Lede */}
          <p style={{
            ...ss,
            marginLeft: "clamp(0.5rem, 4vw, 5rem)",
            maxWidth: "34rem",
            fontSize: "1rem",
            lineHeight: 1.8,
            color: "rgba(17,17,17,0.6)",
            fontWeight: 300,
          }}>
            The University Student Council (USC) and College Student Councils (CSC) act as the highest
            governing student body of De La Salle Araneta University, committed to protecting student
            rights and cultivating a vibrant Lasallian culture.
          </p>
        </div>

        {/* Ticker */}
        <div aria-hidden="true" style={{ position: "relative", zIndex: 10, borderTop: "1px solid rgba(17,17,17,0.08)", overflow: "hidden", padding: "0.85rem 0", background: "rgba(255,255,255,0.35)" }}>
          <div className="dlsau-ticker">
            {[...TICKER, ...TICKER].map((word, i) => (
              <span key={i} style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.4em", textTransform: "uppercase", color: i % 3 === 0 ? GREEN : "rgba(17,17,17,0.32)", marginRight: "3rem", whiteSpace: "nowrap" }}>
                {word} {i % 2 === 0 ? "✦" : "·"}
              </span>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          MANDATE — compact two-column layout
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Our Mandate"
        style={{ position: "relative", color: DARK, padding: "3.5rem clamp(2rem, 5vw, 5.5rem)", overflow: "hidden" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/about/mandate-bg.jpg" alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,1.0)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <SectionHead title="OUR MANDATE" sub="Article I &amp; III" dg={dg} mono={mono} />

          {/* Preamble + Purpose side by side */}
          <div
            className="dlsau-reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            {[
              {
                label: "Preamble",
                text: "Guided by the Lasallian Core Values — Spirit of Faith, Zeal for Service, and Communion in Mission — and the ideals of Don Salvador Araneta, the USC affirms a democratic, autonomous, and genuine student council that protects the rights and welfare of every student, inculcates involvement in the university and society, and inspires Lasallians to be achievers for God and Country.",
              },
              {
                label: "Purpose",
                text: "The USC serves as mediator between the student body and the Lasallian community, an active agent in promoting societal consciousness, and a unifying voice enjoining students to advance their rights and welfare together — while regularly consulting the student body to remain guided by their sentiments.",
              },
            ].map(({ label, text }) => (
              <div key={label} style={{ padding: "1.75rem", border: "1px solid rgba(17,17,17,0.1)", background: "rgba(244,239,230,0.6)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem" }}>
                  <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                  <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                    {label}
                  </span>
                </div>
                <p style={{ ...ss, fontSize: "0.95rem", lineHeight: 1.85, color: "rgba(17,17,17,0.68)", fontWeight: 300, margin: 0 }}>
                  {text}
                </p>
              </div>
            ))}
          </div>

          {/* Slogan callout */}
          <div
            className="dlsau-reveal"
            style={{ padding: "1.75rem 2rem", borderTop: "1px solid rgba(17,17,17,0.1)", borderBottom: "1px solid rgba(17,17,17,0.1)" }}
          >
            <span aria-label="We Lead. We Serve." style={{ ...dg, display: "block", fontSize: "clamp(1.5rem, 4vw, 2.75rem)", color: GREEN, letterSpacing: "-0.01em" }}>
              <span className="dlsau-slogan">
                &ldquo;WE <span className="dlsau-em">LEAD</span>. WE <span className="dlsau-em">SERVE</span>.&rdquo;
              </span>
            </span>
            <p style={{ ...ss, marginTop: "0.5rem", fontSize: "0.82rem", color: "rgba(17,17,17,0.42)", fontWeight: 300, maxWidth: "34rem" }}>
              The USC Campaign Slogan — reflecting the natural connection between student leadership and service.
            </p>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CORE INITIATIVES — 2-column card grid (mirrors contact layout)
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Arms and Advocacy"
        style={{ background: CREAM, padding: "3.5rem clamp(2rem, 5vw, 5.5rem)" }}
      >
        <SectionHead title="ARMS & ADVOCACY" sub="Article XI" dg={dg} mono={mono} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1.25rem" }}>
          {programs.map((prog, i) => (
            <div
              key={prog.index}
              className="dlsau-reveal dlsau-prog-card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.75rem 1.625rem",
                border: "1px solid rgba(17,17,17,0.12)",
                position: "relative",
                background: CREAM,
                animationDelay: `${i * 0.08}s`,
              }}
            >
              {/* Ghost index */}
              <span aria-hidden="true" style={{ ...dg, position: "absolute", top: "1.1rem", right: "1.25rem", fontSize: "2rem", lineHeight: 1, color: "transparent", WebkitTextStroke: "1px rgba(17,17,17,0.1)", letterSpacing: "-0.02em", userSelect: "none" }}>
                {prog.index}
              </span>

              {/* Tag */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: GREEN }}>
                  {prog.tag}
                </span>
              </div>

              {/* Animated bar */}
              <div className="prog-bar" style={{ height: "1.5px", width: "1.75rem", background: GREEN, margin: "1.25rem 0 0.9rem" }} />

              {/* Title */}
              <h3 style={{ ...ss, fontSize: "clamp(1rem, 2vw, 1.3rem)", fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.2, marginBottom: "0.75rem", color: DARK }}>
                {prog.title}
              </h3>

              {/* Body */}
              <p style={{ ...ss, fontSize: "0.875rem", lineHeight: 1.75, color: "#666", fontWeight: 300, margin: 0, flex: 1 }}>
                {prog.body}
              </p>
            </div>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          COLLEGES — tighter cards, same 4-column grid
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Our Colleges"
        style={{ position: "relative", color: DARK, padding: "3.5rem clamp(2rem, 5vw, 5.5rem)", overflow: "hidden" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image src="/about/colleges-bg.jpg" alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,0.92)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <SectionHead title="OUR COLLEGES" sub="04 branches" dg={dg} mono={mono} />

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))", gap: "1px", background: "rgba(17,17,17,0.08)" }}>
            {colleges.map((college, i) => (
              <Link
                key={college.acronym}
                href={`/colleges/${college.acronym}`}
                style={{ textDecoration: "none", color: "inherit", display: "contents" }}
              >
                <div
                  className="dlsau-reveal dlsau-card"
                  role="article"
                  tabIndex={0}
                  aria-label={`${college.name} — view college page`}
                  style={{
                    position: "relative",
                    padding: "2rem 1.75rem",
                    background: "rgba(255,255,255,0.5)",
                    border: "1px solid rgba(17,17,17,0.07)",
                    overflow: "hidden",
                    cursor: "pointer",
                    animationDelay: `${i * 0.07}s`,
                    ["--card-accent" as string]: college.color,
                  }}
                  onMouseEnter={e => {
                    if (!window.matchMedia("(hover: hover)").matches) return;
                    e.currentTarget.style.background = `rgba(${hexRgb(college.color)},0.09)`;
                    e.currentTarget.style.borderColor = college.color;
                  }}
                  onMouseLeave={e => {
                    if (!window.matchMedia("(hover: hover)").matches) return;
                    e.currentTarget.style.background = "rgba(255,255,255,0.5)";
                    e.currentTarget.style.borderColor = "rgba(17,17,17,0.07)";
                  }}
                >
                  {/* Ghost acronym */}
                  <span className="ghost" aria-hidden="true" style={{ position: "absolute", bottom: "-1rem", right: "-0.25rem", ...dg, fontSize: "5rem", lineHeight: 1, color: "rgba(17,17,17,0.04)", opacity: 1, userSelect: "none", pointerEvents: "none" }}>
                    {college.acronym}
                  </span>

                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div className="bar" style={{ height: 2, width: "1.75rem", background: college.color, marginBottom: "1.5rem" }} />
                    <span style={{ ...dg, display: "block", fontSize: "1.25rem", letterSpacing: "-0.01em", color: DARK, marginBottom: "0.5rem" }}>
                      {college.acronym}
                    </span>
                    <p style={{ ...ss, fontSize: "0.82rem", lineHeight: 1.65, color: "rgba(17,17,17,0.5)", fontWeight: 300, marginBottom: "1.5rem" }}>
                      {college.name}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "1rem", borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                      <span style={{ ...mono, fontSize: "0.47rem", letterSpacing: "0.42em", textTransform: "uppercase", color: college.color }}>
                        College Student Council
                      </span>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={college.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </div>
    </>
  );
}