"use client";

import { useState } from "react";
import Link from "next/link";

type SummaryResponse = {
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
};

type TopMover = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

// Mock data – later replace with market-movers microservice
const topGainers: TopMover[] = [
  { symbol: "SMX", name: "SMX (Security Matters)", price: 61.04, changePct: 250.8 },
  { symbol: "NVDA", name: "NVIDIA Corp", price: 123.45, changePct: 8.2 },
  { symbol: "META", name: "Meta Platforms", price: 320.12, changePct: 5.7 },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 110.5, changePct: 4.9 },
  { symbol: "TSLA", name: "Tesla", price: 210.3, changePct: 4.3 },
];

const topLosers: TopMover[] = [
  { symbol: "ANPA", name: "Rich Sparkle Holdings", price: 16.31, changePct: -38.57 },
  { symbol: "XYZ", name: "Example Corp", price: 9.12, changePct: -12.4 },
  { symbol: "ABC", name: "Sample Industries", price: 45.6, changePct: -9.8 },
  { symbol: "QQQ", name: "Test Global", price: 30.1, changePct: -7.2 },
  { symbol: "RNDM", name: "Random Co", price: 5.4, changePct: -6.5 },
];

// ------------------------------
// Lookup fetcher (client → Next API → lookup backend)
// ------------------------------
async function fetchLookup(ticker: string, period: string, interval: string) {
  const res = await fetch("/api/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, period, interval }),
  });

  const text = await res.text();

  if (!res.ok) {
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
// Main Page Component
// ------------------------------
export default function HomePage() {
  const [ticker, setTicker] = useState("");
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "profile">(
    "overview"
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleSearch() {
    const cleaned = ticker.trim();
    if (!cleaned) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const json = await fetchLookup(cleaned, "1d", "5m");

      setData({
        ticker: json.symbol,
        name: json.shortName ?? json.longName ?? json.symbol,
        price: json.lastPrice,
        changePercent: json.period_return_pct ?? 0,
      });
      setActiveTab("overview");
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Reset dashboard: clear ticker, errors, results, and tab
  function resetDashboard() {
    setTicker("");
    setData(null);
    setError(null);
    setLoading(false);
    setActiveTab("overview");
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Sidebar + overlay */}
      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={closeMenu}
          />
          <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-800 z-50 flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 flex items-center justify-center text-xs font-bold">
                  MM
                </div>
                <span className="text-sm font-semibold tracking-tight">
                  MarketMind
                </span>
              </div>
              <button
                onClick={closeMenu}
                className="p-2 text-slate-300 hover:text-sky-300"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1 text-sm">
              <button
                onClick={() => {
                  resetDashboard();
                  closeMenu();
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-left"
              >
                <span>🏠</span>
                <span>Home</span>
              </button>

              <SidebarLink
                href="/watchlist"
                icon="⭐"
                label="Watchlist"
                onClick={closeMenu}
              />
              <SidebarLink
                href="/sma-ema"
                icon="📈"
                label="SMA / EMA Analyzer"
                onClick={closeMenu}
              />
              <SidebarLink
                href="/news-sentiment"
                icon="📰"
                label="News & Sentiment"
                onClick={closeMenu}
              />
              <SidebarLink
                href="/sector-rotation"
                icon="📊"
                label="Sector Rotation Intelligence"
                onClick={closeMenu}
              />
              <SidebarLink
                href="/assistant"
                icon="🤖"
                label="Stock Analysis Pro"
                onClick={closeMenu}
              />
            </nav>

            {/* Bottom: sign up / log in */}
            <div className="px-4 py-4 border-t border-slate-800 space-y-3">
              <button className="w-full rounded-lg bg-sky-600 hover:bg-sky-500 text-sm font-semibold py-2">
                Sign Up
              </button>
              <button className="w-full rounded-lg border border-slate-600 hover:border-sky-400 text-sm font-semibold py-2">
                Log In
              </button>
            </div>
          </aside>
        </>
      )}

      <div className="w-full max-w-6xl px-4 py-6 md:py-8 space-y-8 md:space-y-10">
        {/* Top bar with hamburger + MarketMind title */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className="p-2 text-slate-300 hover:text-sky-300"
            >
              {isMenuOpen ? (
                "✕"
              ) : (
                <span className="flex flex-col gap-1">
                  <span className="block w-5 h-[2px] bg-slate-300 rounded-full" />
                  <span className="block w-5 h-[2px] bg-slate-300 rounded-full" />
                  <span className="block w-5 h-[2px] bg-slate-300 rounded-full" />
                </span>
              )}
            </button>
            <button
              onClick={() => {
                resetDashboard();
              }}
              className="text-lg font-semibold tracking-tight hover:text-sky-300 transition-colors"
            >
              MarketMind
            </button>
          </div>
          {/* right side reserved for future stuff */}
        </div>

        {/* Hero header + lookup search */}
        <section className="text-center space-y-5 md:space-y-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Search for a stock to start your analysis
          </h1>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-slate-400">
            Get prices, news, technical indicators, sector trends, and AI-powered
            insights, all built on our microservice architecture.
          </p>

          {/* Lookup search bar */}
          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-3xl flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 shadow-sm">
              <span className="text-slate-400 text-lg">🔍</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm md:text-base text-slate-100 placeholder:text-slate-500"
                placeholder="Company or stock symbol…"
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
              />
              <button
                onClick={handleSearch}
                disabled={!ticker.trim() || loading}
                className="text-xs md:text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-40"
              >
                {loading ? "Loading…" : "Search"}
              </button>
            </div>
          </div>
        </section>

        {/* Microservice tiles – match your real microservices */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <ServiceTile href="/watchlist" label="Watchlist" icon="📋" />
            <ServiceTile href="/sma-ema" label="SMA / EMA Analyzer" icon="📈" />
            <ServiceTile href="/news-sentiment" label="News & Sentiment" icon="📰" />
            <ServiceTile
              href="/sector-rotation"
              label="Sector Rotation Intelligence"
              icon="📊"
            />
            {/* LLM page */}
            <ServiceTile href="/assistant" label="Stock Analysis Pro" icon="🤖" />
          </div>
        </section>

        {/* Lookup results section */}
        <section className="space-y-4">
          {error && (
            <div className="mb-2 rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {data && (
            <div className="space-y-4">
              {/* Stock header */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 md:p-6 space-y-3 md:space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {data.name} ({data.ticker})
                  </h2>
                  <p className="text-xs md:text-sm text-slate-400">
                    Real-time price • Powered by Lookup Service
                  </p>
                </div>

                <div className="flex flex-col md:flex-row md:items-end md:justify-start gap-4">
                  <div>
                    <div className="text-3xl md:text-4xl font-bold">
                      ${data.price}
                    </div>
                    <div
                      className={
                        "mt-1 text-sm md:text-base font-medium " +
                        (data.changePercent >= 0
                          ? "text-emerald-400"
                          : "text-rose-400")
                      }
                    >
                      {data.changePercent >= 0 ? "+" : ""}
                      {data.changePercent.toFixed(2)}%
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      At close: data not yet wired
                    </p>
                  </div>
                </div>
              </div>

              {/* Simple tab bar: Overview / Chart / Profile */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80">
                <div className="flex border-b border-slate-800 text-sm">
                  <TabButton
                    label="Overview"
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                  />
                  <TabButton
                    label="Chart"
                    active={activeTab === "chart"}
                    onClick={() => setActiveTab("chart")}
                  />
                  <TabButton
                    label="Profile"
                    active={activeTab === "profile"}
                    onClick={() => setActiveTab("profile")}
                  />
                </div>

                <div className="p-4 md:p-5 text-sm text-slate-200">
                  {activeTab === "overview" && (
                    <div className="space-y-2">
                      <p>
                        This is the high-level snapshot for{" "}
                        <span className="font-semibold">{data.ticker}</span>.
                        Once the lookup service returns more fundamentals
                        (market cap, P/E, 52-week range, volume, etc.), you can
                        render them here as key stats.
                      </p>
                    </div>
                  )}

                  {activeTab === "chart" && (
                    <div className="space-y-2">
                      <p>
                        Chart view placeholder. Later, you can use the OHLCV
                        data from lookup (or the SMA/EMA microservice) to draw
                        candlesticks or line charts here.
                      </p>
                    </div>
                  )}

                  {activeTab === "profile" && (
                    <div className="space-y-2">
                      <p>
                        Company profile placeholder. Once lookup exposes fields
                        like sector, industry, and website, you can show them
                        here along with a short description.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Top gainers / losers – hide when we have lookup data */}
        {!data && (
          <section className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopTable title="Top Gainers" items={topGainers} positive />
            <TopTable title="Top Losers" items={topLosers} positive={false} />
          </section>
        )}
      </div>
    </main>
  );
}

// ------------------------------
// Reusable components
// ------------------------------
function ServiceTile(props: { href: string; label: string; icon: string }) {
  const { href, label, icon } = props;
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 py-6 text-sm font-medium text-slate-100 shadow-sm hover:border-sky-400 hover:bg-slate-900 transition"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-center">{label}</span>
    </Link>
  );
}

function SidebarLink(props: {
  href: string;
  icon: string;
  label: string;
  onClick?: () => void;
}) {
  const { href, icon, label, onClick } = props;
  return (
    <Link
      href={href}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-sm"
    >
      <span>{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function TopTable(props: { title: string; items: TopMover[]; positive: boolean }) {
  const { title, items } = props;
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-slate-500">Updated just now</span>
      </div>
      <table className="w-full text-xs md:text-sm">
        <thead className="bg-slate-900">
          <tr className="text-left text-slate-400">
            <th className="px-4 py-2">Symbol</th>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2 text-right">Price</th>
            <th className="px-4 py-2 text-right">Change</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr key={m.symbol} className="border-t border-slate-800">
              <td className="px-4 py-2 text-sky-300 font-medium">{m.symbol}</td>
              <td className="px-4 py-2 text-slate-100 truncate">{m.name}</td>
              <td className="px-4 py-2 text-right text-slate-100">
                ${m.price.toFixed(2)}
              </td>
              <td
                className={
                  "px-4 py-2 text-right font-semibold " +
                  (m.changePct >= 0
                    ? "text-emerald-400"
                    : "text-rose-400")
                }
              >
                {m.changePct >= 0 ? "+" : ""}
                {m.changePct.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TabButton(props: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const { label, active, onClick } = props;
  return (
    <button
      onClick={onClick}
      className={
        "flex-1 px-4 py-2 text-xs md:text-sm font-medium border-b-2 transition-colors " +
        (active
          ? "border-sky-400 text-sky-300 bg-slate-900/80"
          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40")
      }
    >
      {label}
    </button>
  );
}
