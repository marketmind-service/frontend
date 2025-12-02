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

type AgentState = {
  prompt: string;
  classification: string[];
  route_plan: string[];
  route_taken: string[];
  lookup_result?: Record<string, any> | null;
  news_result?: NewsResult | null;
};

export default function NewsSentimentPage() {
  const [prompt, setPrompt] = useState("");
  const [data, setData] = useState<AgentState | null>(null);
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
        body: JSON.stringify({ prompt }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        setError(json.error || "Something went wrong");
      } else {
        setData(json as AgentState);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  const news = data?.news_result;
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
    <main className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">News & Sentiment</h1>

      <form onSubmit={fetchNews} className="flex gap-3 mb-6">
        <input
          className="border rounded px-3 py-2 w-full"
          placeholder='e.g. "NVDA" or "news for Tesla"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? "Loading..." : "Search"}
        </button>
      </form>

      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {!news && !error && !loading && (
        <p className="text-sm text-gray-500">
          Enter a company or ticker to begin.
        </p>
      )}

      {news && !error && (
        <div className="border rounded p-4 mb-6">
          <h2 className="text-lg font-medium mb-1">
            {news.company || news.symbol || "Results"}
          </h2>
          <p className="text-sm text-gray-600">
            Symbol: <span className="font-semibold">{news.symbol}</span>{" "}
            • Articles: <span className="font-semibold">{rows.length}</span>
          </p>

          {summary && (
            <div className="mt-3 text-sm text-gray-700 space-y-1">
              <p>
                Avg sentiment:{" "}
                <span className="font-mono">
                  {summary.avg.toFixed(3)}
                </span>
              </p>
              <p>
                Median sentiment:{" "}
                <span className="font-mono">
                  {summary.median.toFixed(3)}
                </span>
              </p>
              <p>
                Breakdown: +{summary.pos} / 0 {summary.neu} / -{summary.neg}
              </p>
            </div>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2 text-sm">Recent headlines</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1 pr-2">Sentiment</th>
                  <th className="text-left py-1 pr-2">Published</th>
                  <th className="text-left py-1 pr-2">Publisher</th>
                  <th className="text-left py-1 pr-2">Title</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b align-top">
                    <td className="py-1 pr-2 font-mono">
                      {r.label} ({r.compound.toFixed(3)})
                    </td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {r.published}
                    </td>
                    <td className="py-1 pr-2 whitespace-nowrap">
                      {r.publisher}
                    </td>
                    <td className="py-1 pr-2">
                      <a
                        href={r.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
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
    </main>
  );
}
