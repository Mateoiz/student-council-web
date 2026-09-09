"use client";

import { useEffect } from "react";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes dlsau-reveal-in {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.dlsau-reveal { opacity: 0; }
.dlsau-reveal.in-view {
  animation: dlsau-reveal-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.ch-card {
  transition: border-color 0.25s ease, transform 0.25s ease;
}
.ch-card:hover { transform: translateY(-4px); }

.ch-bar {
  transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.ch-card:hover .ch-bar { width: 100% !important; }

.ch-arrow {
  transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s;
  opacity: 0.35;
}
.ch-card:hover .ch-arrow {
  transform: translate(3px, -3px);
  opacity: 1;
}
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const channels = [
  {
    index: "01",
    platform: "Facebook",
    handle: "DLSAUSC",
    description:
      "Official announcements, event updates, resolutions, and everything happening within the Lasallian community.",
    href: "https://www.facebook.com/DLSAUSC",
    label: "facebook.com/DLSAUSC",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    index: "02",
    platform: "Email",
    handle: "usc@dlsau.edu.ph",
    description:
      "Formal concerns, partnership inquiries, student welfare issues, or anything requiring an official Council response.",
    href: "mailto:usc@dlsau.edu.ph",
    label: "usc@dlsau.edu.ph",
    color: "#16a34a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="24" height="24" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    index: "03",
    platform: "Instagram",
    handle: "@usc_dlsau",
    description:
      "Photos, stories, and behind-the-scenes from USC events, advocacy drives, and student life at DLSAU.",
    href: "https://www.instagram.com/usc_dlsau/",
    label: "instagram.com/usc_dlsau",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

/* ─── Arrow SVG ────────────────────────────────────────────────────────────── */
function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
      <path d="M3 13L13 3M13 3H6M13 3v7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Component ────────────────────────────────────────────────────────────── */
export default function ContactPage() {
  useEffect(() => {
    const id = "dlsau-contact-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.1 },
    );
    const t = setTimeout(
      () => document.querySelectorAll(".dlsau-reveal").forEach((el) => io.observe(el)),
      60,
    );
    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  const dg   = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss   = { fontFamily: "'Source Serif 4', serif" };
  const mono = { fontFamily: "'IBM Plex Mono', monospace" };

  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const GREEN = "#16a34a";

  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden" }}>

      {/* ══════════════════════════════════════════════════════════════════════
          HEADER — compact horizontal strip
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "clamp(3rem, 5vw, 4.5rem) clamp(2rem, 5vw, 5.5rem) clamp(2rem, 3vw, 2.75rem)",
        borderBottom: "1px solid rgba(17,17,17,0.1)",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        alignItems: "end",
        gap: "2rem",
      }}>
        {/* Left — eyebrow + headline on one row */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.1rem" }}>
            <span style={{ display: "block", height: 1, width: "1.75rem", background: GREEN, flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
              Reach Out
            </span>
          </div>
          <h1 style={{
            margin: 0,
            display: "flex",
            alignItems: "baseline",
            gap: "clamp(0.5rem, 2vw, 1.25rem)",
            flexWrap: "wrap",
          }}>
            <span style={{
              ...dg,
              fontSize: "clamp(2.5rem, 6.5vw, 5.5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.025em",
              color: DARK,
            }}>
              LET'S
            </span>
            <span style={{
              ...ss,
              fontSize: "clamp(2rem, 5.5vw, 4.75rem)",
              lineHeight: 0.9,
              fontStyle: "italic",
              fontWeight: 300,
              letterSpacing: "-0.01em",
              color: GREEN,
            }}>
              connect.
            </span>
          </h1>
        </div>

        {/* Right — meta tags */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.3rem", paddingBottom: "0.2rem" }}>
          <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(17,17,17,0.32)" }}>
            USC · DLSAU
          </span>
          <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(17,17,17,0.32)" }}>
            03 Channels
          </span>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT CHANNELS — 3-column card grid
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: CREAM,
        padding: "3.5rem clamp(2rem, 5vw, 5.5rem)",
      }}>
        {/* Section heading row */}
        <div
          className="dlsau-reveal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "1.25rem",
            borderBottom: `2px solid ${DARK}`,
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
            CONTACT CHANNELS
          </h2>
          <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.36em", textTransform: "uppercase", color: "#888" }}>
            Channels · DLSAU USC
          </span>
        </div>

        {/* Card grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1.25rem",
        }}>
          {channels.map((ch, i) => (
            <a
              key={ch.index}
              href={ch.href}
              target={ch.href.startsWith("mailto") ? undefined : "_blank"}
              rel={ch.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
              className="dlsau-reveal ch-card"
              style={{
                display: "flex",
                flexDirection: "column",
                padding: "1.75rem 1.625rem",
                border: "1px solid rgba(17,17,17,0.12)",
                textDecoration: "none",
                color: "inherit",
                animationDelay: `${i * 0.08}s`,
                position: "relative",
                background: CREAM,
              }}
            >
              {/* Ghost index — top-right corner */}
              <span style={{
                ...dg,
                position: "absolute",
                top: "1.1rem",
                right: "1.25rem",
                fontSize: "2rem",
                lineHeight: 1,
                color: "transparent",
                WebkitTextStroke: "1px rgba(17,17,17,0.1)",
                letterSpacing: "-0.02em",
                userSelect: "none",
              }}>
                {ch.index}
              </span>

              {/* Platform tag */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                <span style={{ color: ch.color }}>{ch.icon}</span>
                <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.4em", textTransform: "uppercase", color: ch.color }}>
                  {ch.platform}
                </span>
              </div>

              {/* Animated colour bar */}
              <div
                className="ch-bar"
                style={{ height: "1.5px", width: "1.75rem", background: ch.color, margin: "1.35rem 0 0.9rem" }}
              />

              {/* Handle */}
              <h3 style={{
                ...ss,
                fontSize: "clamp(1.05rem, 2vw, 1.35rem)",
                fontWeight: 600,
                letterSpacing: "-0.01em",
                lineHeight: 1.15,
                marginBottom: "0.75rem",
                color: DARK,
              }}>
                {ch.handle}
              </h3>

              {/* Description */}
              <p style={{
                ...ss,
                fontSize: "0.875rem",
                lineHeight: 1.75,
                color: "#666",
                fontWeight: 300,
                margin: 0,
                flex: 1,
              }}>
                {ch.description}
              </p>

              {/* Footer: label + arrow */}
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "1.35rem",
                paddingTop: "0.9rem",
                borderTop: "1px solid rgba(17,17,17,0.08)",
              }}>
                <span style={{
                  ...mono,
                  fontSize: "0.45rem",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  color: ch.color,
                }}>
                  {ch.label}
                </span>
                <span className="ch-arrow" style={{ color: ch.color }}>
                  <ArrowUpRight />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          OFFICE LOCATION — dark band
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: DARK,
        color: CREAM,
        padding: "4rem clamp(2rem, 5vw, 5.5rem)",
      }}>
        <div
          className="dlsau-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
            gap: "2.5rem 5rem",
            alignItems: "start",
          }}
        >
          {/* Left — heading */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <span style={{ display: "block", height: 1, width: "1.75rem", background: GREEN, flexShrink: 0 }} />
              <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                Find Us
              </span>
            </div>
            <h2 style={{
              ...dg,
              fontSize: "clamp(1.75rem, 4.5vw, 3.5rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.025em",
              color: CREAM,
              margin: 0,
            }}>
              OFFICE &amp;<br />LOCATION
            </h2>
          </div>

          {/* Right — address + hours */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* Address */}
            <div>
              <span style={{
                ...mono, fontSize: "0.48rem", letterSpacing: "0.42em",
                textTransform: "uppercase", color: GREEN,
                display: "block", marginBottom: "0.6rem",
              }}>
                Address
              </span>
              <p style={{
                ...ss, fontSize: "0.975rem", lineHeight: 1.8,
                color: "rgba(244,239,230,0.6)", fontWeight: 300, margin: 0,
              }}>
                USC Office, Life Science Building<br />
                De La Salle Araneta University<br />
                Victoneta Ave, Potrero<br />
                Malabon, Metro Manila, Philippines
              </p>
            </div>

            {/* Office hours */}
            <div>
              <span style={{
                ...mono, fontSize: "0.48rem", letterSpacing: "0.42em",
                textTransform: "uppercase", color: GREEN,
                display: "block", marginBottom: "0.6rem",
              }}>
                Office Hours
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {[
                  { day: "Mon – Fri", time: "8:00 AM – 5:00 PM" },
                  { day: "Saturday",  time: "8:00 AM – 12:00 PM" },
                  { day: "Sunday",    time: "Closed" },
                ].map(({ day, time }) => (
                  <div key={day} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    gap: "2rem",
                    paddingBottom: "0.35rem",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.1em", color: "rgba(244,239,230,0.38)", textTransform: "uppercase" }}>
                      {day}
                    </span>
                    <span style={{ ...ss, fontSize: "0.925rem", color: time === "Closed" ? "rgba(244,239,230,0.22)" : CREAM, fontWeight: 300 }}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}