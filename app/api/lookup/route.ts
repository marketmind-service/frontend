export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;
  const isDev = process.env.NODE_ENV !== "production";

  const body = await req.json().catch(() => null);
  const { ticker, period, interval } = body ?? {};

  // In dev, return mock so you never get blocked while coding
  if (isDev || !base) {
    const mock = {
      symbol: (ticker || "MOCK").toUpperCase(),
      lastPrice: 123.45,
      period_return_pct: 1.23,
      shortName: "Mock Corp",
      ticker,
      period,
      interval,
    };

    return Response.json(mock, { status: 200 });
  }

  // In production, try the real backend
  try {
    const resp = await fetch(`${base}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
