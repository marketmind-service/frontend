"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

// ------------------------------
// Types copied from lookup page
// ------------------------------

type TailOhlcvRow = {
  Open?: number;
  High?: number;
  Low?: number;
  Close?: number;
  "Adj Close"?: number;
  Volume?: number;
};

type LookupResponse = {
  company?: string;
  period?: string;
  interval?: string;
  error?: string | null;

  symbol?: string;
  shortName?: string;
  lastPrice?: number;
  period_return_pct?: number;

  tail_ohlcv?: Record<string, TailOhlcvRow> | null;
};

type PricePoint = {
  time: string;
  close: number;
};

// Convert tail_ohlcv dict into a sorted array of { time, close }
// (same logic as lookup page)
function buildChartData(
  tail: Record<string, TailOhlcvRow> | null | undefined
): PricePoint[] {
  if (!tail) return [];

  const entries = Object.entries(tail);

  entries.sort((a, b) => {
    const ta = new Date(a[0]).getTime();
    const tb = new Date(b[0]).getTime();
    return ta - tb;
  });

  const points: PricePoint[] = [];

  for (const [timestamp, row] of entries) {
    const close = row["Adj Close"] ?? row.Close;
    if (close == null) continue;

    const label =
      timestamp.length > 16 ? timestamp.slice(0, 16) : timestamp.slice(0, 10);

    points.push({
      time: label,
      close,
    });
  }

  return points;
}

// ------------------------------
// Indicator helpers (SMA / EMA)
// ------------------------------

type IndicatorPoint = PricePoint & {
  smaShort?: number | null;
  smaLong?: number | null;
  emaShort?: number | null;
  emaLong?: number | null;
};

function addSMA(
  data: IndicatorPoint[],
  window: number,
  key: "smaShort" | "smaLong"
): IndicatorPoint[] {
  if (window <= 1) return data;

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum += data[i].close;
    if (i >= window) {
      sum -= data[i - window].close;
    }
    if (i + 1 >= window) {
      data[i][key] = sum / window;
    } else {
      data[i][key] = null;
    }
  }
  return data;
}

function addEMA(
  data: IndicatorPoint[],
  window: number,
  key: "emaShort" | "emaLong"
): IndicatorPoint[] {
  if (window <= 1 || data.length === 0) return data;

  const k = 2 / (window + 1);
  let ema: number | null = null;

  for (let i = 0; i < data.length; i++) {
    const price = data[i].close;
    if (ema === null) {
      ema = price; // simple seeding
    } else {
      ema = price * k + ema * (1 - k);
    }
    data[i][key] = ema;
  }
  return data;
}

// ------------------------------
// Page component
// ------------------------------

const PERIOD_OPTIONS = ["1d", "5d", "1mo", "6mo", "1y", "5y", "max"];
const INTERVAL_OPTIONS = ["1m", "5m", "15m", "1d"];

