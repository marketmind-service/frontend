// app/api/llm/route.ts

type LlmSource = {
  title: string;
  url?: string;
  type?: string;
};

type LlmResponse = {
  answer: string;
  sources?: LlmSource[];
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { prompt?: string } | null;
  const prompt = body?.prompt ?? "";

  // Mock for now – replace with real LLM call later
  const mock: LlmResponse = {
    answer: `This is a mock answer for: "${prompt}"\n\nLater this will run against the real LLM service.`,
    sources: [
      { title: "Lookup microservice", type: "internal" },
      { title: "SMA / EMA Analyzer", type: "internal" },
    ],
  };

  return Response.json(mock, { status: 200 });
}
