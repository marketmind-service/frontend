export async function GET() {
  return Response.json({
    NODE_ENV: process.env.NODE_ENV ?? null,
    BRIDGE_URL: process.env.LOOKUP_BASE_URL ?? null,
  });
}
