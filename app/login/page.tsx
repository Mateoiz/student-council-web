"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const ALLOWED_DOMAIN = "dlsau.edu.ph";

type Mode = "login" | "signup";

function isAllowedEmail(email: string) {
  return email.trim().toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/lockers";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAllowedEmail(email)) {
      setError(`Please use your school email ending in @${ALLOWED_DOMAIN}`);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    if (mode === "login") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      setLoading(false);
      if (signInError) {
        setError(signInError.message);
        return;
      }
      router.push(redirectTo);
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setSignupSuccess(true);
    }
  };

  if (signupSuccess) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
        <Navbar />
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-6 shadow-xl shadow-green-300"
        >
          <CheckCircle2 size={36} className="text-white" />
        </motion.div>
        <h1 className="text-2xl font-extrabold text-zinc-900 mb-2">Check your email</h1>
        <p className="text-zinc-500 max-w-sm mb-6 text-sm">
          We sent a confirmation link to <strong>{email}</strong>. Click it, then come back and log in.
        </p>
        <button
          onClick={() => {
            setSignupSuccess(false);
            setMode("login");
          }}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
        >
          Back to login
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <div className="pt-32 px-6 max-w-md mx-auto pb-20">
        <h1 className="text-3xl font-extrabold text-center mb-2">
          {mode === "login" ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-zinc-500 text-center text-sm mb-8">
          Use your <strong>@{ALLOWED_DOMAIN}</strong> email to book a locker.
        </p>

        <div className="flex mb-8 bg-zinc-100 rounded-xl p-1">
          {(["login", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                mode === m ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
              }`}
            >
              {m === "login" ? "Log in" : "Sign up"}
            </button>
          ))}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={`you@${ALLOWED_DOMAIN}`}
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:border-zinc-900 transition-colors"
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
              minLength={6}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:border-zinc-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Please wait…" : mode === "login" ? "Log in" : "Sign up"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading...</p>
      </main>
    }>
      <LoginInner />
    </Suspense>
  );
}