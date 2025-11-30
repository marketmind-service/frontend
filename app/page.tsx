"use client";

import { useState } from "react";

type SummaryResponse = {
  ticker: string;
  price: number;
  changePercent: number;
};

// ------------------------------
// 1. Lookup fetcher (client → Next API → lookup backend)
// ------------------------------
async function fetchLookup(ticker: string, period: string, interval: string) {
  const res = await fetch("/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, period, interval }),
  });

  const text = await res.text();

  if (!res.ok) {
    // Try to show the error JSON from the route
    try {
      const errJson = JSON.parse(text);
      throw new Error(
        errJson.error ||
          `Lookup failed (${errJson.source ?? "unknown"}): ${JSON.stringify(
            errJson
          )}`
      );
    } catch {
      throw new Error(`Lookup failed: ${res.status} – ${text.slice(0, 200)}`);
    }
  }

  return JSON.parse(text);
}


// ------------------------------
// 2. Main Page Component
// ------------------------------
export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ------------------------------
  // 3. Search handler
  // ------------------------------
  async function handleSearch() {
    if (!ticker) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const json = await fetchLookup(ticker, "1d", "5m");

      // Map lookup fields to your UI fields
      setData({
        ticker: json.symbol,
        price: json.lastPrice,
        changePercent: json.period_return_pct ?? 0,
      });
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
          Enter a ticker to fetch data from the lookup service.
        </p>
      </header>

      {/* Search bar */}
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

      {/* Errors */}
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

        {/* Results */}
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

            {/* Placeholders */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">SMA / EMA</h2>
              <p className="text-sm text-slate-400">
                Later: pull indicator data and render a chart.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">News & sentiment</h2>
              <p className="text-sm text-slate-400">
                Later: display news headlines from the news-sentiment service.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">Sector analysis</h2>
              <p className="text-sm text-slate-400">
                Later: show sector insights from the sector-analysis service.
              </p>
            </div>

          </div>
        )}
      </section>
    </main>
  );
}
