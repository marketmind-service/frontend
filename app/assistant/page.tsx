"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type LlmSource = {
  title: string;
  url?: string;
  type?: string;
};

type LlmResponse = {
  answer: string;
  sources?: LlmSource[];
};

function AssistantInner() {
  const searchParams = useSearchParams();
  const initialPrompt = searchParams.get("q") ?? "";

  const [prompt, setPrompt] = useState(initialPrompt);
  const [answer, setAnswer] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Optionally auto-run when opened with ?q=...
  useEffect(() => {
    if (initialPrompt) {
      void handleAsk(initialPrompt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

  async function handleAsk(customPrompt?: string) {
    const text = (customPrompt ?? prompt).trim();
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      <div className="w-full max-w-4xl px-4 py-6 md:py-8 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">
            Stock Analysis Pro
          </h1>
          <p className="text-xs text-slate-500">
            Experimental LLM assistant (mocked for now)
          </p>
        </header>

        {/* Question box */}
        <section className="space-y-3">
          <label className="block text-sm font-medium text-slate-300">
            Ask MarketMind AI
          </label>
          <div className="flex gap-2">
            <textarea
              className="flex-1 min-h-[80px] rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-sm outline-none focus:border-sky-500 resize-none"
              placeholder='Example: "Compare NVDA and AMD risk over the last year."'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => handleAsk()}
              disabled={!prompt.trim() || loading}
              className="rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </section>

        {/* Answer / error */}
        <section className="space-y-3">
          {error && (
            <div className="rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {answer && (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm whitespace-pre-wrap">
              {answer}
            </div>
          )}

          {!answer && !error && !loading && (
            <p className="text-xs text-slate-500">
              Your answer will appear here. Right now this uses a mocked
              response from <code>/api/llm</code>; later you can wire it to the
              real LLM microservice.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AssistantPage() {
  // Suspense wrapper is required when using useSearchParams in a client component
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
          <p className="text-sm text-slate-400">Loading assistant…</p>
        </main>
      }
    >
      <AssistantInner />
    </Suspense>
  );
}
