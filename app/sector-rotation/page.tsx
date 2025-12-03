"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

/* -------------------------
   Types – align with SectorState
   ------------------------- */

type RawSectorRow = {
  ETF: string;
  Sector: string;
  Score: number | null;
  RVOL: number | null;
  ["Above 20/50/200"]?: string | null;
  Breadth20: number | string | null;
  ["5D%"]: number | null;
  ["ATR%"]: number | null;
  TopCandidates?: string | null;
  [key: string]: any;
};

type SectorRow = {
  etf: string;
  sector: string;
  score: number | null;
  rvol: number | null;
  breadth20: number | null;
  ret5: number | null;
  atrPct: number | null;
  aboveTrend: string | null;
  topCandidates: string;
  raw: RawSectorRow;
};

type StrongWeakItem = {
  etf: string;
  sector: string;
  reason: string;
};

type SectorStructuredView = {
  risk_mode?: "risk_on" | "risk_off" | "neutral" | string;
  strong_sectors?: StrongWeakItem[];
  weak_sectors?: StrongWeakItem[];
  overextended?: string[];
  basing_or_reverting?: string[];
  rotation_view?: string;
  notes?: string;
  [key: string]: any;
};

type SectorResult = {
  source?: string | null;
  prompt?: string | null;
  sectors?: string[] | null;
  raw_rows?: RawSectorRow[] | null;
  structured_view?: SectorStructuredView | null;
  interpreted_results?: string | null;
  error?: string | null;
};

/* -------------------------
   Frontend constants
   ------------------------- */

const SECTOR_ETFS: Record<string, string> = {
  SMH: "Semiconductors",
  XLK: "Tech",
  XLC: "Comm Services",
  XLF: "Financials",
  XLE: "Energy",
  XBI: "Biotech",
  XLV: "Healthcare",
  XLI: "Industrials",
  IWM: "Small Caps",
  QQQ: "Nasdaq",
  SPY: "S&P 500",
};

const RISK_LABEL: Record<string, string> = {
  risk_on: "Risk-on",
  risk_off: "Risk-off",
  neutral: "Neutral",
};

/* -------------------------
   Multi-select component
   ------------------------- */

type MultiSelectOption = {
  value: string;
  label: string;
  subtitle?: string;
};

type SectorMultiSelectProps = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (next: string[]) => void;
};

