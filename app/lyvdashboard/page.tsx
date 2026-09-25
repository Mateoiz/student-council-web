"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

export default function DashboardDispatcher() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function routeUser() {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/lyvlogin");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Route the user based on their database role
      if (profile?.role === "admin") {
        router.push("/lyvdashboard/admin");
      } else {
        router.push("/lyvdashboard/creatives");
      }
    }
    
    routeUser();
  }, [router, supabase]);

  return (
    <main className="min-h-screen bg-[#fafafa] flex items-center justify-center">
      <div className="flex items-center gap-2.5 text-zinc-400 font-bold text-sm">
        <Loader2 size={18} className="animate-spin text-zinc-500" />
        Authenticating workspace...
      </div>
    </main>
  );
}