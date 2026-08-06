"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle2, LockKeyhole, Calendar, Banknote, QrCode } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  created_at: string;
  locker_ids: string[];
  rental_period: "year" | "term";
  payment_method: "online" | "cashier";
  total_amount: number;
  status: string;
};

const RENTAL_LABELS: Record<string, string> = {
  "1term": "1 Term",
  "3terms": "3 Terms",
};

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

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setBooking(data);
      setLoading(false);
    };
    load();
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
        <p className="text-zinc-500 text-sm mb-6">
          This booking doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => router.push("/lockers")}
          className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
        >
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
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center mb-4 shadow-lg shadow-green-200">
            <CheckCircle2 size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-extrabold">Booking Confirmed</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Reference #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-zinc-100">
            <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
              Lockers Reserved
            </p>
            <div className="flex flex-wrap gap-2">
              {booking.locker_ids.map((lid) => (
                <div
                  key={lid}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-sm font-bold"
                >
                  <LockKeyhole size={12} className="text-green-400" />
                  {lid}
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                Rental Period
              </p>
              <p className="font-bold text-zinc-900">{RENTAL_LABELS[booking.rental_period]}</p>
            </div>
            <Calendar size={20} className="text-zinc-400" />
          </div>

          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                Payment Method
              </p>
              <p className="font-bold text-zinc-900">
                {booking.payment_method === "online" ? "Online Banking" : "Pay at Cashier"}
              </p>
            </div>
            <PaymentIcon size={20} className="text-zinc-400" />
          </div>

          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-1">
                Status
              </p>
              <span
                className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                  booking.status === "paid"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {booking.status === "pending_payment" ? "Pending Payment" : booking.status}
              </span>
            </div>
          </div>

          <div className="p-5 bg-zinc-50 flex items-center justify-between">
            <p className="font-black text-zinc-900 text-lg">Total Amount Due</p>
            <p className="text-3xl font-black text-green-600">
              ₱{booking.total_amount.toLocaleString()}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 mt-6">
          Booked on {new Date(booking.created_at).toLocaleDateString()}
        </p>

        <div className="flex flex-wrap gap-3 justify-center mt-8">
          <button
            onClick={() => router.push("/lockers")}
            className="px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-700 transition-colors"
          >
            Back to Lockers
          </button>
        </div>
      </div>
    </main>
  );
}