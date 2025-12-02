"use client";

import { useState } from "react";
import Link from "next/link";
import AuthSidebarSection from "@/app/auth/AuthSidebarSection";

type TopMover = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

type LlmSource = {
  title: string;
  url?: string;
  type?: string;
};

type LlmResponse = {
  answer: string;
  sources?: LlmSource[];
};

// Mock data – later replace with sector-rotation / market-movers microservice
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

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // LLM state
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk() {
    const text = prompt.trim();
    if (!text) return;

    setLoading(true);
    setError(null);
    setAnswer("");

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      if (!res.ok) {
        throw new Error(`LLM request failed: ${res.status}`);
      }

      const json = (await res.json()) as LlmResponse;
      setAnswer(json.answer);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function resetDashboard() {
    setPrompt("");
    setAnswer("");
    setError(null);
    setLoading(false);
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
                href="/lookup"
                icon="🔎"
                label="Stock Lookup"
                onClick={closeMenu}
              />
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
            </nav>

            {/* Bottom: sign up / log in */}
            <AuthSidebarSection onAction={closeMenu} />
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
              onClick={resetDashboard}
              className="text-lg font-semibold tracking-tight hover:text-sky-300 transition-colors"
            >
              MarketMind
            </button>
          </div>
        </div>

        {/* Hero header + LLM search */}
        <section className="text-center space-y-5 md:space-y-6">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            Search for a stock to start your analysis
          </h1>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-slate-400">
            Type a question and get an answer that can reference
            lookup, technical indicators, news, and sector rotation (once all
            services are wired up).
          </p>

          {/* LLM search bar */}
          <div className="mt-4 flex justify-center">
            <div className="w-full max-w-3xl flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 shadow-sm">
              <span className="text-slate-400 text-lg">🤖</span>
              <input
                className="flex-1 bg-transparent outline-none text-sm md:text-base text-slate-100 placeholder:text-slate-500"
                placeholder='Example: "Summarize NVDA performance over the last year."'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
              />
              <button
                onClick={handleAsk}
                disabled={!prompt.trim() || loading}
                className="text-xs md:text-sm font-medium text-sky-300 hover:text-sky-200 disabled:opacity-40"
              >
                {loading ? "Thinking…" : "Ask"}
              </button>
            </div>
          </div>
        </section>

        {/* Microservice tiles */}
        <section className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <ServiceTile href="/lookup" label="Stock Lookup" icon="🔎" />
            <ServiceTile href="/watchlist" label="Watchlist" icon="📋" />
            <ServiceTile href="/sma-ema" label="SMA / EMA Analyzer" icon="📈" />
            <ServiceTile
              href="/news-sentiment"
              label="News & Sentiment"
              icon="📰"
            />
            <ServiceTile
              href="/sector-rotation"
              label="Sector Rotation Intelligence"
              icon="📊"
            />
          </div>
        </section>

        {/* LLM answer section */}
        <section className="space-y-4">
          {error && (
            <div className="mb-2 rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {answer && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </section>

        {/* Top gainers / losers – hide while an answer is showing */}
        {!answer && (
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
                  (m.changePct >= 0 ? "text-emerald-400" : "text-rose-400")
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
