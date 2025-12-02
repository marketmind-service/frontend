export async function POST(req: Request) {
  const base = process.env.NEWS_BASE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({ error: "NEWS_BASE_URL is not set" }),
      { status: 500 }
    );
  }

  const body = await req.json();

  if (!body?.prompt || typeof body.prompt !== "string") {
    return new Response(
      JSON.stringify({ error: "Missing or invalid 'prompt'" }),
      { status: 400 }
    );
  }

  const res = await fetch(`${base}/api/news-agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: body.prompt }),
  });

  const text = await res.text();

  try {
    const json = JSON.parse(text);
    return new Response(JSON.stringify(json), { status: res.status });
  } catch {
    return new Response(text, { status: res.status });
  }
}
