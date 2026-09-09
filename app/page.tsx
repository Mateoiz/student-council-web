"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowRight,
  Megaphone,
  CalendarDays,
  Users2,
  LockKeyhole,
  Sparkles,
  Plus,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const councils = [
  {
    acronym: "CAST",
    name: "College of Arts, Science, and Technology",
    logo: "/colleges/cast1.png",
    lightColor: "group-hover:bg-red-50",
    textColor: "group-hover:text-red-700",
  },
  {
    acronym: "CBMA",
    name: "College of Business Mgt. & Accountancy",
    logo: "/colleges/cbma.png",
    lightColor: "group-hover:bg-yellow-50",
    textColor: "group-hover:text-yellow-700",
  },
  {
    acronym: "COED",
    name: "College of Education",
    logo: "/colleges/coed.png",
    lightColor: "group-hover:bg-blue-50",
    textColor: "group-hover:text-blue-700",
  },
  {
    acronym: "CVMAS",
    name: "College of Vet. Med. & Ag. Sciences",
    logo: "/colleges/cvmas.png",
    lightColor: "group-hover:bg-green-50",
    textColor: "group-hover:text-green-700",
  },
];

const COLLEGES = ["CAST", "CBMA", "COED", "CVMAS"];

const faqs = [
  {
    q: "Do I still have to attend my regular classes on September 1–2?",
    a: "For continuing/old students who are scheduled to take examinations on September 1–2, you are excused from your regular classes. Your absence will not be counted against you.",
  },
  {
    q: "What if I don't have an examination on September 1–2?",
    a: "If you are not scheduled for an examination, please follow your regular class schedule and the instructions of your respective faculty members.",
  },
  {
    q: "Where can I find my examination schedule and room assignment?",
    a: "Your examination schedule and room assignment will be provided by the faculty member handling the subject and made available through your respective College.",
  },
  {
    q: "Will attendance be checked on September 1–2?",
    a: "Regular attendance checking and recording will officially begin on September 7, 2026. However, students should still follow the arrangements and instructions provided by their respective faculty members.",
  },
  {
    q: "Are examinations on September 1–2 part of the previous term?",
    a: "Yes. These examinations are for continuing/old students who still need to complete examinations from the previous term.",
  },
  {
    q: "Will regular classes continue on September 1–2?",
    a: "Yes, regular classes are part of the opening of SY 2026–2027. However, students who are scheduled for examinations on September 1–2 are excused from their regular classes during the examination arrangements.",
  },
  {
    q: "What about new/first-year students?",
    a: "For new students, the Welcoming Rites will be scheduled on a later date. In the meantime, faculty members are encouraged to use class time for classroom orientation and discussion of relevant University policies and guidelines.",
  },
  {
    q: "Is wearing the uniform required during the first week?",
    a: "For 2nd year students and above: the prescribed university uniform is required; however, consideration is being given during the first week of classes — students who aren't yet able to wear their complete uniform are still encouraged to come in proper and decent attire. For 1st year students: wearing the prescribed university uniform is highly encouraged. In short: the uniform remains required, but students are being given consideration during the first week.",
  },
  {
    q: "How do I read my room assignment?",
    a: "Room codes indicate the building, floor, and room number. Example: LSB 701 — LSB (Life and Science Building), 7 (7th Floor), 01 (Room 1) — so LSB 701 means Life and Science Building, 7th Floor, Room 1.",
  },
  {
    q: "What if I am still affected by flooding and genuinely cannot travel to the University to take my examination?",
    a: "We understand that some students may still be affected by flooding or other circumstances brought about by the recent weather conditions. If you are genuinely unable to travel to the University and take your examination, please coordinate with your respective professor and explain your situation — they may provide appropriate consideration depending on your case. Communicate your concerns as soon as possible, and please prioritize your safety while coordinating.",
  },
  {
    q: "When will the Frosh Walk and Frosh Night be held?",
    a: "The official dates and details for the Frosh Walk and Frosh Night will be announced through the official Facebook page of the University Student Council — please wait for that announcement. In the meantime, the Lasallian Kickoff will be held on September 1 as a mini welcoming activity to kick off the new academic year and welcome students back to campus.",
  },
];

/* ─── Nav items data ────────────────────────────────────────────────────────── */
const navItems = [
  {
    index: "01",
    icon: <Megaphone size={20} strokeWidth={2} />,
    title: "Announcements",
    sub: "Official memorandums & updates",
    href: "#announcements",
    badge: null,
  },
  {
    index: "02",
    icon: <CalendarDays size={20} strokeWidth={2} />,
    title: "Events Calendar",
    sub: "Assemblies & org fairs",
    href: "#events",
    badge: null,
  },
  {
    index: "03",
    icon: <Users2 size={20} strokeWidth={2} />,
    title: "Council Directory",
    sub: "Meet your USC officers",
    href: "#directory",
    badge: null,
  },
  {
    index: "04",
    icon: <LockKeyhole size={20} strokeWidth={2} />,
    title: "Locker Booking",
    sub: "Automated reservation system",
    href: "/lockers",
    badge: "Open now",
  },
];

