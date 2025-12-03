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
  Legend,
} from "recharts";

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

type IndicatorPoint = PricePoint & {
  smaShort?: number | null;
  smaLong?: number | null;
  emaShort?: number | null;
  emaLong?: number | null;
};

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
      ema = price;
    } else {
      ema = price * k + ema * (1 - k);
    }
    data[i][key] = ema;
  }
  return data;
}


const PERIOD_OPTIONS = ["1d", "5d", "1mo", "6mo", "1y", "5y", "max"];
const INTRADAY_INTERVALS = ["1m", "5m", "15m"];
const ALL_INTERVAL_OPTIONS = [...INTRADAY_INTERVALS, "1d"];

function allowedIntervalsForPeriod(period: string): string[] {
  switch (period) {
    case "1d":
    case "5d":
      return ["1m", "5m", "15m", "1d"];
    case "1mo":
      return ["5m", "15m", "1d"];
    case "6mo":
    case "1y":
    case "5y":
    case "max":
    default:
      return ["1d"];
  }
}


type StockSuggestion = {
  symbol: string;
  name: string;
  type: string;
};

const TRENDING_STOCKS: StockSuggestion[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", type: "Stock" },
  { symbol: "AAPL", name: "Apple Inc.", type: "Stock" },
  { symbol: "MSFT", name: "Microsoft Corporation", type: "Stock" },
  { symbol: "TSLA", name: "Tesla, Inc.", type: "Stock" },
  { symbol: "AMD", name: "Advanced Micro Devices, Inc.", type: "Stock" },
];

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
          if (!controller.signal.aborted) {
            setRemoteSuggestions([]);
          }
        });
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [upperQuery]);

  let suggestions: StockSuggestion[] = [];

  if (!upperQuery) {
    suggestions = TRENDING_STOCKS.slice(0, 4);
  } else {
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
        <span className="mr-2 text-slate-500">🔍</span>
        <input
          className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500"
          placeholder="Single ticker symbol (for example AAPL or NVDA)…"
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
                  setFocused(false);
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

  useEffect(() => {
    const allowed = allowedIntervalsForPeriod(period);
    if (!allowed.includes(interval)) {
      setInterval(allowed[allowed.length - 1]);
    }
  }, [period, interval]);

  const isIntradaySelected = INTRADAY_INTERVALS.includes(interval);

  function handleShortChange(raw: string) {
    let val = parseInt(raw, 10);
    if (Number.isNaN(val)) val = 5;
    val = Math.max(2, Math.min(500, val));
    // ensure short < long
    if (val >= longWindow) {
      setLongWindow(Math.min(600, val + 5));
    }
    setShortWindow(val);
  }

  function handleLongChange(raw: string) {
    let val = parseInt(raw, 10);
    if (Number.isNaN(val)) val = 50;
    val = Math.max(3, Math.min(600, val));
    // ensure long > short
    if (val <= shortWindow) {
      setShortWindow(Math.max(2, val - 5));
    }
    setLongWindow(val);
  }

  function applyPreset(shortW: number, longW: number) {
    setShortWindow(shortW);
    setLongWindow(longW);
  }

  async function handleAnalyze() {
    const cleaned = ticker.trim().toUpperCase();
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setData(null);
    setSeries([]);
    setSummary({});

    const allowed = allowedIntervalsForPeriod(period);
    const effectiveInterval = allowed.includes(interval)
      ? interval
      : allowed[allowed.length - 1];

    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: cleaned,
          period,
          interval: effectiveInterval,
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
      const lWin = Math.max(3, longWindow);

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
  const displayedPeriod = data?.period ?? period;
  const displayedInterval = data?.interval ?? interval;

  return (
    <main className="min-h-screen bg-slate-950/90 backdrop-blur text-slate-100 flex flex-col items-center">
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

        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-200">
              Ticker / Company
            </label>
            <TickerSearch
              value={ticker}
              onChange={(v) => setTicker(v.toUpperCase())}
              onSubmit={handleAnalyze}
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
                {allowedIntervalsForPeriod(period).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                {isIntradaySelected
                  ? "Using intraday data to show short-term moves. For longer periods, we switch to daily candles."
                  : "Using daily candles, which are better for 6-month, 1-year, or longer views."}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-200">
                Moving average windows
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">Short</div>
                  <input
                    type="number"
                    min={2}
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    value={shortWindow}
                    onChange={(e) => handleShortChange(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-400 mb-1">Long</div>
                  <input
                    type="number"
                    min={3}
                    className="w-full rounded-md bg-slate-950 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    value={longWindow}
                    onChange={(e) => handleLongChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Number of data points used for each SMA / EMA line. Short
                reacts faster, long tracks the big trend.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => applyPreset(20, 50)}
                  className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500"
                >
                  20 / 50 (swing)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset(50, 200)}
                  className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500"
                >
                  50 / 200 (long term)
                </button>
              </div>
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
                <p className="text-xs text-slate-500 mt-1">
                  Period:{" "}
                  <span className="text-slate-100">{displayedPeriod}</span> •
                  Interval:{" "}
                  <span className="text-slate-100">
                    {displayedInterval}
                  </span>
                </p>
              </div>

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

              <SmaEmaChart history={history} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}


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

          <Line
            type="monotone"
            dataKey="close"
            name="Close"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />

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
