"use client";

import { useEffect } from "react";
import Image from "next/image";

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

/* Mobile refinements */
@media (max-width: 768px) {
  .dlsau-spine { display: none; }
  .dlsau-ticker { animation-duration: 22s; }
  .dlsau-card { padding: 1.75rem !important; }
}

/* ── Attention-word underline draw ── */
@keyframes dlsau-badge-pop {
  0%,100% { transform: scale(1); }
  45%     { transform: scale(1.04) skewX(-1deg); }
}
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
/* Slogan hover expand */
.dlsau-slogan {
  display: inline-block;
  transition: letter-spacing 0.4s cubic-bezier(0.16,1,0.3,1);
  cursor: default;
}
.dlsau-slogan:hover {
  letter-spacing: 0.045em;
  animation: dlsau-badge-pop 0.55s ease forwards;
}
/* Keyboard focus ring on cards */
.dlsau-card:focus-visible {
  outline: 2px solid var(--card-accent, #005c00);
  outline-offset: 3px;
  box-shadow: 0 0 0 5px rgba(0,92,0,0.07);
}


/* Respect touch devices: hover-only effects shouldn't stick after tap */
@media (hover: none) {
  .dlsau-card:hover .bar { width: 2rem !important; }
  .dlsau-card:hover .ghost { opacity: 0.04 !important; }
  .dlsau-prog:hover { opacity: 1; }
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
  const GREEN = "#005c00";

return (
    <>
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — soft editorial spread with background photo
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

        {/* Background photo — swap the src below for your own image */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/about/hero-bg.jpg"
            alt=""
            fill
            priority
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          {/* Cream wash so the photo reads soft, not stark */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,0.86)" }} />
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(180deg, rgba(244,239,230,0.55) 0%, rgba(244,239,230,0.88) 55%, ${CREAM} 100%)`,
          }} />
          {/* Subtle noise texture, same technique as the homepage hero */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.05, mixBlendMode: "multiply",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
        </div>

        {/* Ghost watermark — contained so it never bleeds */}
        <div aria-hidden="true" style={{
          position: "absolute", inset: 0, zIndex: 1,
          display: "flex", alignItems: "center", justifyContent: "center",
          overflow: "hidden", pointerEvents: "none",
        }}>
          <span style={{
            ...dg,
            fontSize: "clamp(7rem, 26vw, 24rem)",
            color: "transparent",
            WebkitTextStroke: "1px rgba(17,17,17,0.05)",
            letterSpacing: "-0.04em",
            lineHeight: 0.85,
            userSelect: "none",
            whiteSpace: "nowrap",
          }}>
            DLSAU
          </span>
        </div>

        {/* Rotated spine label — hidden on mobile to avoid crowding the headline */}
        <div aria-hidden="true" className="dlsau-spine" style={{
          position: "absolute", left: "1.25rem", top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          whiteSpace: "nowrap",
          ...mono,
          fontSize: "0.5rem", letterSpacing: "0.42em",
          color: "rgba(17,17,17,0.28)", textTransform: "uppercase",
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
              color: DARK,
            }}>
              <span className="dlsau-em">BEYOND</span>
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
            color: "rgba(17,17,17,0.62)",
            fontWeight: 300,
          }}>
            The University Student Council (USC) and College Student Councils (CSC) act as the highest governing
            student body of De La Salle Araneta University, committed to protecting student rights and
            cultivating a vibrant Lasallian culture.
          </p>
        </div>

        {/* Scrolling ticker */}
        <div
          aria-hidden="true"
          style={{
            position: "relative", zIndex: 10,
            borderTop: "1px solid rgba(17,17,17,0.08)",
            overflow: "hidden",
            padding: "0.85rem 0",
            background: "rgba(255,255,255,0.35)",
          }}
        >
          <div className="dlsau-ticker">
            {[...TICKER, ...TICKER].map((word, i) => (
              <span key={i} style={{
                ...mono,
                fontSize: "0.57rem", letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: i % 3 === 0 ? GREEN : "rgba(17,17,17,0.32)",
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
          MANDATE — Preamble + guiding principles, soft photo backdrop
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Our Mandate"
        style={{
          position: "relative",
          color: DARK,
          padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
          overflow: "hidden",
        }}
      >
        {/* Background photo — swap the src below for your own image */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/about/mandate-bg.jpg"
            alt=""
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,1.0)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            className="dlsau-reveal"
            style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              paddingBottom: "2rem",
              borderBottom: "1px solid rgba(17,17,17,0.12)",
              marginBottom: "2.75rem",
              background: "rgba(244,239,230,0.15)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "4px",
              padding: "2rem 2rem 2rem 2rem",
            }}
          >
            <h2 style={{ ...dg, fontSize: "clamp(2.25rem, 7vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.85, color: DARK }}>
              OUR<br />MANDATE
            </h2>
            <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888", paddingBottom: "0.3rem" }}>
              Article I &amp; III
            </span>
          </div>

          <div
            className="dlsau-reveal"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
              gap: "3rem",
              background: "rgba(244,239,230,0.15)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "4px",
              padding: "2.5rem",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.54rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                  Preamble
                </span>
              </div>
              <p style={{ ...ss, fontSize: "1rem", lineHeight: 1.85, color: "rgba(17,17,17,0.68)", fontWeight: 300 }}>
                Guided by the Lasallian Core Values — Spirit of Faith, Zeal for Service, and Communion in
                Mission — and the ideals of Don Salvador Araneta, the USC affirms a democratic, autonomous,
                and genuine student council that protects the rights and welfare of every student, inculcates
                involvement in the university and society, and inspires Lasallians to be achievers for God and Country.
              </p>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem" }}>
                <span style={{ display: "block", width: 6, height: 6, borderRadius: "50%", background: GREEN, flexShrink: 0 }} />
                <span style={{ ...mono, fontSize: "0.54rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                  Purpose
                </span>
              </div>
              <p style={{ ...ss, fontSize: "1rem", lineHeight: 1.85, color: "rgba(17,17,17,0.68)", fontWeight: 300 }}>
                The USC serves as mediator between the student body and the Lasallian community, an active
                agent in promoting societal consciousness, and a unifying voice enjoining students to advance
                their rights and welfare together — while regularly consulting the student body to remain guided
                by their sentiments.
              </p>
            </div>
          </div>

          {/* Slogan callout */}
          <div
            className="dlsau-reveal"
            style={{
              marginTop: "3.5rem",
              padding: "2.5rem",
              borderTop: "1px solid rgba(17,17,17,0.1)",
              background: "rgba(244,239,230,0.15)",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              borderRadius: "4px",
            }}
          >
            <span
              aria-label="We Lead. We Serve."
              style={{
                ...dg,
                display: "block",
                fontSize: "clamp(1.75rem, 5vw, 3.25rem)",
                color: GREEN,
                letterSpacing: "-0.01em",
              }}
            >
              <span className="dlsau-slogan">
                &ldquo;WE <span className="dlsau-em">LEAD</span>. WE <span className="dlsau-em">SERVE</span>.&rdquo;
              </span>
            </span>
            <p style={{ ...ss, marginTop: "0.75rem", fontSize: "0.85rem", color: "rgba(17,17,17,0.45)", fontWeight: 300, maxWidth: "34rem" }}>
              The USC Campaign Slogan — reflecting the natural connection between student leadership and service.
            </p>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CORE INITIATIVES — cream editorial rows
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Arms and Advocacy"
        style={{
          background: CREAM,
          padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
        }}
      >
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
            ARMS &<br />ADVOCACY
          </h2>
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888", paddingBottom: "0.3rem" }}>
            Article XI
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
          COLLEGES — soft section with colour-accent cards
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        aria-label="Our Colleges"
        style={{
          position: "relative",
          color: DARK,
          padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
          overflow: "hidden",
        }}
      >
        {/* Background photo — swap the src below for your own image */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Image
            src="/about/colleges-bg.jpg"
            alt=""
            fill
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
          <div style={{ position: "absolute", inset: 0, background: "rgba(244,239,230,0.92)" }} />
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          {/* Section heading */}
          <div
            className="dlsau-reveal"
            style={{
              display: "flex", alignItems: "flex-end", justifyContent: "space-between",
              paddingBottom: "2rem",
              borderBottom: "1px solid rgba(17,17,17,0.1)",
              marginBottom: "1px",
            }}
          >
            <h2 style={{ ...dg, fontSize: "clamp(2.25rem, 7vw, 5.5rem)", letterSpacing: "-0.025em", lineHeight: 0.85, color: DARK }}>
              OUR<br />COLLEGES
            </h2>
            <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888", paddingBottom: "0.3rem" }}>
              04 branches
            </span>
          </div>

          {/* Grid — 1px gaps become visible lines against the light bg */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))",
            gap: "1px",
            background: "rgba(17,17,17,0.08)",
          }}>
            {colleges.map((college, i) => (
              <div
                key={college.acronym}
                className="dlsau-reveal dlsau-card"
                role="article"
                tabIndex={0}
                aria-label={college.name}
                style={{
                  position: "relative",
                  padding: "2.5rem",
                  background: "rgba(255,255,255,0.5)",
                  border: "1px solid rgba(17,17,17,0.07)",
                  overflow: "hidden",
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
                {/* Background ghost acronym */}
                <span
                  className="ghost"
                  aria-hidden="true"
                  style={{
                    position: "absolute", bottom: "-1rem", right: "-0.25rem",
                    ...dg,
                    fontSize: "5.5rem", lineHeight: 1,
                    color: "rgba(17,17,17,0.04)",
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

                  <span style={{ ...dg, display: "block", fontSize: "1.35rem", letterSpacing: "-0.01em", color: DARK, marginBottom: "0.65rem" }}>
                    {college.acronym}
                  </span>

                  <p style={{ ...ss, fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(17,17,17,0.5)", fontWeight: 300, marginBottom: "2.5rem" }}>
                    {college.name}
                  </p>

                  <div style={{ paddingTop: "1.25rem", borderTop: "1px solid rgba(17,17,17,0.08)" }}>
                    <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.42em", textTransform: "uppercase", color: college.color }}>
                      College Student Council
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
    </>
  );
}