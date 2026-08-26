"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2, LockKeyhole, Calendar, Banknote, QrCode,
  Upload, Loader2, Clock, KeyRound, PartyPopper, Link as LinkIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  created_at: string;
  locker_ids: string[];
  rental_period: string;
  payment_method: "online" | "cashier";
  total_amount: number;
  status: "pre_registered" | "paid" | "completed";
  receipt_url: string | null;
  first_name: string | null;
  middle_initial: string | null;
  surname: string | null;
  student_id: string | null;
  college: string | null;
  program: string | null;
  year_level: string | null;
  phone: string | null;
};

const RENTAL_LABELS: Record<string, string> = {
  "1term": "1 Term",
  "3terms": "3 Terms",
};

// ─── Disclaimer ───────────────────────────────────────────────────────────────

function ForgeryDisclaimer() {
  return (
    <div className="p-4 sm:p-5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6 shadow-md">
      <p className="font-black text-white uppercase tracking-widest text-[10px] sm:text-xs mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
        Important Reminder
      </p>
      <ul className="space-y-2 list-none">
        <li className="flex gap-3 items-start">
          <span className="text-red-400 mt-0.5">•</span>
          <span>
            <span className="font-bold text-white">Submitting a falsified or altered proof of payment</span> will result in immediate cancellation of your booking. Students caught doing so will be <span className="font-bold text-red-400">barred from renting a locker for the next term.</span>
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="text-red-400 mt-0.5">•</span>
          <span>
            You are required to <span className="font-bold text-white">surrender your spare key and a hard copy of your receipt</span> to the USC office as the final step. Failure to do so means you will <span className="font-bold text-red-400">not be able to use the locker</span> until this requirement is completed.
          </span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="text-red-400 mt-0.5">•</span>
          <span>
            By booking, you acknowledge these policies and your responsibility to provide truthful and accurate documentation.
          </span>
        </li>
      </ul>
    </div>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: Booking["status"] }) {
  if (status === "pre_registered") {
    return (
      <div className="flex items-start gap-3 p-4 sm:p-5 bg-red-50 border-2 border-red-300 rounded-xl text-sm mb-6 shadow-sm">
        <Clock size={18} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-red-800 text-sm sm:text-base">Action Required — Upload Proof of Payment</p>
          <p className="text-red-600 text-xs sm:text-sm mt-1 leading-relaxed">
            Your booking is <span className="font-black underline underline-offset-2">not confirmed</span> until you upload your proof of payment below. Without it, your locker may be released to another student.
          </p>
        </div>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <div className="flex items-start gap-3 p-4 sm:p-5 bg-blue-50 border-2 border-blue-200 rounded-xl text-sm mb-6 shadow-sm">
        <KeyRound size={18} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-blue-900 text-sm sm:text-base">Payment Verified — One Last Step!</p>
          <p className="text-blue-700 text-xs sm:text-sm mt-1 leading-relaxed">
            Please submit your <span className="font-bold">spare key</span> and <span className="font-bold">copy of receipt</span> to the USC office to complete your locker registration.
          </p>
        </div>
      </div>
    );
  }
  if (status === "completed") {
    return (
      <div className="flex items-start gap-3 p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-200 rounded-xl text-sm mb-6 shadow-sm">
        <PartyPopper size={18} className="text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-emerald-900 text-sm sm:text-base">All Done!</p>
          <p className="text-emerald-700 text-xs sm:text-sm mt-1 leading-relaxed">Your locker is fully registered. Enjoy your locker!</p>
        </div>
      </div>
    );
  }
  return null;
}

// ─── Receipt Upload ───────────────────────────────────────────────────────────

