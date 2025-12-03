"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/auth/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }


    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-950/90 backdrop-blur text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">Log in to MarketMind</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-300">Email</label>
            <input
              type="email"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-1 text-sm">
            <label className="block text-slate-300">Password</label>
            <input
              type="password"
              required
              className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="rounded-md border border-rose-500 bg-rose-950/40 px-3 py-2 text-xs text-rose-100">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold py-2 disabled:opacity-50"
          >
            {loading ? "Logging you in…" : "Log In"}
          </button>
        </form>

        <p className="text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-sky-400 hover:text-sky-300">
            Sign up
          </Link>
        </p>

        <p className="text-xs text-slate-500">
          <Link href="/" className="hover:text-sky-300">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </main>
  );
}
