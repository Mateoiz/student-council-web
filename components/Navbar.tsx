"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "About", href: "/about" },
  { name: "Tools", href: "/tools" },
  { name: "LYV", href: "/lyvapplication" },
];

// Pages whose hero is dark — Navbar text switches to white when unscrolled
const DARK_HERO_PAGES: string[] = [];

// ─── Brand mark ─────────────────────────────────────────────────────────────
function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex flex-col z-50">
      <span
        className={`font-black tracking-tight text-base leading-none transition-colors ${
          light
            ? "text-white group-hover:text-green-400"
            : "text-[#083011] group-hover:text-green-600"
        }`}
      >
        USC–CSC
      </span>
      <div className={`h-px my-[3px] w-full ${light ? "bg-white/30" : "bg-zinc-300"}`} />
      <span
        className={`text-[9px] font-semibold tracking-[0.12em] uppercase leading-none transition-colors ${
          light ? "text-white/80" : "text-zinc-500"
        }`}
      >
        De La Salle Araneta University
      </span>
    </Link>
  );
}

// ─── Icons ──────────────────────────────────────────────────────────────────
function MailIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

// ─── Register CTA (glow + live dot + pop-in) ────────────────────────────────
// ─── Register CTA (carnival ticket) ─────────────────────────────────────────
function RegisterCTA({ fullWidth = false }: { fullWidth?: boolean }) {
  return (
    <>
      <style>{`
        @keyframes cv-pop {
          0%   { opacity: 0; transform: scale(0.4) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes cv-wiggle {
          0%, 86%, 100% { transform: rotate(0); }
          89% { transform: rotate(-4deg) scale(1.05); }
          92% { transform: rotate(4deg) scale(1.05); }
          95% { transform: rotate(-3deg); }
          98% { transform: rotate(2deg); }
        }
        @keyframes cv-blink {
          0%, 49%  { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
        @keyframes cv-shine {
          0%   { transform: translateX(-130%) skewX(-20deg); }
          55%, 100% { transform: translateX(260%) skewX(-20deg); }
        }
        .cv-wrap {
          position: relative;
          display: inline-flex;
          filter: drop-shadow(0 6px 10px rgba(220, 38, 38, 0.38));
          animation: cv-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both,
                     cv-wiggle 5s ease-in-out 1.6s infinite;
        }
        .cv-wrap.cv-full { display: flex; width: 100%; }
        .cv-ticket {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          overflow: hidden;
          padding: 0.8rem 1.5rem;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.875rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 1px 0 rgba(0, 0, 0, 0.35);
          background: repeating-linear-gradient(90deg, #dc2626 0 14px, #b91c1c 14px 28px);
          box-shadow: inset 0 0 0 2px #fbbf24;
          -webkit-mask:
            radial-gradient(circle at 0 50%, transparent 7px, #000 7.5px) left / 51% 100% no-repeat,
            radial-gradient(circle at 100% 50%, transparent 7px, #000 7.5px) right / 51% 100% no-repeat;
                  mask:
            radial-gradient(circle at 0 50%, transparent 7px, #000 7.5px) left / 51% 100% no-repeat,
            radial-gradient(circle at 100% 50%, transparent 7px, #000 7.5px) right / 51% 100% no-repeat;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cv-wrap:hover .cv-ticket { transform: scale(1.08) rotate(-2deg); }
        .cv-wrap:active .cv-ticket { transform: scale(0.96); }
        .cv-full .cv-ticket { flex: 1; font-size: 1rem; padding: 0.95rem 1.5rem; }

        .cv-bulbs {
          position: absolute;
          left: 12px;
          right: 12px;
          height: 5px;
          background-image: radial-gradient(circle, #fde047 0 1.8px, transparent 2.4px);
          background-size: 10px 5px;
          background-repeat: repeat-x;
          animation: cv-blink 0.9s steps(1) infinite;
          pointer-events: none;
        }
        .cv-bulbs.top { top: 3px; }
        .cv-bulbs.bottom { bottom: 3px; animation-delay: 0.45s; }

        .cv-shine {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 40%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          animation: cv-shine 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .cv-wrap, .cv-bulbs, .cv-shine { animation: none; }
        }
      `}</style>

      <Link
        href="/register"
        aria-label="Register for the event"
        className={`cv-wrap group ${fullWidth ? "cv-full" : ""}`}
      >
        <span className="cv-ticket">
          <span className="cv-bulbs top" aria-hidden />
          <span className="cv-bulbs bottom" aria-hidden />
          <span className="cv-shine" aria-hidden />

          <span aria-hidden className="text-base leading-none">🎟️</span>
          <span className="relative">Register</span>
          <span className="relative transition-transform duration-300 group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu automatically on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle scroll and resize events
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };

    handleScroll();
    handleResize();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const isDarkHero = DARK_HERO_PAGES.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  const forceSolidBg = isScrolled || mobileMenuOpen;
  const useLight = isDarkHero && !forceSolidBg;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      <div
        className={`transition-all duration-300 ${
          forceSolidBg
            ? "bg-white/95 backdrop-blur-md border-b border-zinc-200 shadow-sm py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between">
          <BrandMark light={useLight} />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-semibold transition-colors ${
                  useLight
                    ? "text-white/90 hover:text-white"
                    : "text-zinc-600 hover:text-[#083011]"
                }`}
              >
                {link.name}
              </Link>
            ))}

            <div className="ml-2">
              <RegisterCTA />
            </div>

            <Link
              href="/contact"
              className={`group inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-sm font-bold transition-all duration-300 hover:scale-105 active:scale-95 ${
                useLight
                  ? "border-white text-white hover:bg-white hover:text-[#083011]"
                  : "border-[#083011] text-[#083011] hover:bg-[#083011] hover:text-white hover:shadow-lg hover:shadow-green-900/25"
              }`}
            >
              <MailIcon size={15} />
              Contact Us
            </Link>
          </nav>

          {/* Mobile Toggle */}
          <button
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
            className={`md:hidden z-50 p-2 transition-colors ${
              useLight ? "text-white" : "text-[#083011]"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg p-6 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-2 fade-in duration-200">
              <RegisterCTA fullWidth />

              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-lg font-semibold text-zinc-800 hover:text-[#083011]"
                >
                  {link.name}
                </Link>
              ))}

              <Link
                href="/contact"
                className="mt-2 flex items-center justify-center gap-2 rounded-xl border-2 border-[#083011] px-5 py-3 text-center text-base font-bold text-[#083011] transition-all hover:bg-[#083011] hover:text-white active:scale-95"
              >
                <MailIcon size={18} />
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}