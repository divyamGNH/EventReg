import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function Register({ setAuthUser }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_BASE}/api/auth/register`,
        { username, email, password },
        { withCredentials: true },
      );

      setAuthUser(response.data?.user || null);
      navigate("/home");
    } catch (error) {
      const message =
        error.response?.data?.message ||
        (error.request
          ? "Unable to reach server. Check backend is running and CORS/API URL settings."
          : "Unable to create account right now. Please try again.");
      setErrorMessage(message);
      console.error(error.response?.data || error.message);
    } finally {
      setIsSubmitting(false);
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
            Create Your Account
          </h1>
          <p className="mt-2 text-center text-xl text-slate-600">
            Join EventReg and start managing registrations with a cleaner
            workflow.
          </p>

          <form
            onSubmit={handleRegister}
            className="mx-auto mt-8 grid max-w-3xl gap-5"
          >
            <div>
              <label
                htmlFor="username"
                className="block text-2xl text-slate-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-xl text-slate-900 outline-none transition focus:border-[#f05456] focus:bg-white"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-2xl text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
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
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 8 characters"
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

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-[#f05456] px-8 py-3 text-xl font-semibold text-white transition hover:bg-[#df4a4c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </button>
              <Link
                to="/login"
                className="rounded-md bg-[#3f4b61] px-8 py-3 text-xl font-semibold text-white transition hover:bg-[#313b4d]"
              >
                I Have an Account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
