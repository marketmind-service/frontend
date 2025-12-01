"use client";

import { useState } from "react";
import Link from "next/link";

type LookupResponse = {
  symbol?: string;
  shortName?: string;
  lastPrice?: number;
  period_return_pct?: number;
  period?: string;
  interval?: string;
};

const PERIOD_OPTIONS = ["1d", "5d", "1mo", "6mo", "1y", "5y", "max"];
const INTERVAL_OPTIONS = ["1m", "5m", "15m", "1d"];

export default function LookupPage() {
  const [ticker, setTicker] = useState("");
  const [period, setPeriod] = useState("1d");
  const [interval, setInterval] = useState("5m");
  const [data, setData] = useState<LookupResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup() {
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticker: cleaned,
          period,
          interval,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        // try to parse error payload if backend sends JSON
        try {
          const errJson = JSON.parse(text);
          throw new Error(
            errJson.error ||
              errJson.detail ||
              `Lookup failed (${errJson.source ?? "unknown"})`
          );
        } catch {
          throw new Error(
            `Lookup failed: ${res.status} – ${text.slice(0, 200)}`
          );
        }
      }

      const json = JSON.parse(text) as LookupResponse;
      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-6 md:py-8 space-y-6">
        {/* Top bar */}
        <header className="flex items-center justify-between mb-2">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-sky-300 transition-colors"
          >
            ← Back to MarketMind
          </Link>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight">
            Stock Lookup
          </h1>
        </header>

        {/* Controls */}
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Ticker / Company
            </label>
            <input
              className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
              placeholder="e.g. AAPL, MSFT, NVDA"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLookup();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Period
              </label>
              <select
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                {PERIOD_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Interval
              </label>
              <select
                className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
              >
                {INTERVAL_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleLookup}
              disabled={!ticker.trim() || loading}
              className="rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Run Lookup"}
            </button>
          </div>
        </section>

        {/* Result / error */}
        <section className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {!error && !data && !loading && (
            <p className="text-xs text-slate-500">
              Enter a ticker, choose a period and interval, then click{" "}
              <span className="font-semibold">Run Lookup</span> to see the
              lookup microservice response.
            </p>
          )}

          {data && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-sm">
              <div>
                <h2 className="text-base font-semibold mb-1">
                  {data.shortName ?? data.symbol ?? "Result"}
                </h2>
                <p className="text-slate-400 text-xs">
                  Symbol:{" "}
                  <span className="text-slate-100 font-mono">
                    {data.symbol ?? "N/A"}
                  </span>
                </p>
              </div>

              <div className="flex items-baseline gap-4">
                <div>
                  <div className="text-2xl font-bold">
                    {data.lastPrice != null ? `$${data.lastPrice}` : "—"}
                  </div>
                  {data.period_return_pct != null && (
                    <div
                      className={
                        "text-sm mt-1 " +
                        (data.period_return_pct >= 0
                          ? "text-emerald-400"
                          : "text-rose-400")
                      }
                    >
                      {data.period_return_pct >= 0 ? "+" : ""}
                      {data.period_return_pct.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                <p>
                  Period:{" "}
                  <span className="text-slate-100">
                    {data.period ?? period}
                  </span>{" "}
                  • Interval:{" "}
                  <span className="text-slate-100">
                    {data.interval ?? interval}
                  </span>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
