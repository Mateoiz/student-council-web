"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CheckCircle2, LockKeyhole, Calendar, Banknote, QrCode,
  Upload, ImageIcon, Loader2, Clock, KeyRound, PartyPopper
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
};

const RENTAL_LABELS: Record<string, string> = {
  "1term": "1 Term",
  "3terms": "3 Terms",
};

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({ status }: { status: Booking["status"] }) {
  if (status === "pre_registered") {
    return (
      <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-300 rounded-xl text-sm">
        <Clock size={16} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-red-700">Action Required — Upload Proof of Payment</p>
          <p className="text-red-600 text-xs mt-1">
            Your booking is <span className="font-black underline underline-offset-2">not confirmed</span> until you upload your proof of payment below. Without it, your locker may be released to another student.
          </p>
        </div>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm">
        <KeyRound size={16} className="text-blue-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-blue-800">Payment Verified — One Last Step!</p>
          <p className="text-blue-600 text-xs mt-0.5">
            Please submit your <span className="font-bold">spare key</span> to the USC office to complete your locker registration.
          </p>
        </div>
      </div>
    );
  }

  if (status === "completed") {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm">
        <PartyPopper size={16} className="text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <p className="font-bold text-emerald-800">All Done!</p>
          <p className="text-emerald-600 text-xs mt-0.5">
            Your locker is fully registered. Enjoy your locker!
          </p>
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

    // Local preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }

    const ext = file.name.split(".").pop();
    const path = `${bookingId}/receipt.${ext}`;

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
    <div className="p-5 border-b border-zinc-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
          Proof of Payment
        </p>
        <span className="text-[10px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
          Required
        </span>
      </div>

      {done && preview ? (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden border border-zinc-200">
            <img src={preview} alt="Receipt" className="w-full max-h-48 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-3">
              <span className="text-white text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-green-400" />
                Receipt submitted
              </span>
            </div>
          </div>
          <button
            onClick={() => { setDone(false); setPreview(null); }}
            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors font-semibold underline underline-offset-2"
          >
            Replace receipt
          </button>
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
            className="w-full flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-zinc-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <Loader2 size={24} className="text-green-500 animate-spin" />
                <span className="text-sm font-bold text-zinc-600">Uploading…</span>
              </>
            ) : (
              <>
                <div className="w-10 h-10 rounded-full bg-zinc-100 group-hover:bg-green-100 flex items-center justify-center transition-colors">
                  <Upload size={18} className="text-zinc-400 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="text-center">
           <p className="text-sm font-bold text-zinc-700">Upload proof of payment</p>
                  <p className="text-xs text-zinc-400 mt-0.5">Screenshot or photo · JPG, PNG, or PDF · max 5MB</p>
                </div>
              </>
            )}
          </button>
          {error && (
            <p className="text-xs text-red-500 font-semibold mt-2 text-center">{error}</p>
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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace(`/login?redirect=${encodeURIComponent(`/receipt/${id}`)}`);
        return;
      }

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

    // Real-time: watch for admin status changes
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

  if (loading) {
    return (
      <main className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <p className="text-zinc-400 font-bold">Loading receipt…</p>
      </main>
    );
  }

  if (notFound || !booking) {
    return (
      <main className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center px-6 text-center">
        <p className="text-zinc-900 font-bold text-lg mb-2">Receipt not found</p>
        <p className="text-zinc-500 text-sm mb-6">This booking doesn't exist or you don't have access to it.</p>
        <button onClick={() => router.push("/lockers")} className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors">
          Back to Lockers
        </button>
      </main>
    );
  }

  const PaymentIcon = booking.payment_method === "online" ? QrCode : Banknote;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 pb-20">
      <Navbar />

      <div className="pt-32 px-6 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-200">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Booking Confirmed</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Reference #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        {/* Status banner */}
        <div className="mb-4">
          <StatusBanner status={booking.status} />
        </div>

        {/* Booking card */}
        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">Lockers Reserved</p>
            <div className="flex flex-wrap gap-2">
              {booking.locker_ids.map((lid) => (
                <div key={lid} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-bold">
                  <LockKeyhole size={12} className="text-green-400" />
                  {lid}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Rental Period</p>
              <p className="font-bold text-zinc-900">{RENTAL_LABELS[booking.rental_period] ?? booking.rental_period}</p>
            </div>
            <Calendar size={20} className="text-zinc-400" />
          </div>

          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Payment Method</p>
              <p className="font-bold text-zinc-900">
                {booking.payment_method === "online" ? "Online Banking" : "Pay at Cashier"}
              </p>
            </div>
            <PaymentIcon size={20} className="text-zinc-400" />
          </div>

          {/* Receipt upload — only visible when pre_registered */}
          {booking.status === "pre_registered" && (
            <ReceiptUpload
              bookingId={booking.id}
              existingUrl={booking.receipt_url}
              onUploaded={(url) => setBooking(prev => prev ? { ...prev, receipt_url: url } : prev)}
            />
          )}

          <div className="p-5 border-b border-zinc-100">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">Status</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
              booking.status === "completed" ? "bg-emerald-100 text-emerald-700" :
              booking.status === "paid"      ? "bg-blue-100 text-blue-700" :
                                              "bg-amber-100 text-amber-700"
            }`}>
              {booking.status === "pre_registered" ? "Pending Verification" :
               booking.status === "paid"            ? "Payment Verified" :
                                                      "Completed"}
            </span>
          </div>

          <div className="p-5 bg-zinc-50 flex items-center justify-between">
            <p className="font-black text-zinc-900 text-lg">Total Amount Due</p>
            <p className="text-3xl font-black text-green-600">₱{booking.total_amount.toLocaleString()}</p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Booked on {new Date(booking.created_at).toLocaleDateString()}
        </p>
      </div>
    </main>
  );
}