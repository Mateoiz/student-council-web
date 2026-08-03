"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const navLinks = [
  { name: "Announcements", href: "#announcements" },
  { name: "Events", href: "#events" },
  { name: "CSC Directory", href: "#directory" },
  { name: "Resolutions", href: "#resolutions" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-md border-b border-zinc-200 shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-6 flex items-center justify-between">
        
        {/* Logo / Brand */}
        <Link href="/" className="group flex items-center gap-2 z-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-600 text-white font-bold transition-transform group-hover:scale-105">
            
          </div>
          <span className="font-bold text-zinc-900 tracking-tight text-lg">
            DLSAU <span className="text-green-600">USC-CSC</span>
          </span>
        </Link>

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

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden text-zinc-900 z-50 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Navigation Dropdown */}
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