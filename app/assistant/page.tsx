"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type LlmResponse = {
  answer: string;
  sources?: Array<{ title: string; url?: string; type?: string }>;
  // plus anything else your backend returns
};

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";

  const [data, setData] = useState<LlmResponse | null>(null);
  const [loading, setLoading] = useState(!!q);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;

    async function run() {
      setLoading(true);
      setError(null);
      setData(null);
      try {
        const res = await fetch("/api/llm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: q }),
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`LLM failed: ${res.status} – ${text.slice(0, 200)}`);
        }
        const json = (await res.json()) as LlmResponse;
        setData(json);
      } catch (e: any) {
        setError(e.message ?? "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [q]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-8 gap-6">
      <header className="w-full max-w-5xl flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">MarketMind AI Assistant</h1>
          <p className="text-sm text-slate-400">
            Query: <span className="italic">{q || "No question provided"}</span>
          </p>
        </div>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-sky-400 hover:underline"
        >
          ← Back to dashboard
        </button>
      </header>

      {/* future: editable prompt bar on this page too */}
      {loading && (
        <div className="w-full max-w-5xl text-sm text-slate-400">
          Thinking with the LLM…
        </div>
      )}

      {error && (
        <div className="w-full max-w-5xl rounded-md border border-red-500 bg-red-950/40 px-4 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {data && (
        <section className="w-full max-w-5xl space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-lg font-semibold mb-2">Answer</h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {data.answer}
            </p>
          </div>

          {data.sources && data.sources.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <h2 className="text-lg font-semibold mb-2">Sources</h2>
              <ul className="list-disc list-inside text-sm text-slate-300">
                {data.sources.map((s, i) => (
                  <li key={i}>
                    {s.url ? (
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-400 hover:underline"
                      >
                        {s.title}
                      </a>
                    ) : (
                      s.title
                    )}
                    {s.type && (
                      <span className="text-slate-500 text-xs">
                        {" "}
                        ({s.type})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
