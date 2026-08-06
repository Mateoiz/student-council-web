"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";import { ArrowRight, Megaphone, CalendarDays, Users2, LockKeyhole } from "lucide-react";
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
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouseX(x);
    setMouseY(y);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-900">
      
      <Navbar />

      {/* ── Hero ── */}
      <section
        onMouseMove={handleHeroMouseMove}
        className="relative isolate flex min-h-screen flex-col justify-center overflow-hidden border-b border-zinc-200"
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

        <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 py-24">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-12 right-6 select-none text-[25vw] sm:text-[20rem] font-bold leading-none text-zinc-900/[0.04]"
          >
            USC-CSC
          </span>

          <div className="relative flex flex-col lg:flex-row gap-16 lg:items-center justify-between">
            <div className="w-full">
              <div className="flex items-center gap-3 mb-8">
                <span className="h-px w-10 bg-green-600" />
                <p className="font-mono text-sm tracking-[0.3em] text-green-700 uppercase font-semibold">
                  De La Salle Araneta University
                </p>
              </div>

              <h1
                className="cursor-default text-6xl md:text-7xl lg:text-[8.5rem] leading-[0.85] tracking-tighter font-extrabold text-zinc-900 uppercase"
                onMouseEnter={() => setHeroHovered(true)}
                onMouseLeave={() => { setHeroHovered(false); setCollegeIndex(0); }}
              >
                {/* Line 1: University ↔ College acronym slot */}
<span className="relative inline-flex items-end" style={{ clipPath: "inset(-20% 0 -20% 0)" }}>             <AnimatePresence mode="wait">
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

                {/* Line 2: Student — slides right on hover */}
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

              <div className="mt-14 flex flex-wrap items-center gap-4">
                <a
                  href="#announcements"
                  className="group/btn inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-4 text-sm font-bold tracking-wide text-white transition-all hover:bg-green-700 hover:scale-105 shadow-md"
                >
                  Latest Resolutions
                  <ArrowRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
                </a>
                
                <a
                  href="#directory"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-200 bg-white/80 px-8 py-4 text-sm font-bold tracking-wide text-zinc-800 backdrop-blur-sm transition-all hover:border-green-600 hover:text-green-700"
                >
                  Find Your CSC
                </a>
              </div>
            </div>

            <div className="lg:w-[450px] shrink-0">
              <p className="text-zinc-600 text-lg leading-relaxed border-l-2 border-green-600 pl-6 mb-8">
                The bridge between the student body and the administration —
                resolutions, events, and everything happening across the
                College Student Councils.
              </p>

              <div className="flex flex-col gap-3 border-t border-zinc-200 pt-8">
                <p className="text-xs uppercase tracking-widest font-semibold text-zinc-400 mb-2">
                  Representing 4 Colleges
                </p>
                
                {councils.map((csc) => (
                  <a
                    key={csc.acronym}
                    href={`#${csc.acronym.toLowerCase()}`}
                    className={`group relative flex items-center justify-between rounded-2xl border border-zinc-200 bg-white/60 backdrop-blur-sm p-3 transition-all duration-300 hover:border-transparent hover:shadow-lg ${csc.lightColor}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-zinc-100 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 p-1.5 overflow-hidden">
                        <div className="relative w-full h-full">
                          <Image 
                            src={csc.logo} 
                            alt={`${csc.acronym} Logo`} 
                            fill 
                            className="object-contain" 
                          />
                        </div>
                      </div>
                      
                      <div className="flex flex-col">
                        <span className={`font-bold text-zinc-900 transition-colors duration-300 ${csc.textColor}`}>
                          {csc.acronym}
                        </span>
                        <span className="text-xs font-medium text-zinc-500 line-clamp-1">
                          {csc.name}
                        </span>
                      </div>
                    </div>

                    <ArrowRight 
                      size={18} 
                      className={`mr-2 opacity-0 -translate-x-4 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 ${csc.textColor}`} 
                    />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick links ── */}
      <section id="announcements" className="mx-auto max-w-[1400px] px-6 py-32">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">Where to start</h2>
          <span className="font-mono text-sm tracking-[0.3em] text-green-600 font-semibold uppercase">
            04 sections
          </span>
        </div>

        {/* Updated grid to support 4 items elegantly */}
        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-4 border-t-2 border-l-2 border-zinc-100">
          <Card
            index="01"
            icon={<Megaphone size={24} strokeWidth={2.5} />}
            title="Announcements"
            body="Official memorandums, university guidelines, and real-time updates from the council."
            href="#announcements"
          />
          <Card
            index="02"
            icon={<CalendarDays size={24} strokeWidth={2.5} />}
            title="Events Calendar"
            body="Track upcoming university-wide events, assemblies, and organization fairs."
            href="#events"
          />
          <Card
            index="03"
            icon={<Users2 size={24} strokeWidth={2.5} />}
            title="Council Directory"
            body="Meet your USC officers and connect directly with your College Student Council."
            href="#directory"
          />
          <Card
            index="04"
            icon={<LockKeyhole size={24} strokeWidth={2.5} />}
            title="Locker Booking"
            body="Secure your locker for the semester through our automated reservation system."
            href="/lockers"
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
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  href?: string;
}) {
  return (
    <Link 
      href={href}
      className="group relative block border-b-2 border-r-2 border-zinc-100 p-10 transition-colors hover:bg-zinc-50"
    >
      <span className="font-mono text-sm font-bold text-zinc-300">{index}</span>

      <div className="mt-8 inline-flex items-center justify-center rounded-2xl bg-green-50 p-4 text-green-700 transition-transform group-hover:scale-110 duration-300">
        {icon}
      </div>

      <h3 className="mt-8 text-2xl font-bold text-zinc-900 tracking-tight">{title}</h3>
      <p className="mt-4 text-base text-zinc-500 leading-relaxed font-medium">{body}</p>

      <ArrowRight
        size={20}
        strokeWidth={2.5}
        className="absolute bottom-10 right-10 text-green-600 opacity-0 transition-all transform translate-x-4 group-hover:translate-x-0 group-hover:opacity-100"
      />
    </Link>
  );
}