"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, RefreshCw, Download, MoreHorizontal, Trash2, Mail, Phone } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type FlairRow = {
  id: string;
  full_name: string;
  email: string;
  contact_number: string;
  id_number: string;
  college: string | null;
  program: string;
  year_level: string;
  block: string;
  status: string | null;
  created_at?: string;
};

const CREAM = "#F4EFE6";
const DARK = "#111111";
const GREEN = "#06402B";
const HEADER_H = "5rem";

const mono = { fontFamily: "'IBM Plex Mono', monospace" } as const;
const dg = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss = { fontFamily: "'Source Serif 4', serif" } as const;

export default function FlairRegistrationsAdmin() {
  const [data, setData] = useState<FlairRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [collegeFilter, setCollegeFilter] = useState("ALL");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data: rows, error } = await supabase
        .from("flair_registrations")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && rows) setData(rows as FlairRow[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel("flair_admin_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "flair_registrations" }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchData]);

  useEffect(() => {
    const handleDoc = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".flair-opt-wrap")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleDoc);
    return () => document.removeEventListener("click", handleDoc);
  }, []);

  const handleDelete = async (row: FlairRow) => {
    if (!confirm(`Delete FLAIR record for ${row.full_name} (${row.id_number})?`)) return;
    await supabase.from("flair_registrations").delete().eq("id", row.id);
    setOpenMenuId(null);
    fetchData();
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return data.filter((item) => {
      const matchSearch =
        !q ||
        item.full_name?.toLowerCase().includes(q) ||
        item.id_number?.toLowerCase().includes(q) ||
        item.email?.toLowerCase().includes(q) ||
        item.contact_number?.includes(q) ||
        item.program?.toLowerCase().includes(q);

      const matchCol = collegeFilter === "ALL" || item.college === collegeFilter;
      return matchSearch && matchCol;
    });
  }, [data, search, collegeFilter]);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["ID", "Name", "ID Number", "Email", "Phone", "College", "Program", "Year", "Block", "Status"];
    const rows = filtered.map((r) => [
      `"${r.id}"`,
      `"${r.full_name}"`,
      `"${r.id_number}"`,
      `"${r.email}"`,
      `"${r.contact_number}"`,
      `"${r.college || ""}"`,
      `"${r.program}"`,
      `"${r.year_level}"`,
      `"${r.block}"`,
      `"${r.status || "pre_registered"}"`,
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `flair_participants_${Date.now()}.csv`;
    link.click();
  };

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
      <Navbar />

      {/* Top Navbar Shield */}
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
          maxWidth: 1240,
          margin: "0 auto",
          padding: `calc(${HEADER_H} + env(safe-area-inset-top) + 1.25rem) clamp(1rem, 3.5vw, 2rem) calc(3rem + env(safe-area-inset-bottom))`,
          boxSizing: "border-box",
        }}
      >
        {/* Navigation Breadcrumb */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid rgba(17,17,17,0.12)",
          }}
        >
          <Link
            href="/admin/register"
            style={{
              ...mono,
              fontSize: "clamp(0.65rem, 2.2vw, 0.72rem)",
              color: "#666",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <ArrowLeft size={14} /> Back to Portals
          </Link>
          <span
            style={{
              ...mono,
              fontSize: "clamp(0.58rem, 2vw, 0.65rem)",
              padding: "0.25rem 0.6rem",
              background: GREEN,
              color: CREAM,
              borderRadius: 4,
              fontWeight: 600,
            }}
          >
            FLAIR 2026
          </span>
        </div>

        {/* Header Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: "1rem",
            borderBottom: "2px solid rgba(17,17,17,0.12)",
            paddingBottom: "1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div>
            <span
              style={{
                ...mono,
                fontSize: "0.65rem",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: GREEN,
                fontWeight: 600,
              }}
            >
              USC Frosh Walk 2026
            </span>
            <h1
              style={{
                ...dg,
                fontSize: "clamp(1.5rem, 4vw, 2.2rem)",
                margin: "0.2rem 0 0",
                lineHeight: 1.15,
              }}
            >
              FLAIR Registrations
            </h1>
          </div>

          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={fetchData}
              style={{
                ...mono,
                padding: "0.55rem 0.85rem",
                background: "#ffffff",
                border: "1px solid rgba(17,17,17,0.15)",
                borderRadius: 6,
                fontSize: "0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} /> Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              style={{
                ...mono,
                padding: "0.55rem 1rem",
                background: DARK,
                color: CREAM,
                border: "none",
                borderRadius: 6,
                fontSize: "0.7rem",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.75rem",
            background: "#ffffff",
            padding: "0.85rem 1.15rem",
            borderRadius: 8,
            border: "1px solid rgba(17,17,17,0.1)",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flex: "1 1 240px",
              background: CREAM,
              padding: "0.45rem 0.75rem",
              borderRadius: 4,
              border: "1px solid rgba(17,17,17,0.12)",
            }}
          >
            <Search size={14} color="#777" />
            <input
              type="text"
              placeholder="Search name, ID number, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                ...mono,
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: "0.75rem",
                width: "100%",
                color: DARK,
              }}
            />
          </div>

          <select
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            style={{
              ...mono,
              padding: "0.5rem 0.8rem",
              borderRadius: 4,
              border: "1px solid rgba(17,17,17,0.15)",
              fontSize: "0.72rem",
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            <option value="ALL">All Colleges</option>
            <option value="CAST">CAST</option>
            <option value="CBMA">CBMA</option>
            <option value="COED">COED</option>
            <option value="CVMAS">CVMAS</option>
          </select>

          <span style={{ ...mono, fontSize: "0.7rem", color: "#888", marginLeft: "auto", alignSelf: "center" }}>
            Total: {filtered.length}
          </span>
        </div>

        {/* Table View */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: 8,
            border: "1px solid rgba(17,17,17,0.1)",
            overflowX: "auto",
            boxShadow: "0 6px 20px rgba(0,0,0,0.03)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 720 }}>
            <thead>
              <tr
                style={{
                  ...mono,
                  fontSize: "0.65rem",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#666",
                  borderBottom: "2px solid rgba(17,17,17,0.08)",
                  background: "rgba(17,17,17,0.02)",
                }}
              >
                <th style={{ padding: "0.85rem 1rem" }}>Participant</th>
                <th style={{ padding: "0.85rem 1rem" }}>Contact Details</th>
                <th style={{ padding: "0.85rem 1rem" }}>College / Program</th>
                <th style={{ padding: "0.85rem 1rem" }}>Year & Block</th>
                <th style={{ padding: "0.85rem 1rem" }}>Status</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", ...mono, color: "#888" }}>
                    Loading FLAIR records...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "3rem", textAlign: "center", ...mono, color: "#888" }}>
                    No FLAIR participants found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isMenuOpen = openMenuId === item.id;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid rgba(17,17,17,0.06)", fontSize: "0.85rem" }}>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontWeight: 600, color: DARK }}>{item.full_name}</div>
                        <div style={{ ...mono, fontSize: "0.7rem", color: "#666" }}>{item.id_number}</div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.78rem", color: "#444" }}>
                          <Mail size={12} color="#888" /> {item.email}
                        </div>
                        <div style={{ ...mono, display: "flex", alignItems: "center", gap: 5, fontSize: "0.7rem", color: "#666", marginTop: 2 }}>
                          <Phone size={11} color="#888" /> {item.contact_number}
                        </div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {item.college && (
                            <span style={{ ...mono, fontSize: "0.55rem", padding: "0.15rem 0.4rem", borderRadius: 3, background: GREEN, color: CREAM, fontWeight: 600 }}>
                              {item.college}
                            </span>
                          )}
                          <span style={{ fontSize: "0.8rem", color: "#444" }}>{item.program}</span>
                        </div>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", ...mono, fontSize: "0.72rem", color: "#555" }}>
                        {item.year_level} · B{item.block}
                      </td>

                      <td style={{ padding: "0.85rem 1rem" }}>
                        <span style={{ ...mono, fontSize: "0.62rem", padding: "0.2rem 0.5rem", borderRadius: 4, background: "rgba(6,64,43,0.08)", color: GREEN, fontWeight: 600, textTransform: "uppercase" }}>
                          {item.status || "pre_registered"}
                        </span>
                      </td>

                      <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                        <div className="flair-opt-wrap" style={{ position: "relative", display: "inline-block" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(isMenuOpen ? null : item.id);
                            }}
                            style={{
                              ...mono,
                              width: 28,
                              height: 28,
                              background: "rgba(17,17,17,0.05)",
                              border: "1px solid rgba(17,17,17,0.12)",
                              borderRadius: 4,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <MoreHorizontal size={14} />
                          </button>

                          {isMenuOpen && (
                            <div
                              style={{
                                position: "absolute",
                                right: 0,
                                top: "100%",
                                zIndex: 50,
                                background: "#ffffff",
                                border: "1px solid rgba(17,17,17,0.12)",
                                borderRadius: 6,
                                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                                minWidth: 150,
                                padding: "0.3rem 0",
                                textAlign: "left",
                                ...mono,
                              }}
                            >
                              <a
                                href={`/confirm/${item.id}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: "block", padding: "0.5rem 0.8rem", fontSize: "0.68rem", color: DARK, textDecoration: "none" }}
                              >
                                ↗ View Pass
                              </a>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                style={{ width: "100%", display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 0.8rem", fontSize: "0.68rem", color: "#dc2626", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                              >
                                <Trash2 size={12} /> Delete Entry
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}