// app/api/lookup/route.ts

type LookupRequestBody = {
  ticker?: string;
  period?: string;
  interval?: string;
};

export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;
  const isDev = process.env.NODE_ENV !== "production";

  const body = (await req.json().catch(() => null)) as LookupRequestBody | null;
  const ticker = body?.ticker?.toString().trim();
  const period = body?.period;
  const interval = body?.interval;

  if (!ticker) {
    return new Response(
      JSON.stringify({ error: "ticker is required" }),
      { status: 400 }
    );
  }

  // In dev, if LOOKUP_BASE_URL is missing, return a mock so you can still code
  if (isDev && !base) {
    const mock = {
      symbol: ticker.toUpperCase(),
      lastPrice: 123.45,
      period_return_pct: 1.23,
      shortName: "Mock Corp",
      company: ticker,
      period,
      interval,
      tail_ohlcv: null,
    };

    return Response.json(mock, { status: 200 });
  }

  if (!base) {
    return new Response(
      JSON.stringify({
        error: "LOOKUP_BASE_URL not set on server",
        source: "next-api",
      }),
      { status: 500 }
    );
  }

  try {
    // Backend expects { company, period, interval }
    const backendBody = {
      company: ticker,
      period,
      interval,
    };

    const resp = await fetch(`${base}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendBody),
    });

    const text = await resp.text();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({
          error: "Lookup backend returned non-OK status",
          source: "lookup-backend",
          backendStatus: resp.status,
          backendBodyPreview: text.slice(0, 500),
        }),
        { status: 500 }
      );
    }

    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to call lookup backend (network / DNS / VNet issue)",
        source: "next-api-fetch",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
