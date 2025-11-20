"use client";

import { useState } from "react";

type SummaryResponse = {
  ticker: string;
  price: number;
  changePercent: number;
  // add more fields when you know your router response shape
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!ticker || !API_BASE) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/summary?ticker=${encodeURIComponent(ticker)}`
      );
      if (!res.ok) throw new Error("Request failed");
      const json = (await res.json()) as SummaryResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-8 gap-8">
      <header className="w-full max-w-5xl flex flex-col gap-2">
        <h1 className="text-3xl font-bold">MarketMind Dashboard</h1>
        <p className="text-sm text-slate-400">
          Enter a ticker to fetch combined data from the router service on Azure.
        </p>
      </header>

      <section className="w-full max-w-5xl flex gap-3">
        <input
          className="flex-1 rounded-md bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
          placeholder="e.g. AAPL, MSFT, TSLA"
          value={ticker}
          onChange={(e) => setTicker(e.target.value.toUpperCase())}
        />
        <button
          onClick={handleSearch}
          className="rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
          disabled={!ticker || loading}
        >
          {loading ? "Loading…" : "Search"}
        </button>
      </section>

      <section className="w-full max-w-5xl">
        {error && (
          <div className="mb-4 rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && !data && (
          <p className="text-slate-400 text-sm">
            No ticker selected yet. Try searching for one.
          </p>
        )}

        {data && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Summary card */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">
                {data.ticker} overview
              </h2>
              <p className="text-2xl font-bold">${data.price}</p>
              <p
                className={
                  "mt-1 text-sm " +
                  (data.changePercent >= 0
                    ? "text-emerald-400"
                    : "text-rose-400")
                }
              >
                {data.changePercent >= 0 ? "▲" : "▼"} {data.changePercent}%
                today
              </p>
            </div>

            {/* Placeholders for other services */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">SMA / EMA</h2>
              <p className="text-sm text-slate-400">
                Later: call router endpoint for indicators and render a chart.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">News & sentiment</h2>
              <p className="text-sm text-slate-400">
                Later: show headlines from the news-sentiment service.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">Sector analysis</h2>
              <p className="text-sm text-slate-400">
                Later: show sector trends from the sector-analysis service.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
