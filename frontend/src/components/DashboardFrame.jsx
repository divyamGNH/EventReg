import axios from "axios";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

const navBase = "rounded-md px-4 py-2 text-sm font-semibold transition";

export default function DashboardFrame({ user, setAuthUser }) {
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_BASE}/api/auth/logout`,
        {},
        { withCredentials: true },
      );
    } catch {
      // no-op
    } finally {
      setAuthUser(null);
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#efeff1] px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                EventReg Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                {isAdmin ? "Admin Workspace" : "User Workspace"}
              </h1>
              <p className="text-sm text-slate-600">
                {user?.username || "User"} | {user?.email} | {user?.role}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NavLink
                to="/"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Landing
              </NavLink>
              <button
                onClick={handleLogout}
                className="rounded-md bg-[#f05456] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#df4a4c]"
              >
                Logout
              </button>
            </div>
          </div>

          <nav className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
            {!isAdmin && (
              <>
                <NavLink
                  to="/dashboard/events"
                  className={({ isActive }) =>
                    `${navBase} ${isActive ? "bg-[#f05456] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
                  }
                >
                  Browse Events
                </NavLink>
                <NavLink
                  to="/dashboard/registrations"
                  className={({ isActive }) =>
                    `${navBase} ${isActive ? "bg-[#f05456] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
                  }
                >
                  My Registrations
                </NavLink>
                <NavLink
                  to="/dashboard/payments"
                  className={({ isActive }) =>
                    `${navBase} ${isActive ? "bg-[#f05456] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
                  }
                >
                  Payment History
                </NavLink>
              </>
            )}

            {isAdmin && (
              <>
                <NavLink
                  to="/dashboard/admin/events"
                  className={({ isActive }) =>
                    `${navBase} ${isActive ? "bg-[#f05456] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
                  }
                >
                  Manage Events
                </NavLink>
                <NavLink
                  to="/dashboard/admin/events/new"
                  className={({ isActive }) =>
                    `${navBase} ${isActive ? "bg-[#f05456] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`
                  }
                >
                  Create Event
                </NavLink>
              </>
            )}
          </nav>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