function SectorMultiSelect({
  options,
  selected,
  onChange,
}: SectorMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.value.toLowerCase().includes(q) ||
        (o.label && o.label.toLowerCase().includes(q)) ||
        (o.subtitle && o.subtitle.toLowerCase().includes(q))
    );
  }, [options, search]);

  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  function clear() {
    onChange([]);
  }

  const count = selected.length;

  return (
    <div className="relative">
      {/* Closed pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 hover:border-sky-500"
      >
        <div className="flex flex-wrap gap-1 items-center">
          {count === 0 && (
            <span className="text-slate-500">Select sectors…</span>
          )}
          {count > 0 && (
            <>
              {selected.slice(0, 3).map((v) => (
                <span
                  key={v}
                  className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px] border border-slate-600"
                >
                  <span className="font-mono mr-1">{v}</span>
                  <span className="text-slate-300">
                    {SECTOR_ETFS[v] ?? v}
                  </span>
                </span>
              ))}
              {count > 3 && (
                <span className="text-xs text-slate-400">
                  +{count - 3} more
                </span>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {count > 0 && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-200">
              {count}
            </span>
          )}
          <span className="text-slate-500 text-xs">
            {open ? "▴" : "▾"}
          </span>
        </div>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 shadow-xl text-sm overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800">
            <input
              className="flex-1 bg-transparent outline-none text-slate-100 placeholder:text-slate-500 text-xs"
              placeholder="Search sectors or tickers…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {selected.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-[11px] text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.map((opt) => {
              const checked = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-900 text-left"
                >
                  <span
                    className={`h-4 w-4 flex items-center justify-center rounded border text-[10px] ${
                      checked
                        ? "bg-sky-500 border-sky-400 text-slate-950"
                        : "border-slate-500 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <div className="flex flex-col">
                    <span className="font-mono text-xs text-slate-100">
                      {opt.value}
                    </span>
                    <span className="text-xs text-slate-300">
                      {opt.label}
                    </span>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-slate-500">
                No sectors match that search.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------
   Page component
   ------------------------- */

export default function SectorPage() {
  const allTickers = Object.keys(SECTOR_ETFS);

  const options: MultiSelectOption[] = allTickers.map((t) => ({
    value: t,
    label: SECTOR_ETFS[t],
  }));

  const [selected, setSelected] = useState<string[]>([]);
  const [data, setData] = useState<SectorResult | null>(null);
  const [rows, setRows] = useState<SectorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runSectorAnalysis() {
    setLoading(true);
    setError(null);
    setData(null);
    setRows([]);

    try {
      const res = await fetch("/api/sector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectors: selected }),
      });

      const text = await res.text();

      if (!res.ok) {
        try {
          const errJson = JSON.parse(text);
          throw new Error(
            errJson.error ||
              errJson.detail ||
              `Sector analysis failed (${errJson.source ?? "unknown"})`
          );
        } catch {
          throw new Error(
            `Sector analysis failed: ${res.status} – ${text.slice(0, 200)}`
          );
        }
      }

      const json = JSON.parse(text) as SectorResult;

      if (json.error) {
        throw new Error(json.error);
      }

      setData(json);

      const mapped: SectorRow[] = (json.raw_rows ?? []).map((r: RawSectorRow) => {
        const breadth =
          typeof r.Breadth20 === "number" ? (r.Breadth20 as number) : null;

        return {
          etf: r.ETF,
          sector: r.Sector,
          score: r.Score ?? null,
          rvol: r.RVOL ?? null,
          breadth20: breadth,
          ret5: r["5D%"] ?? null,
          atrPct: r["ATR%"] ?? null,
          aboveTrend: (r["Above 20/50/200"] ?? null) as string | null,
          topCandidates: r.TopCandidates || "",
          raw: r,
        };
      });

      setRows(mapped);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function selectAll() {
    setSelected(allTickers);
  }

  const structured = data?.structured_view || {};
  const riskMode = structured.risk_mode ?? "neutral";
  const strong = structured.strong_sectors ?? [];
  const weak = structured.weak_sectors ?? [];

  const selectedSingleRow: SectorRow | null = useMemo(() => {
    if (!rows.length || selected.length !== 1) return null;
    const target = selected[0];
    return rows.find((r) => r.etf === target) ?? null;
  }, [rows, selected]);

  const multiCompare = selected.length > 1;

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
            Sector Rotation Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 text-center">
            Pick one or more sector ETFs, then run the analyzer to see risk tone,
            leaders, laggards, and tradeable rotation ideas.
          </p>
        </header>

        {/* Controls */}
        <section className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="text-sm font-medium text-slate-200">
              Sectors to analyze
            </h2>
            <button
              type="button"
              onClick={selectAll}
              className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:border-sky-500"
            >
              Select all
            </button>
          </div>

          <SectorMultiSelect
            options={options}
            selected={selected}
            onChange={setSelected}
          />

          <p className="text-xs text-slate-500">
            • Single selection: focused card for that sector.{" "}
            <br className="hidden md:block" />
            • Multiple selections: sectors are compared in the ranked table
            below.
          </p>

          <div className="flex justify-end pt-2">
            <button
              onClick={runSectorAnalysis}
              disabled={selected.length === 0 || loading}
              className="rounded-md px-4 py-2 text-sm font-medium bg-sky-600 hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Run sector analysis"}
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
              Choose sectors and run the analyzer to see a ranked dashboard,
              high-level risk tone, and trader commentary.
            </p>
          )}

          {data && (
            <div className="space-y-4">
              {/* High-level summary card */}
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 space-y-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase text-slate-500">
                      Risk tone
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        riskMode === "risk_on"
                          ? "bg-emerald-900/40 text-emerald-300 border border-emerald-500/40"
                          : riskMode === "risk_off"
                          ? "bg-rose-900/40 text-rose-300 border border-rose-500/40"
                          : "bg-slate-800 text-slate-200 border border-slate-600/60"
                      }`}
                    >
                      {RISK_LABEL[riskMode] ?? riskMode}
                    </span>
                  </div>
                  {structured.rotation_view && (
                    <div className="text-xs text-slate-300 max-w-xl text-right">
                      {structured.rotation_view}
                    </div>
                  )}
                </div>

                {/* Strong / weak chips */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <div className="text-xs uppercase text-emerald-400">
                      Leaders
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {strong.length === 0 && (
                        <span className="text-xs text-slate-500">
                          No clear leaders detected.
                        </span>
                      )}
                      {strong.map((s) => (
                        <span
                          key={s.etf}
                          className="px-2 py-1 rounded-full border border-emerald-500/50 text-[11px] text-emerald-200"
                        >
                          {s.etf} · {s.sector}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs uppercase text-rose-400">
                      Laggards
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {weak.length === 0 && (
                        <span className="text-xs text-slate-500">
                          No obvious laggards flagged.
                        </span>
                      )}
                      {weak.map((w) => (
                        <span
                          key={w.etf}
                          className="px-2 py-1 rounded-full border border-rose-500/50 text-[11px] text-rose-200"
                        >
                          {w.etf} · {w.sector}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {structured.notes && (
                  <div className="pt-2 border-t border-slate-800 text-xs text-slate-400">
                    {structured.notes}
                  </div>
                )}
              </div>

              {/* Single-sector focus card */}
              {selectedSingleRow && (
                <div className="rounded-2xl border border-sky-800 bg-slate-900/80 p-4 text-sm space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Focus: {selectedSingleRow.sector}{" "}
                        <span className="font-mono text-xs text-slate-400">
                          ({selectedSingleRow.etf})
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        You have one sector selected. Metrics below describe this
                        ETF only.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2 text-xs text-slate-300">
                    <div>
                      <div className="text-slate-500 uppercase mb-1">
                        Score
                      </div>
                      <div className="text-base font-semibold">
                        {selectedSingleRow.score ?? "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 uppercase mb-1">
                        RVOL
                      </div>
                      <div>
                        {selectedSingleRow.rvol != null
                          ? selectedSingleRow.rvol.toFixed(2)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 uppercase mb-1">
                        Breadth20
                      </div>
                      <div>
                        {selectedSingleRow.breadth20 != null
                          ? selectedSingleRow.breadth20.toFixed(2)
                          : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500 uppercase mb-1">
                        5D % / ATR %
                      </div>
                      <div>
                        {selectedSingleRow.ret5 != null
                          ? selectedSingleRow.ret5.toFixed(2)
                          : "—"}{" "}
                        /{" "}
                        {selectedSingleRow.atrPct != null
                          ? selectedSingleRow.atrPct.toFixed(2)
                          : "—"}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-slate-500 uppercase mb-1">
                        Above 20 / 50 / 200
                      </div>
                      <div>{selectedSingleRow.aboveTrend ?? "—"}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-slate-500 uppercase mb-1">
                        Top names
                      </div>
                      <div>
                        {selectedSingleRow.topCandidates || "No standouts."}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ranked comparison table */}
              {rows.length > 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <h3 className="text-sm font-semibold mb-1">
                    {multiCompare
                      ? `Comparing ${rows.length} sectors`
                      : "Sector snapshot"}
                  </h3>
                  <p className="text-[11px] text-slate-500 mb-2">
                    Higher scores indicate stronger combination of volume, breadth,
                    trend, and recent momentum.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="text-left py-1 pr-2">ETF</th>
                          <th className="text-left py-1 pr-2">Sector</th>
                          <th className="text-right py-1 pr-2">Score</th>
                          <th className="text-right py-1 pr-2">RVOL</th>
                          <th className="text-right py-1 pr-2">Breadth20</th>
                          <th className="text-right py-1 pr-2">5D %</th>
                          <th className="text-right py-1 pr-2">ATR %</th>
                          <th className="text-left py-1 pr-2">Trend</th>
                          <th className="text-left py-1 pr-2">Top names</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr
                            key={r.etf}
                            className={`border-b border-slate-900 hover:bg-slate-900/60 ${
                              selectedSingleRow &&
                              selectedSingleRow.etf === r.etf
                                ? "bg-slate-900/80"
                                : ""
                            }`}
                          >
                            <td className="py-1 pr-2 font-mono">{r.etf}</td>
                            <td className="py-1 pr-2 whitespace-nowrap text-slate-200">
                              {r.sector}
                            </td>
                            <td className="py-1 pr-2 text-right">
                              {r.score ?? "—"}
                            </td>
                            <td className="py-1 pr-2 text-right">
                              {r.rvol != null ? r.rvol.toFixed(2) : "—"}
                            </td>
                            <td className="py-1 pr-2 text-right">
                              {r.breadth20 != null
                                ? r.breadth20.toFixed(2)
                                : "—"}
                            </td>
                            <td className="py-1 pr-2 text-right">
                              {r.ret5 != null ? r.ret5.toFixed(2) : "—"}
                            </td>
                            <td className="py-1 pr-2 text-right">
                              {r.atrPct != null ? r.atrPct.toFixed(2) : "—"}
                            </td>
                            <td className="py-1 pr-2 text-xs whitespace-nowrap">
                              {r.aboveTrend ?? "—"}
                            </td>
                            <td className="py-1 pr-2 text-xs">
                              {r.topCandidates || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Commentary */}
              {data?.interpreted_results && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                  <h3 className="text-sm font-semibold mb-2">
                    Trader commentary
                  </h3>
                  <div className="text-xs text-slate-200 whitespace-pre-wrap">
                    {data.interpreted_results}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
