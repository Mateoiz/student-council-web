"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import {
  LogOut,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  X,
  Users,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  Tag,
  Flag,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";

// ─── Types ────────────────────────────────────────────────────────────────────

type Priority = "high" | "mid" | "low";
type Category = "design" | "content" | "social" | "video";
type Tab = "all" | "pending" | "done" | "available";
type Sort = "newest" | "due_date" | "priority";

interface Member {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  priority: Priority;
  due_date: string | null;
  is_done: boolean;
  created_at: string;
  assigned_committee: string | null;
  task_assignees: { member_id: string }[];
}

interface NewTaskForm {
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  due_date: string;
  assignee_ids: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const CATEGORY_STYLES: Record<Category, string> = {
  design: "bg-blue-50/80 text-blue-600 border-blue-200",
  content: "bg-amber-50/80 text-amber-600 border-amber-200",
  social: "bg-green-50/80 text-green-600 border-green-200",
  video: "bg-red-50/80 text-red-600 border-red-200",
};
const CATEGORY_DOT: Record<Category, string> = {
  design: "bg-blue-400",
  content: "bg-amber-400",
  social: "bg-green-400",
  video: "bg-red-400",
};
const CATEGORY_LABELS: Record<Category, string> = {
  design: "Design", content: "Content", social: "Social", video: "Video",
};
const PRIORITY_DOT: Record<Priority, string> = {
  high: "bg-red-500", mid: "bg-amber-500", low: "bg-zinc-400",
};
const PRIORITY_LABEL: Record<Priority, string> = {
  high: "High", mid: "Medium", low: "Low",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map(p => p[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${MONTH_NAMES[+m - 1].slice(0, 3)} ${+d}`;
}

function isOverdue(due: string | null, done: boolean) {
  if (!due || done) return false;
  return new Date(due) < new Date(new Date().toDateString());
}

function getCalendarCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const total = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: total }, (_, i) => {
    let date: Date;
    let other = false;
    if (i < firstDay) {
      date = new Date(year, month - 1, prevDays - firstDay + i + 1);
      other = true;
    } else if (i >= firstDay + daysInMonth) {
      date = new Date(year, month + 1, i - firstDay - daysInMonth + 1);
      other = true;
    } else {
      date = new Date(year, month, i - firstDay + 1);
    }
    const iso = date.toISOString().split("T")[0];
    const isToday = date.getTime() === today.getTime();
    return { date, iso, other, isToday };
  });
}

// ─── Custom UI Components ─────────────────────────────────────────────────────

function CustomSelect({
  value,
  options,
  onChange,
  icon: Icon,
  label
}: {
  value: string;
  options: { label: string; value: string; dot?: string }[];
  onChange: (val: any) => void;
  icon?: React.ElementType;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-900 font-medium">
          {Icon && <Icon size={14} className="text-zinc-400" />}
          {selected?.dot && <span className={`w-2 h-2 rounded-full ${selected.dot}`} />}
          {selected?.label}
        </div>
        <ChevronDown size={14} className={`text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+6px)] left-0 w-full bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden py-1"
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors text-left"
                >
                  {opt.dot && <span className={`w-2 h-2 rounded-full ${opt.dot}`} />}
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomDatePicker({
  value,
  onChange,
  label
}: {
  value: string;
  onChange: (val: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const currentValDate = new Date(value);
  const [year, setYear] = useState(currentValDate.getFullYear());
  const [month, setMonth] = useState(currentValDate.getMonth());

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = getCalendarCells(year, month);

  return (
    <div className="relative">
      <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
      >
        <div className="flex items-center gap-2 text-zinc-900 font-medium font-mono">
          <Calendar size={14} className="text-zinc-400" />
          {value}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-[calc(100%+6px)] left-0 w-64 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <button type="button" onClick={prev} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 transition-colors">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-zinc-800">{MONTH_NAMES[month]} {year}</span>
                <button type="button" onClick={next} className="p-1 rounded-md hover:bg-zinc-100 text-zinc-500 transition-colors">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px">
                {cells.map(({ iso, other, isToday }) => {
                  const selected = value === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => { onChange(iso); setOpen(false); }}
                      className={[
                        "flex flex-col items-center justify-center aspect-square rounded-md text-xs transition-all",
                        other ? "text-zinc-300" : "text-zinc-600",
                        isToday && !selected ? "ring-1 ring-zinc-900 font-bold text-zinc-900" : "",
                        selected ? "bg-zinc-900 text-white font-bold" : "hover:bg-zinc-50",
                      ].join(" ")}
                    >
                      <span>{new Date(iso).getDate()}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberAvatar({ member, size = 28, online }: { member: Member; size?: number; online?: boolean }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      {member.avatar_url ? (
        <img
          src={member.avatar_url}
          alt={member.full_name ?? "Member"}
          className="rounded-full object-cover w-full h-full shadow-sm"
        />
      ) : (
        <div
          className="rounded-full bg-zinc-100 border border-zinc-200 text-zinc-600 flex items-center justify-center font-bold w-full h-full"
          style={{ fontSize: size * 0.35 }}
        >
          {initials(member.full_name)}
        </div>
      )}
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${online ? "bg-green-500" : "bg-zinc-300"}`} />
      )}
    </div>
  );
}

function CalendarPanel({ tasks, selectedDate, onSelectDate }: { tasks: Task[]; selectedDate: string | null; onSelectDate: (d: string | null) => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells = getCalendarCells(year, month);
  const dotsForDate = (dateStr: string) => [...new Set(tasks.filter(t => t.due_date === dateStr).map(t => t.category))].slice(0, 3);

  return (
    <div className="p-4 border-b border-zinc-100">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-bold text-zinc-800">{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition-colors">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-zinc-400 py-1 tracking-wide">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map(({ iso, other, isToday }) => {
          const dots = dotsForDate(iso);
          const selected = selectedDate === iso;
          return (
            <button
              key={iso}
              onClick={() => onSelectDate(selected ? null : iso)}
              className={[
                "flex flex-col items-center justify-center aspect-square rounded-lg text-xs transition-all gap-0.5",
                other ? "text-zinc-300" : "text-zinc-600",
                isToday && !selected ? "ring-1 ring-zinc-900 font-bold text-zinc-900" : "",
                selected ? "bg-zinc-900 text-white font-bold shadow-md shadow-zinc-900/20" : "hover:bg-zinc-50",
              ].join(" ")}
            >
              <span>{new Date(iso).getDate()}</span>
              {dots.length > 0 && (
                <div className="flex gap-px">
                  {dots.map(cat => (
                    <span key={cat} className={`w-1 h-1 rounded-full ${selected ? "bg-white/70" : CATEGORY_DOT[cat]}`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  members,
  onToggle,
  onDelete,
  onPickUp,
  isAdmin,
  isAvailable,
  onlineIds,
}: {
  task: Task;
  members: Member[];
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onPickUp: (id: string) => void;
  isAdmin: boolean;
  isAvailable: boolean;
  onlineIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState(false);
  const overdue = isOverdue(task.due_date, task.is_done);
  const assignedMembers = task.task_assignees
    .map(a => members.find(m => m.id === a.member_id))
    .filter(Boolean) as Member[];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={`bg-white border rounded-2xl overflow-hidden transition-colors ${
        expanded ? "border-zinc-300 shadow-md shadow-zinc-200/50" : "border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
      }`}
    >
      <div className="p-4 flex gap-3 cursor-pointer" onClick={() => setExpanded(e => !e)}>
        {!isAvailable && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(task.id, !task.is_done); }}
            className="flex-shrink-0 mt-0.5 text-zinc-300 hover:text-zinc-900 transition-colors"
          >
            <motion.div whileTap={{ scale: 0.85 }}>
              {task.is_done ? <CheckCircle2 size={20} className="text-zinc-900" /> : <Circle size={20} />}
            </motion.div>
          </button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <p className={`text-sm font-semibold leading-snug mb-1.5 transition-colors ${task.is_done ? "line-through text-zinc-400" : "text-zinc-900"}`}>
              {task.title}
            </p>
            {isAvailable && (
              <button
                onClick={(e) => { e.stopPropagation(); onPickUp(task.id); }}
                className="flex items-center gap-1.5 flex-shrink-0 bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <Download size={12} /> Pick Up
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded border ${CATEGORY_STYLES[task.category]}`}>
              {CATEGORY_LABELS[task.category]}
            </span>
            {task.due_date && (
              <span className={`text-[11px] font-mono flex items-center gap-1 ${overdue ? "text-red-600 font-semibold bg-red-50 px-1.5 py-0.5 rounded" : "text-zinc-500"}`}>
                <Calendar size={11} />
                {formatDate(task.due_date)}
                {overdue && " (Overdue)"}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 flex-shrink-0">
          <div className={`w-2 h-2 rounded-full mt-1.5 ${PRIORITY_DOT[task.priority]}`} />
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={15} className="text-zinc-300" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 border-t border-zinc-100/60 flex flex-col gap-4 mt-1">
              {task.description && (
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              )}
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  {assignedMembers.length > 0 ? (
                    <div className="flex -space-x-1.5">
                      {assignedMembers.map((m, i) => (
                        <div key={m.id} className="relative z-10 hover:z-20 transition-transform hover:scale-110" style={{ zIndex: 10 - i }} title={m.full_name || "Member"}>
                          <MemberAvatar member={m} size={24} online={onlineIds.has(m.id)} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-zinc-400 italic">No Assignees (Open Pool)</span>
                  )}
                  <span className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                    task.priority === "high" ? "bg-red-50 text-red-700 border-red-200"
                    : task.priority === "mid" ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-zinc-50 text-zinc-600 border-zinc-200"
                  }`}>
                    {PRIORITY_LABEL[task.priority]} Priority
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => onDelete(task.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function AddTaskModal({
  members,
  defaultDue,
  onClose,
  onCreated,
}: {
  members: Member[];
  defaultDue: string;
  onClose: () => void;
  onCreated: (task: Task) => void;
}) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<NewTaskForm>({
    title: "",
    description: "",
    category: "design",
    priority: "mid",
    due_date: defaultDue,
    assignee_ids: [],
  });

  const set = (key: keyof NewTaskForm, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const toggleAssignee = (id: string) =>
    set("assignee_ids", form.assignee_ids.includes(id)
      ? form.assignee_ids.filter(x => x !== id)
      : [...form.assignee_ids, id]);

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
        })
        .select()
        .single();
      if (taskErr) throw taskErr;

      if (form.assignee_ids.length) {
        const { error: assignErr } = await supabase
          .from("task_assignees")
          .insert(form.assignee_ids.map(member_id => ({ task_id: task.id, member_id })));
        if (assignErr) throw assignErr;
      }

      onCreated({ ...task, task_assignees: form.assignee_ids.map(id => ({ member_id: id })) });
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl border border-zinc-200 shadow-2xl max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, y: 40, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.98 }}
        transition={{ duration: 0.3, type: "spring", bounce: 0.2 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <h2 className="font-extrabold text-zinc-900">New Task</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 text-zinc-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5 custom-scrollbar">
          {error && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </motion.div>
          )}

          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Task Title</label>
            <input
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors shadow-sm"
              placeholder="e.g. Update Firebase Security Rules"
              value={form.title}
              onChange={e => set("title", e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-1.5 block">Description <span className="font-normal text-zinc-400">(optional)</span></label>
            <textarea
              className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors resize-none shadow-sm"
              rows={3}
              placeholder="Add notes, references, or context…"
              value={form.description}
              onChange={e => set("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <CustomSelect
              label="Category"
              icon={Tag}
              value={form.category}
              onChange={v => set("category", v)}
              options={[
                { label: "Design", value: "design" },
                { label: "Content", value: "content" },
                { label: "Social", value: "social" },
                { label: "Video", value: "video" },
              ]}
            />
            <CustomSelect
              label="Priority"
              icon={Flag}
              value={form.priority}
              onChange={v => set("priority", v)}
              options={[
                { label: "High", value: "high", dot: "bg-red-500" },
                { label: "Medium", value: "mid", dot: "bg-amber-500" },
                { label: "Low", value: "low", dot: "bg-zinc-400" },
              ]}
            />
          </div>

          <CustomDatePicker
            label="Due Date"
            value={form.due_date}
            onChange={v => set("due_date", v)}
          />

          <div>
            <label className="text-xs font-semibold text-zinc-500 mb-2 flex items-center gap-1.5">
              <Users size={14} /> Assignees
            </label>
            <div className="grid grid-cols-2 gap-2">
              {members.map(m => {
                const selected = form.assignee_ids.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleAssignee(m.id)}
                    className={[
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-sm font-semibold transition-all text-left",
                      selected ? "border-zinc-900 bg-zinc-900 text-white shadow-md shadow-zinc-900/20" : "border-zinc-200 text-zinc-700 bg-white hover:border-zinc-400",
                    ].join(" ")}
                  >
                    <MemberAvatar member={m} size={24} />
                    <span className="truncate">{m.full_name?.split(" ")[0] ?? "Member"}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-100 flex gap-3 pb-[calc(1rem+env(safe-area-inset-bottom))] md:pb-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-[2] py-3 rounded-xl bg-zinc-900 text-white text-sm font-black hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-zinc-900/20"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Deploy Task"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CreativesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<Sort>("newest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const fetchMembers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url, role").neq("role", "admin").order("full_name");
    if (data) setMembers(data);
  }, [supabase]);

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*, task_assignees(member_id)").order("created_at", { ascending: false });
    if (data) setTasks(data as Task[]);
  }, [supabase]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("id, role").eq("id", user.id).single();
        if (profile) setCurrentUser(profile);
      }
      await Promise.all([fetchMembers(), fetchTasks()]);
      setIsLoading(false);
    };
    init();
  }, [fetchMembers, fetchTasks, supabase]);

  useEffect(() => {
    const channel = supabase.channel("tasks-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, fetchTasks)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supabase, fetchTasks]);

  useEffect(() => {
    if (!currentUser) return;
    const room = supabase.channel("creatives-presence", { config: { presence: { key: currentUser.id } } });
    room.on("presence", { event: "sync" }, () => {
      setOnlineIds(new Set(Object.keys(room.presenceState())));
    }).subscribe(async status => {
      if (status === "SUBSCRIBED") await room.track({ user_id: currentUser.id });
    });
    return () => { supabase.removeChannel(room); };
  }, [supabase, currentUser]);

  const isAdmin = currentUser?.role === "admin";

  const toggleTask = async (id: string, done: boolean) => {
    if (!isAdmin) {
      const task = tasks.find(t => t.id === id);
      if (!task?.task_assignees.some(a => a.member_id === currentUser?.id)) return;
    }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, is_done: done } : t));
    await supabase.from("tasks").update({ is_done: done }).eq("id", id);
  };

  const pickUpTask = async (taskId: string) => {
    if (!currentUser) return;
    
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, task_assignees: [{ member_id: currentUser.id }] } : t));
    
    await supabase.from("task_assignees").insert({ task_id: taskId, member_id: currentUser.id });
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const handleCreated = (task: Task) => setTasks(prev => [task, ...prev]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/lyvlogin");
  };

  const PRIORITY_ORDER: Record<Priority, number> = { high: 0, mid: 1, low: 2 };
  const sortLabels: Record<Sort, string> = { newest: "Newest", due_date: "Due Date", priority: "Priority" };

  const processedTasks = useMemo(() => {
    let result = tasks.filter(t => {
      if (isAdmin) return true;
      
      const isMine = t.task_assignees.some(a => a.member_id === currentUser?.id);
      
      const isOpenPool = t.task_assignees.length === 0 && t.assigned_committee === currentUser?.role;
      
      return isMine || isOpenPool;
    });

    result = result
      .filter(t => !selectedMember || t.task_assignees.some(a => a.member_id === selectedMember))
      .filter(t => !selectedDate || t.due_date === selectedDate);

    if (activeTab === "done") result = result.filter(t => t.is_done);
    else if (activeTab === "pending") result = result.filter(t => !t.is_done && t.task_assignees.length > 0);
    else if (activeTab === "available") result = result.filter(t => t.task_assignees.length === 0);

    result.sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sort === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return 0;
    });

    return result;
  }, [tasks, selectedMember, selectedDate, activeTab, sort, isAdmin, currentUser]);

  const todayIso = new Date().toISOString().split("T")[0];
  const boardTitle = selectedMember ? members.find(m => m.id === selectedMember)?.full_name ?? "Member" : selectedDate ? formatDate(selectedDate) : "Workspace";
  const openPoolCount = tasks.filter(t => t.task_assignees.length === 0 && (isAdmin || t.assigned_committee === currentUser?.role)).length;

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900 font-sans">
      <Navbar />

      <div className="pt-16 flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-[280px] border-r border-zinc-200/80 bg-white overflow-y-auto flex-shrink-0 z-10 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
          <CalendarPanel
            tasks={tasks}
            selectedDate={selectedDate}
            onSelectDate={date => { setSelectedDate(date); setSelectedMember(null); }}
          />

          <div className="p-5 flex-1">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">Team Directory</p>
            <button
              onClick={() => { setSelectedMember(null); setSelectedDate(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all mb-2 ${
                !selectedMember && !selectedDate ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20" : "text-zinc-600 hover:bg-zinc-50"
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${!selectedMember && !selectedDate ? "bg-white/20" : "bg-zinc-100"}`}>
                <Users size={14} />
              </div>
              <span className="flex-1 text-left">Everyone</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${!selectedMember && !selectedDate ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                {tasks.length}
              </span>
            </button>

            <div className="space-y-1">
              {members.map(m => {
                const count = tasks.filter(t => t.task_assignees.some(a => a.member_id === m.id)).length;
                const active = selectedMember === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMember(active ? null : m.id); setSelectedDate(null); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/20" : "text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    <MemberAvatar member={m} size={32} online={onlineIds.has(m.id)} />
                    <span className="flex-1 text-left truncate">{m.full_name ?? m.id.slice(0, 8)}</span>
                    {count > 0 && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded-md flex-shrink-0 ${active ? "bg-white/20 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#fafafa]">
          <div className="px-6 md:px-8 py-6 border-b border-zinc-200/80 bg-white flex items-end justify-between flex-shrink-0 z-10 sticky top-0">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-zinc-900">{boardTitle}</h1>
              <p className="text-sm text-zinc-500 font-medium mt-1">
                {processedTasks.length} active items • Engineering Portal Theme
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors active:scale-95"
              >
                <LogOut size={16} />
                <span className="hidden sm:inline">Logout</span>
              </button>
              {isAdmin && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors shadow-md shadow-zinc-900/20 active:scale-95"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Initialize Task</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center border-b border-zinc-200/80 bg-white px-6 md:px-8 flex-shrink-0 justify-between">
            <div className="flex gap-2">
              {(["all", "pending", "done"] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`capitalize text-sm font-bold px-4 py-3 border-b-2 transition-all ${
                    activeTab === tab ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"
                  }`}
                >
                  {tab}
                </button>
              ))}
              <button
                onClick={() => setActiveTab("available")}
                className={`flex items-center gap-1.5 capitalize text-sm font-bold px-4 py-3 border-b-2 transition-all ${
                  activeTab === "available" ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-400 hover:text-zinc-700"
                }`}
              >
                Available
                {openPoolCount > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md leading-none">
                    {openPoolCount}
                  </span>
                )}
              </button>
            </div>

            {/* Custom Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortMenuOpen(!sortMenuOpen)}
                className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-zinc-50 transition-colors text-xs font-bold text-zinc-600"
              >
                <ArrowUpDown size={14} className="text-zinc-400" />
                {sortLabels[sort]}
                <ChevronDown size={14} className={`text-zinc-400 transition-transform ${sortMenuOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {sortMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-20" onClick={() => setSortMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-[calc(100%+4px)] w-40 bg-white border border-zinc-200 shadow-xl rounded-xl py-1 z-30"
                    >
                      {(Object.keys(sortLabels) as Sort[]).map(key => (
                        <button
                          key={key}
                          onClick={() => { setSort(key); setSortMenuOpen(false); }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${sort === key ? "bg-zinc-50 text-zinc-900" : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"}`}
                        >
                          {sortLabels[key]}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6 pb-24 md:pb-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
                <Loader2 size={24} className="animate-spin text-zinc-300" />
                <span className="text-sm font-semibold">Syncing database...</span>
              </div>
            ) : processedTasks.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mb-4 text-zinc-300 shadow-inner">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-base font-bold text-zinc-900 mb-1">Queue Empty</p>
                <p className="text-sm text-zinc-500 max-w-[250px]">
                  {activeTab === "available" ? "No open tasks in the pool." : activeTab === "done" ? "Awaiting compiled tasks." : "All systems nominal. Initialize a new task when ready."}
                </p>
              </motion.div>
            ) : (
              <motion.div layout className="space-y-3 max-w-4xl mx-auto md:mx-0">
                <AnimatePresence mode="popLayout">
                  {processedTasks.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      members={members}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onPickUp={pickUpTask}
                      isAdmin={isAdmin}
                      isAvailable={task.task_assignees.length === 0}
                      onlineIds={onlineIds}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="md:hidden fixed bottom-6 right-5 z-40">
          <button
            onClick={() => setModalOpen(true)}
            className="w-14 h-14 bg-zinc-900 text-white rounded-full flex items-center justify-center shadow-xl shadow-zinc-900/30 hover:bg-zinc-800 transition-all active:scale-90"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      <AnimatePresence>
        {isAdmin && modalOpen && (
          <AddTaskModal
            key="modal"
            members={members}
            defaultDue={selectedDate ?? todayIso}
            onClose={() => setModalOpen(false)}
            onCreated={handleCreated}
          />
        )}
      </AnimatePresence>
    </main>
  );
}