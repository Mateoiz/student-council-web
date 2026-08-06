"use client";

import Link from "next/link";
import { Users, Target, HeartHandshake, ArrowRight, GraduationCap } from "lucide-react";
import Navbar from "@/components/Navbar";

const programs = [
  {
    index: "01",
    title: "Samahang Lasalyano",
    icon: <Users size={24} strokeWidth={2.5} />,
    body: "The core community of DLSAU student leaders and volunteers dedicated to faith, service, and communion.",
  },
];

const colleges = [
  {
    acronym: "CVMAS",
    name: "College of Veterinary Medicine & Agricultural Sciences",
    council: "CVMAS College Student Council",
    hoverColor: "group-hover:bg-green-50",
    accent: "bg-green-600",
  },
  {
    acronym: "CBMA",
    name: "College of Business Management & Accountancy",
    council: "CBMA College Student Council",
    hoverColor: "group-hover:bg-yellow-50",
    accent: "bg-yellow-500",
  },
  {
    acronym: "CAST",
    name: "College of Arts, Science, and Technology",
    council: "CAST College Student Council",
    hoverColor: "group-hover:bg-red-50",
    accent: "bg-red-600",
  },
  {
    acronym: "COED",
    name: "College of Education",
    council: "COED College Student Council",
    hoverColor: "group-hover:bg-blue-50",
    accent: "bg-blue-600",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-24 border-b border-zinc-200">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="flex items-center gap-3 mb-8">
            <span className="h-px w-10 bg-green-600" />
            <p className="font-mono text-sm tracking-[0.3em] text-green-700 uppercase font-semibold">
              Our Identity
            </p>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-[8.5rem] leading-[0.85] tracking-tighter font-extrabold text-zinc-900 uppercase mb-12">
            Beyond <br />
            <span className="italic text-green-600 font-serif tracking-normal lowercase">representation</span>
          </h1>

          <div className="lg:w-[600px]">
            <p className="text-zinc-600 text-lg md:text-xl leading-relaxed border-l-2 border-green-600 pl-6">
              The University Student Council (USC) and College Student Councils (CSC) act as the highest governing student body of De La Salle Araneta University, committed to protecting student rights and cultivating a vibrant Lasallian culture.
            </p>
          </div>
        </div>
      </section>

      {/* ── Core Programs (Grid Style matched to Home) ── */}
      <section className="mx-auto max-w-[1400px] px-6 py-32">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">Core Initiatives</h2>
          <span className="font-mono text-sm tracking-[0.3em] text-green-600 font-semibold uppercase">
            03 programs
          </span>
        </div>

        <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3 border-t-2 border-l-2 border-zinc-100">
          {programs.map((prog) => (
            <div
              key={prog.index}
              className="group relative block border-b-2 border-r-2 border-zinc-100 p-10 transition-colors hover:bg-zinc-50"
            >
              <span className="font-mono text-sm font-bold text-zinc-300">{prog.index}</span>

              <div className="mt-8 inline-flex items-center justify-center rounded-2xl bg-green-50 p-4 text-green-700 transition-transform group-hover:scale-110 duration-300">
                {prog.icon}
              </div>

              <h3 className="mt-8 text-2xl font-bold text-zinc-900 tracking-tight">{prog.title}</h3>
              <p className="mt-4 text-base text-zinc-500 leading-relaxed font-medium">{prog.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Colleges ── */}
      <section className="mx-auto max-w-[1400px] px-6 pb-32">
        <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight">Our Colleges</h2>
          <span className="font-mono text-sm tracking-[0.3em] text-green-600 font-semibold uppercase">
            04 branches
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {colleges.map((college) => (
            <div
              key={college.acronym}
              className={`group relative flex flex-col rounded-2xl border-2 border-zinc-100 p-8 transition-all duration-300 hover:border-transparent hover:shadow-xl ${college.hoverColor}`}
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-mono text-xl font-bold text-zinc-900">
                  {college.acronym}
                </span>
                <GraduationCap className="text-zinc-300 transition-colors group-hover:text-zinc-900" size={28} strokeWidth={1.5} />
              </div>
              
              <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-2">
                {college.name}
              </h3>
              
              <div className="mt-auto pt-8">
                <div className={`h-1 w-12 rounded-full ${college.accent} mb-4 transition-all duration-300 group-hover:w-full`} />
                <p className="text-sm font-semibold text-zinc-500">
                  {college.council}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Call to Action ── */}
    </main>
  );
}