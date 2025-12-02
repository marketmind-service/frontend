// app/api/lookup/route.ts

type LookupRequestBody = {
  company?: string;
  period?: string;
  interval?: string;
};

export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;

  // Must exist in production — otherwise 500
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

  // extract fields
  const company = body?.company?.toString().trim() || "";
  const period = body?.period?.toString().trim() || undefined;
  const interval = body?.interval?.toString().trim() || undefined;

  // validate required field
  if (!company) {
    return new Response(
      JSON.stringify({ error: "company is required" }),
      { status: 400 }
    );
  }

  try {
    // build POST body for function app
    const backendBody = {
      company,
      period,
      interval,
    };

    // IMPORTANT: call the Azure Function route
    const resp = await fetch(`${base}/api/lookupbridge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendBody),
    });

    const text = await resp.text();

    // backend error?
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

    // pass through backend response as-is
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to call lookup backend (network or DNS)",
        source: "next-api-fetch",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
