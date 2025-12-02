"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/app/auth/supabaseClient";

type WatchItem = {
  id: number;
  symbol: string;
  name: string;
  targetPrice?: number;
  notes?: string;
};

export default function WatchlistPage() {
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [targetPrice, setTargetPrice] = useState<string>("");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState<WatchItem[]>([
    // Mock starter data – replace with real data later
    { id: 1, symbol: "NVDA", name: "NVIDIA Corp", targetPrice: 130 },
    { id: 2, symbol: "TSLA", name: "Tesla Inc", targetPrice: 230 },
  ]);

  // --- Auth check ---
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoadingUser(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSymbol = symbol.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedSymbol) return;

    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        symbol: trimmedSymbol,
        name: trimmedName || trimmedSymbol,
        targetPrice: targetPrice ? Number(targetPrice) : undefined,
        notes: notes.trim() || undefined,
      },
    ]);

    setSymbol("");
    setName("");
    setTargetPrice("");
    setNotes("");
  }

  function handleRemove(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <p className="text-sm text-slate-400">Checking your session…</p>
      </main>
    );
  }

  // --- Not logged in state ---
  if (!user) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 text-center">
          <h1 className="text-xl font-semibold">Watchlist</h1>
          <p className="text-sm text-slate-400">
            Please{" "}
            <Link href="/login" className="text-sky-400 hover:text-sky-300">
              log in
            </Link>{" "}
            or{" "}
            <Link href="/signup" className="text-sky-400 hover:text-sky-300">
              create an account
            </Link>{" "}
            to access your watchlist.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-600 hover:border-sky-400 px-4 py-2 text-xs font-medium"
          >
            ← Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  // --- Logged in view ---
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-sky-300 inline-flex items-center gap-1"
            >
              ← Back to dashboard
            </Link>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Watchlist
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Signed in as <span className="text-sky-300">{user.email}</span>.  
              Track tickers you&apos;re monitoring and set simple targets.
            </p>
          </div>
        </div>

        {/* Add form */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-4">
          <h2 className="text-sm font-semibold">Add to watchlist</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs md:text-sm">
            <div className="space-y-1">
              <label className="block text-slate-400">Symbol</label>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="e.g., NVDA"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400">Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Company name"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-slate-400">Target price (optional)</label>
              <input
                type="number"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="e.g., 250"
                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-sky-400"
              />
            </div>
            <div className="space-y-1 md:col-span-1">
              <label className="block text-slate-400">Notes (optional)</label>
              <div className="flex gap-2">
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Short note"
                  className="flex-1 rounded-lg bg-slate-950 border border-slate-700 px-3 py-2 outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-semibold whitespace-nowrap"
                >
                  Add
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Watchlist table */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold">Your tickers</h2>
            <span className="text-xs text-slate-500">
              {items.length} {items.length === 1 ? "ticker" : "tickers"}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="px-4 py-6 text-sm text-slate-400">
              Your watchlist is empty. Add a symbol above to get started.
            </div>
          ) : (
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-900">
                <tr className="text-left text-slate-400">
                  <th className="px-4 py-2">Symbol</th>
                  <th className="px-4 py-2">Name</th>
                  <th className="px-4 py-2 text-right">Target</th>
                  <th className="px-4 py-2">Notes</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-800">
                    <td className="px-4 py-2 text-sky-300 font-medium">
                      {item.symbol}
                    </td>
                    <td className="px-4 py-2 text-slate-100 truncate">
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-right text-slate-100">
                      {item.targetPrice !== undefined ? `$${item.targetPrice.toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-2 text-slate-300 max-w-[200px] truncate">
                      {item.notes ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-xs text-rose-400 hover:text-rose-300"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </main>
  );
}
