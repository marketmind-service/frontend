// app/api/news/route.ts

export async function POST(req: Request) {
  const base = process.env.BRIDGE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({ error: "BRIDGE_URL is not set on the frontend" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Allow { company } or { prompt } from the frontend
  const companyInput = body?.company ?? body?.prompt;
  const company =
    typeof companyInput === "string" ? companyInput.trim() : undefined;

  // Default number of news items if not supplied
  const itemsRaw = body?.items;
  const items =
    typeof itemsRaw === "number" && Number.isFinite(itemsRaw) && itemsRaw > 0
      ? itemsRaw
      : 10;

  if (!company) {
    return new Response(
      JSON.stringify({
        error: "Missing or invalid 'company' (or 'prompt')",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // This matches DirectNewsRequest in app.py
    const res = await fetch(`${base}/api/newsbridge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company, items }),
    });

    const text = await res.text();

    try {
      const json = JSON.parse(text);
      return new Response(JSON.stringify(json), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Backend returned non-JSON (e.g. HTML error page from a proxy)
      return new Response(
        JSON.stringify({
          error: "Backend returned non-JSON",
          raw: text.slice(0, 200),
        }),
        {
          status: res.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (err) {
    console.error("Error proxying to news backend", err);
    return new Response(
      JSON.stringify({ error: "Failed to reach news backend" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
