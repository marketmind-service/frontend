"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthSidebarSection from "@/app/auth/AuthSidebarSection";

type AskAgentResponse = {
  prompt?: string;
  classification?: string[];
  route_plan?: string[];
  route_taken?: string[];
  lookup_result?: {
    symbol?: string | null;
    company?: string | null;
    period?: string | null;
    interval?: string | null;
    error?: string | null;
  } | null;
  news_result?: {
    company?: string | null;
    items?: number | null;
    error?: string | null;
  } | null;
  sector_result?: {
    sectors?: string[] | null;
    interpreted_results?: string | null;
    error?: string | null;
  } | null;
  error?: string | null;
};

export default function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  async function handleAsk() {
    const text = prompt.trim();
    if (!text) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });

      const raw = await res.text();

      let data: AskAgentResponse;
      try {
        data = JSON.parse(raw) as AskAgentResponse;
      } catch {
        throw new Error(
          `Unexpected response from /api/ask: ${raw.slice(0, 200)}`
        );
      }

      if (!res.ok) {
        const detail = (data as any)?.detail || data.error;
        throw new Error(detail || `Agent request failed: ${res.status}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      let route = data.route_plan?.[0] ?? null;

      if (!route) {
        const label = data.classification?.[0];
        if (label === "Stock Lookup") route = "stock_lookup";
        else if (label === "News & Sentiment") route = "news_sentiment";
        else if (label === "Sector Analysis") route = "sector_analysis";
        else if (label === "SMA/EMA Analyzer") route = "sma_ema";
      }

      if (route === "stock_lookup") {
        const lr = data.lookup_result ?? {};
        const ticker =
          (lr.symbol ||
            lr.company ||
            extractSymbolFromPrompt(text) ||
            "").toString().toUpperCase();

        if (!ticker) {
          setError(
            "I couldn’t figure out which ticker you meant. Try including the symbol, like NVDA or AAPL."
          );
          return;
        }

        const period = lr.period || "1y";
        const interval = lr.interval || "1d";

        const params = new URLSearchParams();
        params.set("ticker", ticker);
        if (period) params.set("period", period);
        if (interval) params.set("interval", interval);

        router.push(`/lookup?${params.toString()}`);
        return;
      }

      if (route === "news_sentiment") {
        const company =
          data.news_result?.company ||
          extractSymbolFromPrompt(text) ||
          text;

        const params = new URLSearchParams();
        if (company) params.set("company", company);

        router.push(`/news-sentiment?${params.toString()}`);
        return;
      }

      if (route === "sector_analysis") {
        const sectors = data.sector_result?.sectors || [];
        const params = new URLSearchParams();

        if (sectors.length) {
          params.set("sectors", sectors.join(","));
        }

        params.set("fromAgent", "1");

        const qs = params.toString();
        router.push(`/sector-rotation${qs ? `?${qs}` : ""}`);
        return;
      }

      if (route === "sma_ema") {
        const params = new URLSearchParams();
        params.set("prompt", text);
        router.push(`/sma-ema?${params.toString()}`);
        return;
      }

      setError(
        "I can only help with stock lookup, indicators, news, and sector questions right now. Try rephrasing your prompt."
      );
    } catch (err: any) {
      console.error("agent /api/ask error", err);
      setError(err?.message || "Something went wrong talking to the agent.");
    } finally {
      setLoading(false);
    }
  }

  function resetDashboard() {
    setPrompt("");
    setError(null);
    setLoading(false);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <main className="min-h-screen bg-slate-950/90 backdrop-blur text-slate-100 flex flex-col items-center">
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

            <AuthSidebarSection onAction={closeMenu} />
          </aside>
        </>
      )}

      <div className="w-full max-w-6xl px-4 py-6 md:py-8 flex-1 flex flex-col">
        {/* top nav row (stays near top) */}
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

        {/* main hero content centered vertically */}
        <div className="flex-1 flex flex-col justify-center space-y-10 md:space-y-12">
          <section className="text-center space-y-5 md:space-y-6">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
              Search for a stock to start your analysis
            </h1>
            <p className="max-w-3xl mx-auto text-sm md:text-base text-slate-400">
              Type a question and I’ll route it to stock lookup, technical
              indicators, news, or sector rotation automatically.
            </p>

            <div className="mt-4 flex justify-center">
              <div className="w-full max-w-3xl flex flex-col gap-2">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 shadow-sm">
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

                {error && (
                  <div className="text-xs md:text-sm text-red-300 bg-red-950/40 border border-red-700/70 rounded-lg px-3 py-2 text-left">
                    {error}
                  </div>
                )}

                {!error && !loading && (
                  <p className="text-xs md:text-sm text-slate-500 text-left">
                    Ask about a ticker, news, or sector strength. I’ll send you
                    to the right tool and pre-fill the inputs.
                  </p>
                )}
              </div>
            </div>
          </section>

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
        </div>
      </div>
    </main>
  );
}

function extractSymbolFromPrompt(prompt: string): string | null {
  const m = prompt.toUpperCase().match(/\b[A-Z]{2,5}\b/);
  return m ? m[0] : null;
}

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
