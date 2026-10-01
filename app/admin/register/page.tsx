"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Sparkles, HeartHandshake } from "lucide-react";
import { supabase } from "@/lib/supabase";

const CREAM = "#F4EFE6";
const DARK = "#111111";
const GREEN = "#06402B";
const RED = "#dc2626";
const HEADER_H = "5rem";

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const dg = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss = { fontFamily: "'Source Serif 4', serif" } as const;

export default function RegisterAdminHub() {
  const [flairCount, setFlairCount] = useState<number | null>(null);
  const [castCount, setCastCount] = useState<number | null>(null);

  const fetchCounts = async () => {
    try {
      const [{ count: fCount }, { count: cCount }] = await Promise.all([
        supabase.from("flair_registrations").select("id", { count: "exact", head: true }),
        supabase.from("cast_seminar_registrations").select("id", { count: "exact", head: true }),
      ]);
      setFlairCount(fCount ?? 0);
      setCastCount(cCount ?? 0);
    } catch {
      // fallback in case of connection drop
    }
  };

  useEffect(() => {
    fetchCounts();

    const chFlair = supabase
      .channel("flair_hub_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "flair_registrations" }, fetchCounts)
      .subscribe();

    const chCast = supabase
      .channel("cast_hub_sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "cast_seminar_registrations" }, fetchCounts)
      .subscribe();

    return () => {
      supabase.removeChannel(chFlair);
      supabase.removeChannel(chCast);
    };
  }, []);

  return (
    <div
      style={{
        background: CREAM,
        color: DARK,
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        ...ss,
      }}
    >

      {/* Fixed top buffer to prevent fixed navbar overlapping during scroll */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: `calc(${HEADER_H} + env(safe-area-inset-top))`,
          background: CREAM,
          zIndex: 19,
          pointerEvents: "none",
        }}
      />

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 980,
          margin: "0 auto",
          padding: `calc(${HEADER_H} + env(safe-area-inset-top) + 1.25rem) clamp(1rem, 4vw, 2.5rem) calc(3rem + env(safe-area-inset-bottom))`,
          boxSizing: "border-box",
        }}
      >
        {/* Navigation Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: "1rem",
            marginBottom: "1.75rem",
            borderBottom: "1px solid rgba(17,17,17,0.12)",
          }}
        >
          <Link
            href="/admin"
            style={{
              ...mono,
              fontSize: "clamp(0.65rem, 2.2vw, 0.72rem)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#666",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.3rem 0",
            }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>

          <span
            style={{
              ...mono,
              fontSize: "clamp(0.58rem, 2vw, 0.65rem)",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: GREEN,
              fontWeight: 600,
            }}
          >
            Registration Control
          </span>
        </div>

        {/* Hero Title */}
        <div style={{ marginBottom: "clamp(1.75rem, 4.5vw, 2.75rem)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
            <span style={{ display: "block", height: 1, width: "1.75rem", background: GREEN }} />
            <span
              style={{
                ...mono,
                fontSize: "clamp(0.55rem, 2vw, 0.62rem)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: GREEN,
              }}
            >
              Monitor & Records
            </span>
          </div>

          <h1
            style={{
              ...dg,
              fontSize: "clamp(1.65rem, 5vw, 2.6rem)",
              margin: 0,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Attendee Registrations
          </h1>
          <p
            style={{
              fontSize: "clamp(0.85rem, 2.5vw, 0.95rem)",
              color: "rgba(17,17,17,0.65)",
              fontWeight: 300,
              margin: "0.6rem 0 0",
              maxWidth: "36rem",
              lineHeight: 1.55,
            }}
          >
            Select an event stream to view real-time rosters, search registrant credentials, and manage gate attendance.
          </p>
        </div>

        {/* Adaptive 2-Column Responsive Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
            gap: "clamp(1rem, 3vw, 1.5rem)",
          }}
        >
          {/* Card 1: FLAIR */}
          <Link
            href="/admin/register/flair"
            style={{
              background: GREEN,
              color: CREAM,
              borderRadius: 12,
              padding: "clamp(1.35rem, 3.5vw, 2rem)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
              minHeight: 230,
              boxShadow: "0 10px 30px rgba(6,64,43,0.18)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            {/* Watermark */}
            <span
              aria-hidden
              style={{
                ...dg,
                position: "absolute",
                right: "-0.08em",
                bottom: "-0.22em",
                fontSize: "clamp(6rem, 16vw, 9.5rem)",
                lineHeight: 1,
                color: "rgba(244,239,230,0.06)",
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              FLAIR
            </span>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(244,239,230,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: CREAM,
                  }}
                >
                  <Sparkles size={22} />
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(244,239,230,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: CREAM,
                  }}
                >
                  <ArrowUpRight size={16} />
                </div>
              </div>

              <span
                style={{
                  ...mono,
                  display: "block",
                  fontSize: "0.6rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#86efac",
                }}
              >
                USC Frosh Walk 2026
              </span>
              <h2
                style={{
                  ...dg,
                  fontSize: "clamp(1.35rem, 3.8vw, 1.7rem)",
                  margin: "0.25rem 0 0",
                  letterSpacing: "-0.01em",
                }}
              >
                FLAIR Roster
              </h2>
              <p
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 300,
                  color: "rgba(244,239,230,0.8)",
                  lineHeight: 1.5,
                  margin: "0.5rem 0 0",
                  maxWidth: "24rem",
                }}
              >
                Participants list, student emails, mobile contact numbers, and campus college allocations.
              </p>
            </div>

            <div
              style={{
                marginTop: "1.75rem",
                paddingTop: "0.85rem",
                borderTop: "1px solid rgba(244,239,230,0.14)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                ...mono,
              }}
            >
              <span style={{ fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.8 }}>
                Total Registrants
              </span>
              <span style={{ fontSize: "1.45rem", fontWeight: 600 }}>
                {flairCount === null ? "…" : flairCount}
              </span>
            </div>
          </Link>

          {/* Card 2: CAST Seminar */}
          <Link
            href="/admin/register/cast"
            style={{
              background: "#ffffff",
              color: DARK,
              borderRadius: 12,
              border: "1px solid rgba(17,17,17,0.1)",
              borderTop: `4px solid ${RED}`,
              padding: "clamp(1.35rem, 3.5vw, 2rem)",
              textDecoration: "none",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 230,
              boxShadow: "0 8px 24px rgba(17,17,17,0.05)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-3px)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 10,
                    background: "rgba(220,38,38,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: RED,
                  }}
                >
                  <HeartHandshake size={22} />
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "rgba(17,17,17,0.05)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: DARK,
                  }}
                >
                  <ArrowUpRight size={16} />
                </div>
              </div>

              <span
                style={{
                  ...mono,
                  display: "block",
                  fontSize: "0.6rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: RED,
                  fontWeight: 600,
                }}
              >
                Rizal Hall · Oct 8, 12:30 PM
              </span>
              <h2
                style={{
                  ...dg,
                  fontSize: "clamp(1.35rem, 3.8vw, 1.7rem)",
                  margin: "0.25rem 0 0",
                  letterSpacing: "-0.01em",
                }}
              >
                CAST Seminar
              </h2>
              <p
                style={{
                  fontSize: "0.84rem",
                  fontWeight: 300,
                  color: "#666",
                  lineHeight: 1.5,
                  margin: "0.5rem 0 0",
                  maxWidth: "24rem",
                }}
              >
                Suicide Prevention Month seminar pass monitor, two-step QR door scans, and attendance log.
              </p>
            </div>

            <div
              style={{
                marginTop: "1.75rem",
                paddingTop: "0.85rem",
                borderTop: "1px solid rgba(17,17,17,0.08)",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                ...mono,
              }}
            >
              <span style={{ fontSize: "0.66rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#777" }}>
                Reserved Passes
              </span>
              <span style={{ fontSize: "1.45rem", fontWeight: 600, color: DARK }}>
                {castCount === null ? "…" : castCount}
              </span>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}