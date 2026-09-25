"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  Trash2,
  Loader2,
  Search,
  ChevronDown,
  ArrowLeft,
  Activity,
  Layers,
  LogOut,
  Plus,
  X,
  Tag,
  Flag,
  Calendar,
  AlertCircle
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "admin" | "creatives" | "user";
type Priority = "high" | "mid" | "low";
type Category = "design" | "content" | "social" | "video";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  avatar_url: string | null;
  created_at?: string;
}

interface TaskSummary {
  id: string;
  title: string;
  category: string;
  priority: string;
  is_done: boolean;
  due_date: string | null;
  created_at: string;
  assigned_committee: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROLE_BADGES: Record<Role, { text: string; bg: string; border: string }> = {
  admin: { text: "text-purple-700", bg: "bg-purple-50", border: "border-purple-200" },
  creatives: { text: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  user: { text: "text-zinc-600", bg: "bg-zinc-100", border: "border-zinc-200" },
};

function initials(name: string | null, email?: string | null) {
  if (name) {
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "??";
}

// ─── Add Task Modal (Admin to Committee) ──────────────────────────────────────

function AddCommitteeTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: (task: TaskSummary) => void }) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "design" as Category,
    priority: "mid" as Priority,
    due_date: new Date().toISOString().split("T")[0],
    assigned_committee: "creatives" as Role,
  });

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("Task title is required."); return; }
    setIsLoading(true);
    setError(null);
    try {
      const { data: task, error: taskErr } = await supabase
        .from("tasks")
        .insert({
          title: form.title.trim(),
          description: form.description.trim() || null,
          category: form.category,
          priority: form.priority,
          due_date: form.due_date || null,
          is_done: false,
          assigned_committee: form.assigned_committee,
        })
        .select()
        .single();
      
      if (taskErr) throw taskErr;
      onCreated(task as TaskSummary);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to create task.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl border border-zinc-200 shadow-2xl max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, y: 40, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.98 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="font-extrabold text-zinc-900">Dispatch Committee Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 custom-scrollbar">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
              <AlertCircle size={16} />{error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Task Title</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
              placeholder="e.g. Design Event Poster"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors resize-none"
              rows={3}
              placeholder="Add details, links, or specific requirements..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Category</label>
              <select
                className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
              >
                <option value="design">Design</option>
                <option value="content">Content</option>
                <option value="social">Social</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Target Committee</label>
              <select
                className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                value={form.assigned_committee}
                onChange={e => setForm(f => ({ ...f, assigned_committee: e.target.value as Role }))}
              >
                <option value="creatives">Creatives Team</option>
                <option value="admin">Administrators</option>
                <option value="user">General Pool</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Due Date</label>
              <input
                type="date"
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Priority</label>
              <select
                className="w-full px-3 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                value={form.priority}
                onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
              >
                <option value="high">High Priority</option>
                <option value="mid">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading} className="flex-[2] py-3 rounded-xl bg-zinc-900 text-white text-sm font-black hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 flex items-center justify-center gap-2">
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Deploy to Pool"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Custom Dropdown for Roles ────────────────────────────────────────────────

function RoleSelector({ currentRole, onSelect, disabled }: { currentRole: Role; onSelect: (role: Role) => void; disabled?: boolean; }) {
  const [open, setOpen] = useState(false);
  const roles: Role[] = ["creatives", "admin", "user"];

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${ROLE_BADGES[currentRole].bg} ${ROLE_BADGES[currentRole].text} ${ROLE_BADGES[currentRole].border} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:brightness-95"}`}
      >
        <span className="capitalize">{currentRole}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && !disabled && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }} transition={{ duration: 0.15 }}
              className="absolute right-0 top-[calc(100%+4px)] w-32 bg-white border border-zinc-200 rounded-xl shadow-lg py-1 z-40 overflow-hidden"
            >
              {roles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { onSelect(r); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-semibold capitalize transition-colors flex items-center justify-between ${currentRole === r ? "bg-zinc-50 font-bold text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}`}
                >
                  {r}
                  {currentRole === r && <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const supabase = createClient();

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "tasks">("users");
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/lyvlogin");
  };

  useEffect(() => {
    async function verifyAdmin() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/lyvlogin"); return; }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      if (profile?.role !== "admin") {
        setAuthorized(false);
        setTimeout(() => router.push("/lyvdashboard"), 2000);
      } else {
        setAuthorized(true);
      }
    }
    verifyAdmin();
  }, [router, supabase]);

  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    const [profilesRes, tasksRes] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, role, avatar_url").order("full_name"),
      supabase.from("tasks").select("id, title, category, priority, is_done, due_date, created_at, assigned_committee").order("created_at", { ascending: false }),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
    if (tasksRes.data) setTasks(tasksRes.data as TaskSummary[]);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (authorized) loadDashboardData();
  }, [authorized, loadDashboardData]);

  const handleRoleChange = async (userId: string, newRole: Role) => {
    setProfiles((prev) => prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    await supabase.from("tasks").delete().eq("id", taskId);
  };

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return profiles.filter(p => p.full_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.role.toLowerCase().includes(q));
  }, [profiles, searchQuery]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return tasks.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || t.priority.toLowerCase().includes(q) || (t.assigned_committee && t.assigned_committee.toLowerCase().includes(q)));
  }, [tasks, searchQuery]);

  const metrics = useMemo(() => {
    const totalUsers = profiles.length;
    const totalCreatives = profiles.filter((p) => p.role === "creatives").length;
    const completedTasks = tasks.filter((t) => t.is_done).length;
    const pendingTasks = tasks.length - completedTasks;
    return { totalUsers, totalCreatives, completedTasks, pendingTasks };
  }, [profiles, tasks]);

  if (authorized === false) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-red-200 p-8 rounded-2xl shadow-xl max-w-sm text-center flex flex-col items-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4"><ShieldAlert size={24} /></div>
          <h2 className="text-xl font-black text-zinc-900 mb-1">Access Restricted</h2>
          <p className="text-xs text-zinc-500 mb-4">You do not have administrative privileges to view this portal. Redirecting...</p>
          <Loader2 size={18} className="animate-spin text-zinc-400" />
        </motion.div>
      </main>
    );
  }

  if (authorized === null || isLoading) {
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="flex items-center gap-2.5 text-zinc-400 font-bold text-sm"><Loader2 size={18} className="animate-spin text-zinc-500" />Loading security policies and directory...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900 pb-20">
      <Navbar />

      <div className="max-w-6xl mx-auto pt-24 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <button onClick={() => router.push("/lyvdashboard/creatives")} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors mb-2">
              <ArrowLeft size={14} /> Back to Creatives Workspace
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">System Control Center</h1>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-900 text-white shadow-sm"><ShieldCheck size={12} /> Root Mode</span>
            </div>
            <p className="text-sm text-zinc-500 mt-1">Oversee account delegations, team permissions, and workspace operational tasks.</p>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto md:items-end">
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 transition-colors active:scale-95 w-full md:w-auto">
              <LogOut size={16} />Logout
            </button>
            <div className="relative w-full md:w-64">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search user, task, or role..." className="w-full pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-zinc-900 transition-colors shadow-sm" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2"><span className="text-[11px] font-bold uppercase tracking-wider">Total Members</span><Users size={16} /></div>
            <p className="text-2xl font-black tracking-tight">{metrics.totalUsers}</p>
            <p className="text-xs text-zinc-400 mt-0.5">{metrics.totalCreatives} in creatives</p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2"><span className="text-[11px] font-bold uppercase tracking-wider">Pending Work</span><Clock size={16} /></div>
            <p className="text-2xl font-black tracking-tight">{metrics.pendingTasks}</p>
            <p className="text-xs text-amber-600 font-semibold mt-0.5">Active pipeline</p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2"><span className="text-[11px] font-bold uppercase tracking-wider">Delivered</span><CheckCircle2 size={16} /></div>
            <p className="text-2xl font-black tracking-tight">{metrics.completedTasks}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Marked done</p>
          </div>
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between text-zinc-400 mb-2"><span className="text-[11px] font-bold uppercase tracking-wider">System State</span><Activity size={16} /></div>
            <p className="text-2xl font-black tracking-tight text-emerald-600">Stable</p>
            <p className="text-xs text-zinc-400 mt-0.5">Realtime active</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-zinc-200 mb-6">
          <div className="flex">
            <button onClick={() => setActiveTab("users")} className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${activeTab === "users" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}>
              <Users size={16} /> Directory ({filteredProfiles.length})
            </button>
            <button onClick={() => setActiveTab("tasks")} className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-sm transition-all ${activeTab === "tasks" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"}`}>
              <Layers size={16} /> Task Audit ({filteredTasks.length})
            </button>
          </div>
          {activeTab === "tasks" && (
            <button onClick={() => setTaskModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-zinc-800 transition-colors mb-2">
              <Plus size={14} /> Dispatch Task
            </button>
          )}
        </div>

        {activeTab === "users" && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Member</th><th className="py-3 px-5">Account Email</th><th className="py-3 px-5">Designated Role</th><th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredProfiles.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200/60 flex items-center justify-center font-bold text-xs text-zinc-600 flex-shrink-0">
                          {p.avatar_url ? <img src={p.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : initials(p.full_name, p.email)}
                        </div>
                        <span className="font-semibold text-zinc-900">{p.full_name || "Unassigned Name"}</span>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-xs text-zinc-500">{p.email || "No email bound"}</td>
                      <td className="py-3.5 px-5"><RoleSelector currentRole={p.role} onSelect={(r) => handleRoleChange(p.id, r)} /></td>
                      <td className="py-3.5 px-5 text-right"><span className="text-[11px] font-mono text-zinc-400">UID: {p.id.slice(0, 6)}...</span></td>
                    </tr>
                  ))}
                  {filteredProfiles.length === 0 && (<tr><td colSpan={4} className="py-12 text-center text-zinc-400 font-semibold text-sm">No team accounts found.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="bg-white border border-zinc-200/80 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/60 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                    <th className="py-3 px-5">Task</th><th className="py-3 px-5">Committee</th><th className="py-3 px-5">Status</th><th className="py-3 px-5 text-right">Administrative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 text-sm">
                  {filteredTasks.map((t) => (
                    <tr key={t.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-zinc-900 max-w-xs truncate">{t.title}</p>
                        <p className="text-[10px] uppercase font-bold text-zinc-400 mt-0.5">{t.category} • {t.priority}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        {t.assigned_committee ? (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">{t.assigned_committee}</span>
                        ) : <span className="text-xs text-zinc-400 italic">None</span>}
                      </td>
                      <td className="py-3.5 px-5">
                        {t.is_done ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={13} /> Completed</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600"><Clock size={13} /> In Progress</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button onClick={() => handleDeleteTask(t.id)} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors inline-flex items-center gap-1" title="Purge Task"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                  {filteredTasks.length === 0 && (<tr><td colSpan={5} className="py-12 text-center text-zinc-400 font-semibold text-sm">No tasks matched your search.</td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {taskModalOpen && <AddCommitteeTaskModal onClose={() => setTaskModalOpen(false)} onCreated={(task) => setTasks(prev => [task, ...prev])} />}
      </AnimatePresence>
    </main>
  );
}