"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Box, Users, Ticket, LogOut, MoreVertical, ExternalLink, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type CardOptionProps = {
  href: string;
};

function CardOptionsMenu({ href }: CardOptionProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = `${window.location.origin}${href}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setOpen(false);
    }, 1500);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(!open);
        }}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
        title="More options"
      >
        <MoreVertical size={18} />
      </button>

      {open && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-0 top-10 w-44 bg-white border border-zinc-200 rounded-xl shadow-xl py-1.5 z-20 text-xs font-medium text-zinc-700"
        >
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
          >
            <ExternalLink size={14} />
            Open in New Tab
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 hover:text-zinc-900 text-left transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            <span>{copied ? "Copied Link!" : "Copy Page Link"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push("/admin/login");
      } else {
        setUserEmail(session.user.email ?? null);
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <div className="pt-32 px-6 max-w-5xl mx-auto pb-20">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={26} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Logged in as <span className="font-semibold text-zinc-700">{userEmail}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Locker Management */}
          <Link
            href="/admin/lockers"
            className="group relative block bg-white p-6 md:p-7 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Box size={24} />
              </div>
              <CardOptionsMenu href="/admin/lockers" />
            </div>
            <h2 className="text-lg font-bold mb-2">Locker Management</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              View, approve, and manage student locker rentals, track payments, and update availability statuses.
            </p>
          </Link>

          {/* LYV Applications */}
          <Link
            href="/admin/lyv"
            className="group relative block bg-white p-6 md:p-7 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <Users size={24} />
              </div>
              <CardOptionsMenu href="/admin/lyv" />
            </div>
            <h2 className="text-lg font-bold mb-2">LYV Applications</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Review incoming volunteer applications, filter candidates by college, and organize committee assignments.
            </p>
          </Link>

          {/* Seminar Registrations */}
          <Link
            href="/admin/register"
            className="group relative block bg-white p-6 md:p-7 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                <Ticket size={24} />
              </div>
              <CardOptionsMenu href="/admin/register" />
            </div>
            <h2 className="text-lg font-bold mb-2">Seminar Monitor</h2>
            <p className="text-zinc-500 text-xs leading-relaxed">
              Live tracking for registered attendees, fast QR door scan status, manual check-in/out toggles, and CSV logs.
            </p>
          </Link>
        </div>

        <div className="mt-16 flex justify-center">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-zinc-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </div>
    </main>
  );
}