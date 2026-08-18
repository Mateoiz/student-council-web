"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["usc@dlsau.edu.ph", "ice.ramirez@dlsau.edu.ph"];

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    if (!data.session?.user.email || !ADMIN_EMAILS.includes(data.session.user.email)) {
      setError("This account doesn't have admin access.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    router.push("/admin/lockers");
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <div className="pt-32 px-6 max-w-md mx-auto pb-20">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 shadow-lg">
            <ShieldCheck size={26} className="text-green-400" />
          </div>
          <h1 className="text-3xl font-extrabold">Admin Sign In</h1>
          <p className="text-zinc-500 text-sm mt-2">
            Restricted access — USC officers only.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl mb-5"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dlsau.edu.ph"
              required
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 mt-2 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in…" : "Sign In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Not an admin? <a href="/lockers" className="font-semibold text-zinc-600 hover:text-green-600 underline underline-offset-2">Go to locker booking</a>
        </p>
      </div>
    </main>
  );
}