"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Calendar,
  CalendarDays,
  Banknote,
  QrCode,
  CheckCircle2,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────

type RentalPeriod = "1term" | "3terms" | null;
type PaymentMethod = "online" | "cashier" | null;

// ─── Static Data ──────────────────────────────────────────────────────────────

const RENTAL_OPTIONS = [
  {
    id: "1term" as RentalPeriod,
    label: "1 Term",
    duration: "August 2025 – December 2025",
    price: 300,
    Icon: Calendar,
    badge: null,
  },
  {
    id: "3terms" as RentalPeriod,
    label: "3 Terms",
    duration: "August 2025 – May 2026",
    price: 800,
    Icon: CalendarDays,
    badge: "Best Value",
  },
];

const PAYMENT_OPTIONS = [
  { id: "online" as PaymentMethod, label: "Online Banking", Icon: QrCode, color: "text-blue-500" },
  { id: "cashier" as PaymentMethod, label: "Pay at Cashier", Icon: Banknote, color: "text-amber-500" },
];

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: number }) {
  const steps = ["Rental Period", "Payment", "Review"];
  return (
    <div className="flex items-center justify-center gap-0 mb-12">
      {steps.map((label, i) => {
        const num = i + 1;
        const active = step === num;
        const done = step > num;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <motion.div
                animate={{
                  backgroundColor: done ? "#16a34a" : active ? "#18181b" : "#e4e4e7",
                  color: done || active ? "#fff" : "#71717a",
                  scale: active ? 1.15 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm"
              >
                {done ? <CheckCircle2 size={16} /> : num}
              </motion.div>
              <span
                className={`text-[11px] font-bold tracking-wide uppercase ${
                  active ? "text-zinc-900" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 md:w-24 h-0.5 mb-5 mx-2 rounded-full transition-colors duration-500 ${
                  step > num ? "bg-green-600" : "bg-zinc-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 – Rental Period ───────────────────────────────────────────────────

function RentalStep({
  lockers,
  selected,
  onSelect,
}: {
  lockers: string[];
  selected: RentalPeriod;
  onSelect: (p: RentalPeriod) => void;
}) {
  return (
    <motion.div
      key="rental"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {lockers.map((id) => (
          <div
            key={id}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-bold"
          >
            <LockKeyhole size={14} className="text-green-400" />
            {id}
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-extrabold text-zinc-900 text-center mb-2">
        How long do you need it?
      </h2>
      <p className="text-zinc-500 text-center text-sm mb-8">
        Choose a rental period for your selected locker{lockers.length > 1 ? "s" : ""}.
      </p>

      <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {RENTAL_OPTIONS.map(({ id, label, duration, price, Icon, badge }) => {
          const isSelected = selected === id;
          return (
            <motion.button
              key={id!}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(id)}
              className={`relative text-left p-6 rounded-2xl border-2 transition-all duration-200 shadow-sm ${
                isSelected
                  ? "border-green-600 bg-green-50 shadow-green-100 shadow-lg"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              {badge && (
                <span className="absolute top-4 right-4 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              )}

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? "bg-green-600 text-white" : "bg-zinc-100 text-zinc-500"
                }`}
              >
                <Icon size={20} />
              </div>

              <p className="font-extrabold text-zinc-900 text-lg mb-1">{label}</p>
              <p className="text-zinc-400 text-sm mb-4">{duration}</p>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-zinc-900">
                  ₱{price.toLocaleString()}
                </span>
                <span className="text-zinc-400 text-sm font-medium">/ locker</span>
              </div>

              {lockers.length > 1 && (
                <p className="text-xs text-zinc-400 mt-1 font-medium">
                  ₱{(price * lockers.length).toLocaleString()} total for {lockers.length} lockers
                </p>
              )}

              {isSelected && (
                <div className="absolute bottom-4 right-4 text-green-600">
                  <CheckCircle2 size={22} />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Step 2 – Payment ─────────────────────────────────────────────────────────

function PaymentStep({
  selected,
  onSelect,
}: {
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
}) {
  return (
    <motion.div
      key="payment"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <h2 className="text-2xl font-extrabold text-zinc-900 text-center mb-2">
        How will you pay?
      </h2>
      <p className="text-zinc-500 text-center text-sm mb-8">
        Select your preferred payment method.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
        {PAYMENT_OPTIONS.map(({ id, label, Icon, color }) => {
          const isSelected = selected === id;
          return (
            <motion.button
              key={id!}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(id)}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 ${
                isSelected
                  ? "border-green-600 bg-green-50 shadow-lg shadow-green-100"
                  : "border-zinc-200 bg-white hover:border-zinc-400"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isSelected ? "bg-green-600 text-white" : `bg-zinc-100 ${color}`
                }`}
              >
                <Icon size={22} />
              </div>
              <span className="font-bold text-zinc-800 text-sm text-center leading-tight">
                {label}
              </span>
              {isSelected && <CheckCircle2 size={16} className="text-green-600" />}
            </motion.button>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-400 mt-8 max-w-sm mx-auto">
        {selected === "cashier"
          ? "Proceed to the school cashier with your booking reference to complete payment."
          : selected === "online"
          ? "Bank transfer details will be sent to your registered email after submission."
          : "Payment instructions will be provided after your booking is confirmed."}
      </p>
    </motion.div>
  );
}

// ─── Step 3 – Review ─────────────────────────────────────────────────────────

function ReviewStep({
  lockers,
  rental,
  payment,
}: {
  lockers: string[];
  rental: RentalPeriod;
  payment: PaymentMethod;
}) {
  const rentalOption = RENTAL_OPTIONS.find((r) => r.id === rental)!;
  const paymentOption = PAYMENT_OPTIONS.find((p) => p.id === payment)!;
  const total = rentalOption.price * lockers.length;

  return (
    <motion.div
      key="review"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-lg mx-auto"
    >
      <h2 className="text-2xl font-extrabold text-zinc-900 text-center mb-2">
        Review your booking
      </h2>
      <p className="text-zinc-500 text-center text-sm mb-8">
        Double-check before confirming.
      </p>

      <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-100">
          <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
            Lockers Reserved
          </p>
          <div className="flex flex-wrap gap-2">
            {lockers.map((id) => (
              <div
                key={id}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-bold"
              >
                <LockKeyhole size={12} className="text-green-400" />
                {id}
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
              Rental Period
            </p>
            <p className="font-bold text-zinc-900">{rentalOption.label}</p>
            <p className="text-sm text-zinc-400">{rentalOption.duration}</p>
          </div>
          <rentalOption.Icon size={20} className="text-zinc-400" />
        </div>

        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
              Payment Method
            </p>
            <p className="font-bold text-zinc-900">{paymentOption.label}</p>
          </div>
          <paymentOption.Icon size={20} className="text-zinc-400" />
        </div>

        <div className="p-5 bg-zinc-50 flex items-center justify-between">
          <p className="font-black text-zinc-900 text-lg">Total Amount Due</p>
          <p className="text-3xl font-black text-green-600">
            ₱{total.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400 mt-5">
        By confirming, you agree to the{" "}
        <span className="underline underline-offset-2 cursor-pointer">
          Locker Rental Terms & Conditions
        </span>
        .
      </p>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function LockerCheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(1);
  const [rental, setRental] = useState<RentalPeriod>(null);
  const [payment, setPayment] = useState<PaymentMethod>(null);
  const [submitted, setSubmitted] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lockers = (searchParams.get("lockers") ?? "")
    .split(",")
    .filter(Boolean);

  // Redirect if no lockers, and require login before checking out
  useEffect(() => {
    const init = async () => {
      if (!lockers.length) {
        router.replace("/lockers");
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(
          `/login?redirect=${encodeURIComponent(
            window.location.pathname + window.location.search
          )}`
        );
        return;
      }
      setCheckingAuth(false);
    };
    init();
  }, []);

  const canNext =
    (step === 1 && rental !== null) ||
    (step === 2 && payment !== null) ||
    step === 3;

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
    else handleSubmit();
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    setSubmitting(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          window.location.pathname + window.location.search
        )}`
      );
      return;
    }

    const rentalOption = RENTAL_OPTIONS.find((r) => r.id === rental)!;
    const total = rentalOption.price * lockers.length;

const { data: booking, error } = await supabase
      .from("locker_bookings")
      .insert({
        user_id: session.user.id,
        locker_ids: lockers,
        rental_period: rental,
        payment_method: payment,
        total_amount: total,
      })
      .select()
      .single();

    setSubmitting(false);

    if (error || !booking) {
      setSubmitError(
        error?.code === "23505"
          ? "One of these lockers was just taken by someone else. Please pick another."
          : "Something went wrong submitting your booking. Please try again."
      );
      return;
    }

    router.push(`/receipt/${booking.id}`);
  };

  // ── Auth check loading state ────────────────────────────────────────────────
  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Checking your session…</p>
      </main>
    );
  }

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18 }}
          className="w-24 h-24 rounded-full bg-green-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-300"
        >
          <CheckCircle2 size={44} className="text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-extrabold text-zinc-900 mb-3"
        >
          Booking Confirmed!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-zinc-500 max-w-sm mb-8"
        >
          Your locker{lockers.length > 1 ? "s have" : " has"} been reserved. Please settle your payment as per the selected method to complete the booking.
        </motion.p>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          <button
            onClick={() => router.push("/lockers")}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
          >
            Back to Lockers
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-6 py-3 border border-zinc-200 text-zinc-700 rounded-xl font-bold hover:border-zinc-400 transition-colors"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </main>
    );
  }

  // ── Checkout Flow ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-40">
      <Navbar />

      <div className="pt-32 px-6 max-w-[900px] mx-auto">
        <button
          onClick={() => (step === 1 ? router.back() : setStep((s) => s - 1))}
          className="flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-zinc-900 transition-colors mb-10"
        >
          <ChevronLeft size={16} />
          {step === 1 ? "Back to Lockers" : "Previous Step"}
        </button>

        <StepIndicator step={step} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <RentalStep lockers={lockers} selected={rental} onSelect={setRental} />
          )}
          {step === 2 && (
            <PaymentStep selected={payment} onSelect={setPayment} />
          )}
          {step === 3 && (
            <ReviewStep lockers={lockers} rental={rental!} payment={payment!} />
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none">
        <div className="mx-auto max-w-[800px] pointer-events-auto">
          {submitError && (
            <p className="text-center text-sm font-semibold text-red-600 mb-2 bg-white/90 rounded-lg py-2 px-3">
              {submitError}
            </p>
          )}
          <motion.button
            whileHover={canNext && !submitting ? { scale: 1.02 } : {}}
            whileTap={canNext && !submitting ? { scale: 0.97 } : {}}
            onClick={handleNext}
            disabled={!canNext || submitting}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base tracking-wide shadow-xl transition-all duration-200 ${
              canNext && !submitting
                ? "bg-zinc-900 text-white shadow-zinc-900/20 hover:bg-zinc-800"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
            }`}
          >
            {step === 3 ? (
              <>
                <CheckCircle2 size={20} />
                {submitting ? "Submitting…" : "Confirm Booking"}
              </>
            ) : (
              <>
                Continue
                <ArrowRight size={20} />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </main>
  );
}

export default function LockerCheckout() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading...</p>
      </main>
    }>
      <LockerCheckoutInner />
    </Suspense>
  );
}