import { Link } from "react-router-dom";

const Home = () => {
  return (
    <div className="min-h-screen bg-[#efeff1] text-slate-900">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-end px-6 pt-8">
        <Link
          to="/login"
          className="rounded-md bg-[#f05456] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df4a4c]"
        >
          Event Manager
        </Link>
      </div>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 pb-24 pt-16 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight text-[#f05456] sm:text-7xl">
          &lt;EventReg <span className="text-black">/&gt;</span>
        </h1>
        <h2 className="mt-3 text-4xl font-extrabold text-slate-600 sm:text-5xl">
          Event Management
        </h2>
        <p className="mt-5 max-w-3xl text-2xl leading-relaxed text-slate-500">
          Bringing your events to life with simplified registration, seamless
          management, and easy ticketing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/login"
            className="rounded-md bg-[#f05456] px-10 py-3 text-xl font-semibold text-white transition hover:bg-[#df4a4c]"
          >
            Signin
          </Link>
          <Link
            to="/register"
            className="rounded-md bg-[#3f4b61] px-10 py-3 text-xl font-semibold text-white transition hover:bg-[#313b4d]"
          >
            Signup
          </Link>
        </div>

        <div className="mt-24 h-px w-full bg-slate-400/70" />
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-28 md:grid-cols-2 md:items-center">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#f05456]">
            More speed. High efficiency
          </h3>
          <h4 className="mt-2 text-5xl font-black leading-tight text-slate-900">
            Keep events on schedule
          </h4>
          <p className="mt-5 text-xl leading-relaxed text-slate-600">
            Plan and publish events with flexible ticketing, monitor
            registrations in real time, and keep admin workflows clear.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-[0_20px_60px_-35px_rgba(2,6,23,0.4)]">
          <img
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=80"
            alt="Event dashboard preview"
            className="h-full w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
};

export default Home;
