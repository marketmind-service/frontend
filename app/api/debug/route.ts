export async function GET() {
  return Response.json({
    NODE_ENV: process.env.NODE_ENV ?? null,
    LOOKUP_BASE_URL: process.env.LOOKUP_BASE_URL ?? null,
  });
}
