import { useMemo } from "react";
import axios from "axios";

const API_BASE = "http://localhost:3000";

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
  const registrationMap = useMemo(
    () =>
      new Map(
        registrations.map((entry) => [
          String(entry.event?._id || entry.eventId),
          entry.status,
        ])
      ),
    [registrations]
  );

  const handleCheckout = async (eventId) => {
    onPaymentStart(eventId);
    try {
      const response = await axios.post(
        `${API_BASE}/api/payments/events/${eventId}/checkout`,
        {},
        { withCredentials: true }
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

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Available Events</h2>
          <p className="text-sm text-slate-600">One payment per event.</p>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No active events right now.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {events.map((eventItem) => {
              const eventId = String(eventItem._id);
              const status = registrationMap.get(eventId) || "not_registered";
              const soldOut = eventItem.availableSeats <= 0;
              const isRegistered = status === "registered";
              const isPending = status === "pending_payment";

              return (
                <article
                  key={eventId}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-lg font-semibold text-slate-900">{eventItem.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{eventItem.description || "No description."}</p>

                  <dl className="mt-4 space-y-1 text-sm text-slate-700">
                    <div className="flex justify-between gap-3">
                      <dt>Location</dt>
                      <dd>{eventItem.location}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Starts</dt>
                      <dd>{formatDate(eventItem.startDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Price</dt>
                      <dd>{formatMoney(eventItem.priceInCents, eventItem.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Seats left</dt>
                      <dd>{eventItem.availableSeats}</dd>
                    </div>
                  </dl>

                  <div className="mt-5">
                    {isRegistered ? (
                      <span className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                        Registered
                      </span>
                    ) : (
                      <button
                        onClick={() => handleCheckout(eventId)}
                        disabled={soldOut || busyEventId === eventId}
                        className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
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
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">My Registrations</h3>
          <div className="mt-4 space-y-3">
            {registrations.length === 0 ? (
              <p className="text-sm text-slate-600">No registrations yet.</p>
            ) : (
              registrations.map((entry) => (
                <div key={String(entry.registrationId)} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{entry.event?.title || "Unknown event"}</p>
                  <p className="text-sm text-slate-600">Status: {entry.status}</p>
                  <p className="text-sm text-slate-600">Paid at: {formatDate(entry.paidAt)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900">My Payments</h3>
          <div className="mt-4 space-y-3">
            {payments.length === 0 ? (
              <p className="text-sm text-slate-600">No payments recorded yet.</p>
            ) : (
              payments.map((entry) => (
                <div key={String(entry._id)} className="rounded-xl border border-slate-200 p-3">
                  <p className="font-medium text-slate-900">{entry.eventId?.title || "Unknown event"}</p>
                  <p className="text-sm text-slate-600">
                    Amount: {formatMoney(entry.amountInCents, entry.currency)}
                  </p>
                  <p className="text-sm text-slate-600">Status: {entry.status}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