export default function Home() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const [collegeIndex, setCollegeIndex] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    if (!heroHovered) return;
    const interval = setInterval(() => {
      setCollegeIndex((i) => (i + 1) % COLLEGES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [heroHovered]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouseX((e.clientX - rect.left) / rect.width - 0.5);
    setMouseY((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-900">
      <Navbar />

      {/* ── Hero ── */}
      <section
        onMouseMove={handleHeroMouseMove}
        className="relative isolate flex min-h-[100svh] flex-col justify-start sm:justify-center overflow-hidden border-b border-zinc-200"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.div
            animate={{ x: mouseX * 14, y: mouseY * 10 }}
            transition={{ type: "spring", stiffness: 40, damping: 15 }}
            className="absolute inset-[-3%]"
          >
            <Image
              src="https://storage.googleapis.com/world-study-prod/media/school_photo/2696/1e6e2619-ca20-49a8-8078-91f3ed2e46f3.jpg"
              alt=""
              fill
              priority
              className="object-cover object-center"
            />
          </motion.div>
          <div className="absolute inset-0 bg-white/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white" />
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />
          <motion.div
            animate={{ x: ["-30%", "130%"] }}
            transition={{ repeat: Infinity, duration: 9, ease: "linear", repeatDelay: 3 }}
            className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-transparent via-green-500/10 to-transparent skew-x-12"
          />
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-green-500/20 rounded-full blur-3xl"
          />
        </div>

        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-green-600/60 to-transparent z-10" />

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-5 sm:px-6 pt-32 sm:pt-24 pb-20 sm:pb-24">
          <span
            aria-hidden
            className="hidden sm:block pointer-events-none absolute -top-12 right-6 select-none text-[20rem] font-bold leading-none text-zinc-900/[0.04]"
          >
            USC-CSC
          </span>

          <div className="relative flex flex-col lg:flex-row gap-10 sm:gap-16 lg:items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-6 sm:mb-8">
                <span className="h-px w-8 sm:w-10 bg-green-600" />
                <p className="font-mono text-[11px] sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-green-700 uppercase font-semibold">
                  De La Salle Araneta University
                </p>
              </div>

              <h1
                className="cursor-default text-[15vw] xs:text-6xl sm:text-7xl lg:text-[8.5rem] leading-[0.85] tracking-tighter font-extrabold text-zinc-900 uppercase"
                onMouseEnter={() => setHeroHovered(true)}
                onMouseLeave={() => { setHeroHovered(false); setCollegeIndex(0); }}
              >
                <span className="relative inline-flex items-end" style={{ clipPath: "inset(-20% 0 -20% 0)" }}>
                  <AnimatePresence mode="wait">
                    {!heroHovered ? (
                      <motion.span
                        key="university"
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block"
                      >
                        University
                      </motion.span>
                    ) : (
                      <motion.span
                        key={`college-${collegeIndex}`}
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "-100%", opacity: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="inline-block text-green-600"
                      >
                        {COLLEGES[collegeIndex]}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <br />
                <motion.span
                  animate={{ x: heroHovered ? 16 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  Student
                </motion.span>
                <br />
                <motion.span
                  animate={{ x: heroHovered ? 32 : 0, scaleX: heroHovered ? 1.04 : 1 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block italic text-green-600 font-serif tracking-normal lowercase origin-left"
                >
                  Council
                </motion.span>
              </h1>

              <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <a
                  href="#faqs"
                  className="group/btn2 order-first sm:order-none inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border-2 border-green-600 bg-green-600 sm:bg-green-50 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold tracking-wide text-white sm:text-green-700 transition-all active:scale-[0.98] sm:hover:bg-green-600 sm:hover:text-white"
                >
                  <Sparkles size={16} />
                  Opening of SY 2026–27 — FAQs
                </a>
                <a
                  href="#announcements"
                  className="group/btn inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-zinc-900 sm:bg-green-600 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold tracking-wide text-white transition-all active:scale-[0.98] sm:hover:bg-green-700 sm:hover:scale-105 shadow-md"
                >
                  Latest Resolutions
                  <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </a>
                <a
                  href="#directory"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border-2 border-zinc-200 bg-white/80 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold tracking-wide text-zinc-800 backdrop-blur-sm transition-all active:scale-[0.98] sm:hover:border-green-600 sm:hover:text-green-700"
                >
                  Find Your CSC
                </a>
              </div>
            </div>

            <div className="lg:w-[450px] shrink-0">
              <p className="text-zinc-600 text-base sm:text-lg leading-relaxed border-l-2 border-green-600 pl-4 sm:pl-6 mb-6 sm:mb-8">
                The bridge between the student body and the administration —
                resolutions, events, and everything happening across the
                College Student Councils.
              </p>
              <div className="flex flex-col gap-2.5 sm:gap-3 border-t border-zinc-200 pt-6 sm:pt-8">
                <p className="text-[11px] sm:text-xs uppercase tracking-widest font-semibold text-zinc-400 mb-1 sm:mb-2">
                  Representing 4 Colleges
                </p>
                {councils.map((csc) => (
                  <a
                    key={csc.acronym}
                    href={`#${csc.acronym.toLowerCase()}`}
                    className={`group relative flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/60 backdrop-blur-sm p-2.5 sm:p-3 transition-all duration-300 active:scale-[0.98] hover:border-transparent hover:shadow-lg ${csc.lightColor}`}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="relative flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-100 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 p-1.5 overflow-hidden">
                        <div className="relative w-full h-full">
                          <Image src={csc.logo} alt={`${csc.acronym} Logo`} fill className="object-contain" />
                        </div>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold text-sm sm:text-base text-zinc-900 transition-colors duration-300 ${csc.textColor}`}>
                          {csc.acronym}
                        </span>
                        <span className="text-xs font-medium text-zinc-500 line-clamp-1">{csc.name}</span>
                      </div>
                    </div>
                    <ArrowRight
                      size={18}
                      className={`mr-1 sm:mr-2 shrink-0 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 ${csc.textColor}`}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════════════
          WHERE TO START — editorial typographic link rail
      ══════════════════════════════════════════════════════════════════════ */}
      <section id="announcements" className="mx-auto max-w-[1400px] px-5 sm:px-6 py-16 sm:py-24">
        {/* Section header */}
        <div className="mb-0 flex items-end justify-between pb-4 border-b-2 border-zinc-900">
          <div className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.38em] text-green-600 uppercase font-semibold">
              Navigate
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
              Where to start
            </h2>
          </div>
          <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] text-zinc-400 uppercase pb-0.5">
            04 sections
          </span>
        </div>

        {/* Link rail rows */}
        <div>
          {navItems.map((item, i) => (
            <NavRow key={item.href} {...item} delay={i * 0.06} />
          ))}
        </div>
      </section>


      {/* ── FAQs ── */}
      <section id="faqs" className="border-t border-zinc-200 bg-zinc-50/60">
        <div className="mx-auto max-w-[900px] px-5 sm:px-6 py-16 sm:py-28">
          <div className="mb-10 sm:mb-14 flex flex-col gap-3 sm:gap-4">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 sm:w-10 bg-green-600" />
              <p className="font-mono text-[11px] sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-green-700 uppercase font-semibold">
                SY 2026–2027 Opening
              </p>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">
              Frequently asked questions
            </h2>
            <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-[560px]">
              Answers about the September 1–2 examination arrangements, uniforms,
              attendance, and welcoming activities for the new school year.
            </p>
          </div>

          <div className="flex flex-col divide-y divide-zinc-200 border-y border-zinc-200">
            {faqs.map((item, i) => {
              const open = openFaq === i;
              return (
                <div key={item.q}>
                  <button
                    onClick={() => setOpenFaq(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-start justify-between gap-4 sm:gap-6 py-5 sm:py-6 text-left"
                  >
                    <span className="text-base sm:text-lg font-bold text-zinc-900 leading-snug">{item.q}</span>
                    <motion.span
                      animate={{ rotate: open ? 45 : 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-0.5 shrink-0 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-green-50 text-green-700"
                    >
                      <Plus size={16} strokeWidth={2.5} />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {open && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <p className="pb-5 sm:pb-6 pr-10 sm:pr-14 text-sm sm:text-base text-zinc-600 leading-relaxed">
                          {item.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <p className="mt-8 sm:mt-10 text-sm text-zinc-500">
            Didn&apos;t find what you&apos;re looking for? Watch the official
            Facebook page of the University Student Council for further announcements.
          </p>
        </div>
      </section>
    </main>
  );
}

/* NavRow */
function NavRow({
  index,
  icon,
  title,
  sub,
  href,
  badge,
  delay = 0,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
  href: string;
  badge: string | null;
  delay?: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.a
      ref={ref}
      href={href}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay }}
      className="group relative flex items-center gap-5 sm:gap-8 border-b border-zinc-200 py-5 sm:py-6 no-underline overflow-hidden"
    >
      {/* Sweep underline — absolutely positioned, z-0 */}
      <span
        aria-hidden
        className="absolute bottom-0 left-0 h-[2px] w-0 bg-green-600 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
      />

      {/* Ghost index */}
      <span
        aria-hidden
        className="shrink-0 select-none font-mono text-3xl sm:text-4xl lg:text-5xl font-bold leading-none text-transparent transition-all duration-300 group-hover:opacity-70"
        style={{ WebkitTextStroke: "1.5px rgba(17,17,17,0.13)" }}
      >
        {index}
      </span>

      {/* Title — slides right on hover */}
      <h3 className="flex-1 min-w-0 text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight leading-none text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0 group-hover:translate-x-2.5 group-hover:text-green-700">
        {title}
      </h3>

      {/* Right meta — descriptor + icon + badge (desktop) */}
      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 max-w-[220px] opacity-40 transition-opacity duration-300 group-hover:opacity-100">
        {badge && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
            </span>
            {badge}
          </span>
        )}
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-500 text-right leading-snug">
          {sub}
        </p>
        <span className="text-green-600 mt-0.5">{icon}</span>
      </div>

      {/* Arrow — slides in from left */}
      <ArrowRight
        size={22}
        strokeWidth={2}
        className="shrink-0 text-green-600 opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
      />
    </motion.a>
  );
}