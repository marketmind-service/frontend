// app/api/lookup/route.ts

type LookupRequestBody = {
  ticker?: string;
  company?: string;
  period?: string;
  interval?: string;
};

export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({
        error: "LOOKUP_BASE_URL not set on server",
        source: "next-api",
      }),
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as LookupRequestBody | null;

  // accept either "ticker" or "company" from the client
  const id = (body?.company ?? body?.ticker ?? "").toString().trim();
  const period = body?.period?.toString().trim() || undefined;
  const interval = body?.interval?.toString().trim() || undefined;

  if (!id) {
    return new Response(
      JSON.stringify({ error: "ticker/company is required" }),
      { status: 400 }
    );
  }

  try {
    // send both company and ticker so the function can use whatever it expects
    const backendBody = {
      company: id,
      ticker: id,
      period,
      interval,
    };

    // 🔴 IMPORTANT: this hits the FUNCTIONS APP, not the container directly
    const resp = await fetch(`${base}/api/lookupbridge`, {
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

    // just stream through whatever JSON the function returns
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
