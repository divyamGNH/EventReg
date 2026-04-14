import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import UserEventsPanel from "./UserEventsPanel";
import AdminEventsPanel from "./AdminEventsPanel";

const API_BASE = "http://localhost:3000";

const Home = ({ user, setAuthUser }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [payments, setPayments] = useState([]);
  const [adminEvents, setAdminEvents] = useState([]);
  const [busyEventId, setBusyEventId] = useState("");
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const showMessage = (type, text) => {
    setMessage({ type, text });
  };

  const fetchUserData = async () => {
    const [eventsResponse, registrationsResponse, paymentsResponse] = await Promise.all([
      axios.get(`${API_BASE}/api/events`, { withCredentials: true }),
      axios.get(`${API_BASE}/api/events/my-registrations`, { withCredentials: true }),
      axios.get(`${API_BASE}/api/events/my-payments`, { withCredentials: true }),
    ]);

    setEvents(eventsResponse.data?.events || []);
    setRegistrations(registrationsResponse.data?.registrations || []);
    setPayments(paymentsResponse.data?.payments || []);
  };

  const fetchAdminData = async () => {
    const response = await axios.get(`${API_BASE}/api/admin/events`, {
      withCredentials: true,
    });
    setAdminEvents(response.data?.events || []);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchUserData();
      if (isAdmin) {
        await fetchAdminData();
      }
    } catch (error) {
      showMessage("error", error.response?.data?.message || "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const refreshAll = async () => {
    await loadData();
  };

  const bannerClass = useMemo(() => {
    if (message.type === "success") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }
    if (message.type === "error") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }
    return "";
  }, [message.type]);

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Logout failed:", error.response?.data || error.message);
    } finally {
      setAuthUser(null);
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_35%,#e2e8f0_100%)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Event Registration Platform</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Dashboard</h1>
              <p className="mt-2 text-sm text-slate-600">
                Logged in as <span className="font-medium text-slate-900">{user?.email}</span> ({user?.role})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={refreshAll}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {message.text && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${bannerClass}`}>{message.text}</div>
        )}

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            Loading dashboard...
          </div>
        ) : isAdmin ? (
          <AdminEventsPanel
            events={adminEvents}
            onRefresh={refreshAll}
            onMessage={({ type, message: text }) => showMessage(type, text)}
          />
        ) : (
          <UserEventsPanel
            events={events}
            registrations={registrations}
            payments={payments}
            busyEventId={busyEventId}
            onPaymentStart={(eventId) => {
              setBusyEventId(eventId);
              showMessage("", "");
            }}
            onPaymentDone={({ type, message: text }) => {
              setBusyEventId("");
              showMessage(type, text);
              refreshAll();
            }}
          />
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          Backend uses separate collections for users, events, registrations, payments, webhook logs, and admin logs.
        </div>
      </div>
    </div>
  );
};

export default Home;
