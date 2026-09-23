"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, AlertCircle, Lock, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";

function LoginFormInner() {
  const router = useRouter();
  const supabase = createClient();  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.email || !formData.password) {
      setError("Please enter both your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Authenticate the user
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email.trim(),
        password: formData.password,
      });
      
      if (authError) throw authError;

      // 2. Fetch the user's role from your profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error fetching profile:", profileError);
      }
      
      // DEBUG: Check your browser console to see if this returns { role: 'admin' } or null
      console.log("Fetched Profile Data:", profile);
      
      router.refresh();

      // 3. Route based on the assigned role
      if (profile?.role === 'admin') {
        router.push("/lyvdashboard/admin");
      } else if (profile?.role === 'creatives') {
        router.push("/lyvdashboard/creatives");
      } else {
        router.push("/lyvdashboard");
      }
      
    } catch (err: any) {
      setError(err.message || "Invalid login credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <Navbar />

      <div className="pt-24 md:pt-32 px-4 md:px-6 max-w-md mx-auto pb-28 md:pb-20">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-center mb-2">
            Sign in to LYVS
          </h1>
          <p className="text-zinc-500 text-center text-xs md:text-sm px-2">
            Enter your credentials to access your dashboard.
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

        <form onSubmit={handleSubmit} className="space-y-5 bg-white p-4 md:p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email address"
                required
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors disabled:opacity-50"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Password"
                required
                disabled={isLoading}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-zinc-200 bg-zinc-50 text-base focus:outline-none focus:bg-white focus:border-zinc-900 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="hidden md:flex w-full items-center justify-center gap-2 py-3.5 mt-6 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide hover:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <button
            type="submit"
            onClick={handleSubmit as any}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-xl font-black text-sm tracking-wide active:bg-zinc-800 transition-colors disabled:bg-zinc-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex items-center gap-2 text-zinc-400 font-bold">
          <Loader2 size={20} className="animate-spin" />
          Loading...
        </div>
      </main>
    }>
      <LoginFormInner />
    </Suspense>
  );
}