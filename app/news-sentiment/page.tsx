"use client";

import { useState } from "react";

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

export default function NewsSentimentPage() {
  const [prompt, setPrompt] = useState("");
  const [data, setData] = useState<NewsResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchNews(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // "prompt" is what user types; backend expects "company"
        body: JSON.stringify({ company: prompt, items: 10 }),
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

  // Now the returned object IS the news result
  const news = data;
  const rows = news?.rows || [];

  const summary = rows.length
    ? (() => {
        const comps = rows.map((r) => r.compound);
        const avg = comps.reduce((a, b) => a + b, 0) / comps.length;
        const sorted = [...comps].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        const median =
          sorted.length % 2 === 1
            ? sorted[mid]
            : (sorted[mid - 1] + sorted[mid]) / 2;
        const pos = rows.filter((r) => r.label === "pos").length;
        const neu = rows.filter((r) => r.label === "neu").length;
        const neg = rows.filter((r) => r.label === "neg").length;
        return { avg, median, pos, neu, neg };
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
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-sky-600 text-sm md:text-base font-medium text-white disabled:opacity-50"
              >
                {loading ? "Loading..." : "Search"}
              </button>
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
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-2 text-sm">
              <div className="font-medium">
                {news.company || news.symbol || "Results"}
              </div>
              <div className="text-slate-400">
                Symbol:{" "}
                <span className="font-semibold text-slate-100">
                  {news.symbol || "n/a"}
                </span>{" "}
                • Articles:{" "}
                <span className="font-semibold text-slate-100">
                  {rows.length}
                </span>
              </div>

              {summary && (
                <div className="pt-2 grid gap-2 md:grid-cols-3 text-slate-300">
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
                  <div>
                    <div className="text-xs uppercase text-slate-500">
                      Breakdown
                    </div>
                    <div className="text-sm">
                      +{summary.pos} / 0 {summary.neu} / -{summary.neg}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABLE */}
          {rows.length > 0 && (
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
                    {rows.map((r, i) => (
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
        </div>
      </div>
    </main>
  );
}
