import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80";

const formatMoney = (amountInCents, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountInCents || 0) / 100);

const getTierPrice = (baseAmount, tier) =>
  Math.round((baseAmount || 0) * (tier === "vip" ? 2 : 1));

export default function UserEventsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [busyEventId, setBusyEventId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [ticketTierMap, setTicketTierMap] = useState({});

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");

  const registrationMap = useMemo(
    () =>
      new Map(
        registrations.map((entry) => [
          String(entry.event?._id || entry.eventId),
          entry.status,
        ]),
      ),
    [registrations],
  );

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          events.map((entry) => String(entry.category || "General").trim()),
        ),
      ).filter(Boolean),
    [events],
  );

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      const key = keyword.trim().toLowerCase();
      const title = String(eventItem.title || "").toLowerCase();
      const description = String(eventItem.description || "").toLowerCase();
      const eventCategory = String(eventItem.category || "General").trim();

      if (key && !title.includes(key) && !description.includes(key))
        return false;
      if (category && eventCategory !== category) return false;
      return true;
    });
  }, [events, keyword, category]);

  const load = async () => {
    const [eventsResponse, registrationsResponse] = await Promise.all([
      axios.get(`${API_BASE}/api/events`, { withCredentials: true }),
      axios.get(`${API_BASE}/api/events/my-registrations`, {
        withCredentials: true,
      }),
    ]);

    setEvents(eventsResponse.data?.events || []);
    setRegistrations(registrationsResponse.data?.registrations || []);
  };

  useEffect(() => {
    load().catch(() =>
      setMessage({ type: "error", text: "Failed to load events." }),
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const payment = params.get("payment");
    const sessionId = params.get("session_id");

    if (payment === "cancel") {
      setMessage({
        type: "error",
        text: "Payment canceled. You can retry checkout.",
      });
      navigate("/dashboard/events", { replace: true });
      return;
    }

    if (payment !== "success") return;

    if (!sessionId) {
      setMessage({
        type: "success",
        text: "Payment received. Refreshing your registration status...",
      });
      load().catch(() => undefined);
      return;
    }

    const syncStatus = async () => {
      try {
        await axios.get(
          `${API_BASE}/api/payments/checkout-status/${sessionId}`,
          { withCredentials: true },
        );
        await load();
        setMessage({
          type: "success",
          text: "Payment confirmed. Registration updated.",
        });
      } catch (error) {
        setMessage({
          type: "error",
          text:
            error.response?.data?.error || "Unable to confirm payment status.",
        });
      } finally {
        navigate("/dashboard/events", { replace: true });
      }
    };

    syncStatus();
  }, [location.search, navigate]);

  const handleCheckout = async (eventId) => {
    const tier = ticketTierMap[eventId] || "standard";
    setBusyEventId(eventId);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post(
        `${API_BASE}/api/payments/events/${eventId}/checkout`,
        { ticketTier: tier },
        { withCredentials: true },
      );

      if (response.data?.alreadyRegistered) {
        await load();
        setMessage({
          type: "success",
          text: response.data.message || "Already registered.",
        });
        return;
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      setMessage({
        type: "error",
        text: "Unable to start checkout for this event.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Checkout failed.",
      });
    } finally {
      setBusyEventId("");
    }
  };

  const bannerClass =
    message.type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : message.type === "error"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "";

  return (
    <div className="space-y-6">
      {message.text && (
        <div className={`rounded-xl border px-4 py-3 text-sm ${bannerClass}`}>
          {message.text}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Filter</h2>
          <div className="mt-4 space-y-4">
            <input
              type="text"
              placeholder="Search by keyword..."
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm outline-none transition focus:border-[#f05456] focus:bg-white"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm outline-none transition focus:border-[#f05456] focus:bg-white"
            >
              <option value="">All categories</option>
              {categoryOptions.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>
        </aside>

        <section>
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Available Events
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((eventItem) => {
              const eventId = String(eventItem._id);
              const status = registrationMap.get(eventId) || "not_registered";
              const isRegistered = status === "registered";
              const soldOut = eventItem.availableSeats <= 0;
              const selectedTier = ticketTierMap[eventId] || "standard";
              const ticketAmount = getTierPrice(
                eventItem.priceInCents,
                selectedTier,
              );

              return (
                <article
                  key={eventId}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={eventItem.imageUrl || FALLBACK_POSTER}
                    alt={eventItem.title}
                    className="h-56 w-full object-cover"
                    onError={(event) => {
                      event.currentTarget.src = FALLBACK_POSTER;
                    }}
                  />

                  <div className="space-y-3 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#f05456]">
                      {eventItem.category || "General"}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900">
                      {eventItem.title}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {eventItem.description || "No description"}
                    </p>

                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      <p>Location: {eventItem.location || "-"}</p>
                      <p>
                        Date:{" "}
                        {new Date(eventItem.startDate).toLocaleDateString(
                          "en-GB",
                        )}
                      </p>
                      <p>Seats left: {eventItem.availableSeats}</p>
                    </div>

                    {!isRegistered && (
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700">
                          Ticket Tier
                        </label>
                        <select
                          value={selectedTier}
                          onChange={(event) =>
                            setTicketTierMap((prev) => ({
                              ...prev,
                              [eventId]: event.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-sm outline-none transition focus:border-[#f05456]"
                        >
                          <option value="standard">Standard</option>
                          <option value="vip">VIP (2x price)</option>
                        </select>
                        <p className="text-sm font-semibold text-slate-900">
                          Pay: {formatMoney(ticketAmount, eventItem.currency)}
                        </p>
                      </div>
                    )}

                    <div>
                      {isRegistered ? (
                        <span className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                          Registered
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckout(eventId)}
                          disabled={busyEventId === eventId || soldOut}
                          className="w-full rounded-lg bg-[#f05456] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df4a4c] disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {busyEventId === eventId
                            ? "Redirecting..."
                            : soldOut
                              ? "Sold Out"
                              : "Register & Pay"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    </div>
  );
}
