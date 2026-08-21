"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Megaphone, CalendarDays, Users2, LockKeyhole, Sparkles } from "lucide-react";
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

// Note: the locker-open announcement now lives inside <Navbar /> itself
// (stacked within the fixed header, hidden on /lockers). No separate
// banner component needed here anymore — avoids a duplicate announcement
// and the fixed-position overlap bug from before.

export default function Home() {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [heroHovered, setHeroHovered] = useState(false);
  const [collegeIndex, setCollegeIndex] = useState(0);

  useEffect(() => {
    if (!heroHovered) return;
    const interval = setInterval(() => {
      setCollegeIndex((i) => (i + 1) % COLLEGES.length);
    }, 700);
    return () => clearInterval(interval);
  }, [heroHovered]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    // Parallax is a desktop-hover nicety; on touch devices there's no
    // mousemove, so this simply never fires and mouseX/Y stay at 0.
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseX(x);
    setMouseY(y);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-900">

      <Navbar />

      {/* ── Hero ──
          justify-start + explicit top padding on mobile (instead of pure
          vertical centering) so content always clears the fixed Navbar —
          which can be taller than expected when its announcement banner
          is showing. Reverts to centered on sm:+ where there's more room. */}
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
          {/* Giant watermark text — hidden on small phones where it just adds visual noise
              behind already-large heading text; reappears from sm: up */}
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
                {/* Line 1: University ↔ College acronym slot */}
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

                {/* Line 2: Student — slides right on hover (desktop only effect, harmless on touch) */}
                <motion.span
                  animate={{ x: heroHovered ? 16 : 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block"
                >
                  Student
                </motion.span>

                <br />

                {/* Line 3: Council — italic serif, slides + scales */}
                <motion.span
                  animate={{
                    x: heroHovered ? 32 : 0,
                    scaleX: heroHovered ? 1.04 : 1,
                  }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block italic text-green-600 font-serif tracking-normal lowercase origin-left"
                >
                  Council
                </motion.span>
              </h1>

              {/* CTAs: full-width stacked buttons on mobile instead of a wrapping
                  row of pill buttons that get squeezed and misaligned */}
              <div className="mt-10 sm:mt-14 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 sm:gap-4">
                <Link
                  href="/lockers"
                  className="group/btn2 order-first sm:order-none inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full border-2 border-green-600 bg-green-600 sm:bg-green-50 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold tracking-wide text-white sm:text-green-700 transition-all active:scale-[0.98] sm:hover:bg-green-600 sm:hover:text-white"
                >
                  <Sparkles size={16} />
                  Lockers Open — Reserve Now
                </Link>

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
                          <Image
                            src={csc.logo}
                            alt={`${csc.acronym} Logo`}
                            fill
                            className="object-contain"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className={`font-bold text-sm sm:text-base text-zinc-900 transition-colors duration-300 ${csc.textColor}`}>
                          {csc.acronym}
                        </span>
                        <span className="text-xs font-medium text-zinc-500 line-clamp-1">
                          {csc.name}
                        </span>
                      </div>
                    </div>

                    <ArrowRight
                      size={18}
                      className={`mr-1 sm:mr-2 shrink-0 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 sm:opacity-0 ${csc.textColor}`}
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick links ── */}
      <section id="announcements" className="mx-auto max-w-[1400px] px-5 sm:px-6 py-16 sm:py-32">
        <div className="mb-8 sm:mb-16 flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">Where to start</h2>
          <span className="font-mono text-xs sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-green-600 font-semibold uppercase">
            04 sections
          </span>
        </div>

        {/* Single column on phones (each card gets full width + a clear divider),
            2-up on tablets, 4-up on desktop */}
        <div className="grid gap-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-zinc-100 sm:border-l-2">
          <Card
            index="01"
            icon={<Megaphone size={22} strokeWidth={2.5} />}
            title="Announcements"
            body="Official memorandums, university guidelines, and real-time updates from the council."
            href="#announcements"
          />
          <Card
            index="02"
            icon={<CalendarDays size={22} strokeWidth={2.5} />}
            title="Events Calendar"
            body="Track upcoming university-wide events, assemblies, and organization fairs."
            href="#events"
          />
          <Card
            index="03"
            icon={<Users2 size={22} strokeWidth={2.5} />}
            title="Council Directory"
            body="Meet your USC officers and connect directly with your College Student Council."
            href="#directory"
          />
          <Card
            index="04"
            icon={<LockKeyhole size={22} strokeWidth={2.5} />}
            title="Locker Booking"
            body="Secure your locker for the semester through our automated reservation system."
            href="/lockers"
            badge="Open now"
          />
        </div>
      </section>
    </main>
  );
}

// Upgraded Card component to act as a functional Link
function Card({
  index,
  icon,
  title,
  body,
  href = "#",
  badge,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="group relative block border-b-2 border-r-0 sm:border-r-2 border-zinc-100 p-6 sm:p-10 transition-colors active:bg-zinc-50 sm:hover:bg-zinc-50"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-zinc-300">{index}</span>
        {badge && (
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-green-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-600" />
            </span>
            {badge}
          </span>
        )}
      </div>

      <div className="mt-6 sm:mt-8 inline-flex items-center justify-center rounded-2xl bg-green-50 p-3.5 sm:p-4 text-green-700 transition-transform group-hover:scale-110 duration-300">
        {icon}
      </div>

      <h3 className="mt-6 sm:mt-8 text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">{title}</h3>
      <p className="mt-3 sm:mt-4 text-sm sm:text-base text-zinc-500 leading-relaxed font-medium">{body}</p>

      <ArrowRight
        size={20}
        strokeWidth={2.5}
        className="absolute bottom-6 right-6 sm:bottom-10 sm:right-10 text-green-600 opacity-0 sm:opacity-0 transition-all transform translate-x-4 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </Link>
  );
}