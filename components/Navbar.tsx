"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight } from "lucide-react";

const navLinks = [
  { name: "About Us", href: "/about" },
  { name: "Lockers", href: "/lockers" },
  { name: "Tools", href: "/tools" },
];

const BANNER_DISMISS_KEY = "locker_banner_dismissed_v1";

// Pages whose hero is dark — Navbar text switches to white when unscrolled
const DARK_HERO_PAGES = ["/about"];

// ─── Brand mark ─────────────────────────────────────────────────────────────
function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex flex-col z-50">
      <span
        className={`font-black tracking-tight text-base leading-none transition-colors ${
          light
            ? "text-white group-hover:text-green-400"
            : "text-[#083011] group-hover:text-green-500"
        }`}
      >
        USC–CSC
      </span>
      <div className={`h-px my-[3px] w-full ${light ? "bg-white/30" : "bg-zinc-300"}`} />
      <span
        className={`text-[9px] font-semibold tracking-[0.12em] uppercase leading-none ${
          light ? "text-white/60" : "text-zinc-400"
        }`}
      >
        De La Salle Araneta University
      </span>
    </Link>
  );
}

// ─── Locker-open announcement strip ─────────────────────────────────────────
function LockerBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="bg-[#083011]">
      <div className="mx-auto flex max-w-[1400px] items-center justify-center gap-3 px-4 sm:px-6 py-2 text-center">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>

        <p className="text-xs sm:text-sm font-semibold text-white leading-tight">
          <span className="text-green-400 font-black">Locker bookings are now open</span>
          <span className="hidden sm:inline text-white/70">
            {" "}— reserve yours for the semester before they run out.
          </span>
        </p>

        <Link
          href="/lockers"
          className="hidden sm:inline-flex items-center gap-1 shrink-0 rounded-full bg-green-600 px-3.5 py-1 text-xs font-bold text-white transition-colors hover:bg-green-500"
        >
          Book now
          <ArrowRight size={12} />
        </Link>

        <button
          onClick={onDismiss}
          className="shrink-0 rounded-full p-1 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
          aria-label="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

// ─── Navbar ──────────────────────────────────────────────────────────────────
export default function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem(BANNER_DISMISS_KEY);
    if (!dismissed) setBannerVisible(true);
  }, []);

  const dismissBanner = () => {
    localStorage.setItem(BANNER_DISMISS_KEY, "1");
    setBannerVisible(false);
  };

  const onLockersPage = pathname?.startsWith("/lockers");
  const showBanner = bannerVisible && !isScrolled && !onLockersPage;

  // Use light (white) text when sitting over a dark hero and not yet scrolled
  const isDarkHero = DARK_HERO_PAGES.some((p) => pathname?.startsWith(p));
  const useLight = isDarkHero && !isScrolled;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex flex-col">
      {showBanner && <LockerBanner onDismiss={dismissBanner} />}

      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? "bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm py-3"
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
                    ? "text-white/80 hover:text-white"
                    : "text-zinc-600 hover:text-[#083011]"
                }`}
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="/contact"
              className={`ml-4 rounded-full px-5 py-2.5 text-sm font-bold transition-all shadow-md hover:scale-105 ${
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
            className={`md:hidden z-50 p-2 transition-colors ${
              useLight ? "text-white" : "text-[#083011]"
            }`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 bg-white border-b border-zinc-200 shadow-lg p-6 flex flex-col gap-4 md:hidden">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-lg font-semibold text-zinc-800 hover:text-[#083011]"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
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