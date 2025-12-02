// app/api/lookup/route.ts

type LookupRequestBody = {
  ticker?: string;   // what your React page sends
  company?: string;  // future-proof: if you ever send company instead
  period?: string;
  interval?: string;
};

export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;
  const isDev = process.env.NODE_ENV !== "production";

  const body = (await req.json().catch(() => null)) as LookupRequestBody | null;

  const rawCompany =
    (body?.company ?? body?.ticker ?? "").toString().trim();

  const period = body?.period?.toString().trim() || undefined;
  const interval = body?.interval?.toString().trim() || undefined;

  if (!rawCompany) {
    return new Response(
      JSON.stringify({ error: "ticker/company is required" }),
      { status: 400 }
    );
  }

  // Dev helper: if there is no LOOKUP_BASE_URL, return a mock payload
  if (isDev && !base) {
    const mock = {
      symbol: rawCompany.toUpperCase(),
      lastPrice: 123.45,
      period_return_pct: 1.23,
      shortName: "Mock Corp",
      company: rawCompany,
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
    // This is exactly what FastAPI expects:
    //   DirectLookupRequest(company, period, interval)
    const backendBody: {
      company: string;
      period?: string;
      interval?: string;
    } = { company: rawCompany };

    if (period) backendBody.period = period;
    if (interval) backendBody.interval = interval;

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
        error:
          "Failed to call lookup backend (network / DNS / VNet issue)",
        source: "next-api-fetch",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
