"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";

/* ─── Types ─────────────────────────────────────────────────────────────────── */
type Application = {
  id: string;
  name: string;
  email: string;
  college: string;
  program: string;
  year_level: string;
  committee: string;
  description: string;
  created_at: string;
};

/* ─── Constants ─────────────────────────────────────────────────────────────── */
const COLLEGE_COLORS: Record<string, string> = {
  CAST:  "#dc2626",
  CBMA:  "#ca8a04",
  CVMAS: "#005c00",
  COED:  "#7c3aed",
};

const COMMITTEE_LABELS: Record<string, string> = {
  logistics:               "Logistics",
  comms:                   "Comms & Sec",
  operations:              "Operations",
  "multimedia-creatives":  "Multimedia — Creatives",
  "multimedia-documentation": "Multimedia — Docs",
};

const ALL_COLLEGES   = ["CAST", "CBMA", "CVMAS", "COED"];
const ALL_COMMITTEES = ["logistics", "comms", "operations", "multimedia-creatives", "multimedia-documentation"];

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,400;0,8..60,600;1,8..60,300&family=IBM+Plex+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body { background: #0e0e0e; color: #f4efe6; font-family: 'Source Serif 4', serif; }

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(244,239,230,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(244,239,230,0.3); }

@keyframes fade-up {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.fade-up { animation: fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.skeleton {
  background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
  background-size: 800px 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 3px;
}

.row-hover { transition: background 0.15s ease; }
.row-hover:hover { background: rgba(244,239,230,0.04) !important; cursor: pointer; }

.chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 2px 8px; border-radius: 3px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem;
  letter-spacing: 0.08em; text-transform: uppercase; font-weight: 500;
  white-space: nowrap;
}

.filter-btn {
  font-family: 'IBM Plex Mono', monospace; font-size: 0.6rem;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 5px 10px; border-radius: 3px; border: 1px solid rgba(244,239,230,0.12);
  background: transparent; color: rgba(244,239,230,0.5);
  cursor: pointer; transition: all 0.15s ease; white-space: nowrap;
}
.filter-btn:hover { border-color: rgba(244,239,230,0.3); color: rgba(244,239,230,0.8); }
.filter-btn.active { background: rgba(244,239,230,0.1); border-color: rgba(244,239,230,0.35); color: #f4efe6; }

.search-input {
  background: rgba(244,239,230,0.04); border: 1px solid rgba(244,239,230,0.1);
  border-radius: 4px; padding: 8px 12px;
  font-family: 'IBM Plex Mono', monospace; font-size: 0.72rem;
  color: #f4efe6; outline: none; width: 220px;
  transition: border-color 0.2s ease;
}
.search-input::placeholder { color: rgba(244,239,230,0.25); }
.search-input:focus { border-color: rgba(244,239,230,0.3); }

.drawer-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  z-index: 50; backdrop-filter: blur(3px);
  animation: fade-up 0.2s ease both;
}
.drawer {
  position: fixed; top: 0; right: 0; bottom: 0; width: min(480px, 100vw);
  background: #161616; border-left: 1px solid rgba(244,239,230,0.08);
  z-index: 51; overflow-y: auto; padding: 2rem;
  animation: drawer-in 0.3s cubic-bezier(0.16,1,0.3,1) both;
}
@keyframes drawer-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}

.sort-btn {
  background: none; border: none; cursor: pointer;
  color: rgba(244,239,230,0.3); font-family: 'IBM Plex Mono', monospace;
  font-size: 0.55rem; padding: 0 4px;
  transition: color 0.15s ease;
}
.sort-btn:hover, .sort-btn.active { color: #f4efe6; }

.stat-card {
  background: rgba(244,239,230,0.03); border: 1px solid rgba(244,239,230,0.08);
  border-radius: 6px; padding: 1.1rem 1.3rem;
  transition: border-color 0.2s ease;
}
.stat-card:hover { border-color: rgba(244,239,230,0.15); }
`;

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
const dg   = { fontFamily: "'Dela Gothic One', sans-serif" } as React.CSSProperties;
const mono = { fontFamily: "'IBM Plex Mono', monospace" }   as React.CSSProperties;
const ss   = { fontFamily: "'Source Serif 4', serif" }      as React.CSSProperties;

function collegeDot(college: string) {
  const color = COLLEGE_COLORS[college] ?? "#888";
  return (
    <span className="chip" style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
      {college}
    </span>
  );
}

function committeeChip(committee: string) {
  return (
    <span className="chip" style={{ background: "rgba(244,239,230,0.06)", color: "rgba(244,239,230,0.65)", border: "1px solid rgba(244,239,230,0.1)" }}>
      {COMMITTEE_LABELS[committee] ?? committee}
    </span>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function fmtFull(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-PH", { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Drawer ─────────────────────────────────────────────────────────────────── */
function ApplicantDrawer({ app, onClose }: { app: Application; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const color = COLLEGE_COLORS[app.college] ?? "#888";

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
          <div>
            {collegeDot(app.college)}
            <h2 style={{ ...dg, fontSize: "1.4rem", marginTop: "0.6rem", lineHeight: 1.1 }}>{app.name}</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(244,239,230,0.4)", fontSize: "1.3rem", cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.4rem" }}>
          <Row label="Email" value={<a href={`mailto:${app.email}`} style={{ color: "#f4efe6", textDecoration: "underline", textDecorationColor: "rgba(244,239,230,0.3)", ...ss }}>{app.email}</a>} />
          <Row label="Program" value={app.program || "—"} />
          <Row label="Year Level" value={app.year_level ? `Year ${app.year_level}` : "—"} />
          <Row label="Committee" value={committeeChip(app.committee)} />
          <Row label="Applied" value={fmtFull(app.created_at)} />

          <div>
            <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,230,0.3)", display: "block", marginBottom: "0.6rem" }}>Statement</span>
            <p style={{ ...ss, fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(244,239,230,0.75)", fontWeight: 300, whiteSpace: "pre-wrap" }}>{app.description}</p>
          </div>
        </div>

        <div style={{ marginTop: "2.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(244,239,230,0.07)" }}>
          <span style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.15em", color: "rgba(244,239,230,0.2)", textTransform: "uppercase" }}>ID · {app.id}</span>
        </div>
      </aside>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "1rem", alignItems: "start" }}>
      <span style={{ ...mono, fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,230,0.3)", paddingTop: "2px" }}>{label}</span>
      <span style={{ ...ss, fontSize: "0.88rem", color: "rgba(244,239,230,0.85)" }}>{value}</span>
    </div>
  );
}

/* ─── Skeleton rows ──────────────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[160, 180, 70, 140, 60, 80].map((w, i) => (
        <td key={i} style={{ padding: "14px 16px", borderBottom: "1px solid rgba(244,239,230,0.05)" }}>
          <div className="skeleton" style={{ height: 12, width: w, maxWidth: "100%" }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── Main page ──────────────────────────────────────────────────────────────── */
export default function AdminPage() {
  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Application | null>(null);
  const [search, setSearch]       = useState("");
  const [collegeFilter, setCollegeFilter]     = useState<string | null>(null);
  const [committeeFilter, setCommitteeFilter] = useState<string | null>(null);
  const [sortKey, setSortKey]     = useState<"name" | "college" | "committee" | "created_at">("created_at");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");

  useEffect(() => {
    const id = "admin-css";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id; el.textContent = STYLES;
      document.head.appendChild(el);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("lyv_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setApps(data as Application[]);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let out = [...apps];
    if (collegeFilter)   out = out.filter(a => a.college === collegeFilter);
    if (committeeFilter) out = out.filter(a => a.committee === committeeFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        a.program?.toLowerCase().includes(q)
      );
    }
    out.sort((a, b) => {
      const av = a[sortKey] ?? ""; const bv = b[sortKey] ?? "";
      return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return out;
  }, [apps, collegeFilter, committeeFilter, search, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  /* ── Stats ── */
  const totalByCollege = useMemo(() =>
    ALL_COLLEGES.reduce((acc, c) => ({ ...acc, [c]: apps.filter(a => a.college === c).length }), {} as Record<string, number>),
  [apps]);
  const totalByCommittee = useMemo(() =>
    ALL_COMMITTEES.reduce((acc, c) => ({ ...acc, [c]: apps.filter(a => a.committee === c).length }), {} as Record<string, number>),
  [apps]);

  const SortArrow = ({ k }: { k: typeof sortKey }) => (
    <button className={`sort-btn${sortKey === k ? " active" : ""}`} onClick={() => toggleSort(k)}>
      {sortKey === k ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
    </button>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "#0e0e0e", color: "#f4efe6" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: "1px solid rgba(244,239,230,0.07)", padding: "1.5rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
          <h1 style={{ ...dg, fontSize: "1.6rem", letterSpacing: "-0.02em" }}>LYV</h1>
          <span style={{ ...mono, fontSize: "0.6rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(244,239,230,0.35)" }}>Applications · Admin</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "0.62rem", color: "rgba(244,239,230,0.3)" }}>
            {loading ? "—" : `${filtered.length} of ${apps.length}`}
          </span>
          <input
            className="search-input"
            placeholder="Search name, email, program…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Stats row ── */}
      {!loading && (
        <div className="fade-up" style={{ padding: "1.25rem 2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.75rem", borderBottom: "1px solid rgba(244,239,230,0.06)" }}>
          <div className="stat-card" style={{ gridColumn: "span 1" }}>
            <div style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,230,0.3)", marginBottom: "0.4rem" }}>Total</div>
            <div style={{ ...dg, fontSize: "1.8rem", lineHeight: 1 }}>{apps.length}</div>
          </div>
          {ALL_COLLEGES.map(c => (
            <div className="stat-card" key={c} style={{ cursor: "pointer", borderColor: collegeFilter === c ? `${COLLEGE_COLORS[c]}60` : undefined }}
              onClick={() => setCollegeFilter(f => f === c ? null : c)}>
              <div style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: COLLEGE_COLORS[c], marginBottom: "0.4rem", opacity: 0.8 }}>{c}</div>
              <div style={{ ...dg, fontSize: "1.8rem", lineHeight: 1, color: collegeFilter === c ? COLLEGE_COLORS[c] : "#f4efe6" }}>{totalByCollege[c] ?? 0}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ padding: "0.9rem 2rem", display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid rgba(244,239,230,0.05)" }}>
        <span style={{ ...mono, fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,230,0.25)", marginRight: "0.25rem" }}>Committee</span>
        {ALL_COMMITTEES.map(c => (
          <button key={c} className={`filter-btn${committeeFilter === c ? " active" : ""}`}
            onClick={() => setCommitteeFilter(f => f === c ? null : c)}>
            {COMMITTEE_LABELS[c]} <span style={{ opacity: 0.5, marginLeft: 3 }}>{totalByCommittee[c]}</span>
          </button>
        ))}
        {(collegeFilter || committeeFilter || search) && (
          <button className="filter-btn" style={{ marginLeft: "auto", borderColor: "rgba(244,239,230,0.06)", color: "rgba(244,239,230,0.35)" }}
            onClick={() => { setCollegeFilter(null); setCommitteeFilter(null); setSearch(""); }}>
            Clear ✕
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...ss }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(244,239,230,0.08)" }}>
              {[
                { label: "Name",      key: "name"       as const },
                { label: "Email",     key: null                  },
                { label: "College",   key: "college"    as const },
                { label: "Committee", key: "committee"  as const },
                { label: "Program",   key: null                  },
                { label: "Applied",   key: "created_at" as const },
              ].map(({ label, key }) => (
                <th key={label} style={{ ...mono, fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(244,239,230,0.3)", fontWeight: 500, padding: "10px 16px", textAlign: "left", whiteSpace: "nowrap" }}>
                  {label} {key && <SortArrow k={key} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "4rem", textAlign: "center", color: "rgba(244,239,230,0.2)", ...mono, fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase" }}>
                      No applications found
                    </td>
                  </tr>
                )
                : filtered.map((app, i) => (
                  <tr key={app.id} className="row-hover fade-up" onClick={() => setSelected(app)}
                    style={{ borderBottom: "1px solid rgba(244,239,230,0.05)", animationDelay: `${Math.min(i * 20, 200)}ms` }}>
                    <td style={{ padding: "14px 16px", fontWeight: 400, fontSize: "0.88rem", whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{app.name}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "rgba(244,239,230,0.45)", ...mono, whiteSpace: "nowrap", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{app.email}</td>
                    <td style={{ padding: "14px 16px" }}>{collegeDot(app.college)}</td>
                    <td style={{ padding: "14px 16px" }}>{committeeChip(app.committee)}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.78rem", color: "rgba(244,239,230,0.45)", ...ss }}>{app.program || "—"}</td>
                    <td style={{ padding: "14px 16px", fontSize: "0.72rem", color: "rgba(244,239,230,0.3)", ...mono, whiteSpace: "nowrap" }}>{fmt(app.created_at)}</td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

      {/* ── Drawer ── */}
      {selected && <ApplicantDrawer app={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}