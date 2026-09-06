"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ConditionalChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome =
    pathname?.startsWith("/tools/gcalc") ||
    pathname?.startsWith("/tools/schedule-maker");

  return (
    <>
      {!hideChrome && <Navbar />}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>
      {!hideChrome && <Footer />}
    </>
  );
}