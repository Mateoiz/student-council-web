"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaPlus, FaCalendarAlt, FaTimes, FaTrashAlt, 
  FaPalette, FaMobileAlt, FaDesktop, FaImage, FaDownload,
  FaCheckCircle, FaUndo, FaRedo, FaCopy,
  FaExclamationTriangle,   FaCloudUploadAlt, FaDoorOpen, FaArrowLeft
} from "react-icons/fa";
import { useModal, ModalProvider } from "../../context/ModalContext";
import Link from "next/link";
const CREAM = "#F4EFE6";
const DARK  = "#111111";
const GREEN = "#005c00";
const dg   = { fontFamily: "'Dela Gothic One', sans-serif" } as const;
const ss   = { fontFamily: "'Source Serif 4', serif" }       as const;
const mono = { fontFamily: "'IBM Plex Mono', monospace" }    as const;

function useToolsFont() {
  useEffect(() => {
    const id = "dlsau-tools-css-schedule";
    if (!document.getElementById(id)) {
      const el = document.createElement("style");
      el.id = id;
      el.textContent = `@import url('https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=Source+Serif+4:ital,opsz,wght@0,8..60,300;0,8..60,600;1,8..60,300;1,8..60,600&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;
      document.head.appendChild(el);
    }
  }, []);
}

type Day = 'M' | 'T' | 'W' | 'Th' | 'F' | 'S';
type ClassSession = {
  id: string;
  code: string;
  name: string;
  room: string; // ← NEW
  days: Day[];
  startTime: string; 
  endTime: string;   
  color: string;
};

type ViewMode = 'editor' | 'canvas';
type ThemeMode = 'light' | 'black' | 'blue' | 'pink';
type FormatMode = 'desktop' | 'mobile';

interface DashboardScheduleMakerProps {}
// Add this state in the component
const PASTEL_COLORS = [
  "bg-rose-200 text-rose-950 border-rose-300",
  "bg-orange-200 text-orange-950 border-orange-300",
  "bg-amber-200 text-amber-950 border-amber-300",
  "bg-emerald-200 text-emerald-950 border-emerald-300",
  "bg-teal-200 text-teal-950 border-teal-300",
  "bg-cyan-200 text-cyan-950 border-cyan-300",
  "bg-blue-200 text-blue-950 border-blue-300",
  "bg-indigo-200 text-indigo-950 border-indigo-300",
  "bg-violet-200 text-violet-950 border-violet-300",
  "bg-purple-200 text-purple-950 border-purple-300",
  "bg-fuchsia-200 text-fuchsia-950 border-fuchsia-300",
  "bg-zinc-200 text-zinc-950 border-zinc-300"
];

// Map pastel class string → a named colour for the tracker colour system
const PASTEL_TO_TRACKER_COLOR: Record<string, string> = {
  "bg-rose-200 text-rose-950 border-rose-300":    "rose",
  "bg-orange-200 text-orange-950 border-orange-300": "amber",
  "bg-amber-200 text-amber-950 border-amber-300": "amber",
  "bg-emerald-200 text-emerald-950 border-emerald-300": "emerald",
  "bg-teal-200 text-teal-950 border-teal-300":    "cyan",
  "bg-cyan-200 text-cyan-950 border-cyan-300":    "cyan",
  "bg-blue-200 text-blue-950 border-blue-300":    "blue",
  "bg-indigo-200 text-indigo-950 border-indigo-300": "blue",
  "bg-violet-200 text-violet-950 border-violet-300": "violet",
  "bg-purple-200 text-purple-950 border-purple-300": "violet",
  "bg-fuchsia-200 text-fuchsia-950 border-fuchsia-300": "rose",
  "bg-zinc-200 text-zinc-950 border-zinc-300":    "emerald",
};

const THEME_STYLES = {
  light: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-900', grid: 'bg-zinc-200/50', header: 'bg-zinc-100', subText: 'text-zinc-400' },
  black: { bg: 'bg-zinc-950', border: 'border-zinc-800', text: 'text-white', grid: 'bg-zinc-800/50', header: 'bg-zinc-900', subText: 'text-zinc-500' },
  blue: { bg: 'bg-[#0f172a]', border: 'border-slate-800', text: 'text-slate-100', grid: 'bg-slate-800/50', header: 'bg-slate-900', subText: 'text-slate-400' },
  pink: { bg: 'bg-[#fff1f2]', border: 'border-rose-200', text: 'text-rose-950', grid: 'bg-rose-200/50', header: 'bg-rose-100', subText: 'text-rose-400' }
};

const DAYS_OF_WEEK: Day[] = ['M', 'T', 'W', 'Th', 'F', 'S'];
const START_HOUR = 7; 
const END_HOUR = 19; 
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const STORAGE_KEY = 'jpcs_schedule_v1';
const MAX_HISTORY = 30;

interface PersistedState {
  classes: ClassSession[];
  termName: string;
  activeTheme: ThemeMode;
  format: FormatMode;
  savedAt: number;
}

// ─── Conflict detection ───────────────────────────────────────────────────────
function detectConflicts(classes: ClassSession[]): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  for (let i = 0; i < classes.length; i++) {
    for (let j = i + 1; j < classes.length; j++) {
      const a = classes[i], b = classes[j];
      const sharedDays = a.days.filter(d => b.days.includes(d));
      if (sharedDays.length === 0) continue;
      const aStart = timeToMin(a.startTime), aEnd = timeToMin(a.endTime);
      const bStart = timeToMin(b.startTime), bEnd = timeToMin(b.endTime);
      if (aStart < bEnd && bStart < aEnd) {
        const addConflict = (id: string, conflictId: string) => {
          const existing = conflicts.get(id) || [];
          if (!existing.includes(conflictId)) conflicts.set(id, [...existing, conflictId]);
        };
        addConflict(a.id, b.id);
        addConflict(b.id, a.id);
      }
    }
  }
  return conflicts;
}

function timeToMin(t: string) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}



// ─── Conflict badge ───────────────────────────────────────────────────────────
function ConflictBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-widest">
      <FaExclamationTriangle size={10} />
      {count} schedule conflict{count > 1 ? 's' : ''}
    </motion.div>
  );
}

// ─── Auto-save indicator ─────────────────────────────────────────────────────
function SaveIndicator({ savedAt }: { savedAt: number | null }) {
  if (!savedAt) return null;
  const ago = Math.round((Date.now() - savedAt) / 1000);
  const label = ago < 5 ? "Saved just now" : ago < 60 ? `Saved ${ago}s ago` : "Saved";
  return (
    <motion.div key={savedAt} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
      <FaCloudUploadAlt size={11} /> {label}
    </motion.div>
  );
}

function PasteScheduleModal({
  isOpen, onClose, onImport,
}: {
  isOpen: boolean;
  onClose: () => void;
  onImport: (classes: ClassSession[]) => void;
}) {
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ClassSession[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) { setText(""); setPreview([]); setError(""); }
  }, [isOpen]);

  const DAY_MAP: Record<string, Day[]> = {
    'M':['M'],'T':['T'],'W':['W'],'TH':['Th'],'F':['F'],'S':['S'],
    'MT':['M','T'],'MW':['M','W'],'MF':['M','F'],
    'TTH':['T','Th'],'TF':['T','F'],'WF':['W','F'],
    'MWF':['M','W','F'],'MTWTHF':['M','T','W','Th','F'],
  };

  const toTime = (t: string) => `${t.slice(0,2)}:${t.slice(2,4)}`;

  const parse = (raw: string): ClassSession[] => {
    const results: ClassSession[] = [];
    const seen = new Set<string>();
    const blockRegex = /([A-Z]{2,}\d{2,}[A-Z]?)\s*\n\s*([^\n]+)\s*\n\s*([^\n]*?)\s*-\s*([A-Z]{1,6})(\d{4})-(\d{4})/gm;
    let match;
    while ((match = blockRegex.exec(raw)) !== null) {
      const code = match[1].trim();
      const section = match[2].trim();
      const roomPart = match[3].replace(/^-\s*/, '').trim();
      const dayStr = match[4].toUpperCase();
      const startTime = toTime(match[5]);
      const endTime = toTime(match[6]);
      const key = `${code}-${dayStr}-${startTime}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const days: Day[] = DAY_MAP[dayStr] || [];
      results.push({
        id: `paste-${Date.now()}-${results.length}`,
        code, name: section,
        room: roomPart === '-' || roomPart === '' ? '' : roomPart,
        days, startTime, endTime,
        color: PASTEL_COLORS[results.length % PASTEL_COLORS.length],
      });
    }
    return results;
  };

  const handleParse = () => {
    setError("");
    const parsed = parse(text);
    if (parsed.length === 0) {
      setError("No classes detected. Make sure you copied the full schedule table including course codes, sections, and time patterns like MW0730-0930.");
      setPreview([]);
    } else {
      setPreview(parsed);
    }
  };

  const formatDays = (days: Day[]) => days.join('·');
  const fmt12 = (t: string) => {
    if (!t) return '';
    const [h, m] = t.split(':').map(Number);
    return `${h % 12 || 12}:${m.toString().padStart(2,'0')} ${h >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ type: "spring", stiffness: 400, damping: 30 }}
className="relative w-full max-w-lg bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-2xl z-10 flex flex-col gap-5 max-h-[85dvh] overflow-hidden"
          >
            <div className="flex items-start justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                           <div className="w-11 h-11 rounded-2xl bg-[#005c00]/10 text-[#005c00] flex items-center justify-center shrink-0">
                  <FaCalendarAlt size={17} />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase tracking-tight text-zinc-900 dark:text-white leading-none" style={{ fontFamily: "'Dela Gothic One', sans-serif" }}>Paste Schedule</h3>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>Auto-parse from your SERP schedule page</p>  </div>
              </div>
              <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors p-1"><FaTimes size={14} /></button>
            </div>

{/* Two-panel layout: paste area OR preview */}
            <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">

              {/* Instructions — hidden once preview is showing to save space */}
              {preview.length === 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shrink-0">
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                    Copy your <span className="font-black text-zinc-700 dark:text-zinc-200">Weekly Schedule</span> from your enrollment system and paste below. Course codes, rooms, days and times will be extracted automatically.
                  </p>
                </div>
              )}

              {/* Textarea — shrinks when preview is shown */}
              {preview.length === 0 ? (
                <textarea
                  value={text}
                  onChange={e => { setText(e.target.value); setPreview([]); setError(""); }}
                  placeholder={"Paste your schedule here...\n\nExample:\nCORE104\nBSCS2A\nRM506 - MW0730-0930"}
                  rows={7}
                  className="flex-1 w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-xs font-mono text-zinc-700 dark:text-zinc-300 outline-none focus:border-[#06402B] dark:focus:border-emerald-500 resize-none"
                />
              ) : (
                /* Compact re-paste strip when preview is visible */
                <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 rounded-2xl shrink-0"
>
                  <FaCalendarAlt size={10} className="text-zinc-400 shrink-0"/>
                  <p className="text-[10px] font-bold text-zinc-500 flex-1 truncate">
                    {text.length} chars pasted · {preview.length} classes found
                  </p>
                  <button
                    onClick={() => { setPreview([]); setError(""); }}
                    className="text-[9px] font-black text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 uppercase tracking-widest shrink-0 transition-colors"
                  >
                    Re-paste
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl shrink-0">
                  <FaExclamationTriangle size={11} className="text-red-500 mt-0.5 shrink-0"/>
                  <p className="text-[11px] font-bold text-red-500 leading-relaxed">{error}</p>
                </div>
              )}

              {/* Preview list — scrollable, fills remaining space */}
              {preview.length > 0 && (
                <div className="flex-1 overflow-y-auto min-h-0 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
>
                  {/* Sticky header */}
                  <div className="sticky top-0 flex items-center justify-between px-4 py-3 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-100 dark:border-zinc-800 z-10 rounded-t-2xl"
                  >
                    <p className="text-[11px] font-black text-[#06402B] dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#06402B] dark:bg-emerald-400 animate-pulse" />
{preview.length} classes detected
                    </p>
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Review before adding</span>
                  </div>
                  <div className="p-2 space-y-1.5">
                    {preview.map((cls, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-[#06402B]/30 transition-colors">
                        {/* Color swatch */}
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 border-2 shadow-sm ${cls.color}`}
                        >
                          {cls.code.slice(0,2)}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
<p className="text-sm font-black text-zinc-900 dark:text-white leading-none">{cls.code}</p>
{cls.days.length > 0 && (
  <span className="shrink-0 text-[9px] font-black text-[#06402B] dark:text-emerald-400 bg-[#06402B]/8 dark:bg-emerald-500/10 px-2 py-0.5 rounded-lg font-mono tracking-wider border border-[#06402B]/10 dark:border-emerald-500/20">
    {formatDays(cls.days)}
  </span>
)}
                          </div>
                          <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 truncate">{cls.name}</span>
<div className="flex items-center gap-2 flex-wrap mt-0.5">
  {cls.startTime && (
    <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500">
      {fmt12(cls.startTime)} — {fmt12(cls.endTime)}
    </span>
  )}
  {cls.room && (
    <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
      <FaDoorOpen size={8} className="opacity-60"/>{cls.room}
    </span>
  )}
</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
{/* Footer buttons */}
            <div className="flex gap-3 shrink-0 pt-1">
              <button onClick={onClose}
               className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95">
                Cancel
              </button>
              {preview.length === 0 ? (
                <button onClick={handleParse} disabled={!text.trim()}
                  className="flex-1 py-3 bg-[#005c00] dark:bg-[#005c00] text-white rounded-xl font-bold text-xs uppercase tracking-widest disabled:opacity-40 hover:bg-[#007a00] dark:hover:bg-[#007a00]shadow-md transition-all">
                  Parse Schedule
                </button>
              ) : (
                <button onClick={() => { onImport(preview); onClose(); }}
                  className="flex-1 py-3.5 bg-[#005c00] dark:bg-[#005c00] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#007a00] dark:hover:bg-[#007a00]shadow-lg shadow-[#06402B]/20 transition-all active:scale-95 flex items-center justify-center gap-2"
>
                  <FaCheckCircle size={12}/> Add {preview.length} Class{preview.length !== 1 ? "es" : ""}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardScheduleMaker(props: DashboardScheduleMakerProps) {
  return (
    <ModalProvider>
      <ScheduleMakerInner {...props} />
    </ModalProvider>
  );
}

function ScheduleMakerInner({}: DashboardScheduleMakerProps) {
  useToolsFont();
  const { showAlert, showConfirm } = useModal();
  const [classes, setClassesRaw] = useState<ClassSession[]>([]);
  const [termName, setTermNameRaw] = useState("1st Term, A.Y. 2026-2027");
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('light');
  const [format, setFormat] = useState<FormatMode>('desktop');

  const [view, setView] = useState<ViewMode>('editor');
  const [isExporting, setIsExporting] = useState(false);
  const [wallpaperMode, setWallpaperMode] = useState<'lockscreen' | 'homescreen'>('lockscreen');
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [history, setHistory] = useState<ClassSession[][]>([]);
  const [future, setFuture] = useState<ClassSession[][]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showPasteModal, setShowPasteModal] = useState(false);
const [pasteText, setPasteText] = useState("");
const [parsePreview, setParsePreview] = useState<ClassSession[]>([]);
const [parsError, setParsError] = useState("");

  // ── Hydrate — localStorage only ───────────────────────────
  useEffect(() => {
    let loaded = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: PersistedState = JSON.parse(raw);
        setClassesRaw((parsed.classes || []).map(c => ({ ...c, room: c.room ?? '' })));
        setTermNameRaw(parsed.termName || "2nd Term, A.Y. 2025-2026");
        setActiveTheme(parsed.activeTheme || 'light');
        setFormat(parsed.format || 'desktop');
        setSavedAt(parsed.savedAt || null);
        loaded = true;
      }
    } catch { /* ignore */ }

    if (!loaded) {
      setClassesRaw([
        { id: '1', code: 'CS101', name: 'Intro to Computing', room: 'GK-101', days: ['M', 'W'], startTime: '08:00', endTime: '09:30', color: PASTEL_COLORS[3] },
        { id: '2', code: 'MATH20', name: 'Discrete Mathematics', room: 'AGN-301', days: ['T', 'Th'], startTime: '10:00', endTime: '12:00', color: PASTEL_COLORS[6] }
      ]);
    }

    setHydrated(true);
  }, []);

  // ── Persist — localStorage only ───────────────────────────
  const persist = useCallback((cls: ClassSession[], name: string, theme: ThemeMode, fmt: FormatMode) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const now = Date.now();
      const state: PersistedState = { classes: cls, termName: name, activeTheme: theme, format: fmt, savedAt: now };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setSavedAt(now);
      } catch { /* quota */ }
    }, 800);
  }, []);

  const pushHistory = useCallback((prev: ClassSession[]) => {
    setHistory(h => [...h.slice(-MAX_HISTORY), prev]);
    setFuture([]);
  }, []);

  const setClasses = useCallback((updater: ClassSession[] | ((prev: ClassSession[]) => ClassSession[]), skipHistory = false) => {
    setClassesRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (!skipHistory) pushHistory(prev);
      persist(next, termName, activeTheme, format);
      return next;
    });
  }, [termName, activeTheme, format, persist, pushHistory]);

  const setTermName = useCallback((name: string) => {
    setTermNameRaw(name);
    persist(classes, name, activeTheme, format);
  }, [classes, activeTheme, format, persist]);

  const handleThemeChange = useCallback((t: ThemeMode) => {
    setActiveTheme(t);
    persist(classes, termName, t, format);
  }, [classes, termName, format, persist]);

  const handleFormatChange = useCallback((f: FormatMode) => {
    setFormat(f);
    persist(classes, termName, activeTheme, f);
  }, [classes, termName, activeTheme, persist]);

  // ── Undo / Redo ──────────────────────────────────────────
  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [classes, ...f]);
    setHistory(h => h.slice(0, -1));
    setClassesRaw(prev);
    persist(prev, termName, activeTheme, format);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(h => [...h, classes]);
    setFuture(f => f.slice(1));
    setClassesRaw(next);
    persist(next, termName, activeTheme, format);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // ── Conflicts ────────────────────────────────────────────
  const conflicts = detectConflicts(classes);
  const conflictPairs = new Set<string>();
  conflicts.forEach((vals, key) => vals.forEach(v => conflictPairs.add([key, v].sort().join('|'))));

  // ── Image upload ─────────────────────────────────────────
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setBgImage(URL.createObjectURL(e.target.files[0]));
  };

  // ── Class CRUD ───────────────────────────────────────────
  const addClass = () => {
    setClasses(prev => [...prev, {
      id: Date.now().toString(), code: '', name: '', room: '',
      days: [], startTime: '08:00', endTime: '09:00',
      color: PASTEL_COLORS[prev.length % PASTEL_COLORS.length]
    }]);
  };

  const duplicateClass = (cls: ClassSession) => {
    setClasses(prev => [...prev, { ...cls, id: Date.now().toString(), code: cls.code + '_2' }]);
  };


  const updateClass = (id: string, field: keyof ClassSession, value: any) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const removeClass = (id: string) => {
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const toggleDay = (id: string, day: Day) => {
    setClasses(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newDays = c.days.includes(day) ? c.days.filter(d => d !== day) : [...c.days, day];
      return { ...c, days: newDays };
    }));
  };

  const cycleColor = (id: string, currentColor: string) => {
    const nextIndex = (PASTEL_COLORS.indexOf(currentColor) + 1) % PASTEL_COLORS.length;
    updateClass(id, 'color', PASTEL_COLORS[nextIndex]);
  };

  const clearAll = () => {
    showConfirm(
      "Clear All Classes",
      "This will remove all classes from your schedule. This action can be undone with Ctrl+Z.",
      () => setClasses([]),
      "Clear All",
      false
    );
  };

  // ── Position helpers ─────────────────────────────────────
  const getPositionStyle = (start: string, end: string) => {
    if (!start || !end) return { top: '0%', height: '0%' };
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMin = (sh * 60 + sm) - (START_HOUR * 60);
    const endMin = (eh * 60 + em) - (START_HOUR * 60);
    const top = (startMin / TOTAL_MINUTES) * 100;
    const height = ((endMin - startMin) / TOTAL_MINUTES) * 100;
    return { top: `${top}%`, height: `${height}%` };
  };

  const formatTime12hr = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const sortClassesByTime = (dayClasses: ClassSession[]) =>
    [...dayClasses].sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

  // ── Export JPG ───────────────────────────────────────────
  const downloadJPG = async () => {
    setIsExporting(true);
    try {
      const { toJpeg } = await import('html-to-image');
      const element = document.getElementById('schedule-canvas');
      if (!element) return;
      const dataUrl = await toJpeg(element, {
        quality: 1.0, pixelRatio: format === 'mobile' ? 4 : 2,
        backgroundColor: activeTheme === 'black' ? '#09090b' : activeTheme === 'blue' ? '#0f172a' : activeTheme === 'pink' ? '#fff1f2' : '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `${termName || 'My_Schedule'}_${format}.jpg`;
      link.href = dataUrl; link.click();
    } catch (err) {
      showAlert("Export Failed", "Failed to export. Ensure 'html-to-image' is installed.");
    } finally { setIsExporting(false); }
  };

  if (!hydrated) return (
    <div className="flex items-center justify-center py-20">
      <span className="w-8 h-8 rounded-full border-4 border-[#06402B]/30 border-t-[#06402B] animate-spin" />
    </div>
  );

  const parseScheduleText = (text: string): ClassSession[] => {
  const results: ClassSession[] = [];
  const seen = new Set<string>();

  // Pattern: COURSECODE\nSECTION\nRM... - DAYS TIME-TIME  or  - - DAYS TIME-TIME
  const blockRegex = /([A-Z]{2,}\d{2,}[A-Z]?)\s*\n\s*([A-Z0-9]+)\s*\n\s*(.+?)\s*-\s*([A-Z]{1,6})(\d{4})-(\d{4})/gm;

  const DAY_MAP: Record<string, Day[]> = {
    'M':   ['M'],
    'T':   ['T'],
    'W':   ['W'],
    'TH':  ['Th'],
    'F':   ['F'],
    'S':   ['S'],
    'MT':  ['M','T'],
    'MW':  ['M','W'],
    'MF':  ['M','F'],
    'TTH': ['T','Th'],
    'TF':  ['T','F'],
    'WF':  ['W','F'],
    'MWF': ['M','W','F'],
    'MTWTHF': ['M','T','W','Th','F'],
  };

  const toTime = (t: string) => {
    const h = t.slice(0, 2);
    const m = t.slice(2, 4);
    return `${h}:${m}`;
  };

  let match;
  while ((match = blockRegex.exec(text)) !== null) {
    const code = match[1].trim();
    const section = match[2].trim();
    const roomPart = match[3].trim();
    const dayStr = match[4].toUpperCase();
    const startTime = toTime(match[5]);
    const endTime = toTime(match[6]);

    const key = `${code}-${dayStr}-${startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const days: Day[] = DAY_MAP[dayStr] || [];
    const room = roomPart.replace(/^-\s*/, '').trim();

    results.push({
      id: `paste-${Date.now()}-${results.length}`,
      code,
      name: section,
      room: room === '-' ? '' : room,
      days,
      startTime,
      endTime,
      color: PASTEL_COLORS[results.length % PASTEL_COLORS.length],
    });
  }

  return results;
};

  // ==========================================
  // VIEW: EDITOR
  // ==========================================
  if (view === 'editor') {
    return (
      <div style={{ background: CREAM, color: DARK, minHeight: "100dvh" }}>
      <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20 pt-10 animate-in fade-in slide-in-from-bottom-4 w-full px-4">

        <PasteScheduleModal
  isOpen={showPasteModal}
  onClose={() => setShowPasteModal(false)}
  onImport={(parsed) => setClasses(prev => [...prev, ...parsed])}
/>

        {/* Header Block */}        <Link href="/tools" style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          ...mono, fontSize: "0.6rem", letterSpacing: "0.15em", textTransform: "uppercase",
          color: "rgba(17,17,17,0.5)", textDecoration: "none", marginBottom: "0.5rem",
          transition: "color 0.2s"
        }}
        onMouseEnter={e => e.currentTarget.style.color = DARK}
        onMouseLeave={e => e.currentTarget.style.color = "rgba(17,17,17,0.5)"}
        >
          <FaArrowLeft size={12} /> BACK TO TOOLS
        </Link>

        <div style={{ background: "rgba(255,255,255,0.55)", border: "1px solid rgba(17,17,17,0.1)", borderRadius: "4px", overflow: "hidden" }}>
          <div style={{ height: 2, background: GREEN }} />
          <div className="p-5 sm:p-6 md:p-8 flex flex-col lg:flex-row justify-between gap-6">

          <div className="flex-1 space-y-3 sm:space-y-4 w-full">
            <input
              type="text" placeholder="Term / Semester Name"
              value={termName} onChange={e => setTermName(e.target.value)}
              className="w-full text-2xl md:text-4xl bg-transparent border-none outline-none tracking-tight"
              style={{ ...dg, color: DARK }}
            />
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded text-[10px] sm:text-xs font-bold uppercase tracking-widest" style={{ ...mono, background: "rgba(0,92,0,0.08)", color: GREEN, borderRadius: 4 }}>
                {classes.length} Classes
              </div>
<button onClick={() => setShowPasteModal(true)}
  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors"
  style={{ ...mono, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK }}
  onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; }}
  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(17,17,17,0.15)"; e.currentTarget.style.color = DARK; }}
>
  <FaCalendarAlt size={10} /> Paste from SERP
</button>
              <ConflictBadge count={conflictPairs.size} />
              <SaveIndicator savedAt={savedAt} />
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col justify-end gap-3 w-full lg:w-auto">
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={undo} disabled={history.length === 0} title="Undo (Ctrl+Z)"
                className="flex-1 lg:flex-none px-4 py-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 transition-all text-[10px] sm:text-xs"
                style={{ ...mono, background: "rgba(17,17,17,0.05)", color: "rgba(17,17,17,0.6)", borderRadius: 4 }}>
                <FaUndo size={12} /> <span className="hidden sm:inline">Undo</span>
              </button>
              <button onClick={redo} disabled={future.length === 0} title="Redo (Ctrl+Y)"
                className="flex-1 lg:flex-none px-4 py-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 transition-all text-[10px] sm:text-xs"
                style={{ ...mono, background: "rgba(17,17,17,0.05)", color: "rgba(17,17,17,0.6)", borderRadius: 4 }}>
                <FaRedo size={12} /> <span className="hidden sm:inline">Redo</span>
              </button>
            </div>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => fileInputRef.current?.click()}
                className="flex-1 lg:w-full px-4 py-3 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all text-[10px] sm:text-xs"
                style={{ ...mono, background: "rgba(17,17,17,0.08)", color: DARK, borderRadius: 4 }}>
                <FaImage size={14} /> {bgImage ? 'Change Image' : 'Add Background'}
              </button>
              {bgImage && (
                <button onClick={() => setBgImage(null)} className="px-4 py-3 font-bold transition-colors" style={{ background: "rgba(185,28,28,0.08)", color: "#b91c1c", borderRadius: 4 }}>
                  <FaTrashAlt size={14} />
                </button>
              )}
            </div>

            <button onClick={() => {
              if (saveTimerRef.current) {
                clearTimeout(saveTimerRef.current);
                try {
                  const state = { classes, termName, activeTheme, format, savedAt: Date.now() };
                  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                  setSavedAt(state.savedAt);
                } catch { /* ignore */ }
              }
              setView('canvas');
            }}
              className="w-full sm:w-auto lg:w-full px-6 sm:px-8 py-3 font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all text-[10px] sm:text-xs"
              style={{ ...mono, background: GREEN, color: "#fff", borderRadius: 4 }}
              onMouseEnter={e => (e.currentTarget.style.opacity = "0.87")}
              onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
            >
              <FaCalendarAlt size={14} /> View Timetable
            </button>
          </div>
          </div>
        </div>

        {/* Class Input List */}
        <div className="space-y-4 w-full">
          <AnimatePresence>
            {classes.map((cls) => {
              const hasConflict = conflicts.has(cls.id);
              return (
                <motion.div
                  key={cls.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 sm:p-5 flex flex-col gap-4 group transition-colors w-full"
                  style={{
                    background: "rgba(255,255,255,0.55)", borderRadius: 4,
                    border: `1px solid ${hasConflict ? "rgba(185,28,28,0.4)" : "rgba(17,17,17,0.1)"}`,
                  }}
                >
                  {hasConflict && (
                    <div className="flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest w-full" style={{ background: "rgba(185,28,28,0.08)", border: "1px solid rgba(185,28,28,0.2)", borderRadius: 4, color: "#b91c1c" }}>
                      <FaExclamationTriangle size={9} /> Time conflict detected
                    </div>
                  )}

                  {/* Row 1: Color + Code + Name */}
                  <div className="flex flex-col lg:flex-row gap-3">
                    <div className="flex items-center gap-3 w-full lg:w-48 shrink-0">
                      <button onClick={() => cycleColor(cls.id, cls.color)} title="Click to change color"
                        className={`w-12 h-12 lg:w-10 lg:h-10 rounded-xl lg:rounded-full ${cls.color} flex items-center justify-center transition-all shadow-inner shrink-0 border-2 hover:scale-110 active:scale-90`}>
                        <FaPalette size={14} className="opacity-60" />
                      </button>
                      <input
                        type="text" placeholder="Code" value={cls.code}
                        onChange={(e) => updateClass(cls.id, 'code', e.target.value)}
                        className="tools-input flex-1 lg:w-full outline-none p-3 sm:p-4 lg:p-3 uppercase text-sm sm:text-base"
                        style={{ ...mono, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK, fontWeight: 600 }}
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text" placeholder="Course Name" value={cls.name}
                        onChange={(e) => updateClass(cls.id, 'name', e.target.value)}
                        className="tools-input w-full outline-none p-3 sm:p-4 lg:p-3 text-sm sm:text-base"
                        style={{ ...ss, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK }}
                      />
                    </div>
                    {/* Room field */}
                    <div className="w-full lg:w-36 shrink-0">
                      <div className="relative">
                        <FaDoorOpen size={11} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "rgba(17,17,17,0.4)" }}/>
                        <input
                          type="text" placeholder="Room" value={cls.room}
                          onChange={(e) => updateClass(cls.id, 'room', e.target.value)}
                          className="tools-input w-full pl-8 outline-none p-3 sm:p-4 lg:p-3 text-sm"
                          style={{ ...ss, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Days + Times + Actions */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Day toggles */}
                    <div className="flex justify-between sm:justify-center items-center gap-1 sm:gap-2 p-2 sm:p-3 lg:p-1.5 flex-1 sm:flex-none" style={{ background: "rgba(17,17,17,0.04)", border: "1px solid rgba(17,17,17,0.1)", borderRadius: 4 }}>
                      {DAYS_OF_WEEK.map(day => {
                        const isActive = cls.days.includes(day);
                        return (
                          <button key={day} onClick={() => toggleDay(cls.id, day)}
                            className={`flex-1 sm:w-10 sm:h-10 lg:w-8 lg:h-8 py-2 sm:py-0 text-xs sm:text-sm lg:text-xs font-black transition-all border ${
                              isActive ? `${cls.color} shadow-sm` : ''}`}
                            style={!isActive ? { borderColor: "transparent", color: "rgba(17,17,17,0.4)", borderRadius: 3 } : { borderRadius: 3 }}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Times */}
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="time" value={cls.startTime}
                        onChange={(e) => updateClass(cls.id, 'startTime', e.target.value)}
                        className="tools-input flex-1 outline-none p-3 sm:p-4 lg:p-2.5 text-center text-sm sm:text-base"
                        style={{ ...mono, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK }}
                      />
                      <span className="font-bold shrink-0" style={{ color: "rgba(17,17,17,0.4)" }}>–</span>
                      <input
                        type="time" value={cls.endTime}
                        onChange={(e) => updateClass(cls.id, 'endTime', e.target.value)}
                        className="tools-input flex-1 outline-none p-3 sm:p-4 lg:p-2.5 text-center text-sm sm:text-base"
                        style={{ ...mono, background: CREAM, border: "1px solid rgba(17,17,17,0.15)", borderRadius: 4, color: DARK }}
                      />
                    </div>

                    {/* Duplicate + Delete */}
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => duplicateClass(cls)} title="Duplicate class"
                        className="flex-1 sm:flex-none transition-colors p-3 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                        style={{ ...mono, background: "rgba(17,17,17,0.05)", color: "rgba(17,17,17,0.5)", borderRadius: 4 }}
                        onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
                        onMouseLeave={e => (e.currentTarget.style.color = "rgba(17,17,17,0.5)")}
                      >
                        <span className="sm:hidden">Duplicate</span><FaCopy size={13} />
                      </button>
                      <button onClick={() => removeClass(cls.id)} title="Remove class"
                        className="flex-1 sm:flex-none transition-colors p-3 flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                        style={{ ...mono, background: "rgba(185,28,28,0.08)", color: "#b91c1c", borderRadius: 4 }}
                      >
                        <span className="sm:hidden">Remove</span><FaTrashAlt size={13} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {classes.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400">
              <FaCalendarAlt size={28} className="opacity-30" />
              <p className="text-sm font-bold uppercase tracking-widest">No classes yet</p>
              <p className="text-xs text-zinc-400 font-medium">Add a class below or import from your Tracker</p>
            </motion.div>
          )}
          <div className="flex gap-3">
            <button onClick={addClass}
              className="flex-1 py-5 sm:py-6 border-2 border-dashed font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2"
              style={{ ...mono, borderColor: "rgba(17,17,17,0.2)", color: "rgba(17,17,17,0.5)", borderRadius: 4 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = GREEN; e.currentTarget.style.color = GREEN; e.currentTarget.style.background = "rgba(0,92,0,0.04)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(17,17,17,0.2)"; e.currentTarget.style.color = "rgba(17,17,17,0.5)"; e.currentTarget.style.background = "transparent"; }}
            >
              <FaPlus size={12} /> Add New Class
            </button>
            {classes.length > 0 && (
              <button onClick={clearAll}
                className="px-5 py-5 sm:py-6 border-2 border-dashed font-bold uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-center gap-2"
                style={{ ...mono, borderColor: "rgba(185,28,28,0.3)", color: "#dc2626", borderRadius: 4 }}
              >
                <FaTrashAlt size={12} /> <span className="hidden sm:inline">Clear All</span>
              </button>
            )}
          </div>

          <p className="text-center text-[10px] pt-2" style={{ ...mono, color: "rgba(17,17,17,0.4)" }}>
            Ctrl+Z to undo · Ctrl+Y to redo · Changes auto-saved
          </p>
        </div>
      </div>
      </div>
    );
  }

  // ==========================================
  // VIEW: CANVAS & EXPORT
  // ==========================================
 if (view === 'canvas') {
    const currentTheme = THEME_STYLES[activeTheme];

    return (
      <div className="flex flex-col min-h-[100dvh] w-full" style={{ background: CREAM, color: DARK }}>
            {/* Note: This switcher below appears to have been pasted outside the header. You can safely delete it or move it down! */}
            <div className="flex p-1" style={{ background: "rgba(17,17,17,0.06)", borderRadius: 4 }}>         <button onClick={() => handleFormatChange('desktop')}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                style={{ ...mono, borderRadius: 3, background: format === 'desktop' ? GREEN : 'transparent', color: format === 'desktop' ? '#fff' : 'rgba(17,17,17,0.5)' }}>
                <FaDesktop size={12} /> <span className="hidden sm:inline">Desktop</span>
              </button>
              <button onClick={() => handleFormatChange('mobile')}
                className="px-3 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
                style={{ ...mono, borderRadius: 3, background: format === 'mobile' ? GREEN : 'transparent', color: format === 'mobile' ? '#fff' : 'rgba(17,17,17,0.5)' }}>
                <FaMobileAlt size={12} /> <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>
        {/* TOP HEADER */}
        <div className="h-16 md:h-20 px-3 sm:px-4 md:px-8 flex items-center justify-between shrink-0 z-30" style={{ background: CREAM, borderBottom: "1px solid rgba(17,17,17,0.1)" }}>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
            <button onClick={() => setView('editor')}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shrink-0"
              style={{ background: "rgba(17,17,17,0.08)", color: "rgba(17,17,17,0.5)" }}>
              <FaTimes size={14} />
            </button>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm md:text-lg uppercase tracking-tight truncate" style={{ ...dg, color: DARK }}>{termName || "My Schedule"}</h3>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-widest truncate" style={{ ...mono, color: GREEN }}>Preview & Export</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 shrink-0">
            <div className="flex bg-zinc-200 dark:bg-zinc-800 p-1 rounded-xl">
              <button onClick={() => handleFormatChange('desktop')}
                className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${format === 'desktop' ? 'bg-white dark:bg-zinc-950 shadow-md text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <FaDesktop size={12} /> <span className="hidden sm:inline">Desktop</span>
              </button>
              <button onClick={() => handleFormatChange('mobile')}
                className={`px-3 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 ${format === 'mobile' ? 'bg-white dark:bg-zinc-950 shadow-md text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}>
                <FaMobileAlt size={12} /> <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

                 {format === 'mobile' && (
              <div className="flex p-1" style={{ background: "rgba(17,17,17,0.06)", borderRadius: 4 }}>
                <button onClick={() => setWallpaperMode('lockscreen')}
                  className="px-2.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all"
                  style={{ ...mono, borderRadius: 3, background: wallpaperMode === 'lockscreen' ? GREEN : 'transparent', color: wallpaperMode === 'lockscreen' ? '#fff' : 'rgba(17,17,17,0.5)' }}>
                  Lock
                </button>
                <button onClick={() => setWallpaperMode('homescreen')}
                  className="px-2.5 py-2 text-[9px] font-bold uppercase tracking-widest transition-all"
                  style={{ ...mono, borderRadius: 3, background: wallpaperMode === 'homescreen' ? GREEN : 'transparent', color: wallpaperMode === 'homescreen' ? '#fff' : 'rgba(17,17,17,0.5)' }}>
                  Home
                </button>
              </div>
            )}

            <div className="hidden md:block" style={{ width: 1, height: 24, background: "rgba(17,17,17,0.12)" }} />                <button onClick={downloadJPG} disabled={isExporting}
              className="flex items-center justify-center gap-1.5 px-3 sm:px-4 md:px-5 py-2 md:py-2.5 text-white font-bold text-[10px] sm:text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-md disabled:opacity-50 shrink-0"
              style={{ ...mono, background: GREEN, borderRadius: 4 }}>
              <FaDownload size={14} /> <span className="hidden sm:inline">{isExporting ? "Saving..." : "Export JPG"}</span>
            </button>
          </div>
        </div>

        {/* MAIN LAYOUT */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full">

                {/* THEME SIDEBAR */}
          <div className="w-full md:w-20 shrink-0 flex md:flex-col items-center md:justify-center gap-4 p-3 md:p-0 border-b md:border-b-0 z-20 transition-colors overflow-x-auto" style={{ background: CREAM, borderColor: "rgba(17,17,17,0.1)" }}>    <span className="md:hidden text-[9px] font-bold text-zinc-500 uppercase tracking-widest shrink-0 ml-2">Theme:</span>
  {([
              { id: 'light', color: 'bg-white border-zinc-300' },
              { id: 'black', color: 'bg-zinc-950 border-zinc-700' },
              { id: 'blue', color: 'bg-slate-900 border-slate-700' },
              { id: 'pink', color: 'bg-rose-100 border-rose-300' }
            ] as { id: ThemeMode; color: string }[]).map((t) => (
              <button key={t.id} onClick={() => handleThemeChange(t.id)} title={`${t.id} theme`}
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-2 shrink-0 transition-all ${t.color} ${activeTheme === t.id ? 'scale-110 shadow-[0_0_15px_rgba(0,0,0,0.2)] ring-2 ring-[#005c00] ring-offset-2' : 'hover:scale-105 opacity-80'}`} 
              />
            ))}
          </div>
          {/* CANVAS */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex md:items-start justify-center w-full relative" style={{ background: "rgba(17,17,17,0.03)" }}>      {format === 'desktop' && (
              <div className="md:hidden absolute top-6 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-bold px-4 py-1.5 rounded-full z-40 backdrop-blur-md animate-pulse whitespace-nowrap pointer-events-none">
                Scroll horizontally ↔
              </div>
            )}

            <div
              id="schedule-canvas"
              className={`relative transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${!bgImage && currentTheme.bg} ${currentTheme.border} border shadow-2xl overflow-hidden shrink-0 flex flex-col ${
                format === 'desktop'
                  ? 'w-full min-w-250 max-w-7xl rounded-4xl p-8 md:p-10 h-250'
                  : 'w-90 h-195 rounded-[2.5rem] border-8 shadow-[0_0_50px_rgba(0,0,0,0.15)] overflow-hidden'
              }`}
              style={{ backgroundImage: bgImage ? `url(${bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}
            >
              {bgImage && (
                <div className={`absolute inset-0 z-0 backdrop-blur-md ${activeTheme === 'black' ? 'bg-black/70' : activeTheme === 'blue' ? 'bg-slate-900/70' : activeTheme === 'pink' ? 'bg-rose-100/70' : 'bg-white/70'}`} />
              )}

              {/* ── DESKTOP CANVAS ── */}
              {format === 'desktop' ? (
                <>
                  <div className="mb-8 text-center relative z-10">
                    <h2 className={`font-black uppercase tracking-tight text-3xl md:text-4xl ${currentTheme.text}`}>{termName || "My Schedule"}</h2>
                    <p className={`font-mono font-bold uppercase tracking-widest text-xs mt-1 ${currentTheme.text} opacity-80`}>USC-CSC</p>
                  </div>

                  <div className="grid grid-cols-7 gap-4 mb-4 shrink-0 relative z-10">
                    <div className="col-span-1" />
                    {DAYS_OF_WEEK.map(day => {
                      const fullDay = { 'M':'Monday', 'T':'Tuesday', 'W':'Wednesday', 'Th':'Thursday', 'F':'Friday', 'S':'Saturday' }[day];
                      return (
                        <div key={day} className={`col-span-1 text-center py-3 rounded-xl border ${currentTheme.border} ${bgImage ? 'bg-black/10 dark:bg-white/10 backdrop-blur-sm' : currentTheme.header}`}>
                          <p className={`font-black uppercase tracking-wider text-sm ${currentTheme.text}`}>{fullDay}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-7 gap-4 relative flex-1 z-10">
                    <div className={`col-span-1 flex flex-col justify-between border-r border-dashed ${currentTheme.border} pr-4`}>
                      {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                        const hour = START_HOUR + i;
                        const ampm = hour >= 12 ? 'PM' : 'AM';
                        const displayHr = hour > 12 ? hour - 12 : hour;
                        return (
                          <div key={i} className={`text-right font-mono font-bold uppercase relative -top-2 text-[10px] ${currentTheme.text} opacity-70`}>
                            {displayHr}:00 {ampm}
                          </div>
                        );
                      })}
                    </div>

                    <div className="absolute inset-0 left-[calc(100%/7)] right-0 pointer-events-none flex flex-col justify-between z-0">
                      {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => (
                        <div key={i} className={`w-full h-px ${bgImage ? 'bg-black/10 dark:bg-white/10' : currentTheme.grid}`} />
                      ))}
                    </div>

                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className={`col-span-1 relative z-10 h-full border-r border-dashed ${currentTheme.border} last:border-0`}>
                        {classes.filter(c => c.days.includes(day)).map(cls => {
                          const pos = getPositionStyle(cls.startTime, cls.endTime);
                          const hasConflict = conflicts.has(cls.id);
                          return (
                            <div
                              key={`${cls.id}-${day}`}
                              className={`absolute left-0 right-0 mx-1 rounded-xl shadow-sm border flex flex-col overflow-hidden p-3 transition-all ${cls.color} ${hasConflict ? 'ring-2 ring-red-500' : ''}`}
                              style={{ top: pos.top, height: pos.height }}
                            >
                              <h4 className="font-black leading-tight text-sm truncate">{cls.code}</h4>
                              <p className="font-bold uppercase tracking-widest mt-0.5 text-[10px] truncate opacity-90">{cls.name}</p>
                              {/* ← NEW: Room shown on canvas block */}
                              {cls.room && (
                                <p className="font-mono text-[9px] opacity-70 truncate mt-0.5 flex items-center gap-0.5">
                                  <FaDoorOpen size={7}/> {cls.room}
                                </p>
                              )}
                              <p className="font-mono font-bold mt-auto opacity-80 text-[10px] truncate">
                                {formatTime12hr(cls.startTime)} - {formatTime12hr(cls.endTime)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* ── MOBILE CANVAS ── */
                <div className="flex flex-col h-full w-full relative z-10">
                  {wallpaperMode === 'lockscreen' ? (
                    <div className="flex flex-col h-full w-full relative z-10 justify-end">
                      <div className="flex flex-col gap-1.5 px-4 pt-2 pb-6 overflow-hidden">
                        <div className={`flex items-center justify-between mb-1 ${currentTheme.text}`}>
                          <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-60">{termName}</p>
                          <p className="text-[7px] font-mono opacity-30">JPCS DLSAU</p>
                        </div>

                        {DAYS_OF_WEEK.map(day => {
                          const dayClasses = sortClassesByTime(classes.filter(c => c.days.includes(day)));
                          if (dayClasses.length === 0) return null;
                          const fullDay = { 'M':'MON','T':'TUE','W':'WED','Th':'THU','F':'FRI','S':'SAT' }[day];
                          return (
                            <div key={day} className={`flex gap-1.5 items-stretch rounded-xl overflow-hidden border ${currentTheme.border}`}>
                              <div className={`w-9 shrink-0 flex items-center justify-center ${activeTheme === 'light' ? 'bg-zinc-900' : activeTheme === 'pink' ? 'bg-rose-300' : 'bg-white/10'}`}>
                                <span className={`text-[7px] font-black uppercase tracking-widest ${activeTheme === 'light' ? 'text-white' : currentTheme.text}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                  {fullDay}
                                </span>
                              </div>
                              <div className="flex-1 flex flex-col gap-1 py-1 pr-2 min-w-0">
                                {dayClasses.map(c => (
                                  <div key={c.id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${c.color} ${conflicts.has(c.id) ? 'ring-1 ring-red-500' : ''}`}>
                                    {c.room && <span className="shrink-0 text-[7px] font-black font-mono bg-black/15 px-1 py-0.5 rounded">{c.room}</span>}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[9px] font-black leading-none truncate">{c.code}</p>
                                      <p className="text-[7px] font-bold opacity-70 leading-none truncate mt-0.5 uppercase">{c.name}</p>
                                    </div>
                                    <div className="shrink-0 text-right">
                                      <p className="text-[7px] font-mono font-bold opacity-80 leading-none">{formatTime12hr(c.startTime)}</p>
                                      <p className="text-[7px] font-mono font-bold opacity-80 leading-none mt-0.5">{formatTime12hr(c.endTime)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full px-4 pt-8 pb-28 gap-1.5">
                      <div className={`flex items-center justify-between mb-1 ${currentTheme.text}`}>
                        <p className="text-[8px] font-black uppercase tracking-[0.25em] opacity-60">{termName}</p>
                        <p className="text-[7px] font-mono opacity-30">JPCS DLSAU</p>
                      </div>

                      {DAYS_OF_WEEK.map(day => {
                        const dayClasses = sortClassesByTime(classes.filter(c => c.days.includes(day)));
                        if (dayClasses.length === 0) return null;
                        const fullDay = { 'M':'MON','T':'TUE','W':'WED','Th':'THU','F':'FRI','S':'SAT' }[day];
                        return (
                          <div key={day} className={`flex gap-1.5 items-stretch rounded-xl overflow-hidden border ${currentTheme.border}`}>
                            <div className={`w-9 shrink-0 flex items-center justify-center ${activeTheme === 'light' ? 'bg-zinc-900' : activeTheme === 'pink' ? 'bg-rose-300' : 'bg-white/10'}`}>
                              <span className={`text-[7px] font-black uppercase tracking-widest ${activeTheme === 'light' ? 'text-white' : currentTheme.text}`} style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                                {fullDay}
                              </span>
                            </div>
                            <div className="flex-1 flex flex-col gap-1 py-1 pr-2 min-w-0">
                              {dayClasses.map(c => (
                                <div key={c.id} className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${c.color} ${conflicts.has(c.id) ? 'ring-1 ring-red-500' : ''}`}>
                                  {c.room && <span className="shrink-0 text-[7px] font-black font-mono bg-black/15 px-1 py-0.5 rounded">{c.room}</span>}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black leading-none truncate">{c.code}</p>
                                    <p className="text-[7px] font-bold opacity-70 leading-none truncate mt-0.5 uppercase">{c.name}</p>
                                  </div>
                                  <div className="shrink-0 text-right">
                                    <p className="text-[7px] font-mono font-bold opacity-80 leading-none">{formatTime12hr(c.startTime)}</p>
                                    <p className="text-[7px] font-mono font-bold opacity-80 leading-none mt-0.5">{formatTime12hr(c.endTime)}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}

                      <div className={`mt-auto pt-2 text-center opacity-15 ${currentTheme.text}`}>
                        <p className="text-[6px] font-mono uppercase tracking-widest">dock area</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}