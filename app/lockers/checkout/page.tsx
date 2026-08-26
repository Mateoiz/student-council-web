"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, ArrowRight, ShieldCheck, Banknote, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

const PRICE_1_TERM = 300;
const PRICE_3_TERMS = 800;

// PH mobile numbers: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX / 639XXXXXXXXX
const PH_MOBILE_REGEX = /^(?:\+63|63|0)9\d{9}$/;

function normalizePhoneForCheck(raw: string) {
  // Strip spaces, dashes, parens for comparison/validation
  return raw.replace(/[\s\-()]/g, "");
}

function isValidPHMobile(raw: string) {
  return PH_MOBILE_REGEX.test(normalizePhoneForCheck(raw));
}

// Store phone in a consistent canonical form: 09XXXXXXXXX
function toCanonicalPHMobile(raw: string) {
  const cleaned = normalizePhoneForCheck(raw);
  if (cleaned.startsWith("+63")) return "0" + cleaned.slice(3);
  if (cleaned.startsWith("63")) return "0" + cleaned.slice(2);
  return cleaned;
}

function CheckoutInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lockerQuery = searchParams.get("lockers") || "";
  const selectedLockers = lockerQuery.split(",").filter(Boolean);

  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [rentalPeriod, setRentalPeriod] = useState<"1term" | "3terms">("1term");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cashier">("online");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("student_details");
    if (!saved) {
      router.push("/login?redirect=/lockers/checkout?lockers=" + lockerQuery);
      return;
    }

    if (selectedLockers.length === 0) {
      router.push("/lockers");
      return;
    }

    setStudentDetails(JSON.parse(saved));
  }, [router, lockerQuery, selectedLockers.length]);

  const handleCheckout = async () => {
    if (!studentDetails || selectedLockers.length === 0) return;
    setError(null);

    // 0. Validate PH mobile format before touching the database
    if (!studentDetails.phone || !isValidPHMobile(studentDetails.phone)) {
      setError(
        "Please provide a valid Philippine mobile number (e.g. 09XXXXXXXXX or +639XXXXXXXXX)."
      );
      return;
    }

    setIsSubmitting(true);

    const amountPerLocker = rentalPeriod === "1term" ? PRICE_1_TERM : PRICE_3_TERMS;
    const totalAmount = selectedLockers.length * amountPerLocker;
    const canonicalPhone = toCanonicalPHMobile(studentDetails.phone);
    const normalizedFirstName = studentDetails.first_name.trim().toLowerCase();
    const normalizedSurname = studentDetails.surname.trim().toLowerCase();

    try {
      // 1. DUPLICATE CHECK: block on matching Student ID OR matching full name (case-insensitive)
      const activeStatuses = ["pre_registered", "paid", "completed"];

      const [{ data: idMatches, error: idErr }, { data: nameMatches, error: nameErr }] =
        await Promise.all([
          supabase
            .from("locker_bookings")
            .select("id, status, student_id")
            .eq("student_id", studentDetails.student_id)
            .in("status", activeStatuses),
          supabase
            .from("locker_bookings")
            .select("id, status, first_name, surname")
            .ilike("first_name", normalizedFirstName)
            .ilike("surname", normalizedSurname)
            .in("status", activeStatuses),
        ]);

      if (idErr) throw idErr;
      if (nameErr) throw nameErr;

      const hasIdDupe = idMatches && idMatches.length > 0;
      const hasNameDupe = nameMatches && nameMatches.length > 0;

      if (hasIdDupe && hasNameDupe) {
        setError(
          "Both this Student ID and this name already have an active locker booking. Each student may only rent one locker per term. If you believe this is an error, please contact the USC office."
        );
        setIsSubmitting(false);
        return;
      }

      if (hasIdDupe) {
        setError(
          "This Student ID already has an active locker booking. Each student may only rent one locker per term. If you believe this is an error, please contact the USC office."
        );
        setIsSubmitting(false);
        return;
      }

      if (hasNameDupe) {
        setError(
          "A booking already exists under this name (possibly with a different Student ID). Each student may only rent one locker per term — please contact the USC office if this is a mistake."
        );
        setIsSubmitting(false);
        return;
      }

      // 2. ATOMIC CLAIM: Try to reserve the lockers ONLY if they are currently 'available'
      const { data: claimedLockers, error: claimError } = await supabase
        .from("lockers")
        .update({ status: "reserved" })
        .in("id", selectedLockers)
        .eq("status", "available")
        .select("id");

      if (claimError) throw claimError;

      // 3. VERIFY CLAIM: Did we successfully lock down ALL the lockers we requested?
      if (!claimedLockers || claimedLockers.length !== selectedLockers.length) {
        // Someone else snatched at least one of them right before us!

        // Rollback: Release any lockers we DID manage to grab back to 'available'
        if (claimedLockers && claimedLockers.length > 0) {
          await supabase
            .from("lockers")
            .update({ status: "available" })
            .in("id", claimedLockers.map((l) => l.id));
        }

        setError("Sorry! Someone else just booked one of these lockers. Please go back and select a different one.");
        setIsSubmitting(false);
        return;
      }

      // 4. SUCCESS: The lockers are safely ours. Now insert the booking record.
      const { data: booking, error: insertError } = await supabase
        .from("locker_bookings")
        .insert({
          first_name: studentDetails.first_name,
          middle_initial: studentDetails.middle_initial,
          surname: studentDetails.surname,
          email: studentDetails.email,
          student_id: studentDetails.student_id,
          college: studentDetails.college,
          program: studentDetails.program,
          year_level: studentDetails.year_level,
          phone: canonicalPhone,
          locker_ids: selectedLockers,
          rental_period: rentalPeriod,
          payment_method: paymentMethod,
          total_amount: totalAmount,
          status: "pre_registered",
        })
        .select("id")
        .single();

      if (insertError) {
        // Failsafe: If the booking insert fails for any reason, release the lockers
        await supabase.from("lockers").update({ status: "available" }).in("id", selectedLockers);
        throw insertError;
      }

      // 5. Send them to the receipt page using the generated booking UUID
      router.push(`/receipt/${booking.id}`);
    } catch (err: any) {
      console.error(err);
      setError("Failed to create booking: " + (err.message || "Unknown error"));
      setIsSubmitting(false);
    }
  };

  if (!studentDetails) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Verifying details…</p>
      </main>
    );
  }

  const amountPerLocker = rentalPeriod === "1term" ? PRICE_1_TERM : PRICE_3_TERMS;
  const totalAmount = selectedLockers.length * amountPerLocker;
  const phoneLooksValid = studentDetails.phone ? isValidPHMobile(studentDetails.phone) : true;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      <Navbar />

      <div className="pt-32 px-6 max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Left Col: Selections */}
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-2">Checkout</h1>
            <p className="text-zinc-500 text-sm">Review your selection and choose a plan.</p>
          </div>

          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-zinc-300 leading-relaxed">
            <p className="font-black text-white uppercase tracking-widest text-[10px] mb-1.5">
              One Locker Per Student
            </p>
            <p>
              Each Student ID may only book <span className="font-bold text-white">one locker per term</span>. Attempting to book multiple lockers, using false information, or any other form of policy violation will result in <span className="font-bold text-red-400">immediate cancellation and serious repercussions</span>, including being barred from future locker rentals.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-200">
              {error}
            </div>
          )}

          {!phoneLooksValid && !error && (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-semibold border border-amber-200">
              The mobile number on file ({studentDetails.phone}) doesn't look like a valid PH number. You'll need to fix this before confirming.
            </div>
          )}

          {/* Lockers List */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Selected Lockers</h2>
            <div className="flex flex-wrap gap-2">
              {selectedLockers.map((id) => (
                <div key={id} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold shadow-sm">
                  <LockKeyhole size={14} className="text-green-400" />
                  {id}
                </div>
              ))}
            </div>
          </div>

          {/* Rental Period */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Rental Period</h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRentalPeriod("1term")}
                className={`p-4 rounded-xl text-left border-2 transition-all ${
                  rentalPeriod === "1term"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${rentalPeriod === "1term" ? "text-green-900" : "text-zinc-900"}`}>1 Term</span>
                  {rentalPeriod === "1term" && <ShieldCheck size={16} className="text-green-600" />}
                </div>
                <span className="text-sm font-semibold text-zinc-500">₱{PRICE_1_TERM} / locker</span>
              </button>

              <button
                onClick={() => setRentalPeriod("3terms")}
                className={`p-4 rounded-xl text-left border-2 transition-all ${
                  rentalPeriod === "3terms"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`font-bold ${rentalPeriod === "3terms" ? "text-green-900" : "text-zinc-900"}`}>3 Terms</span>
                  {rentalPeriod === "3terms" && <ShieldCheck size={16} className="text-green-600" />}
                </div>
                <span className="text-sm font-semibold text-zinc-500">₱{PRICE_3_TERMS} / locker</span>
                <span className="block mt-1 text-[10px] font-black text-green-600 uppercase tracking-wider">Save ₱50</span>
              </button>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Payment Method</h2>
            <div className="grid grid-cols-1 gap-4">
              
              {/* Online Banking Wrapper */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPaymentMethod("online")}
                  className={`flex items-center gap-3 p-4 rounded-xl text-left border-2 transition-all ${
                    paymentMethod === "online"
                      ? "border-green-500 bg-green-50"
                      : "border-zinc-200 bg-white hover:border-zinc-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${paymentMethod === "online" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                    <QrCode size={20} />
                  </div>
                  <div>
                    <span className={`block font-bold ${paymentMethod === "online" ? "text-green-900" : "text-zinc-900"}`}>Online Banking / GCash</span>
                    <span className="block text-xs font-medium text-zinc-500">Upload receipt after booking</span>
                  </div>
                </button>

                {/* Expanded Online Payment Details */}
                {paymentMethod === "online" && (
                  <div className="p-5 bg-white border border-green-200 rounded-xl text-sm text-zinc-700 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <h3 className="font-bold text-zinc-900 mb-1">OPTION B — Pay via Online Banking</h3>
                    <p className="font-semibold text-green-700 mb-4">Beneficiary: DE LA SALLE ARANETA UNIVERSITY INC.</p>
                    
                    <ul className="space-y-4 mb-5">
                      <li>
                        <span className="font-bold text-zinc-900 block mb-0.5">• BDO (Bills Payment)</span>
                        <span className="text-zinc-500">Biller: De La Salle Araneta University · Code: 2048</span>
                      </li>
                      <li>
                        <span className="font-bold text-zinc-900 block mb-0.5">• BDO (Bank Transfer)</span>
                        <span className="text-zinc-500">Account No.: 007-2400-86698 · Swift: BNORPHMM</span>
                      </li>
                      <li>
                        <span className="font-bold text-zinc-900 block mb-0.5">• AUB (Bills Payment)</span>
                        <span className="text-zinc-500">Biller: DLSAU INC. · Add ₱7.00 service charge</span>
                      </li>
                      <li>
                        <span className="font-bold text-zinc-900 block mb-0.5">• UPay — Debit/Credit, InstaPay, Union Bank</span>
                        <span className="text-zinc-500">Note: 1.5% + ₱5.00 fee for cards</span>
                      </li>
                    </ul>

                    <div className="bg-green-50 text-green-800 p-3 rounded-lg text-xs font-semibold border border-green-100 leading-relaxed">
                      Note: If you paid online, email your receipt to <a href="mailto:payments@dlsau.edu.ph" className="underline font-bold">payments@dlsau.edu.ph</a> BEFORE proceeding to Step 3.
                    </div>
                  </div>
                )}
              </div>

              {/* Cashier Option */}
              <button
                onClick={() => setPaymentMethod("cashier")}
                className={`flex items-center gap-3 p-4 rounded-xl text-left border-2 transition-all ${
                  paymentMethod === "cashier"
                    ? "border-green-500 bg-green-50"
                    : "border-zinc-200 bg-white hover:border-zinc-300"
                }`}
              >
                <div className={`p-2 rounded-lg ${paymentMethod === "cashier" ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                  <Banknote size={20} />
                </div>
                <div>
                  <span className={`block font-bold ${paymentMethod === "cashier" ? "text-green-900" : "text-zinc-900"}`}>Pay at Cashier</span>
                  <span className="block text-xs font-medium text-zinc-500">Upload official receipt later</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Summary Card */}
        <div>
          <div className="sticky top-32 bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-black text-lg mb-6 text-zinc-900">Summary</h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between items-center text-zinc-600 font-medium">
                <span>Student</span>
                <span className="text-zinc-900 font-bold">
                  {studentDetails.first_name} {studentDetails.middle_initial && `${studentDetails.middle_initial}.`} {studentDetails.surname}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 font-medium border-b border-zinc-100 pb-3">
                <span>Student ID</span>
                <span className="font-mono text-zinc-900 font-bold">{studentDetails.student_id}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 font-medium border-b border-zinc-100 pb-3">
                <span>Mobile Number</span>
                <span className={`font-mono font-bold ${phoneLooksValid ? "text-zinc-900" : "text-red-600"}`}>
                  {studentDetails.phone || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center text-zinc-600 font-medium pt-1">
                <span>Lockers ({selectedLockers.length})</span>
                <span className="text-zinc-900 font-bold">₱{amountPerLocker} each</span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 mb-6">
              <div className="flex justify-between items-end">
                <span className="text-zinc-500 font-bold">Total Due</span>
                <span className="text-3xl font-black text-green-600 tracking-tight">
                  ₱{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 text-white rounded-xl font-black tracking-wide hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Processing…" : "Confirm Booking"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
            <p className="text-center text-xs font-medium text-zinc-400 mt-4">
              Your locker will be held pending payment verification.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading checkout...</p>
      </main>
    }>
      <CheckoutInner />
    </Suspense>
  );
}