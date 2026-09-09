"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, CalendarDays, Users2, LockKeyhole } from "lucide-react";

const navItems = [
  {
    index: "01",
    icon: <CalendarDays size={20} strokeWidth={2} />,
    title: "Events Calendar",
    sub: "Assemblies & org fairs",
    href: "#events",
    badge: null,
  },
  {
    index: "02",
    icon: <Users2 size={20} strokeWidth={2} />,
    title: "Council Directory",
    sub: "Meet your USC officers",
    href: "#directory",
    badge: null,
  },
  {
    index: "03",
    icon: <LockKeyhole size={20} strokeWidth={2} />,
    title: "Locker Booking",
    sub: "Automated reservation system",
    href: "/lockers",
    badge: "Open now",
  },
];

export default function NavRailSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-60px" });

  return (
    <section className="mx-auto max-w-[1400px] px-5 sm:px-6 py-16 sm:py-24">
      <motion.div
        ref={headerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={headerInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mb-0 flex items-end justify-between pb-4 border-b-2 border-zinc-900"
      >
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.38em] text-green-600 uppercase font-semibold">
            Navigate
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight leading-none">
            Where to start
          </h2>
        </div>
        <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] text-zinc-400 uppercase pb-0.5">
          03 sections
        </span>
      </motion.div>
      <div>
        {navItems.map((item, i) => (
          <NavRow key={item.href} {...item} delay={i * 0.06} />
        ))}
      </div>
    </section>
  );
}

function NavRow({
  index, icon, title, sub, href, badge, delay = 0,
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
      <span aria-hidden className="absolute bottom-0 left-0 h-[2px] w-0 bg-green-600 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full" />
      <span
        aria-hidden
        className="shrink-0 select-none font-mono text-3xl sm:text-4xl lg:text-5xl font-bold leading-none text-transparent transition-all duration-300 group-hover:opacity-70"
        style={{ WebkitTextStroke: "1.5px rgba(17,17,17,0.13)" }}
      >
        {index}
      </span>
      <h3 className="flex-1 min-w-0 text-2xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight leading-none text-zinc-900 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] translate-x-0 group-hover:translate-x-2.5 group-hover:text-green-700">
        {title}
      </h3>
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
        <p className="font-mono text-[11px] tracking-[0.2em] uppercase text-zinc-500 text-right leading-snug">{sub}</p>
        <span className="text-green-600 mt-0.5">{icon}</span>
      </div>
      <ArrowRight size={22} strokeWidth={2} className="shrink-0 text-green-600 opacity-0 -translate-x-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0" />
    </motion.a>
  );
}