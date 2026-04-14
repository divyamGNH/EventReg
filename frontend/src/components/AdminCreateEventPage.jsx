import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const initialEventForm = {
  title: "",
  description: "",
  category: "General",
  location: "",
  imageUrl: "",
  startDate: "",
  endDate: "",
  capacity: "",
  priceInRupees: "",
};

export default function AdminCreateEventPage() {
  const [formState, setFormState] = useState(initialEventForm);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setMessage({ type: "", text: "" });
    setIsSaving(true);

    const normalizedCapacity = Number(formState.capacity);
    const normalizedPriceInRupees = Number(formState.priceInRupees || 0);

    if (!Number.isInteger(normalizedCapacity) || normalizedCapacity <= 0) {
      setMessage({
        type: "error",
        text: "Capacity must be a whole number greater than 0.",
      });
      setIsSaving(false);
      return;
    }

    if (Number.isNaN(normalizedPriceInRupees) || normalizedPriceInRupees < 0) {
      setMessage({
        type: "error",
        text: "Ticket base price must be 0 or a positive value in rupees.",
      });
      setIsSaving(false);
      return;
    }

    const payload = {
      title: formState.title,
      description: formState.description,
      category: formState.category,
      location: formState.location,
      imageUrl: formState.imageUrl,
      startDate: formState.startDate,
      endDate: formState.endDate,
      capacity: normalizedCapacity,
      priceInCents: Math.round(normalizedPriceInRupees * 100),
      currency: "inr",
    };

    try {
      await axios.post(`${API_BASE}/api/admin/events`, payload, {
        withCredentials: true,
      });
      setMessage({
        type: "success",
        text: "Event created. VIP tier will be automatically 2x at checkout.",
      });
      setFormState(initialEventForm);
      setTimeout(() => navigate("/dashboard/admin/events"), 700);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create event.",
      });
    } finally {
      setIsSaving(false);
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
      <h2 className="text-2xl font-bold text-slate-900">Create Event</h2>
      <p className="mt-1 text-sm text-slate-600">
        Set base ticket price once. VIP is automatically 2x base price.
      </p>

      {message.text && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${bannerClass}`}
        >
          {message.text}
        </div>
      )}

      <form
        className="mt-4 grid gap-3 md:grid-cols-2"
        onSubmit={handleCreateEvent}
      >
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Event Title</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.title}
            onChange={(e) =>
              setFormState((p) => ({ ...p, title: e.target.value }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Category</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.category}
            onChange={(e) =>
              setFormState((p) => ({ ...p, category: e.target.value }))
            }
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Location</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.location}
            onChange={(e) =>
              setFormState((p) => ({ ...p, location: e.target.value }))
            }
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">Poster Image URL</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.imageUrl}
            onChange={(e) =>
              setFormState((p) => ({ ...p, imageUrl: e.target.value }))
            }
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700 md:col-span-2">
          <span className="font-medium">Description</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.description}
            onChange={(e) =>
              setFormState((p) => ({ ...p, description: e.target.value }))
            }
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Start Date and Time</span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.startDate}
            onChange={(e) =>
              setFormState((p) => ({ ...p, startDate: e.target.value }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">End Date and Time</span>
          <input
            type="datetime-local"
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.endDate}
            onChange={(e) =>
              setFormState((p) => ({ ...p, endDate: e.target.value }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Capacity</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.capacity}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                capacity: e.target.value.replace(/[^0-9]/g, ""),
              }))
            }
            required
          />
        </label>
        <label className="space-y-1.5 text-sm text-slate-700">
          <span className="font-medium">Base Price (INR)</span>
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            value={formState.priceInRupees}
            onChange={(e) =>
              setFormState((p) => ({
                ...p,
                priceInRupees: e.target.value.replace(/[^0-9.]/g, ""),
              }))
            }
          />
        </label>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-md bg-[#f05456] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df4a4c] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? "Saving..." : "Create Event"}
          </button>
        </div>
      </form>
    </section>
  );
}
