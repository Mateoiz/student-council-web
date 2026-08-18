"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Filter, Eye, Key, CheckCircle2, Clock,
  X, Download, ChevronRight, Package, Calendar,
  User, Hash, MapPin, AlertCircle, CheckCheck, Phone, BookOpen, GraduationCap, Mail, ArrowRight
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Status = "pre_registered" | "paid" | "completed";

interface Booking {
  id: string;
  firstName: string;
  middleInitial: string;
  surname: string;
  studentId: string;
  college: string;
  program: string;
  yearLevel: string;
  email: string;
  phone: string;
  lockers: LockerInfo[];
  status: Status;
  date: string;
  receiptUrl: string;
  receiptFilename: string;
  notes?: string;
}

interface LockerInfo {
  code: string;
  building: string;
  floor: string;
}
const ADMIN_EMAILS = ["usc@dlsau.edu.ph", "ice.ramirez@dlsau.edu.ph"]; 

const STATUS_META = {
  pre_registered: {
    label: "Pre-Registered",
    icon: Clock,
    pill: "bg-amber-100 text-amber-800 border border-amber-200",
  },
  paid: {
    label: "Paid · Needs Key",
    icon: CheckCircle2,
    pill: "bg-blue-100 text-blue-800 border border-blue-200",
  },
  completed: {
    label: "Completed",
    icon: Key,
    pill: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.pill}`}>
      <Icon size={11} />
      {meta.label}
    </span>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`flex-1 min-w-[100px] rounded-xl border p-4 ${color}`}>
      <p className="text-2xl font-black tabular-nums">{value}</p>
      <p className="text-xs font-medium mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

// ─── Detail Drawer ─────────────────────────────────────────────────────────────
function DetailDrawer({
  booking,
  onClose,
  onStatusChange,
}: {
  booking: Booking | null;
  onClose: () => void;
  onStatusChange: (id: string, status: Status) => void;
}) {
  const [receiptExpanded, setReceiptExpanded] = useState(false);

  useEffect(() => {
    if (!booking) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [booking, onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = booking ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [booking]);

  if (!booking) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <aside className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50">
          <div>
            <p className="text-xs text-zinc-400 font-mono font-bold">{booking.id}</p>
            <h2 className="font-black text-zinc-900 text-lg leading-tight">
              {booking.firstName} {booking.middleInitial && `${booking.middleInitial}.`} {booking.surname}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Status Banner */}
          <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
            <StatusBadge status={booking.status} />
            <span className="text-xs text-zinc-400 flex items-center gap-1">
              <Calendar size={11} /> {booking.date}
            </span>
          </div>

          {/* Student Info */}
          <section className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">Student Info</h3>
            <div className="space-y-2.5">
              <InfoRow icon={Hash} label="Student ID" value={booking.studentId} />
              <InfoRow icon={User} label="Program & Year" value={`${booking.program} · ${booking.yearLevel}`} />
              <InfoRow icon={BookOpen} label="College" value={booking.college} />
              <InfoRow icon={Mail} label="Email" value={booking.email} mono />
              <InfoRow icon={Phone} label="Phone" value={booking.phone} mono />
            </div>
          </section>

          {/* Lockers */}
          <section className="px-5 py-4 border-b border-zinc-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-3">
              Assigned Lockers ({booking.lockers.length})
            </h3>
            <div className="space-y-2">
              {booking.lockers.map((locker) => (
                <div key={locker.code} className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-200">
                  <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package size={15} className="text-white" />
                  </div>
                  <div>
                    <p className="font-black text-sm font-mono text-zinc-900">{locker.code}</p>
                    <p className="text-xs text-zinc-500 flex items-center gap-1">
                      <MapPin size={10} /> {locker.building} · {locker.floor}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notes */}
          {booking.notes && (
            <section className="px-5 py-4 border-b border-zinc-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">Notes</h3>
              <p className="text-sm text-zinc-600 bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2">
                <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                {booking.notes}
              </p>
            </section>
          )}

          {/* Receipt */}
          <section className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Submitted Receipt</h3>
              {booking.receiptUrl && (
                <a
                  href={booking.receiptUrl}
                  download={booking.receiptFilename}
                  className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                  <Download size={12} /> Download
                </a>
              )}
            </div>
            {booking.receiptUrl ? (
              <button
                onClick={() => setReceiptExpanded(!receiptExpanded)}
                className="w-full overflow-hidden rounded-xl border border-zinc-200 hover:border-zinc-400 transition-colors group"
              >
                <img
                  src={booking.receiptUrl}
                  alt="Payment receipt"
                  className={`w-full object-cover transition-all duration-300 ${receiptExpanded ? "max-h-[600px]" : "max-h-48"}`}
                />
                <div className="py-2 text-center text-xs text-zinc-400 group-hover:text-zinc-600 transition-colors font-medium">
                  {receiptExpanded ? "Click to collapse" : "Click to expand"}
                </div>
              </button>
            ) : (
              <div className="w-full p-4 border border-dashed border-zinc-300 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400 text-sm font-semibold">
                No receipt uploaded yet
              </div>
            )}
          </section>
        </div>

        {/* Action Footer */}
        <div className="px-5 py-4 border-t border-zinc-100 bg-zinc-50 flex gap-3">
          {booking.status === "pre_registered" && (
            <>
              <button className="flex-1 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-bold rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2">
                <Eye size={15} /> View Receipt
              </button>
              <button
                onClick={() => { onStatusChange(booking.id, "paid"); onClose(); }}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-bold rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={15} /> Verify Payment
              </button>
            </>
          )}
          {booking.status === "paid" && (
            <button
              onClick={() => { onStatusChange(booking.id, "completed"); onClose(); }}
              className="flex-1 py-2.5 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <Key size={15} /> Mark Key Received
            </button>
          )}
          {booking.status === "completed" && (
            <div className="flex-1 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded-xl flex items-center justify-center gap-2">
              <CheckCheck size={15} /> Booking Complete
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function InfoRow({
  icon: Icon, label, value, mono,
}: {
  icon: React.ElementType; label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-5 h-5 rounded bg-zinc-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={11} className="text-zinc-500" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-400">{label}</p>
        <p className={`text-sm text-zinc-800 font-medium truncate ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
type FilterTab = "all" | Status;

export default function AdminDashboard() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Keep Admin authorization strictly protected
      if (!session || !session.user.email || !ADMIN_EMAILS.includes(session.user.email)) {
        router.replace("/admin/login");
        return;
      }
      await fetchBookings();
      setLoading(false);
    };
    init();
  }, []);

  const fetchBookings = async () => {
    // Note: Removed the profiles join since we moved fields directly to locker_bookings
    const { data, error } = await supabase
      .from("locker_bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase Error Details:", error);
      alert(`Supabase Error: ${error.message || "Check the console for details."}`);
      return;
    }

    const mapped: Booking[] = (data ?? []).map((row: any) => ({
      id: row.id,
      firstName: row.first_name || "Unknown",
      middleInitial: row.middle_initial || "",
      surname: row.surname || "",
      studentId: row.student_id || "—",
      college: row.college || "—",
      program: row.program || "—",
      yearLevel: row.year_level || "—",
      email: row.email || "",
      phone: row.phone || "—",
      lockers: (row.locker_ids ?? []).map((code: string) => ({
        code,
        building: "—",
        floor: "—",
      })),
      status: row.status,
      date: new Date(row.created_at).toLocaleDateString(),
      receiptUrl: row.receipt_url ?? "",
      receiptFilename: row.receipt_url ? row.receipt_url.split("/").pop() : "",
      notes: row.notes,
    }));

    setBookings(mapped);
  };

  const updateStatus = useCallback(async (id: string, newStatus: Status) => {
    const { error } = await supabase
      .from("locker_bookings")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Failed to update status:", error);
      return;
    }

    setBookings(prev =>
      prev.map(bk => (bk.id === id ? { ...bk, status: newStatus } : bk))
    );
    setSelectedBooking(prev => prev?.id === id ? { ...prev, status: newStatus } : prev);
  }, []);

  const filtered = bookings.filter(bk => {
    const matchesTab = activeTab === "all" || bk.status === activeTab;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      `${bk.firstName} ${bk.surname}`.toLowerCase().includes(q) ||
      bk.studentId.toLowerCase().includes(q) ||
      bk.id.toLowerCase().includes(q) ||
      bk.lockers.some(l => l.code.toLowerCase().includes(q));
    return matchesTab && matchesSearch;
  });

  const counts = {
    all: bookings.length,
    pre_registered: bookings.filter(b => b.status === "pre_registered").length,
    paid: bookings.filter(b => b.status === "paid").length,
    completed: bookings.filter(b => b.status === "completed").length,
  };

  const TABS: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pre_registered", label: "Pre-Registered" },
    { key: "paid", label: "Paid" },
    { key: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading dashboard…</p>
      </main>
    );
  }

  return (
    <>
      <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-24">
        <div className="pt-10 px-4 md:px-8 max-w-[1400px] mx-auto">

          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900">Locker Admin</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Verify receipts and track physical key handovers.</p>
          </div>

          {/* Stat Cards */}
          <div className="flex gap-3 mb-6 flex-wrap">
            <StatCard label="Total Bookings" value={counts.all} color="bg-white border-zinc-200 text-zinc-900" />
            <StatCard label="Pending Verification" value={counts.pre_registered} color="bg-amber-50 border-amber-200 text-amber-900" />
            <StatCard label="Keys to Hand Over" value={counts.paid} color="bg-blue-50 border-blue-200 text-blue-900" />
            <StatCard label="Completed" value={counts.completed} color="bg-emerald-50 border-emerald-200 text-emerald-900" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, ID, locker..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mb-4 bg-zinc-100 p-1 rounded-xl w-fit flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {tab.label}
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === tab.key ? "bg-zinc-100 text-zinc-600" : "bg-zinc-200 text-zinc-500"
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[10px] uppercase tracking-widest text-zinc-400">
                    <th className="px-4 py-3 font-bold">Student</th>
                    <th className="px-4 py-3 font-bold">Lockers</th>
                    <th className="px-4 py-3 font-bold hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-16 text-center text-zinc-400">
                        <Search size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="font-semibold text-sm">No bookings found</p>
                        <p className="text-xs mt-1">Try adjusting your search or filter.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map(booking => (
                      <tr
                        key={booking.id}
                        className="hover:bg-zinc-50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        {/* Student */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-black text-zinc-600 flex-shrink-0 uppercase">
                              {`${booking.firstName[0] || ""}${booking.surname[0] || ""}`}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-zinc-900 group-hover:text-green-700 transition-colors flex items-center gap-1">
                                {booking.firstName} {booking.middleInitial && `${booking.middleInitial}.`} {booking.surname}
                                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                              </p>
                              <p className="text-xs text-zinc-400 font-mono">{booking.studentId}</p>
                            </div>
                          </div>
                        </td>

                        {/* Lockers */}
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5 flex-wrap">
                            {booking.lockers.map(l => (
                              <span
                                key={l.code}
                                className="px-2 py-0.5 bg-zinc-100 border border-zinc-200 rounded text-xs font-bold text-zinc-700 font-mono"
                              >
                                {l.code}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3 text-sm text-zinc-500 hidden md:table-cell">{booking.date}</td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={booking.status} />
                        </td>

                        {/* Actions */}
                        <td
                          className="px-4 py-3 text-right"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex justify-end gap-2 items-center">
                            {booking.status === "pre_registered" && (
                              <button
                                onClick={() => updateStatus(booking.id, "paid")}
                                className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors"
                              >
                                Verify
                              </button>
                            )}
                            {booking.status === "paid" && (
                              <button
                                onClick={() => updateStatus(booking.id, "completed")}
                                className="px-3 py-1.5 bg-zinc-900 text-white text-xs font-bold rounded-lg hover:bg-zinc-800 transition-colors flex items-center gap-1"
                              >
                                <Key size={12} /> Key Out
                              </button>
                            )}
                            {booking.status === "completed" && (
                              <span className="text-xs text-zinc-300 font-bold italic">Done</span>
                            )}
                            <button
                              onClick={() => setSelectedBooking(booking)}
                              className="p-1.5 text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-zinc-100 bg-zinc-50 text-xs text-zinc-400 flex items-center justify-between">
                <span>
                  Showing <span className="font-bold text-zinc-600">{filtered.length}</span> of{" "}
                  <span className="font-bold text-zinc-600">{bookings.length}</span> bookings
                </span>
                <span className="font-mono text-zinc-300">JPCS DLSAU · CVMAS Week 2026</span>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Drawer */}
      <DetailDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onStatusChange={updateStatus}
      />
    </>
  );
}