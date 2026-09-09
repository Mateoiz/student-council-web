"use client";

import { use, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

/* ─── Injected CSS ─────────────────────────────────────────────────────────── */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300;1,8..60,400&family=IBM+Plex+Mono:wght@400;500&display=swap');

@keyframes col-reveal-in {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes col-slide-right {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes col-underline-grow {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

.col-reveal { opacity: 0; }
.col-reveal.in-view {
  animation: col-reveal-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.col-reveal.delay-1 { animation-delay: 0.08s; }
.col-reveal.delay-2 { animation-delay: 0.16s; }
.col-reveal.delay-3 { animation-delay: 0.24s; }

.col-card {
  transition: border-color 0.25s ease, transform 0.25s ease, background 0.25s ease;
}
.col-card:hover {
  transform: translateY(-3px);
}

.col-member-card {
  transition: border-color 0.25s ease, background 0.25s ease, transform 0.2s ease;
}
.col-member-card:hover {
  transform: translateY(-2px);
}

.col-org-tag {
  transition: background 0.2s ease, color 0.2s ease;
  cursor: default;
}

.col-back-btn {
  transition: gap 0.2s ease, opacity 0.2s ease;
  text-decoration: none;
}
.col-back-btn:hover {
  opacity: 0.7;
}

.col-section-rule::after {
  content: '';
  display: block;
  height: 1px;
  background: currentColor;
  opacity: 0.12;
  margin-top: 1.25rem;
  transform-origin: left;
  animation: col-underline-grow 0.8s cubic-bezier(0.16,1,0.3,1) 0.3s both;
}

@media (max-width: 768px) {
  .col-hero-grid { grid-template-columns: 1fr !important; }
  .col-members-grid { grid-template-columns: repeat(2, 1fr) !important; }
  .col-spine { display: none !important; }
}
`;

/* ─── College Data ──────────────────────────────────────────────────────────── */
const COLLEGE_DATA: Record<string, {
  acronym: string;
  name: string;
  color: string;
  tagline: string;
  about: string[];
  dean: { name: string; title: string; bio: string };
  chairs: { program: string; role: string; name: string }[];
  orgs: { name: string; acronym: string; type: string }[];
  council: { name: string; position: string; year: string }[];
}> = {
  CVMAS: {
    acronym: "CVMAS",
    name: "College of Veterinary Medicine & Agricultural Sciences",
    color: "#005c00",
    tagline: "Healing, Growing, Serving the Land.",
    about: [
      "The College of Veterinary Medicine and Agricultural Sciences (CVMAS) is committed to producing globally competitive graduates in veterinary medicine and agriculture who are imbued with Lasallian values of faith, service, and community.",
      "The college maintains state-of-the-art laboratories, a teaching hospital, and demonstration farms that provide students with hands-on experience in animal care, crop science, and sustainable agricultural practices.",
      "CVMAS graduates are equipped to address food security, animal health, and environmental sustainability — pressing concerns that define the Philippines' agricultural landscape.",
    ],
    dean: {
      name: "Dr. Antonio M. Glinoga",
      title: "Dean, College of Veterinary Medicine & Agricultural Sciences",
      bio: "Dr. Glinoga leads the College of Veterinary Medicine and Agricultural Sciences at De La Salle Araneta University, guiding programs in veterinary medicine, agriculture, and food technology toward excellence in research, service, and Lasallian formation.",
    },
    chairs: [
      { program: "Agriculture Program", role: "Chair", name: "Mr. Elmer C. Montebon" },
      { program: "Food Technology", role: "OIC-Program Chair", name: "Ms. Janine R. Maniego" },
      { program: "Basic Veterinary Science", role: "OIC-Department Chair", name: "Dr. Cecilia D. Domingo" },
      { program: "Veterinary Paraclinical", role: "OIC-Department Chair", name: "Dr. Almer B. Rosario" },
      { program: "Veterinary Clinical", role: "OIC-Department Chair", name: "Dr. Querobin S. Dycoco, Jr." },
    ],
    orgs: [
      { name: "Agri Student Society in Araneta", acronym: "AGSA", type: "Academic" },
      { name: "Philippine Association of Food Technologies - GAMMA Chapter", acronym: "PAFT-GAMMA", type: "Academic" },
      { name: "Veterinary Clinicians Society", acronym: "VCS", type: "Academic" },
    ],
    council: [
    ],
  },
  CBMA: {
    acronym: "CBMA",
    name: "College of Business Management & Accountancy",
    color: "#ca8a04",
    tagline: "Building Leaders. Creating Value.",
    about: [
      "The College of Business Management and Accountancy (CBMA) prepares students for dynamic roles in the global business landscape through rigorous academic programs in accountancy, business administration, and management.",
      "Anchored in Lasallian values, CBMA cultivates ethical leaders who are analytically sharp, socially responsible, and entrepreneurially driven — ready to navigate complex economic challenges and create sustainable value.",
      "The college maintains active partnerships with industry organizations, providing students with internship opportunities, mentorship programs, and professional development experiences that bridge classroom learning with real-world practice.",
    ],
    dean: {
      name: "Dr. Ma. Edwina A. Ala",
      title: "Dean, College of Business, Management, and Accountancy",
      bio: "Dr. Ala leads the College of Business, Management, and Accountancy at De La Salle Araneta University, overseeing programs in accountancy, business administration, and hospitality and tourism management, committed to forming ethical and globally competitive business professionals.",
    },
    chairs: [
      { program: "Accountancy Program", role: "Chair", name: "Dr. Cresenciana R. Bundoc" },
      { program: "Business Administration Program", role: "Chair", name: "Dr. Edna B. de Ocampo" },
      { program: "Hospitality & Tourism Management Programs", role: "Chair", name: "Ms. Sheriebelou T. Alejo" },
    ],
    orgs: [
      { name: "Hospitality Management Society", acronym: "HMS", type: "Academic" },
      { name: "Tourism Movers Society", acronym: "TMS", type: "Academic" },
      { name: "Junior Philippine Institute of Accountants", acronym: "JPIA", type: "Academic" },
      { name: "Junior Financial Executives", acronym: "JFINEX", type: "Academic" },
      { name: "Junior Marketing Executives", acronym: "JMEX", type: "Academic" },
    ],
    council: [
      { name: "Justin Gio Capuno", position: "Chairperson", year: "2nd Year"  },
      { name: "Lisa Espejo", position: "Vice Chairperson", year: "2nd Year" },
    ],
  },
  CAST: {
    acronym: "CAST",
    name: "College of Arts, Science, and Technology",
    color: "#dc2626",
    tagline: "Curious Minds. Bold Ideas.",
    about: [
      "The College of Arts, Science, and Technology (CAST) is the intellectual cornerstone of DLSAU, offering programs that span the sciences, social sciences, humanities, information technology, and engineering technology.",
      "CAST champions interdisciplinary inquiry — fostering students who question, analyze, and create solutions that transcend conventional academic boundaries. The college's research culture is vibrant, producing outputs that contribute to both scientific knowledge and community development.",
      "With cutting-edge computing laboratories, science research facilities, and active faculty-student research collaborations, CAST equips graduates with critical thinking and technical competencies demanded by the 21st century.",
    ],
    dean: {
      name: "Dr. Marilyn B. Rubrica",
      title: "Dean, College of Arts, Science, and Technology",
      bio: "Dr. Rubrica leads the College of Arts, Science, and Technology at De La Salle Araneta University, overseeing programs in information technology, computer engineering, psychology, and the sciences. Under her leadership, CAST continues to develop globally competitive graduates grounded in Lasallian values.",
    },
    chairs: [
      { program: "Computer Engineering & Computer Science Programs", role: "Chair", name: "Engr. Julius P. Bancud" },
      { program: "Psychology Program", role: "Chair", name: "Mr. Ramon Paulo E. Masagca" },
      { program: "Language and Literature Courses", role: "Coordinator", name: "Mr. Ramil B. Pellogo" },
      { program: "Math and Science Courses", role: "Coordinator", name: "Mr. Leo E. Dizon" },
      { program: "Human and Societal Formation Courses", role: "Coordinator", name: "Mr. Brian G. Romasoc" },
      { program: "NSTP", role: "Coordinator", name: "Mr. Allan Rey D. Salvado" },
    ],
    orgs: [
      { name: "Junior Philippine Computer Society DLSAU", acronym: "JPCS", type: "Academic" },
      { name: "Psychology Society DLSAU", acronym: "PsychSoc", type: "Academic" },
      { name: "Lasalle Araneta Computer Engineering Society", acronym: "LACES", type: "Academic" },
        ],
    council: [
      { name: "Jeshelei Mitch Begino", position: "Chairperson", year: "3rd Year" },
      { name: "Ice Matthew Ramirez", position: "Vice-Chairperson", year: "3rd Year" },
    ],
  },
  COED: {
    acronym: "COED",
    name: "College of Education",
    color: "#2563eb",
    tagline: "Shaping Teachers. Transforming Lives.",
    about: [
      "The College of Education (COED) fulfills a deeply Lasallian mission: forming teachers who are competent, compassionate, and committed to the holistic development of every learner.",
      "COED programs emphasize both content mastery and pedagogical excellence, integrating technology-enhanced instruction, inclusive education principles, and field immersion experiences that prepare graduates for diverse classroom realities.",
      "COED consistently produces top LET board passers and teacher-licensure exam achievers, a testament to the rigor and quality of its formation programs and the dedication of its faculty mentors.",
    ],
    dean: {
      name: "Dr. Irene U. Dalog",
      title: "Dean, College of Education",
      bio: "Dr. Dalog leads the College of Education at De La Salle Araneta University, also serving as Chair of the Education Programs. She is committed to forming competent and compassionate educators anchored in Lasallian values who are ready to serve diverse learning communities.",
    },
    chairs: [
      { program: "Education Programs", role: "Chair", name: "Dr. Irene U. Dalog" },
    ],
    orgs: [
      { name: "Future Educators' Society", acronym: "FES", type: "Academic" },
    ],
    council: [
      { name: "Vince Paulino", position: "Chairperson", year: "2nd Year" },
      { name: "Lois Hortizuela", position: "Vice Chairperson", year: "2nd Year" },
      { name: "Kim Macayayong", position: "Secretary", year: "2nd Year" },
    ],
  },
};

/* ─── Helpers ──────────────────────────────────────────────────────────────── */
function hexRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? `${parseInt(r[1], 16)},${parseInt(r[2], 16)},${parseInt(r[3], 16)}` : "0,0,0";
}

function SectionHead({
  title, sub, color, dg, mono,
}: { title: string; sub: string; color: string; dg: React.CSSProperties; mono: React.CSSProperties }) {
  return (
    <div className="col-reveal col-section-rule" style={{ marginBottom: "2.25rem", color: "#111111" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ display: "block", width: 8, height: 8, background: color, flexShrink: 0 }} />
          <h2 style={{ ...dg, fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", letterSpacing: "-0.02em", margin: 0, color: "#111111" }}>
            {title}
          </h2>
        </div>
        <span style={{ ...mono, fontSize: "0.46rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "rgba(17,17,17,0.35)" }}>
          {sub}
        </span>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function CollegePage({ params }: { params: Promise<{ acronym: string }> }) {
  const { acronym: rawAcronym } = use(params);
  const acronym = rawAcronym.toUpperCase();
  const college = COLLEGE_DATA[acronym];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = "col-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = STYLES;
      document.head.appendChild(el);
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add("in-view")),
      { threshold: 0.08 },
    );
    const t = setTimeout(
      () => document.querySelectorAll(".col-reveal").forEach(el => io.observe(el)),
      60,
    );
    return () => { clearTimeout(t); io.disconnect(); };
  }, []);

  if (!college) return notFound();

  const dg    = { fontFamily: "'Dela Gothic One', sans-serif" };
  const ss    = { fontFamily: "'Source Serif 4', serif" };
  const mono  = { fontFamily: "'IBM Plex Mono', monospace" };
  const CREAM = "#F4EFE6";
  const DARK  = "#111111";
  const { color } = college;
  const rgb = hexRgb(color);

  const ORG_TYPE_COLORS: Record<string, string> = {
    Academic: "#111111",
    Professional: color,
    Service: "#005c00",
    Advocacy: "#7c3aed",
  };

  return (
    <div style={{ background: CREAM, color: DARK, overflowX: "hidden", minHeight: "100dvh" }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          minHeight: "72dvh",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Color wash bg */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: `rgba(${rgb},0.06)` }} />
          <div style={{
            position: "absolute", inset: 0, opacity: 0.04, mixBlendMode: "multiply",
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          }} />
          {/* Bottom gradient blend */}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, rgba(244,239,230,0) 0%, ${CREAM} 100%)` }} />
        </div>

        {/* Ghost acronym watermark */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", overflow: "hidden", pointerEvents: "none", paddingRight: "clamp(2rem, 5vw, 5.5rem)" }}>
          <span style={{ ...dg, fontSize: "clamp(8rem, 22vw, 20rem)", color: "transparent", WebkitTextStroke: `1.5px rgba(${rgb},0.12)`, letterSpacing: "-0.04em", lineHeight: 1, userSelect: "none" }}>
            {college.acronym}
          </span>
        </div>

        {/* Spine */}
        <div aria-hidden="true" className="col-spine" style={{ position: "absolute", left: "1.25rem", top: "50%", transform: "translateY(-50%) rotate(-90deg)", whiteSpace: "nowrap", ...mono, fontSize: "0.48rem", letterSpacing: "0.42em", color: "rgba(17,17,17,0.25)", textTransform: "uppercase" }}>
          DLSAU · USC · {college.acronym}
        </div>

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 10, flex: 1,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "clamp(6rem, 12vw, 9rem) clamp(2rem, 5vw, 5.5rem) clamp(2.5rem, 5vw, 4rem)",
        }}>
          {/* Back link */}
          <Link href="/about" className="col-back-btn" style={{
            display: "inline-flex", alignItems: "center", gap: "0.5rem", marginBottom: "2.5rem",
            ...mono, fontSize: "0.5rem", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(17,17,17,0.45)",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to About
          </Link>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.25rem" }}>
            <span style={{ display: "block", height: 1, width: "1.75rem", background: color, flexShrink: 0 }} />
            <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.44em", textTransform: "uppercase", color }}>
              College Student Council
            </span>
          </div>

          {/* Headline */}
          <div className="col-hero-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", alignItems: "end", gap: "1.75rem" }}>
            <div>
              <h1 style={{ margin: 0 }}>
                <span style={{ ...dg, display: "block", fontSize: "clamp(3.5rem, 11vw, 10rem)", lineHeight: 0.88, letterSpacing: "-0.03em", color: DARK }}>
                  {college.acronym}
                </span>
                <span style={{ ...ss, display: "block", fontSize: "clamp(1rem, 2.2vw, 1.7rem)", fontWeight: 300, fontStyle: "italic", color, lineHeight: 1.3, marginTop: "0.75rem", maxWidth: "32rem" }}>
                  {college.name}
                </span>
              </h1>
            </div>
          </div>

          {/* Tagline */}
          <p style={{ ...ss, marginTop: "1.5rem", fontSize: "1.05rem", lineHeight: 1.75, color: "rgba(17,17,17,0.5)", fontWeight: 300, maxWidth: "28rem" }}>
            {college.tagline}
          </p>

          {/* Color bar accent */}
          <div style={{ marginTop: "2rem", height: 3, width: "clamp(3rem, 8vw, 6rem)", background: color }} />
        </div>
      </section>

      {/* ── ABOUT COLLEGE ─────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem clamp(2rem, 5vw, 5.5rem)" }}>
        <SectionHead title="ABOUT THE COLLEGE" sub="Overview" color={color} dg={dg} mono={mono} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: "1.25rem" }}>
          {college.about.map((para, i) => (
            <div
              key={i}
              className={`col-reveal delay-${i}`}
              style={{
                padding: "1.75rem",
                border: "1px solid rgba(17,17,17,0.1)",
                background: "rgba(255,255,255,0.55)",
                backdropFilter: "blur(8px)",
                position: "relative",
              }}
            >
              <span aria-hidden="true" style={{ ...mono, position: "absolute", top: "1rem", right: "1.25rem", fontSize: "0.42rem", letterSpacing: "0.3em", color: `rgba(${rgb},0.35)` }}>
                0{i + 1}
              </span>
              <p style={{ ...ss, fontSize: "0.9rem", lineHeight: 1.9, color: "rgba(17,17,17,0.65)", fontWeight: 300, margin: 0 }}>
                {para}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DEAN ──────────────────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem clamp(2rem, 5vw, 5.5rem)",
          background: `rgba(${rgb},0.04)`,
          borderTop: "1px solid rgba(17,17,17,0.06)",
          borderBottom: "1px solid rgba(17,17,17,0.06)",
        }}
      >
        <SectionHead title="THE DEAN" sub="Leadership" color={color} dg={dg} mono={mono} />

        {/* Dean card */}
        <div
          className="col-reveal"
          style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "2.5rem",
            alignItems: "start",
            padding: "2.25rem",
            border: "1px solid rgba(17,17,17,0.1)",
            background: CREAM,
            marginBottom: college.chairs.length > 0 ? "1.25rem" : 0,
          }}
        >
          {/* Avatar placeholder */}
          <div style={{
            width: "clamp(4.5rem, 10vw, 7rem)",
            aspectRatio: "1",
            background: `rgba(${rgb},0.12)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: `2px solid rgba(${rgb},0.3)`,
          }}>
            <svg width="40%" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.6">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          <div>
            {/* Name & title */}
            <div style={{ marginBottom: "1.25rem" }}>
              <h3 style={{ ...dg, fontSize: "clamp(1.1rem, 2.5vw, 1.7rem)", letterSpacing: "-0.02em", margin: "0 0 0.4rem", color: DARK }}>
                {college.dean.name}
              </h3>
              <span style={{ ...mono, fontSize: "0.48rem", letterSpacing: "0.36em", textTransform: "uppercase", color }}>
                {college.dean.title}
              </span>
            </div>

            {/* Bio */}
            <p style={{ ...ss, fontSize: "0.9rem", lineHeight: 1.9, color: "rgba(17,17,17,0.6)", fontWeight: 300, margin: 0 }}>
              {college.dean.bio}
            </p>
          </div>
        </div>

        {/* Program Chairs table */}
        {college.chairs.length > 0 && (
          <div className="col-reveal" style={{ border: "1px solid rgba(17,17,17,0.1)", overflow: "hidden" }}>
            {/* Table header */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr auto",
              padding: "0.75rem 1.5rem",
              background: `rgba(${rgb},0.07)`,
              borderBottom: "1px solid rgba(17,17,17,0.08)",
            }}>
              <span style={{ ...mono, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color }}>
                Program / Department
              </span>
              <span style={{ ...mono, fontSize: "0.44rem", letterSpacing: "0.4em", textTransform: "uppercase", color }}>
                Chair
              </span>
            </div>

            {college.chairs.map((chair, i) => (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: "2rem",
                  padding: "1rem 1.5rem",
                  borderBottom: i < college.chairs.length - 1 ? "1px solid rgba(17,17,17,0.06)" : "none",
                  background: i % 2 === 0 ? CREAM : "rgba(255,255,255,0.5)",
                }}
              >
                <div>
                  <span style={{ ...mono, display: "block", fontSize: "0.44rem", letterSpacing: "0.3em", textTransform: "uppercase", color: `rgba(${rgb},0.7)`, marginBottom: "0.25rem" }}>
                    {chair.role}
                  </span>
                  <span style={{ ...ss, fontSize: "0.85rem", color: "rgba(17,17,17,0.6)", fontWeight: 300 }}>
                    {chair.program}
                  </span>
                </div>
                <span style={{ ...ss, fontSize: "0.9rem", fontWeight: 600, color: DARK, whiteSpace: "nowrap" }}>
                  {chair.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── ORGANIZATIONS ─────────────────────────────────────────────────── */}
      <section style={{ padding: "4rem clamp(2rem, 5vw, 5.5rem)" }}>
        <SectionHead title="ORGANIZATIONS" sub={`${college.orgs.length} recognized`} color={color} dg={dg} mono={mono} />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))", gap: "1px", background: "rgba(17,17,17,0.08)" }}>
          {college.orgs.map((org, i) => (
            <div
              key={org.acronym}
              className="col-reveal col-card"
              style={{
                padding: "1.75rem 1.5rem",
                background: "rgba(255,255,255,0.55)",
                position: "relative",
                overflow: "hidden",
                animationDelay: `${i * 0.07}s`,
              }}
              onMouseEnter={e => {
                if (!window.matchMedia("(hover: hover)").matches) return;
                e.currentTarget.style.background = `rgba(${rgb},0.07)`;
              }}
              onMouseLeave={e => {
                if (!window.matchMedia("(hover: hover)").matches) return;
                e.currentTarget.style.background = "rgba(255,255,255,0.55)";
              }}
            >
              {/* Ghost acronym */}
              <span aria-hidden="true" style={{ ...dg, position: "absolute", bottom: "-0.75rem", right: "-0.25rem", fontSize: "3.5rem", lineHeight: 1, color: "transparent", WebkitTextStroke: `1px rgba(${rgb},0.1)`, userSelect: "none", pointerEvents: "none" }}>
                {org.acronym}
              </span>

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Type badge */}
                <span className="col-org-tag" style={{
                  ...mono,
                  display: "inline-block",
                  fontSize: "0.44rem",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  padding: "0.25rem 0.6rem",
                  background: `rgba(${hexRgb(ORG_TYPE_COLORS[org.type] ?? color)},0.1)`,
                  color: ORG_TYPE_COLORS[org.type] ?? color,
                  marginBottom: "1rem",
                }}>
                  {org.type}
                </span>

                <div style={{ height: 2, width: "1.5rem", background: color, marginBottom: "1.1rem" }} />

                <span style={{ ...dg, display: "block", fontSize: "1.1rem", letterSpacing: "-0.01em", color: DARK, marginBottom: "0.4rem" }}>
                  {org.acronym}
                </span>
                <p style={{ ...ss, fontSize: "0.8rem", lineHeight: 1.6, color: "rgba(17,17,17,0.5)", fontWeight: 300, margin: 0 }}>
                  {org.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COUNCIL MEMBERS ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "4rem clamp(2rem, 5vw, 5.5rem) 6rem",
          background: `rgba(${rgb},0.04)`,
          borderTop: "1px solid rgba(17,17,17,0.06)",
        }}
      >
        <SectionHead title="COUNCIL MEMBERS" sub={`${college.council.length} officers`} color={color} dg={dg} mono={mono} />

        <div className="col-members-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.25rem" }}>
          {college.council.map((member, i) => (
            <div
              key={member.name}
              className="col-reveal col-member-card"
              style={{
                padding: "1.5rem 1.375rem",
                border: "1px solid rgba(17,17,17,0.1)",
                background: CREAM,
                position: "relative",
                overflow: "hidden",
                animationDelay: `${i * 0.08}s`,
              }}
              onMouseEnter={e => {
                if (!window.matchMedia("(hover: hover)").matches) return;
                e.currentTarget.style.borderColor = color;
                e.currentTarget.style.background = `rgba(${rgb},0.07)`;
              }}
              onMouseLeave={e => {
                if (!window.matchMedia("(hover: hover)").matches) return;
                e.currentTarget.style.borderColor = "rgba(17,17,17,0.1)";
                e.currentTarget.style.background = CREAM;
              }}
            >
              {/* Position index ghost */}
              <span aria-hidden="true" style={{ ...mono, position: "absolute", top: "1rem", right: "1.1rem", fontSize: "0.44rem", letterSpacing: "0.3em", color: `rgba(${rgb},0.3)` }}>
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Avatar circle */}
              <div style={{
                width: "2.75rem",
                height: "2.75rem",
                borderRadius: "50%",
                background: `rgba(${rgb},0.12)`,
                border: `1.5px solid rgba(${rgb},0.25)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "1rem",
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>

              {/* Position badge */}
              <span style={{ ...mono, display: "block", fontSize: "0.44rem", letterSpacing: "0.38em", textTransform: "uppercase", color, marginBottom: "0.5rem" }}>
                {member.position}
              </span>

              {/* Name */}
              <h4 style={{ ...ss, fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", margin: "0 0 0.3rem", color: DARK }}>
                {member.name}
              </h4>

              {/* Year / program */}
              {member.year && (
                <p style={{ ...mono, fontSize: "0.46rem", letterSpacing: "0.2em", color: "rgba(17,17,17,0.4)", margin: 0 }}>
                  {member.year}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}