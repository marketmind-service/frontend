// app/api/ask/route.ts

type AskRequestBody = {
  prompt?: string;
};

export async function POST(req: Request) {
  const base = process.env.BRIDGE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({
        error: "BRIDGE_URL not set on server",
        source: "next-api",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const body = (await req.json().catch(() => null)) as AskRequestBody | null;
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

  // same pattern as lookup/news/sector: local FastAPI vs Azure Function
  const trimmedBase = base.replace(/\/+$/, "");
  const isLocal =
    trimmedBase.startsWith("http://127.0.0.1") ||
    trimmedBase.startsWith("http://localhost");

  // local dev → FastAPI /api/ask
  // Azure → routerbridge function /api/routerbridge
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

    // Pass through the AgentState JSON from router
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