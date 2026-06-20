import { useState } from "react";
import { LogIn } from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function SignIn() {
  const { login } = useAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to sign in with those credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-mist md:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-6 py-10 md:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <p className="text-sm font-semibold uppercase tracking-normal text-pine">Employee Tracker</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">Sign in to your people workspace</h1>
          <p className="mt-3 text-sm leading-6 text-ink/65">
            Manage employees, payroll records, and leave approvals from a clean operational dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-lg border border-line bg-white p-5 shadow-soft">
            {error && <div className="rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</div>}
            <label className="block">
              <span className="text-sm font-medium text-ink/70">Username</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-ink/70">Password</span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                className="focus-ring mt-1 w-full rounded-md border border-line px-3 py-2"
                required
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-md bg-pine px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogIn size={18} />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </section>
      <section className="hidden bg-ink p-8 text-white md:flex md:items-end">
        <div>
          <p className="text-sm uppercase tracking-normal text-white/55">Default admin</p>
          <p className="mt-2 text-2xl font-semibold">admin / admin123</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/65">
            Credentials are seeded with bcrypt hashing on backend startup and can be replaced when RBAC is added.
          </p>
        </div>
      </section>
    </main>
  );
}
