"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

type NewsRow = {
  published: string;
  publisher: string;
  title: string;
  link: string;
  compound: number;
  label: "pos" | "neu" | "neg";
};

type NewsResult = {
  prompt?: string | null;
  company?: string | null;
  symbol?: string | null;
  items?: number | null;
  rows?: NewsRow[] | null;
  error?: string | null;
};

type SentimentFilter = "all" | "pos" | "neu" | "neg";

export default function NewsSentimentPage() {
  const searchParams = useSearchParams();

  const [prompt, setPrompt] = useState("");
  const [items, setItems] = useState<number>(10);
  const [sentimentFilter, setSentimentFilter] =
    useState<SentimentFilter>("all");
  const [data, setData] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  // Core news fetch logic shared by form + agent deep-link
  async function runNews(company: string, count: number) {
    const trimmed = company.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "prompt" is what user types; backend expects "company"
        body: JSON.stringify({ company: trimmed, items: count }),
      });

      const text = await res.text();
      let json: any = null;

      try {
        json = JSON.parse(text);
      } catch {
        throw new Error(
          `Unexpected response from /api/news: ${text.slice(0, 120)}`
        );
      }

      if (!res.ok || json.error) {
        setError(json.error || `Request failed with status ${res.status}`);
      } else {
        setData(json as NewsResult);
      }
    } catch (err: any) {
      console.error("news-sentiment error", err);
      setError(err?.message || "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchNews(e: React.FormEvent) {
    e.preventDefault();
    await runNews(prompt, items);
  }

  // When navigated from the agent, read query params and auto-run
  useEffect(() => {
    if (bootstrapped) return;

    const companyParam = searchParams.get("company");
    const itemsParam = searchParams.get("items");

    const initialCompany = companyParam ?? "";
    let initialItems = 10;

    if (itemsParam) {
      const n = Number(itemsParam);
      if (!Number.isNaN(n) && n > 0) {
        initialItems = n;
      }
    }

    if (initialCompany) {
      setPrompt(initialCompany);
      setItems(initialItems);
      runNews(initialCompany, initialItems);
    }

    setBootstrapped(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, bootstrapped]);

  const news = data;
  const rows = news?.rows || [];

  // Apply sentiment filter for table + summary
  const filteredRows: NewsRow[] =
    sentimentFilter === "all"
      ? rows
      : rows.filter((r) => r.label === sentimentFilter);

  // Use filtered rows for summary if any; otherwise fall back to all rows
  const summaryRows = filteredRows.length ? filteredRows : rows;

  const summary = summaryRows.length
    ? (() => {
        const comps = summaryRows.map((r) => r.compound);
        const avg = comps.reduce((a, b) => a + b, 0) / comps.length;
        const sorted = [...comps].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
          sorted.length % 2 === 1
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        const pos = summaryRows.filter((r) => r.label === "pos").length;
        const neu = summaryRows.filter((r) => r.label === "neu").length;
        const neg = summaryRows.filter((r) => r.label === "neg").length;

        // Simple "market mood" label based on avg
        let mood = "Mixed / neutral";
        let moodDetail = "Headlines are balanced overall.";
        if (avg > 0.25) {
          mood = "Bullish";
          moodDetail = "Headlines are mostly optimistic.";
        } else if (avg > 0.05) {
          mood = "Slightly bullish";
          moodDetail = "Tone leans positive, but not strongly.";
        } else if (avg < -0.25) {
          mood = "Bearish";
          moodDetail = "Headlines are mostly negative.";
        } else if (avg < -0.05) {
          mood = "Slightly bearish";
          moodDetail = "Tone leans negative, but not strongly.";
        }

        return { avg, median, pos, neu, neg, mood, moodDetail };
      })()
    : null;

  return (
    <main className="min-h-screen bg-slate-950/90 backdrop-blur text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-8">
        <button
          onClick={() => (window.location.href = "/")}
          className="mb-4 text-sm text-slate-400 hover:text-sky-300"
        >
          ← Back to MarketMind
        </button>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm p-6 md:p-8 space-y-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-center mb-2">
            News &amp; Sentiment
          </h1>

          {/* FORM */}
          <form onSubmit={fetchNews} className="flex flex-col gap-3">
            <label className="text-sm text-slate-300">
              Company or ticker
            </label>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder='e.g. "NVDA" or "AAPL"'
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                required
              />
              <div className="flex items-center gap-2">
                <label className="text-xs md:text-sm text-slate-400">
                  Articles
                </label>
                <select
                  value={items}
                  onChange={(e) => setItems(Number(e.target.value))}
                  className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs md:text-sm focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-sky-600 text-sm md:text-base font-medium text-white disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Search"}
                </button>
              </div>
            </div>
          </form>

          {/* STATUS / ERROR */}
          {error && (
            <div className="text-sm text-red-300 bg-red-900/40 border border-red-700 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!news && !error && !loading && (
            <p className="text-sm text-slate-400">
              Enter a company or ticker to begin.
            </p>
          )}

          {/* SUMMARY */}
          {news && !error && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 text-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                <div className="font-medium">
                  {news.company || news.symbol || "Results"}
                </div>
                <div className="text-slate-400 text-xs md:text-sm">
                  Symbol:{" "}
                  <span className="font-semibold text-slate-100">
                    {news.symbol || "n/a"}
                  </span>{" "}
                  • Articles:{" "}
                  <span className="font-semibold text-slate-100">
                    {rows.length}
                  </span>{" "}
                  {filteredRows.length !== rows.length && (
                    <span className="text-slate-500">
                      {" "}
                      (showing {filteredRows.length} after filter)
                    </span>
                  )}
                </div>
              </div>

              {/* Sentiment filter controls */}
              {rows.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-slate-500">Filter:</span>
                  {(["all", "pos", "neu", "neg"] as SentimentFilter[]).map(
                    (f) => {
                      const labelMap: Record<SentimentFilter, string> = {
                        all: "All",
                        pos: "Positive",
                        neu: "Neutral",
                        neg: "Negative",
                      };
                      const isActive = sentimentFilter === f;
                      return (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setSentimentFilter(f)}
                          className={[
                            "px-2 py-1 rounded-full border text-xs transition",
                            isActive
                              ? "bg-sky-600 border-sky-500 text-white"
                              : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800",
                          ].join(" ")}
                        >
                          {labelMap[f]}
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              {summary && (
                <div className="pt-2 grid gap-3 md:grid-cols-4 text-slate-300">
                  <div className="md:col-span-2">
                    <div className="text-xs uppercase text-slate-500">
                      Market mood
                    </div>
                    <div className="font-semibold text-sm">
                      {summary.mood}
                    </div>
                    <div className="text-xs text-slate-400">
                      {summary.moodDetail}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">
                      Avg sentiment
                    </div>
                    <div className="font-mono text-sm">
                      {summary.avg.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase text-slate-500">
                      Median sentiment
                    </div>
                    <div className="font-mono text-sm">
                      {summary.median.toFixed(3)}
                    </div>
                  </div>
                  <div className="md:col-span-4">
                    <div className="text-xs uppercase text-slate-500">
                      Breakdown{" "}
                      <span className="capitalize text-[0.65rem] text-slate-500">
                        (based on current filter)
                      </span>
                    </div>
                    <div className="text-sm">
                      {summary.pos} positive • {summary.neu} neutral •{" "}
                      {summary.neg} negative
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABLE */}
          {filteredRows.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
              <h2 className="text-sm font-semibold mb-2">Recent headlines</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="text-left py-1 pr-2">Sentiment</th>
                      <th className="text-left py-1 pr-2">Published</th>
                      <th className="text-left py-1 pr-2">Publisher</th>
                      <th className="text-left py-1 pr-2">Title</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((r, i) => (
                      <tr key={i} className="border-b border-slate-900">
                        <td className="py-1 pr-2 font-mono">
                          {r.label} ({r.compound.toFixed(3)})
                        </td>
                        <td className="py-1 pr-2 whitespace-nowrap text-slate-300">
                          {r.published}
                        </td>
                        <td className="py-1 pr-2 whitespace-nowrap text-slate-300">
                          {r.publisher}
                        </td>
                        <td className="py-1 pr-2">
                          <a
                            href={r.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-400 hover:underline"
                          >
                            {r.title}
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {rows.length === 0 && news && !loading && !error && (
            <p className="text-sm text-slate-400">
              No headlines found for this symbol and settings.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
