import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const TEST_ADMIN_EMAIL =
  import.meta.env.VITE_TEST_ADMIN_EMAIL || "admin@eventreg.com";
const TEST_ADMIN_PASSWORD =
  import.meta.env.VITE_TEST_ADMIN_PASSWORD || "admin12345";

function Login({ setAuthUser }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState("admin");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreparingTestAdmin, setIsPreparingTestAdmin] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/login`,
        { email, password },
        { withCredentials: true },
      );

      const loggedInUser = response.data?.user;
      setAuthUser(loggedInUser);
      navigate("/home");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to login right now. Please check your credentials and try again.";
      setErrorMessage(message);
      console.error(error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const useTestCredentials = async () => {
    setAuthMode("admin");
    setErrorMessage("");
    setIsPreparingTestAdmin(true);

    try {
      await axios.post(
        `${API_BASE}/api/auth/test-admin/ensure`,
        {},
        { withCredentials: true },
      );
      setEmail(TEST_ADMIN_EMAIL);
      setPassword(TEST_ADMIN_PASSWORD);
    } catch (error) {
      setEmail(TEST_ADMIN_EMAIL);
      setPassword(TEST_ADMIN_PASSWORD);
      setErrorMessage(
        error.response?.data?.message ||
          "Unable to prepare test admin automatically. Try manual admin credentials.",
      );
    } finally {
      setIsPreparingTestAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#efeff1] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center text-3xl font-semibold text-slate-800 transition hover:text-black"
        >
          <span className="mr-2">&larr;</span> EventReg
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-300 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-center text-4xl font-extrabold text-slate-900">
            Admin Authentication Page
          </h1>

          <div className="mt-6 grid overflow-hidden rounded-xl border border-dashed border-[#f05456] sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setAuthMode("admin")}
              className={`px-6 py-4 text-left transition ${
                authMode === "admin"
                  ? "bg-[#f05456] text-white"
                  : "bg-white text-slate-800"
              }`}
            >
              <p className="text-sm">01</p>
              <p className="text-2xl font-semibold">Verify Credentials</p>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("user")}
              className={`px-6 py-4 text-left transition ${
                authMode === "user"
                  ? "bg-[#f05456] text-white"
                  : "bg-white text-slate-800"
              }`}
            >
              <p className="text-sm">02</p>
              <p className="text-2xl font-semibold">Go to Dashboard!</p>
            </button>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-5">
            <div>
              <label htmlFor="email" className="block text-2xl text-slate-700">
                Enter your Registered Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder={
                  authMode === "admin"
                    ? "admin@eventreg.com"
                    : "you@example.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xl text-slate-900 outline-none transition focus:border-[#f05456] focus:bg-white"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-2xl text-slate-700"
              >
                Enter your Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xl text-slate-900 outline-none transition focus:border-[#f05456] focus:bg-white"
                required
              />
            </div>

            {errorMessage && (
              <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-lg text-rose-700">
                {errorMessage}
              </p>
            )}

            <p className="text-lg text-slate-600">
              You can designate yourself as an admin for testing by using test
              credentials.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#f05456] px-8 py-3 text-xl font-semibold text-white transition hover:bg-[#df4a4c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Verifying..." : "Verify"}
              </button>
              <button
                type="button"
                onClick={useTestCredentials}
                disabled={isPreparingTestAdmin}
                className="rounded-md bg-[#3f4b61] px-8 py-3 text-xl font-semibold text-white transition hover:bg-[#313b4d]"
              >
                {isPreparingTestAdmin ? "Preparing..." : "Use Test Credentials"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-lg text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-[#f05456] hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
