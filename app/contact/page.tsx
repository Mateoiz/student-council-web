"use client";

import { useEffect } from "react";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes dlsau-reveal-in {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}

.dlsau-reveal { opacity: 0; }
.dlsau-reveal.in-view {
  animation: dlsau-reveal-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* Contact channel card */
.contact-card {
  transition: background 0.35s ease, border-color 0.35s ease, transform 0.35s ease;
  cursor: pointer;
}
.contact-card:hover { transform: translateY(-3px); }
.contact-card .contact-arrow {
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease;
  opacity: 0.4;
}
.contact-card:hover .contact-arrow {
  transform: translate(4px, -4px);
  opacity: 1;
}
.contact-card .contact-bar {
  transition: width 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.contact-card:hover .contact-bar { width: 100% !important; }
`;

/* ─── Data ─────────────────────────────────────────────────────────────────── */
const channels = [
  {
    index: "01",
    platform: "Facebook",
    handle: "DLSAUSC",
    description:
      "Follow our official Facebook page for announcements, event updates, resolutions, and everything happening within the Lasallian community.",
    href: "https://www.facebook.com/DLSAUSC",
    label: "facebook.com/DLSAUSC",
    color: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
      </svg>
    ),
  },
  {
    index: "02",
    platform: "Email",
    handle: "usc@dlsau.edu.ph",
    description:
      "Send us a direct message for formal concerns, partnership inquiries, student welfare issues, or any matter that requires an official response from the Council.",
    href: "mailto:usc@dlsau.edu.ph",
    label: "usc@dlsau.edu.ph",
    color: "#16a34a",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" width="28" height="28" aria-hidden="true">
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
      "See our latest photos, stories, and behind-the-scenes moments from USC events, advocacy drives, and student life at DLSAU.",
    href: "https://www.instagram.com/usc_dlsau/",
    label: "instagram.com/usc_dlsau",
    color: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

/* ─── Arrow SVG ────────────────────────────────────────────────────────────── */
function ArrowUpRight() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
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
          HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        padding: "clamp(6rem, 10vw, 8rem) clamp(2rem, 5vw, 5.5rem) 2.5rem",
        borderBottom: "1px solid rgba(17,17,17,0.1)",
      }}>
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
          <span style={{ display: "block", height: 1, width: "2.5rem", background: GREEN, flexShrink: 0 }} />
          <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
            Reach Out
          </span>
        </div>

        <h1 style={{ margin: 0 }}>
          <span style={{
            ...dg,
            display: "block",
            fontSize: "clamp(3.5rem, 11vw, 10rem)",
            lineHeight: 0.85,
            letterSpacing: "-0.025em",
            color: DARK,
          }}>
            LET'S
          </span>
          <span style={{
            ...ss,
            display: "block",
            fontSize: "clamp(2.75rem, 9vw, 8.5rem)",
            lineHeight: 0.9,
            fontStyle: "italic",
            fontWeight: 300,
            letterSpacing: "-0.01em",
            color: GREEN,
            paddingLeft: "clamp(0.5rem, 4vw, 5rem)",
            marginTop: "0.5rem",
          }}>
            connect
          </span>
        </h1>

        {/* Bottom rule */}
        <div style={{
          marginTop: "2.5rem",
          borderTop: "1px solid rgba(17,17,17,0.1)",
          paddingTop: "1.1rem",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(17,17,17,0.4)" }}>
            03 channels
          </span>
          <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(17,17,17,0.4)" }}>
            USC · DLSAU
          </span>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT CHANNELS
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
            marginBottom: "0",
          }}
        >
          <h2 style={{
            ...dg,
            fontSize: "clamp(2.25rem, 7vw, 5.5rem)",
            letterSpacing: "-0.025em",
            lineHeight: 0.85,
            margin: 0,
          }}>
            CONTACT<br />CHANNELS
          </h2>
          <span style={{
            ...mono,
            fontSize: "0.57rem", letterSpacing: "0.36em",
            textTransform: "uppercase", color: "#888",
            paddingBottom: "0.3rem",
          }}>
            Channels · DLSAU USC
          </span>
        </div>

        {/* Channel rows */}
        {channels.map((ch, i) => (
          <a
            key={ch.index}
            href={ch.href}
            target={ch.href.startsWith("mailto") ? undefined : "_blank"}
            rel={ch.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
            className="dlsau-reveal contact-card"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(56px, 84px) 1fr auto",
              gap: "1.5rem 2.5rem",
              padding: "3.5rem 0",
              borderBottom: "1px solid rgba(17,17,17,0.1)",
              alignItems: "start",
              textDecoration: "none",
              color: "inherit",
              animationDelay: `${i * 0.1}s`,
            }}
          >
            {/* Outlined index */}
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
              {ch.index}
            </span>

            {/* Content */}
            <div>
              {/* Platform tag row */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <span style={{ color: ch.color }}>{ch.icon}</span>
                <span style={{ ...mono, fontSize: "0.54rem", letterSpacing: "0.42em", textTransform: "uppercase", color: ch.color }}>
                  {ch.platform}
                </span>
              </div>

              {/* Handle / colour bar */}
              <div
                className="contact-bar"
                style={{ height: 2, width: "2.5rem", background: ch.color, marginBottom: "1.25rem" }}
              />

              <h3 style={{
                ...ss,
                fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)",
                fontWeight: 600,
                letterSpacing: "-0.015em",
                lineHeight: 1.1,
                marginBottom: "1rem",
                color: DARK,
              }}>
                {ch.handle}
              </h3>

              <p style={{
                ...ss,
                fontSize: "1rem",
                lineHeight: 1.8,
                color: "#555",
                fontWeight: 300,
                maxWidth: "36rem",
              }}>
                {ch.description}
              </p>

              {/* Clickable label */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.4rem",
                marginTop: "1.5rem",
                paddingTop: "1rem",
                borderTop: "1px solid rgba(17,17,17,0.08)",
              }}>
                <span style={{
                  ...mono,
                  fontSize: "0.54rem", letterSpacing: "0.3em",
                  textTransform: "uppercase", color: ch.color,
                }}>
                  {ch.label}
                </span>
              </div>
            </div>

            {/* Arrow indicator */}
            <div
              className="contact-arrow"
              style={{ color: ch.color, paddingTop: "0.35rem", flexShrink: 0 }}
            >
              <ArrowUpRight />
            </div>
          </a>
        ))}
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          OFFICE LOCATION — dark band
      ══════════════════════════════════════════════════════════════════════ */}
      <section style={{
        background: DARK,
        color: CREAM,
        padding: "5.5rem clamp(2rem, 5vw, 5.5rem)",
      }}>
        <div
          className="dlsau-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
            gap: "3rem 5rem",
            alignItems: "start",
          }}
        >
          {/* Left — heading */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
              <span style={{ display: "block", height: 1, width: "2rem", background: GREEN, flexShrink: 0 }} />
              <span style={{ ...mono, fontSize: "0.54rem", letterSpacing: "0.42em", textTransform: "uppercase", color: GREEN }}>
                Find Us
              </span>
            </div>
            <h2 style={{
              ...dg,
              fontSize: "clamp(2rem, 6vw, 4.5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.025em",
              color: CREAM,
              margin: 0,
            }}>
              OFFICE &amp;<br />LOCATION
            </h2>
          </div>

          {/* Right — address + hours */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* Address */}
            <div>
              <span style={{
                ...mono, fontSize: "0.5rem", letterSpacing: "0.42em",
                textTransform: "uppercase", color: GREEN,
                display: "block", marginBottom: "0.75rem",
              }}>
                Address
              </span>
              <p style={{
                ...ss, fontSize: "1.05rem", lineHeight: 1.8,
                color: "rgba(244,239,230,0.65)", fontWeight: 300, margin: 0,
              }}>
                USC Office, Student Center Building<br />
                De La Salle Araneta University<br />
                Victoneta Ave, Potrero<br />
                Malabon, Metro Manila, Philippines
              </p>
            </div>

            {/* Office hours */}
            <div>
              <span style={{
                ...mono, fontSize: "0.5rem", letterSpacing: "0.42em",
                textTransform: "uppercase", color: GREEN,
                display: "block", marginBottom: "0.75rem",
              }}>
                Office Hours
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {[
                  { day: "Mon – Fri", time: "8:00 AM – 5:00 PM" },
                  { day: "Saturday", time: "8:00 AM – 12:00 PM" },
                  { day: "Sunday",   time: "Closed" },
                ].map(({ day, time }) => (
                  <div key={day} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    gap: "2rem",
                    paddingBottom: "0.5rem",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <span style={{ ...mono, fontSize: "0.57rem", letterSpacing: "0.1em", color: "rgba(244,239,230,0.4)", textTransform: "uppercase" }}>
                      {day}
                    </span>
                    <span style={{ ...ss, fontSize: "0.95rem", color: time === "Closed" ? "rgba(244,239,230,0.25)" : CREAM, fontWeight: 300 }}>
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