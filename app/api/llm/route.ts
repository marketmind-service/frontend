export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const prompt = body?.prompt ?? "";

  // Mock for now
  const mock: LlmResponse = {
    answer: `This is a mock answer for: "${prompt}"\n\nLater this will run against the real LLM service.`,
    sources: [
      { title: "Lookup microservice", type: "internal" },
      { title: "SMA EMA microservice", type: "internal" },
    ],
  };

  return Response.json(mock, { status: 200 });
}
