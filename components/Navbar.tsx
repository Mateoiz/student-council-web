"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "About Us", href: "/about" },
  { name: "Lockers", href: "/lockers" },
  { name: "Tools", href: "/tools" },
  { name: "LYV", href: "/lyvapplication" },
];

// Pages whose hero is dark — Navbar text switches to white when unscrolled
const DARK_HERO_PAGES: string[] = []; // Removed "/about" since its hero is light cream

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

    // 1. Initialize states on mount to catch the current scroll position 
    //    if the user reloads halfway down the page.
    handleScroll();
    handleResize();

    // 2. Use passive listeners for better rendering performance
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Determine active states
  const isDarkHero = DARK_HERO_PAGES.some((p) => pathname === p || pathname?.startsWith(`${p}/`));
  
  // Force a solid background if the user scrolled OR opened the mobile menu
  const forceSolidBg = isScrolled || mobileMenuOpen;
  
  // Only use light text if it's a dark hero page AND the navbar is transparent
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
            <Link
              href="/contact"
              className={`ml-4 rounded-full px-5 py-2.5 text-sm font-bold transition-all shadow-sm hover:scale-105 active:scale-95 ${
                useLight
                  ? "bg-white text-[#083011] hover:bg-green-50"
                  : "bg-[#083011] text-white hover:bg-green-700"
              }`}
            >
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
                className="mt-4 rounded-xl bg-[#083011] px-5 py-3 text-center text-base font-bold text-white shadow-md active:scale-95 transition-transform"
              >
                Contact Us
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}