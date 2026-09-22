"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Box, Users, LogOut } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

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

      <div className="pt-32 px-6 max-w-4xl mx-auto pb-20">
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={26} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold">Admin Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Logged in as <span className="font-semibold text-zinc-700">{userEmail}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link href="/admin/lockers" className="group block bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Box size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">Locker Management</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              View, approve, and manage student locker rentals, track payments, and update availability statuses.
            </p>
          </Link>

          <Link href="/admin/lyv" className="group block bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm hover:border-zinc-900 hover:shadow-md transition-all">
            <div className="w-14 h-14 rounded-xl bg-zinc-100 text-zinc-600 flex items-center justify-center mb-6 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
              <Users size={28} />
            </div>
            <h2 className="text-xl font-bold mb-2">LYV Applications</h2>
            <p className="text-zinc-500 text-sm leading-relaxed">
              Review incoming volunteer applications, filter candidates by college, and organize committee assignments.
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