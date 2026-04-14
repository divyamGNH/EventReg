import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export default function AdminRegistrationsPage() {
  const { eventId } = useParams();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(
          `${API_BASE}/api/admin/events/${eventId}/registrations`,
          { withCredentials: true },
        );
        setUsers(response.data?.users || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load registrations.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [eventId]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Registered Users</h2>
        <Link
          to="/dashboard/admin/events"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to Events
        </Link>
      </div>

      {isLoading && <p className="text-sm text-slate-600">Loading...</p>}
      {!isLoading && error && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}
      {!isLoading && !error && users.length === 0 && (
        <p className="text-sm text-slate-600">No registered users found.</p>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <article
            key={String(user.userId)}
            className="rounded-xl border border-slate-200 p-3"
          >
            <p className="font-semibold text-slate-900">{user.username}</p>
            <p className="text-sm text-slate-700">{user.email}</p>
            <p className="text-sm text-slate-600">
              User ID: {String(user.userId)}
            </p>
            <p className="text-sm text-slate-600">
              Paid at: {formatDate(user.paidAt)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
