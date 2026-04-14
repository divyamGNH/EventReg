import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const formatMoney = (amountInCents, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountInCents || 0) / 100);

export default function AdminEventsPage() {
  const [events, setEvents] = useState([]);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });

  const load = async () => {
    const response = await axios.get(`${API_BASE}/api/admin/events`, {
      withCredentials: true,
    });
    setEvents(response.data?.events || []);
  };

  useEffect(() => {
    load().catch(() =>
      setMessage({ type: "error", text: "Failed to load events." }),
    );
  }, []);

  const handleDelete = async (eventId) => {
    setIsDeletingId(eventId);
    try {
      await axios.delete(`${API_BASE}/api/admin/events/${eventId}`, {
        withCredentials: true,
      });
      setMessage({ type: "success", text: "Event deleted." });
      await load();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to delete event.",
      });
    } finally {
      setIsDeletingId("");
    }
  };

  const bannerClass =
    message.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : message.type === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900">Manage Events</h2>
        <Link
          to="/dashboard/admin/events/new"
          className="rounded-md bg-[#f05456] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#df4a4c]"
        >
          Create New Event
        </Link>
      </div>

      {message.text && (
        <div
          className={`mb-4 rounded-xl border px-4 py-3 text-sm ${bannerClass}`}
        >
          {message.text}
        </div>
      )}

      <div className="space-y-3">
        {events.length === 0 && (
          <p className="text-sm text-slate-600">No events available.</p>
        )}

        {events.map((eventItem) => (
          <article
            key={String(eventItem._id)}
            className="rounded-xl border border-slate-200 p-4"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {eventItem.title}
            </h3>
            <p className="text-sm text-slate-600">
              Category: {eventItem.category || "General"}
            </p>
            <p className="text-sm text-slate-600">
              {formatMoney(eventItem.priceInCents, eventItem.currency)} |{" "}
              {eventItem.status}
            </p>
            <p className="text-sm text-slate-600">
              Booked: {eventItem.seatsBooked}/{eventItem.capacity}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={`/dashboard/admin/events/${String(eventItem._id)}/registrations`}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View Registered Users
              </Link>

              {eventItem.status !== "deleted" && (
                <button
                  onClick={() => handleDelete(String(eventItem._id))}
                  disabled={isDeletingId === String(eventItem._id)}
                  className="rounded-md border border-rose-300 px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed"
                >
                  {isDeletingId === String(eventItem._id)
                    ? "Deleting..."
                    : "Delete"}
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
