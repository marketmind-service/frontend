// app/api/lookup/route.ts

export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;
  const isDev = process.env.NODE_ENV !== "production";

  const body = (await req.json().catch(() => null)) as
    | { ticker?: string; company?: string; period?: string; interval?: string }
    | null;

  const { ticker, company, period, interval } = body ?? {};

  // what we will actually send to the backend
  const companyId = (company ?? ticker ?? "").toString().trim();

  if (!companyId) {
    return new Response(
      JSON.stringify({ error: "ticker/company is required" }),
      { status: 400 }
    );
  }

  // In dev, return mock so you never get blocked while coding
  if (isDev || !base) {
    const mock = {
      symbol: companyId.toUpperCase(),
      lastPrice: 123.45,
      period_return_pct: 1.23,
      shortName: "Mock Corp",
      company: companyId,
      period,
      interval,
    };

    return Response.json(mock, { status: 200 });
  }

  // In production, call the real FastAPI backend:
  //   POST {LOOKUP_BASE_URL}/api/lookup
  //   body: { company, period, interval }
  try {
    const backendBody = {
      company: companyId,
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
