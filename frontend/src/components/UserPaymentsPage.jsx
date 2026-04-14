import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatMoney = (amountInCents, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountInCents || 0) / 100);

export default function UserPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/events/my-payments`, {
          withCredentials: true,
        });
        setPayments(response.data?.payments || []);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">Payment History</h2>
      <p className="mt-1 text-sm text-slate-600">
        Track all your ticket payments here.
      </p>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-slate-600">Loading...</p>}
        {!isLoading && payments.length === 0 && (
          <p className="text-sm text-slate-600">No payments recorded yet.</p>
        )}

        {payments.map((entry) => (
          <article
            key={String(entry._id)}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="font-semibold text-slate-900">
              {entry.eventId?.title || "Unknown event"}
            </h3>
            <p className="text-sm text-slate-600">
              Amount: {formatMoney(entry.amountInCents, entry.currency)}
            </p>
            <p className="text-sm text-slate-600">Status: {entry.status}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
