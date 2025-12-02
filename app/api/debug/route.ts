// app/api/debug/route.ts
export async function GET() {
  return Response.json({
    lookup: process.env.LOOKUP_BASE_URL || "not set",
  });
}
