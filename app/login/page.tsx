"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, AlertCircle, User, Hash, Phone, BookOpen, GraduationCap, ChevronDown, Building2 } from "lucide-react";
import Navbar from "@/components/Navbar";

const ALLOWED_DOMAIN = "dlsau.edu.ph";

const COLLEGES: Record<string, string[]> = {
  "College of Veterinary Medicine & Agricultural Sciences": [
    "Doctor of Veterinary Medicine",
    "Bachelor of Science in Food Technology",
    "Bachelor of Science in Agriculture",
  ],
  "College of Business, Management, & Accountancy": [
    "Bachelor of Science in Accountancy",
    "Bachelor of Science in Business Administration",
    "Bachelor of Science in Hospitality Management",
    "Bachelor of Science in Tourism Management",
  ],
  "College of Education": [
    "Bachelor in Elementary Education",
    "Bachelor in Secondary Education",
  ],
  "College of Arts, Sciences & Technology": [
    "Bachelor of Arts in Psychology",
    "Bachelor of Science in Computer Engineering",
    "Bachelor of Science in Computer Science",
  ],
};

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Irregular"];

function Dropdown({
  icon: Icon, placeholder, value, options, onSelect, disabled,
}: {
  icon: React.ElementType; placeholder: string; value: string;
  options: string[]; onSelect: (v: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center pl-11 pr-9 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base text-left focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors active:scale-[0.99] ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${!value ? "text-zinc-400" : "text-zinc-900"}`}
      >
        <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
        {value || placeholder}
        <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && !disabled && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute z-20 mt-1.5 w-full max-h-[45vh] overflow-y-auto bg-white border border-zinc-200 rounded-xl shadow-lg py-1 overscroll-contain"
            >
              {options.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onSelect(opt); setOpen(false); }}
                  className="w-full text-left px-4 py-3 text-sm text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                >
                  {opt}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function isAllowedEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

function formatStudentId(raw: string) {
  // Increased max length from 12 to 13 digits (4 + 2 + 7)
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 6);
  const part3 = digits.slice(6, 13); // Slices up to the 13th digit

  let out = part1;
  if (digits.length > 4) out += "-" + part2;
  if (digits.length > 6) out += "-" + part3;
  return out;
}

function StudentFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/lockers";

  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    middle_initial: "",
    surname: "",
    student_id: "",
    email: "",
    college: "",
    program: "",
    year_level: "",
    phone: "",
  });

  // Pre-fill form if they already started
  useEffect(() => {
    const saved = localStorage.getItem("student_details");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setField("student_id", formatStudentId(e.target.value));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAllowedEmail(formData.email)) {
      setError(`Please use your school email ending in @${ALLOWED_DOMAIN}`);
      return;
    }

    // Save locally so the Checkout page can grab it and insert it into Supabase
    localStorage.setItem("student_details", JSON.stringify(formData));
    router.push(redirectTo);
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <div className="pt-24 md:pt-32 px-4 md:px-6 max-w-xl mx-auto pb-28 md:pb-20">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
          Student Details
        </h1>
        <p className="text-zinc-500 text-center text-xs md:text-sm mb-6 md:mb-8 px-2">
          Please fill out your information to proceed with your locker reservation.
        </p>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-4 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_90px_1fr] md:gap-4">
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First Name"
                  required
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>

              <div className="flex gap-2 md:contents">
                <div className="relative w-20 md:w-auto shrink-0">
                  <input
                    type="text"
                    name="middle_initial"
                    value={formData.middle_initial}
                    onChange={handleChange}
                    placeholder="M.I."
                    maxLength={3}
                    className="w-full px-2 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base text-center focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                  />
                </div>

                <div className="relative flex-1">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    placeholder="Surname"
                    required
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-4">
              <div className="relative">
                <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  name="student_id"
                  value={formData.student_id}
                  onChange={handleStudentIdChange}
                  placeholder="202X-00-XXXXXXX"
                  maxLength={15} // Adjusted strictly for 4 + 1 + 2 + 1 + 7
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm font-mono focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>

              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
                />
              </div>
            </div>

            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={`you@${ALLOWED_DOMAIN}`}
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-sm focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
              />
            </div>

            <Dropdown
              icon={Building2}
              placeholder="Select College"
              value={formData.college}
              options={Object.keys(COLLEGES)}
              onSelect={(v) => setFormData(prev => ({ ...prev, college: v, program: "" }))}
            />

            <Dropdown
              icon={BookOpen}
              placeholder={formData.college ? "Select Program" : "Select a college first"}
              value={formData.program}
              options={formData.college ? COLLEGES[formData.college] : []}
              onSelect={(v) => setField("program", v)}
              disabled={!formData.college}
            />

            <Dropdown
              icon={GraduationCap}
              placeholder="Select Year Level"
              value={formData.year_level}
              options={YEAR_LEVELS}
              onSelect={(v) => setField("year_level", v)}
            />
          </div>
          <button
            type="submit"
            className="hidden md:flex w-full items-center justify-center gap-2 py-3.5 mt-6 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide hover:bg-zinc-800 transition-colors"
          >
            Continue to Reservation
            <ArrowRight size={16} />
          </button>
        </form>

        {/* Mobile sticky submit bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="submit"
            form={undefined}
            onClick={handleSubmit as any}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide active:bg-zinc-800 transition-colors"
          >
            Continue to Reservation
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading...</p>
      </main>
    }>
      <StudentFormInner />
    </Suspense>
  );
}