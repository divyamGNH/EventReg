import { useState } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000";

const initialEventForm = {
  title: "",
  description: "",
  location: "",
  startDate: "",
  endDate: "",
  capacity: "",
  priceInRupees: "",
};

const formatMoney = (amountInCents, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountInCents || 0) / 100);

export default function AdminEventsPanel({ events, onRefresh, onMessage }) {
  const [formState, setFormState] = useState(initialEventForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState("");
  const [registrationUsers, setRegistrationUsers] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const normalizedCapacity = Number(formState.capacity);
    const normalizedPriceInRupees = Number(formState.priceInRupees || 0);
    const normalizedPriceInCents = Math.round(normalizedPriceInRupees * 100);

    if (!Number.isInteger(normalizedCapacity) || normalizedCapacity <= 0) {
      onMessage({
        type: "error",
        message: "Capacity must be a whole number greater than 0.",
      });
      setIsSaving(false);
      return;
    }

    if (Number.isNaN(normalizedPriceInRupees) || normalizedPriceInRupees < 0) {
      onMessage({
        type: "error",
        message: "Ticket price must be 0 or a positive value in rupees.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      location: formState.location,
      startDate: formState.startDate,
      endDate: formState.endDate,
      capacity: normalizedCapacity,
      priceInCents: normalizedPriceInCents,
      currency: "inr",
    };

    try {
      await axios.post(`${API_BASE}/api/admin/events`, payload, {
        withCredentials: true,
      });

      setFormState(initialEventForm);
      onMessage({ type: "success", message: "Event created." });
      await onRefresh();
    } catch (error) {
      onMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to create event.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setIsDeletingId(eventId);
    try {
      await axios.delete(`${API_BASE}/api/admin/events/${eventId}`, {
        withCredentials: true,
      });
      onMessage({ type: "success", message: "Event deleted." });
      await onRefresh();
      if (selectedEventId === eventId) {
        setSelectedEventId("");
        setRegistrationUsers([]);
      }
    } catch (error) {
      onMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to delete event.",
      });
    } finally {
      setIsDeletingId("");
    }
  };

  const handleLoadRegistrations = async (eventId) => {
    setSelectedEventId(eventId);
    try {
      const response = await axios.get(
        `${API_BASE}/api/admin/events/${eventId}/registrations`,
        { withCredentials: true }
      );
      setRegistrationUsers(response.data?.users || []);
    } catch (error) {
      setRegistrationUsers([]);
      onMessage({
        type: "error",
        message: error.response?.data?.message || "Failed to fetch event registrations.",
      });
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Create Event</h2>
        <p className="mt-1 text-sm text-slate-600">
          Enter the event details. Capacity means maximum people. Price is in rupees.
        </p>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={handleCreateEvent}>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">Event Title</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Example: Tech Fest 2026"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">Location</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Example: Main Auditorium"
              value={formState.location}
              onChange={(event) => setFormState((prev) => ({ ...prev, location: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
            <span className="font-medium">Description</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Short description of the event"
              value={formState.description}
              onChange={(event) => setFormState((prev) => ({ ...prev, description: event.target.value }))}
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">Start Date and Time</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={formState.startDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, startDate: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">End Date and Time</span>
            <input
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              value={formState.endDate}
              onChange={(event) => setFormState((prev) => ({ ...prev, endDate: event.target.value }))}
              required
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">Capacity (Total People)</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Example: 150"
              value={formState.capacity}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, capacity: event.target.value.replace(/[^0-9]/g, "") }))
              }
              required
            />
          </label>
          <label className="space-y-1.5 text-sm text-slate-700">
            <span className="font-medium">Ticket Price (INR)</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="^\d*(\.\d{0,2})?$"
              className="w-full rounded-xl border border-slate-300 px-3 py-2"
              placeholder="Example: 499.00"
              value={formState.priceInRupees}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  priceInRupees: event.target.value.replace(/[^0-9.]/g, ""),
                }))
              }
            />
            <p className="text-xs text-slate-500">Users will see and pay this amount in rupees.</p>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? "Saving..." : "Create Event"}
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">All Events</h3>
          <div className="mt-4 space-y-3">
            {events.length === 0 ? (
              <p className="text-sm text-slate-600">No events available.</p>
            ) : (
              events.map((eventItem) => (
                <div key={String(eventItem._id)} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{eventItem.title}</p>
                  <p className="text-sm text-slate-600">
                    {formatMoney(eventItem.priceInCents, eventItem.currency)} | {eventItem.status}
                  </p>
                  <p className="text-sm text-slate-600">
                    Seats booked: {eventItem.seatsBooked}/{eventItem.capacity}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleLoadRegistrations(String(eventItem._id))}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      View Users
                    </button>
                    {eventItem.status !== "deleted" && (
                      <button
                        onClick={() => handleDeleteEvent(String(eventItem._id))}
                        disabled={isDeletingId === String(eventItem._id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-sm text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed"
                      >
                        {isDeletingId === String(eventItem._id) ? "Deleting..." : "Delete"}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">Registered User IDs</h3>
          <p className="mt-1 text-sm text-slate-600">
            {selectedEventId ? `Event: ${selectedEventId}` : "Select an event to inspect."}
          </p>
          <div className="mt-4 space-y-2">
            {registrationUsers.length === 0 ? (
              <p className="text-sm text-slate-600">No registered users loaded.</p>
            ) : (
              registrationUsers.map((user) => (
                <div key={String(user.userId)} className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="font-medium text-slate-900">{user.username}</p>
                  <p className="text-slate-700">{user.email}</p>
                  <p className="text-slate-600">User ID: {String(user.userId)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
