export const dynamic = 'force-dynamic';
export async function GET(req: Request) { return Response.json({ env: process.env, url: req.url }); }
