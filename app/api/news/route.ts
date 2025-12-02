// app/api/news/route.ts

export async function POST(req: Request) {
  const base = process.env.NEWS_BASE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({ error: "NEWS_BASE_URL is not set on the frontend" }),
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

  const prompt = body?.prompt;
  if (!prompt || typeof prompt !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'prompt'" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const res = await fetch(`${base}/api/news-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const text = await res.text();
    // Pass backend JSON through as-is if possible
    try {
      const json = JSON.parse(text);
      return new Response(JSON.stringify(json), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // Backend returned non-JSON, wrap it
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
