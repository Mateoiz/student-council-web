"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, CheckCircle2, X, AlertCircle, ShoppingCart } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const MAX_LOCKERS = 1;

type Location = {
  id: string;
  name: string;
  sub: string;
  prefix: string;
  start_num: number;
  count: number;
};

type LockerRow = {
  id: string;
  location_id: string;
  label: string;
  status: string;
};

function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 text-sm font-semibold pointer-events-none whitespace-nowrap"
    >
      <AlertCircle size={16} className="text-amber-400 shrink-0" />
      {message}
    </motion.div>
  );
}

export default function LockerBooking() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [lockerRows, setLockerRows] = useState<LockerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLocation, setActiveLocation] = useState<string | null>(null);
  const [selectedLockers, setSelectedLockers] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Load the locations and lockers immediately — no auth gate needed to browse/select
  useEffect(() => {
    const init = async () => {
      const [{ data: locs, error: locErr }, { data: lks, error: lkErr }] = await Promise.all([
        supabase.from("locations").select("*").order("id"),
        supabase.from("lockers").select("id, location_id, label, status"),
      ]);

      if (locErr || lkErr) {
        showToast("Couldn't load lockers. Please refresh.");
        setLoading(false);
        return;
      }

      setLocations(locs ?? []);
      setLockerRows(lks ?? []);
      if (locs && locs.length) setActiveLocation(locs[0].id);
      setLoading(false);
    };
    init();

    // Real-time listener for locker status changes
    const channel = supabase
      .channel("lockers-changes")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "lockers" },
        (payload) => {
          setLockerRows((prev) =>
            prev.map((l) => (l.id === payload.new.id ? { ...l, status: payload.new.status } : l))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const currentLocation = locations.find((loc) => loc.id === activeLocation);

  const lockers = useMemo(() => {
    if (!currentLocation) return [];
    return lockerRows
      .filter((l) => l.location_id === currentLocation.id)
      .sort((a, b) => Number(a.label) - Number(b.label))
      .map((l) => ({ id: l.id, label: l.label, isOccupied: l.status !== "available" }));
  }, [lockerRows, currentLocation]);

  const availableCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const loc of locations) {
      counts[loc.id] = lockerRows.filter(
        (l) => l.location_id === loc.id && l.status === "available"
      ).length;
    }
    return counts;
  }, [lockerRows, locations]);

  const lockerBlocks = useMemo(() => {
    const blocks = [];
    for (let i = 0; i < lockers.length; i += 6) blocks.push(lockers.slice(i, i + 6));
    return blocks;
  }, [lockers]);

  const showToast = (msg: string) => {
    setToast(null);
    requestAnimationFrame(() => setToast(msg));
  };

  const toggleLocker = (id: string, isOccupied: boolean) => {
    if (isOccupied) {
      showToast("This locker is already taken.");
      return;
    }
    setSelectedLockers((prev) => {
      if (prev.includes(id)) return prev.filter((l) => l !== id);
      if (prev.length >= MAX_LOCKERS) {
        showToast(`Maximum of ${MAX_LOCKERS} lockers per booking.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeLocker = (id: string) =>
    setSelectedLockers((prev) => prev.filter((l) => l !== id));

  const selectionFull = selectedLockers.length >= MAX_LOCKERS;

  if (loading || !currentLocation) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading lockers…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-40">
      <Navbar />

      <AnimatePresence>
        {toast && <Toast key={toast} message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      <div className="pt-32 px-6 max-w-[1200px] mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-4">
            Reserve a <span className="text-green-600">Locker</span>
          </h1>
          <p className="text-zinc-500 max-w-xl mx-auto text-sm">
            Pick a building and floor, then tap up to{" "}
            <span className="font-bold text-zinc-700">{MAX_LOCKERS} lockers</span> to reserve them for the semester.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {locations.map((loc) => {
            const isActive = activeLocation === loc.id;
            const avail = availableCounts[loc.id];
            return (
              <button
                key={loc.id}
                onClick={() => {
                  setActiveLocation(loc.id);
                  setSelectedLockers([]);
                }}
                className={`relative flex flex-col items-start px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                  isActive
                    ? "bg-zinc-900 text-white shadow-lg border-zinc-900"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-400 hover:text-zinc-900"
                }`}
              >
                <span className="leading-tight">{loc.name}</span>
                <span className="text-xs font-medium text-zinc-400">{loc.sub}</span>
                <span
                  className={`absolute -top-2 -right-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${
                    isActive ? "bg-green-500 text-white" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                  }`}
                >
                  {avail} free
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 max-w-4xl mx-auto">
          <div className="flex items-center gap-6 text-xs font-semibold text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-7 rounded border border-zinc-300 bg-white shadow-sm" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-7 rounded border border-green-600 bg-green-500 shadow-sm" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative w-5 h-7 rounded border border-zinc-400 bg-zinc-300 flex items-center justify-center">
                <Lock size={8} className="text-zinc-500" />
              </div>
              <span>Occupied</span>
            </div>
          </div>

          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-colors ${
              selectionFull ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-500 border border-zinc-200"
            }`}
          >
            <div className="flex gap-1">
              {Array.from({ length: MAX_LOCKERS }).map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i < selectedLockers.length ? "bg-white" : selectionFull ? "bg-green-400" : "bg-zinc-300"
                  }`}
                />
              ))}
            </div>
            {selectedLockers.length} / {MAX_LOCKERS} selected
            {selectionFull && " · Full"}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeLocation}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="bg-zinc-200 p-8 md:p-12 rounded-3xl border border-zinc-300 shadow-inner overflow-x-auto"
          >
            <div className="flex flex-wrap justify-center gap-8 min-w-[700px]">
              {lockerBlocks.map((block, blockIndex) => (
                <div
                  key={blockIndex}
                  className="grid grid-cols-3 gap-1 bg-zinc-400 border-4 border-zinc-400 p-1 rounded-xl shadow-md"
                >
                  {block.map((locker) => {
                    const isSelected = selectedLockers.includes(locker.id);
                    const isDisabled = locker.isOccupied || (!isSelected && selectionFull);

                    return (
                      <motion.button
                        key={locker.id}
                        whileTap={!locker.isOccupied ? { scale: 0.93 } : {}}
                        onClick={() => toggleLocker(locker.id, locker.isOccupied)}
                        disabled={isDisabled && !isSelected}
                        title={
                          locker.isOccupied
                            ? "This locker is occupied"
                            : isSelected
                            ? "Click to deselect"
                            : selectionFull
                            ? "Maximum lockers reached"
                            : `Select locker ${locker.label}`
                        }
                        className={`group relative flex flex-col items-center justify-center w-20 h-28 border-2 transition-all duration-150 rounded-sm ${
                          locker.isOccupied
                            ? "bg-zinc-300 border-zinc-400 cursor-not-allowed"
                            : isSelected
                            ? "bg-green-500 border-green-700 text-white shadow-inner"
                            : selectionFull
                            ? "bg-zinc-100 border-zinc-300 cursor-not-allowed opacity-50"
                            : "bg-white border-zinc-300 hover:bg-green-50 hover:border-green-300 text-zinc-700 cursor-pointer"
                        }`}
                      >
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex flex-col gap-[3px] opacity-30">
                          {[0, 1, 2].map((v) => (
                            <div key={v} className={`w-6 h-[2px] rounded-full ${isSelected ? "bg-green-900" : "bg-black"}`} />
                          ))}
                        </div>
                        <span className={`text-sm font-black tracking-tighter z-10 drop-shadow-sm mt-4 ${isSelected ? "text-white" : "text-zinc-700"}`}>
                          {locker.label}
                        </span>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-sm bg-black/20 border border-black/10" />
                        {!locker.isOccupied && !isSelected && !selectionFull && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-3 h-3 rounded-full border-2 border-green-400" />
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white drop-shadow-md">
                            <CheckCircle2 size={16} />
                          </div>
                        )}
                        {locker.isOccupied && (
                          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800/5">
                            <Lock size={20} className="text-zinc-500 drop-shadow-md opacity-80" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedLockers.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pointer-events-none"
          >
            <div className="mx-auto max-w-[860px] bg-zinc-900 rounded-2xl p-4 md:px-8 md:py-5 shadow-2xl border border-zinc-800 pointer-events-auto">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-11 h-11 shrink-0 bg-green-600/20 rounded-xl flex items-center justify-center text-green-400">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold mb-1.5">Selected Lockers</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedLockers.map((id) => (
                        <motion.button
                          key={id}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => removeLocker(id)}
                          className="group flex items-center gap-1.5 bg-zinc-800 hover:bg-red-900/50 text-white text-sm font-bold px-3 py-1.5 rounded-lg border border-zinc-700 hover:border-red-700 transition-colors"
                          title={`Remove ${id}`}
                        >
                          <Unlock size={12} className="text-green-400 group-hover:text-red-400 transition-colors" />
                          {id}
                          <X size={11} className="text-zinc-500 group-hover:text-red-400 transition-colors ml-0.5" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                  <button
                    onClick={() => setSelectedLockers([])}
                    className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => {
                      const checkoutPath = `/lockers/checkout?lockers=${selectedLockers.join(",")}`;
                      const hasDetails = localStorage.getItem("student_details");
                      if (!hasDetails) {
                        router.push(`/login?redirect=${encodeURIComponent(checkoutPath)}`);
                      } else {
                        router.push(checkoutPath);
                      }
                    }}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-7 py-3 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-green-900/30 hover:scale-105 active:scale-95 text-sm"
                  >
                    Proceed to Checkout
                    <span className="bg-green-500/60 text-xs px-1.5 py-0.5 rounded-md font-black">
                      {selectedLockers.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}