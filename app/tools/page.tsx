"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Hammer, Wrench } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function ToolsWIP() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-zinc-900 flex flex-col">
      <Navbar />

      <section className="relative isolate flex-1 flex flex-col items-center justify-center overflow-hidden px-5 sm:px-6 py-20">
        
        {/* ── Background Effects (matching your hero section) ── */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-white" />

          {/* SVG Noise Texture */}
          <div
            className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          {/* Subtle Green Glow */}
          <motion.div
            animate={{ opacity: [0.15, 0.3, 0.15] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-green-500/20 rounded-full blur-3xl"
          />
        </div>

        {/* ── Main Content ── */}
        <div className="relative z-10 mx-auto w-full max-w-2xl text-center flex flex-col items-center">
          
          {/* Animated Icons */}
          <div className="relative flex items-center justify-center mb-8">
            <motion.div
              animate={{ rotate: [-10, 20, -10] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -left-6 -top-2 text-zinc-300"
            >
              <Wrench size={40} strokeWidth={1.5} />
            </motion.div>
            
            <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-3xl bg-green-50 border-2 border-green-100 shadow-sm">
              <motion.div
                animate={{ rotate: [0, -15, 10, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              >
                <Hammer size={48} className="text-green-600" strokeWidth={2} />
              </motion.div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-8 sm:w-10 bg-green-600" />
            <p className="font-mono text-[11px] sm:text-sm tracking-[0.25em] sm:tracking-[0.3em] text-green-700 uppercase font-semibold">
              Under Construction
            </p>
            <span className="h-px w-8 sm:w-10 bg-green-600" />
          </div>

          <h1 className="text-5xl sm:text-7xl font-extrabold text-zinc-900 tracking-tighter uppercase mb-6 leading-none">
            Work In <br />
            <span className="italic text-green-600 font-serif tracking-normal lowercase">Progress</span>
          </h1>

          <p className="text-zinc-600 text-base sm:text-lg leading-relaxed max-w-md mx-auto mb-10">
            We are currently building this tool to make your student life easier. Check back soon for updates.
          </p>

          {/* CTA */}
          <Link
            href="/"
            className="group inline-flex items-center justify-center gap-2 rounded-2xl sm:rounded-full bg-zinc-900 px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-bold tracking-wide text-white transition-all active:scale-[0.98] hover:bg-green-700 shadow-md"
          >
            <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
            Return to Homepage
          </Link>
          
        </div>
      </section>
    </main>
  );
}