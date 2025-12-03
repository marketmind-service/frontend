// app/api/sector/route.ts
import { NextRequest } from "next/server";

type SectorRequestBody = {
  sectors?: string[];
};

export async function POST(req: NextRequest) {
  const base = process.env.BRIDGE_URL;

  if (!base) {
    return new Response(
      JSON.stringify({
        error: "BRIDGE_URL not set on server",
        source: "next-api",
      }),
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as SectorRequestBody | null;
  const sectors = body?.sectors ?? [];

  const trimmedBase = base.replace(/\/+$/, "");
  const isLocalFastApi =
    trimmedBase.startsWith("http://127.0.0.1") ||
    trimmedBase.startsWith("http://localhost");

  const targetUrl = isLocalFastApi
    ? `${trimmedBase}/api/sector`
    : `${trimmedBase}/api/sectorbridge`;

  try {
    const backendBody = { sectors };

    const resp = await fetch(targetUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendBody),
    });

    const text = await resp.text();

    if (!resp.ok) {
      return new Response(
        JSON.stringify({
          error: "Sector backend returned non-OK status",
          source: "sector-backend",
          backendStatus: resp.status,
          backendBodyPreview: text.slice(0, 500),
        }),
        { status: 500 }
      );
    }


    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: "Failed to call sector backend (network / DNS / VNet issue)",
        source: "next-api-fetch",
        details: err?.message ?? String(err),
      }),
      { status: 500 }
    );
  }
}