export default function SmaEmaPage() {
  const [ticker, setTicker] = useState("");
  const [period, setPeriod] = useState("1d");
  const [interval, setInterval] = useState("5m");

  const [shortWindow, setShortWindow] = useState(20);
  const [longWindow, setLongWindow] = useState(50);

  const [data, setData] = useState<LookupResponse | null>(null);
  const [series, setSeries] = useState<IndicatorPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<{
    lastClose?: number;
    lastSmaShort?: number | null;
    lastSmaLong?: number | null;
    lastEmaShort?: number | null;
    lastEmaLong?: number | null;
  }>({});

  async function handleAnalyze() {
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setData(null);
    setSeries([]);
    setSummary({});

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: cleaned,
          period,
          interval,
        }),
      });

      const text = await res.text();

      if (!res.ok) {
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

      const base = buildChartData(json.tail_ohlcv ?? null);
      if (!base.length) {
        setError("No price data returned for this period / interval.");
        return;
      }

      const sWin = Math.max(2, shortWindow);
      const lWin = Math.max(2, longWindow);

      let enriched: IndicatorPoint[] = base.map((p) => ({ ...p }));

      enriched = addSMA(enriched, sWin, "smaShort");
      enriched = addSMA(enriched, lWin, "smaLong");
      enriched = addEMA(enriched, sWin, "emaShort");
      enriched = addEMA(enriched, lWin, "emaLong");

      setSeries(enriched);

      const last = enriched[enriched.length - 1];
      setSummary({
        lastClose: last?.close,
        lastSmaShort: last?.smaShort ?? null,
        lastSmaLong: last?.smaLong ?? null,
        lastEmaShort: last?.emaShort ?? null,
        lastEmaLong: last?.emaLong ?? null,
      });
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const history = series;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-5xl px-4 py-6 md:py-8 space-y-6">
        {/* Top bar */}
        <header className="mb-4 space-y-2">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-sky-300 transition-colors"
          >
            ← Back to MarketMind
          </Link>
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight text-center">
            SMA / EMA Analyzer
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
                  handleAnalyze();
                }
              }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Moving average windows (short / long)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={2}
                  className="w-1/2 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={shortWindow}
                  onChange={(e) =>
                    setShortWindow(
                      Number.isNaN(Number(e.target.value))
                        ? 20
                        : Number(e.target.value)
                    )
                  }
                />
                <input
                  type="number"
                  min={2}
                  className="w-1/2 rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={longWindow}
                  onChange={(e) =>
                    setLongWindow(
                      Number.isNaN(Number(e.target.value))
                        ? 50
                        : Number(e.target.value)
                    )
                  }
                />
              </div>
              <p className="text-xs text-slate-500">
                Number of data points used for each SMA / EMA line.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleAnalyze}
              disabled={!ticker.trim() || loading}
              className="rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Run SMA / EMA"}
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
              Enter a ticker, choose a period and interval, then run the
              analyzer to see price history with SMA and EMA overlays.
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

              {/* Summary numbers */}
              {series.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
                  <div>
                    <div className="text-slate-500 uppercase mb-1">
                      Last close
                    </div>
                    <div className="text-base font-semibold">
                      {summary.lastClose != null
                        ? `$${summary.lastClose.toFixed(2)}`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 uppercase mb-1">
                      SMA {shortWindow} / {longWindow}
                    </div>
                    <div>
                      {summary.lastSmaShort != null
                        ? summary.lastSmaShort.toFixed(2)
                        : "n/a"}{" "}
                      /{" "}
                      {summary.lastSmaLong != null
                        ? summary.lastSmaLong.toFixed(2)
                        : "n/a"}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500 uppercase mb-1">
                      EMA {shortWindow} / {longWindow}
                    </div>
                    <div>
                      {summary.lastEmaShort != null
                        ? summary.lastEmaShort.toFixed(2)
                        : "n/a"}{" "}
                      /{" "}
                      {summary.lastEmaLong != null
                        ? summary.lastEmaLong.toFixed(2)
                        : "n/a"}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <SmaEmaChart history={history} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ------------------------------
// Chart component
// ------------------------------

function SmaEmaChart({ history }: { history: IndicatorPoint[] }) {
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
          />
          <Legend
            wrapperStyle={{ fontSize: "0.75rem", color: "#e5e7eb" }}
          />

          {/* Close price */}
          <Line
            type="monotone"
            dataKey="close"
            name="Close"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />

          {/* SMA lines */}
          <Line
            type="monotone"
            dataKey="smaShort"
            name="SMA short"
            stroke="#38bdf8"
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="smaLong"
            name="SMA long"
            stroke="#6366f1"
            strokeWidth={1.2}
            dot={false}
          />

          {/* EMA lines */}
          <Line
            type="monotone"
            dataKey="emaShort"
            name="EMA short"
            stroke="#f97316"
            strokeWidth={1.3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="emaLong"
            name="EMA long"
            stroke="#fb7185"
            strokeWidth={1.3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