function ReceiptUpload({
  bookingId,
  existingUrl,
  onUploaded,
}: {
  bookingId: string;
  existingUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(!!existingUrl);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const { data: files } = await supabase.storage
      .from("receipts")
      .list(bookingId);
    if (files?.length) {
      await supabase.storage
        .from("receipts")
        .remove(files.map(f => `${bookingId}/${f.name}`));
    }
    await supabase
      .from("locker_bookings")
      .update({ receipt_url: null })
      .eq("id", bookingId);
    setDone(false);
    setPreview(null);
    setDeleting(false);
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Please upload an image or PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }

    setError(null);
    setUploading(true);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
    const ext = file.name.split(".").pop();
    const path = `${bookingId}/receipt_${Date.now()}.${ext}`; 

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError("Upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("receipts")
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from("locker_bookings")
      .update({ receipt_url: publicUrl })
      .eq("id", bookingId);

    if (updateError) {
      setError("Couldn't save your receipt. Please try again.");
      setUploading(false);
      return;
    }

    setUploading(false);
    setDone(true);
    onUploaded(publicUrl);
  };

  return (
    <div className="p-5 sm:p-6 border-b border-zinc-100 bg-white">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Proof of Payment
        </p>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
          Required
        </span>
      </div>

      {done && preview ? (
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden border border-zinc-200 shadow-sm group">
            <img src={preview} alt="Receipt" className="w-full max-h-56 sm:max-h-64 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent flex items-end p-4">
              <span className="text-white text-sm font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" />
                Receipt submitted successfully
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={() => { setDone(false); setPreview(null); }}
              className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-bold underline underline-offset-4"
            >
              Replace receipt
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 transition-colors font-bold underline underline-offset-4 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Delete receipt"}
            </button>
          </div>
        </div>
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-zinc-300 rounded-xl hover:border-green-500 hover:bg-green-50/50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed bg-zinc-50/50"
          >
            {uploading ? (
              <>
                <Loader2 size={28} className="text-green-600 animate-spin" />
                <span className="text-sm font-bold text-zinc-700 mt-1">Uploading your receipt…</span>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-zinc-200 group-hover:bg-green-100 group-hover:border-green-200 group-hover:shadow-green-100 flex items-center justify-center transition-all">
                  <Upload size={20} className="text-zinc-400 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="text-center mt-1">
                  <p className="text-sm font-bold text-zinc-800">Tap to upload proof of payment</p>
                  <p className="text-xs font-medium text-zinc-400 mt-1">Screenshot or photo · JPG, PNG, or PDF · Max 5MB</p>
                </div>
              </>
            )}
          </button>
          {error && (
            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-lg">
              <p className="text-xs text-red-600 font-bold text-center">{error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("locker_bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) { setNotFound(true); setLoading(false); return; }

      setBooking(data);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`booking-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "locker_bookings", filter: `id=eq.${id}` },
        (payload) => {
          setBooking(prev => prev ? { ...prev, status: payload.new.status } : prev);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard! Save this to access your booking later.");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="text-zinc-300 animate-spin" />
        <p className="text-zinc-400 font-bold tracking-wide">Loading receipt…</p>
      </main>
    );
  }

  if (notFound || !booking) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
          <LockKeyhole size={28} />
        </div>
        <p className="text-zinc-900 font-extrabold text-xl mb-2">Receipt Not Found</p>
        <p className="text-zinc-500 text-sm mb-8 max-w-sm">This booking doesn't exist or the link may be incorrect. Please check your reference link.</p>
        <button onClick={() => router.push("/lockers")} className="px-8 py-3.5 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-md">
          Back to Lockers
        </button>
      </main>
    );
  }

  const PaymentIcon = booking.payment_method === "online" ? QrCode : Banknote;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-24 sm:pb-32">
      <Navbar />

      <div className="pt-28 sm:pt-32 px-4 sm:px-6 max-w-xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-green-500 flex items-center justify-center mb-5 shadow-xl shadow-green-200/50">
            <CheckCircle2 size={32} className="text-white sm:w-10 sm:h-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Booking Confirmed</h1>
          <p className="text-zinc-500 text-sm sm:text-base font-medium mt-1.5 flex items-center gap-2">
            Reference <span className="font-mono font-bold text-zinc-700 bg-zinc-200/50 px-2 py-0.5 rounded-md">#{booking.id.slice(0, 8).toUpperCase()}</span>
          </p>
          
          <button 
            onClick={copyLinkToClipboard}
            className="mt-5 flex items-start gap-2.5 text-left text-xs sm:text-sm text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl px-4 py-3 max-w-md hover:bg-amber-100/50 transition-colors cursor-pointer group"
          >
            <LinkIcon size={16} className="mt-0.5 shrink-0 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium leading-snug">
              <strong className="block mb-0.5 font-bold text-amber-900">Save this page link!</strong>
              It's your only way to return to this page to check your status and upload your receipt.
            </span>
          </button>
        </div>

        <ForgeryDisclaimer />
        <StatusBanner status={booking.status} />

        <div className="bg-white border border-zinc-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-md shadow-black/5">
          {/* Student Info */}
          <div className="p-5 sm:p-6 border-b border-zinc-100">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
              Student Details
            </p>
            <p className="font-extrabold text-zinc-900 text-lg sm:text-xl">
              {[booking.first_name, booking.middle_initial && `${booking.middle_initial}.`, booking.surname]
                .filter(Boolean)
                .join(" ") || "—"}
            </p>
            <p className="text-sm font-bold text-zinc-500 font-mono mt-1">{booking.student_id ?? "—"}</p>
            
            <div className="flex flex-wrap gap-x-2 gap-y-1 mt-3">
              {booking.college && (
                <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-md">
                  {booking.college}
                </span>
              )}
              {booking.program && (
                <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-md">
                  {booking.program}
                </span>
              )}
              {booking.year_level && (
                <span className="inline-block bg-zinc-100 text-zinc-600 text-xs font-bold px-2.5 py-1 rounded-md">
                  Year {booking.year_level}
                </span>
              )}
            </div>
          </div>

          {/* Lockers Reserved */}
          <div className="p-5 sm:p-6 border-b border-zinc-100">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Lockers Reserved</p>
            <div className="flex flex-wrap gap-2">
              {booking.locker_ids.map((lid) => (
                <div key={lid} className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-zinc-900 text-white rounded-lg sm:rounded-xl text-sm font-bold shadow-sm">
                  <LockKeyhole size={14} className="text-green-400" />
                  {lid}
                </div>
              ))}
            </div>
          </div>

          {/* Settings / Meta */}
          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Rental Period</p>
              <p className="font-extrabold text-zinc-900 text-sm sm:text-base">{RENTAL_LABELS[booking.rental_period] ?? booking.rental_period}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
              <Calendar size={18} className="text-zinc-500" />
            </div>
          </div>

          <div className="p-5 sm:p-6 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Payment Method</p>
              <p className="font-extrabold text-zinc-900 text-sm sm:text-base">
                {booking.payment_method === "online" ? "Online Banking / GCash" : "Pay at Cashier"}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
              <PaymentIcon size={18} className="text-zinc-500" />
            </div>
          </div>

          {/* EXPANDED ONLINE PAYMENT DETAILS */}
          {booking.payment_method === "online" && booking.status === "pre_registered" && (
            <div className="p-5 sm:p-6 border-b border-zinc-100 bg-gradient-to-b from-green-50/50 to-white">
              <h3 className="font-extrabold text-zinc-900 mb-1 text-sm sm:text-base">OPTION B — Pay via Online Banking</h3>
              <p className="font-bold text-green-700 mb-5 text-xs sm:text-sm">Beneficiary: DE LA SALLE ARANETA UNIVERSITY INC.</p>

              <div className="space-y-4 mb-6">
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="font-black text-zinc-900 block mb-1 text-sm">• BDO (Bills Payment)</span>
                  <span className="text-zinc-500 text-xs sm:text-sm font-medium">Biller: De La Salle Araneta University <br/> Code: 2048</span>
                </div>
                
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="font-black text-zinc-900 block mb-1 text-sm">• BDO (Bank Transfer)</span>
                  <span className="text-zinc-500 text-xs sm:text-sm font-medium">Account No.: 007-2400-86698 <br/> Swift: BNORPHMM</span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="font-black text-zinc-900 block mb-1 text-sm">• AUB (Bills Payment)</span>
                  <span className="text-zinc-500 text-xs sm:text-sm font-medium">Biller: DLSAU INC. <br/> Note: Add ₱7.00 service charge</span>
                </div>

                <div className="bg-white p-3 sm:p-4 rounded-xl border border-zinc-200 shadow-sm">
                  <span className="font-black text-zinc-900 block mb-1 text-sm">• UPay</span>
                  <span className="text-zinc-500 text-xs sm:text-sm font-medium">Debit/Credit, InstaPay, Union Bank <br/> Note: 1.5% + ₱5.00 fee for cards</span>
                </div>
              </div>

              <div className="bg-green-100 text-green-900 p-4 rounded-xl text-xs sm:text-sm font-semibold border border-green-200/60 leading-relaxed shadow-sm">
                <span className="font-black block mb-1">Important Step:</span> 
                If you paid online, please email your receipt to <a href="mailto:payments@dlsau.edu.ph" className="underline font-bold text-green-950 hover:text-green-700 transition-colors">payments@dlsau.edu.ph</a> BEFORE proceeding to upload your proof here.
              </div>
            </div>
          )}

          {/* Receipt Upload Component */}
          {booking.status === "pre_registered" && (
            <ReceiptUpload
              bookingId={booking.id}
              existingUrl={booking.receipt_url}
              onUploaded={(url) => setBooking(prev => prev ? { ...prev, receipt_url: url } : prev)}
            />
          )}

          {/* Status Tracker */}
          <div className="p-5 sm:p-6 border-b border-zinc-100">
            <p className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Booking Status</p>
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold border ${
              booking.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
              booking.status === "paid"      ? "bg-blue-50 text-blue-700 border-blue-200" :
                                               "bg-amber-50 text-amber-700 border-amber-200"
            }`}>
              {booking.status === "completed" ? <PartyPopper size={14} /> :
               booking.status === "paid"      ? <KeyRound size={14} /> :
                                                <Clock size={14} />}
              
              {booking.status === "pre_registered" ? "Pending Verification" :
               booking.status === "paid"            ? "Payment Verified" :
                                                      "Completed"}
            </span>
          </div>

          {/* Total */}
          <div className="p-5 sm:p-8 bg-zinc-900 flex items-center justify-between text-white">
            <p className="font-black text-zinc-300 text-sm sm:text-lg">Total Amount Due</p>
            <p className="text-3xl sm:text-4xl font-black text-green-400 tracking-tight">₱{booking.total_amount.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-center text-xs font-medium text-zinc-400 mt-8 mb-12">
          Booked on {new Date(booking.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
    </main>
  );
}