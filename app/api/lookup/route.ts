export async function POST(req: Request) {
  const base = process.env.LOOKUP_BASE_URL;
  if (!base) {
    return new Response(
      JSON.stringify({ error: "LOOKUP_BASE_URL not set on server" }),
      { status: 500 }
    );
  }

  const body = await req.json(); // { ticker, period, interval }

  const resp = await fetch(`${base}/api/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await resp.json();
  return Response.json(data, { status: resp.status });
}
