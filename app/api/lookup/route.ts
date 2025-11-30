export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;

  // Read the request body
  const body = await req.json().catch(() => null);

  if (!base) {
    // This means the env var is NOT set in this environment
    return new Response(
      JSON.stringify({
        error: "LOOKUP_BASE_URL not set on server",
        source: "next-api",
        hint: "Check Azure Static Web App config → Environment variables",
      }),
      { status: 500 }
    );
  }

  try {
    const resp = await fetch(`${base}/api/lookup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const text = await resp.text();

    // If backend itself returns 500 / non-OK, surface that clearly
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

    // Normal OK case
    try {
      const data = JSON.parse(text);
      return Response.json(data, { status: 200 });
    } catch {
      return new Response(
        JSON.stringify({
          error: "Failed to parse backend JSON",
          source: "next-api",
          backendRaw: text.slice(0, 500),
        }),
        { status: 500 }
      );
    }
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
