"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "About Us", href: "/about" },
  { name: "Lockers", href: "/lockers" },
  { name: "Tools", href: "/tools" },
];

function BrandMark() {
  return (
    <Link href="/" className="group flex flex-col z-50">
      <span className="font-black text-zinc-900 tracking-tight text-base leading-none group-hover:text-green-600 transition-colors">
        USC–CSC
      </span>
      <div className="h-px bg-zinc-300 my-[3px] w-full" />
      <span className="text-[9px] font-semibold text-zinc-400 tracking-[0.12em] uppercase leading-none">
        De La Salle Araneta University
      </span>
    </Link>
  );
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/90 backdrop-blur-md border-b border-zinc-200 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between">

        <BrandMark />

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-semibold text-zinc-600 hover:text-green-600 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <Link
            href="#contact"
            className="ml-4 rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-green-600 hover:scale-105"
          >
            Contact Us
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-zinc-900 z-50 p-2"
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
                className="text-lg font-semibold text-zinc-800 hover:text-green-600"
              >
                {link.name}
              </Link>
            ))}
            <Link
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-4 rounded-xl bg-green-600 px-5 py-3 text-center text-base font-bold text-white"
            >
              Contact Us
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}