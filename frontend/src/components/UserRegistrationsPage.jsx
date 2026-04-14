import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function UserRegistrationsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/events/my-registrations`,
          { withCredentials: true },
        );
        setRegistrations(response.data?.registrations || []);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-2xl font-bold text-slate-900">My Registrations</h2>
      <p className="mt-1 text-sm text-slate-600">
        This page shows only your registrations.
      </p>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-slate-600">Loading...</p>}
        {!isLoading && registrations.length === 0 && (
          <p className="text-sm text-slate-600">No registrations yet.</p>
        )}

        {registrations.map((entry) => (
          <article
            key={String(entry.registrationId)}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="font-semibold text-slate-900">
              {entry.event?.title || "Unknown event"}
            </h3>
            <p className="text-sm text-slate-600">Status: {entry.status}</p>
            <p className="text-sm text-slate-600">
              Paid at: {formatDate(entry.paidAt)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
