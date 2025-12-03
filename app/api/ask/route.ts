// app/api/ask/route.ts

export async function POST(req: Request) {
  const base = process.env.ROUTER_BASE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({
        error: "ROUTER_BASE_URL not set on server",
        source: "next-api",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // read prompt from the frontend
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt?.toString().trim() ?? "";

  if (!prompt) {
    return new Response(
      JSON.stringify({ error: "prompt is required" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  // same pattern as lookup: local FastAPI vs Azure routerbridge
  const trimmedBase = base.replace(/\/+$/, "");
  const isLocal =
    trimmedBase.startsWith("http://127.0.0.1") ||
    trimmedBase.startsWith("http://localhost");

  // local dev → FastAPI /api/ask
  // prod (Azure) → routerbridge function /api/routerbridge
  const targetUrl = isLocal
    ? `${trimmedBase}/api/ask`
    : `${trimmedBase}/api/routerbridge`;

  try {
    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const text = await resp.text();

    if (!resp.ok) {
      // bubble up what the router backend said so you can debug
      return new Response(
        JSON.stringify({
          error: "Router backend returned non-OK status",
          source: "router-backend",
          backendStatus: resp.status,
          backendBodyPreview: text.slice(0, 500),
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // router backend already returns JSON AgentState,
    // so just pass it straight through
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to call router backend (network / DNS / VNet issue)",
        source: "next-api-fetch",
        details: err?.message ?? String(err),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
