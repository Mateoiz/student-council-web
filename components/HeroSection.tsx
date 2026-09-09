"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

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

export default function HeroSection() {
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
    setMouseX((e.clientX - rect.left) / rect.width - 0.5);
    setMouseY((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
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
              onMouseLeave={() => {
                setHeroHovered(false);
                setCollegeIndex(0);
              }}
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
                Latest Announcements
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
  );
}