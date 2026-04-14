import { useMemo, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=900&q=80";

const formatMoney = (amountInCents, currency = "inr") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format((amountInCents || 0) / 100);

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString();
};

export default function UserEventsPanel({
  events,
  registrations,
  payments,
  onPaymentStart,
  onPaymentDone,
  busyEventId,
}) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const rupeePrices = useMemo(
    () =>
      events.map((entry) =>
        Math.max(Math.round((entry.priceInCents || 0) / 100), 0),
      ),
    [events],
  );
  const maxPriceRupees = useMemo(
    () => Math.max(...rupeePrices, 1000),
    [rupeePrices],
  );
  const [priceRupees, setPriceRupees] = useState(1000);
  const effectivePriceRupees = Math.min(priceRupees, maxPriceRupees);

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          events
            .map((entry) => String(entry.category || "General").trim())
            .values(),
        ),
      ).filter(Boolean),
    [events],
  );

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

  const filteredEvents = useMemo(() => {
    return events.filter((eventItem) => {
      const title = String(eventItem.title || "").toLowerCase();
      const description = String(eventItem.description || "").toLowerCase();
      const keywordValue = keyword.trim().toLowerCase();
      const eventCategory = String(eventItem.category || "General").trim();
      const priceInRupees = Math.round((eventItem.priceInCents || 0) / 100);

      if (
        keywordValue &&
        !title.includes(keywordValue) &&
        !description.includes(keywordValue)
      ) {
        return false;
      }

      if (category && eventCategory !== category) {
        return false;
      }

      if (dateFilter) {
        const eventDate = new Date(eventItem.startDate);
        const selected = new Date(`${dateFilter}T00:00:00`);
        const selectedEnd = new Date(`${dateFilter}T23:59:59`);
        if (eventDate < selected || eventDate > selectedEnd) {
          return false;
        }
      }

      if (priceInRupees > effectivePriceRupees) {
        return false;
      }

      return true;
    });
  }, [events, keyword, category, dateFilter, effectivePriceRupees]);

  const handleCheckout = async (eventId) => {
    onPaymentStart(eventId);
    try {
      const response = await axios.post(
        `${API_BASE}/api/payments/events/${eventId}/checkout`,
        {},
        { withCredentials: true },
      );

      if (response.data?.alreadyRegistered) {
        onPaymentDone({
          type: "success",
          message: response.data.message || "Already registered.",
        });
        return;
      }

      if (response.data?.url) {
        window.location.href = response.data.url;
        return;
      }

      onPaymentDone({
        type: "error",
        message: "Unable to start checkout for this event.",
      });
    } catch (error) {
      onPaymentDone({
        type: "error",
        message: error.response?.data?.error || "Checkout failed.",
      });
    }
  };

  const clearFilters = () => {
    setKeyword("");
    setCategory("");
    setDateFilter("");
    setPriceRupees(maxPriceRupees);
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900">Filter Options</h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Keyword
              </label>
              <input
                type="text"
                placeholder="Search by keyword..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm outline-none transition focus:border-[#f05456] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Category
              </label>
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm outline-none transition focus:border-[#f05456] focus:bg-white"
              >
                <option value="">Select a category...</option>
                {categoryOptions.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Date Range
              </label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-sm outline-none transition focus:border-[#f05456] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700">
                Price
              </label>
              <input
                type="range"
                min={0}
                max={maxPriceRupees}
                value={effectivePriceRupees}
                onChange={(event) => setPriceRupees(Number(event.target.value))}
                className="mt-1 w-full accent-[#f05456]"
              />
              <p className="text-sm text-slate-700">
                ₹0 - ₹{effectivePriceRupees}
              </p>
            </div>

            <button
              onClick={clearFilters}
              className="w-full rounded-lg bg-[#3f4b61] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#313b4d]"
            >
              Clear Filters
            </button>
          </div>
        </aside>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">Events</h2>
            <p className="text-sm text-slate-600">
              Showing {filteredEvents.length} event(s)
            </p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
              No events match your filters.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEvents.map((eventItem) => {
                const eventId = String(eventItem._id);
                const status = registrationMap.get(eventId) || "not_registered";
                const soldOut = eventItem.availableSeats <= 0;
                const isRegistered = status === "registered";
                const isPending = status === "pending_payment";

                return (
                  <article
                    key={eventId}
                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                  >
                    <img
                      src={eventItem.imageUrl || FALLBACK_POSTER}
                      alt={eventItem.title}
                      className="h-64 w-full object-cover"
                      onError={(event) => {
                        event.currentTarget.src = FALLBACK_POSTER;
                      }}
                    />

                    <div className="space-y-2 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#f05456]">
                        {eventItem.category || "General"}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900">
                        {eventItem.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-slate-600">
                        {eventItem.description || "No description."}
                      </p>

                      <div className="text-sm text-slate-700">
                        <p>People: {eventItem.capacity}</p>
                        <p>
                          Date:{" "}
                          {new Date(eventItem.startDate).toLocaleDateString(
                            "en-GB",
                          )}
                        </p>
                        <p className="font-semibold text-slate-900">
                          {formatMoney(
                            eventItem.priceInCents,
                            eventItem.currency,
                          )}
                        </p>
                      </div>

                      <div className="pt-2">
                        {isRegistered ? (
                          <span className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                            Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => handleCheckout(eventId)}
                            disabled={soldOut || busyEventId === eventId}
                            className="w-full rounded-lg bg-[#f05456] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df4a4c] disabled:cursor-not-allowed disabled:bg-slate-400"
                          >
                            {busyEventId === eventId
                              ? "Redirecting..."
                              : soldOut
                                ? "Sold Out"
                                : isPending
                                  ? "Complete Payment"
                                  : "Register & Pay"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">
            My Registrations
          </h3>
          <div className="mt-4 space-y-3">
            {registrations.length === 0 ? (
              <p className="text-sm text-slate-600">No registrations yet.</p>
            ) : (
              registrations.map((entry) => (
                <div
                  key={String(entry.registrationId)}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="font-medium text-slate-900">
                    {entry.event?.title || "Unknown event"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Status: {entry.status}
                  </p>
                  <p className="text-sm text-slate-600">
                    Paid at: {formatDate(entry.paidAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">My Payments</h3>
          <div className="mt-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-600">
                No payments recorded yet.
              </p>
            ) : (
              payments.map((entry) => (
                <div
                  key={String(entry._id)}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="font-medium text-slate-900">
                    {entry.eventId?.title || "Unknown event"}
                  </p>
                  <p className="text-sm text-slate-600">
                    Amount: {formatMoney(entry.amountInCents, entry.currency)}
                  </p>
                  <p className="text-sm text-slate-600">
                    Status: {entry.status}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
