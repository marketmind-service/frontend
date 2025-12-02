"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// Shape of each OHLCV row in tail_ohlcv coming from the backend
type TailOhlcvRow = {
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
  "Adj Close"?: number;
  Volume?: number;
};

// What FastAPI /api/bridge_url returns (LookupState)
type LookupResponse = {
  // request metadata
  company?: string;
  period?: string;
  interval?: string;
  error?: string | null;

  // main fields we show
  symbol?: string;
  shortName?: string;
  lastPrice?: number;
  period_return_pct?: number;

  // tail OHLCV block
  tail_ohlcv?: Record<string, TailOhlcvRow> | null;
};

type PricePoint = {
  time: string;
  close: number;
};

type StockSuggestion = {
  symbol: string;
  name: string;
  type: string;
};

const PERIOD_OPTIONS = ["1d", "5d", "1mo", "6mo", "1y", "5y", "max"];
const INTERVAL_OPTIONS = ["1m", "5m", "15m", "1d"];

// Simple hard-coded trending list for the empty state
const TRENDING_STOCKS: StockSuggestion[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "Stock" },
  { symbol: "META", name: "Meta Platforms, Inc.", type: "Stock" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "Stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "Stock" },
];

// Convert tail_ohlcv dict into a sorted array of { time, close }
function buildChartData(
  tail: Record<string, TailOhlcvRow> | null | undefined
): PricePoint[] {
  if (!tail) return [];

  const entries = Object.entries(tail);

  // sort by timestamp key so chart goes left → right in time
  entries.sort((a, b) => {
    const ta = new Date(a[0]).getTime();
    const tb = new Date(b[0]).getTime();
    return ta - tb;
  });

  const points: PricePoint[] = [];

  for (const [timestamp, row] of entries) {
    const close = row["Adj Close"] ?? row.Close;
    if (close == null) continue;

    // simple label: date + maybe time slice
    const label =
      timestamp.length > 16 ? timestamp.slice(0, 16) : timestamp.slice(0, 10);

    points.push({
      time: label,
      close,
    });
  }

  return points;
}

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
      const res = await fetch("/api/bridge_url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: cleaned, // your Next.js route can map this to `company`
          period,
          interval,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
        // try to parse FastAPI error payload
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

      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const chartData = buildChartData(data?.tail_ohlcv ?? null);

  return (
    <main className="min-h-screen bg-slate-950/90 backdrop-blur text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-6 md:py-8 space-y-6">
        {/* Top bar */}
        <header className="mb-4 space-y-2">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-sky-300 transition-colors"
          >
            ← Back to MarketMind
          </Link>
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-center">
            Stock Lookup
          </h1>
        </header>

        {/* Controls */}
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Ticker / Company
            </label>
            <TickerSearch
              value={ticker}
              onChange={(v) => setTicker(v.toUpperCase())}
              onSubmit={handleLookup}
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
              <p className="text-xs text-slate-500">
                Overall range of data (for example last 1 day, 1 month, 1 year).
              </p>
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
              <p className="text-xs text-slate-500">
                Spacing between points (for example 5-minute bars vs daily
                candles).
              </p>
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
        <section className="space-y-3 pb-6">
          {error && (
            <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {!error && !data && !loading && (
            <p className="text-xs text-slate-500">
              Enter a ticker, choose a period and interval, then click{" "}
              <span className="font-semibold">Run Lookup</span> to see the
              snapshot and price chart from the lookup microservice.
            </p>
          )}

          {data && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-4 text-sm">
              {/* Header / snapshot */}
              <div>
                <h2 className="text-base font-semibold mb-1">
                  {data.shortName ?? data.company ?? data.symbol ?? "Result"}
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

              {/* Price chart */}
              <PriceChart history={chartData} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PriceChart({ history }: { history: PricePoint[] }) {
  if (!history || history.length === 0) {
    return (
      <p className="mt-3 text-xs text-slate-500">
        No recent price history available for this period and interval.
      </p>
    );
  }

  return (
    <div className="mt-4 h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={history}
          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickMargin={8}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickMargin={8}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#020617",
              border: "1px solid #1f2937",
            }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value: any) => [`$${value}`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="close"
            stroke="#22c55e" // green line
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ------------------------------
   Search bar with trending + API suggestions
   ------------------------------ */

type TickerSearchProps = {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
};

function TickerSearch({ value, onChange, onSubmit }: TickerSearchProps) {
  const [focused, setFocused] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<StockSuggestion[]>(
    []
  );

  const query = value.trim();
  const upperQuery = query.toUpperCase();

  // Try to fetch live suggestions from Yahoo Finance search API
  useEffect(() => {
    if (!upperQuery) {
      setRemoteSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      fetch(
        `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
          upperQuery
        )}&quotesCount=5&newsCount=0`,
        { signal: controller.signal }
      )
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((json) => {
          const quotes = (json?.quotes ?? []) as any[];
          const mapped: StockSuggestion[] = quotes.map((q) => ({
            symbol: q.symbol,
            name: q.shortname || q.longname || q.symbol,
            type: q.quoteType || "Stock",
          }));
          setRemoteSuggestions(mapped);
        })
        .catch(() => {
          // If Yahoo fails (CORS, network, etc.), just fall back to local list
          if (!controller.signal.aborted) {
            setRemoteSuggestions([]);
          }
        });
    }, 250); // debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [upperQuery]);

  // ---------------------------
  // Build suggestions array
  // ---------------------------
  let suggestions: StockSuggestion[] = [];

  if (!upperQuery) {
    // Empty input → static trending list
    suggestions = TRENDING_STOCKS.slice(0, 4);
  } else {
    // Prefer remote suggestions if we have them, otherwise fall back to TRENDING
    const source =
      remoteSuggestions.length > 0 ? remoteSuggestions : TRENDING_STOCKS;

    const startsWith = source.filter((s) =>
      s.symbol.toUpperCase().startsWith(upperQuery)
    );
    const nameMatch = source.filter(
      (s) =>
        !startsWith.includes(s) &&
        s.name.toUpperCase().includes(upperQuery)
    );

    suggestions = [...startsWith, ...nameMatch].slice(0, 4);
  }

  const showDropdown = focused && suggestions.length > 0;

  function handleClear() {
    onChange("");
    setRemoteSuggestions([]);
  }

  return (
    <div className="relative">
      <div className="flex items-center rounded-full bg-slate-950 border border-slate-700 px-3 py-2 text-sm focus-within:border-sky-500">
        {/* search icon */}
        <span className="mr-2 text-slate-500">🔍</span>
        <input
          className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500"
          placeholder="Company or stock symbol..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setTimeout(() => setFocused(false), 100);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            } else if (e.key === "Escape") {
              handleClear();
            }
          }}
        />
        {/* clear button – always available while focused */}
        {(focused || value) && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
            className="ml-2 text-slate-400 hover:text-slate-200 text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1 w-full rounded-xl bg-slate-950 border border-slate-800 shadow-lg text-sm overflow-hidden">
          {!upperQuery && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-400 border-b border-slate-800">
              Trending
            </div>
          )}
          <ul>
            {suggestions.map((s) => (
              <li
                key={s.symbol}
                className="flex items-center justify-between px-3 py-2 hover:bg-slate-900 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(s.symbol);
                  setFocused(false); // hide dropdown on select
                  setRemoteSuggestions([]);
                }}
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-100">
                    {s.symbol}
                  </span>
                  <span className="text-xs text-slate-400">{s.name}</span>
                </div>
                <span className="text-xs text-slate-500">{s.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

