import { apiMode } from '@/lib/api/api';
import { mockUploads } from '@/lib/api/mocks/uploads';

/**
 * Stands in for the signed storage URL (Cloudflare R2) in mock mode only: the browser PUTs the
 * receipt here exactly as it would to R2. Absent in live mode.
 */
export async function PUT(request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  if (apiMode() !== 'mock') return new Response(null, { status: 404 });
  const key = (await params).key.join('/');
  const body = await request.arrayBuffer();
  mockUploads().set(key, {
    size: body.byteLength,
    type: request.headers.get('content-type') ?? 'application/octet-stream',
  });
  return new Response(null, { status: 200 });
}

/** Download of a mock receipt: a one-line placeholder file. */
export async function GET() {
  if (apiMode() !== 'mock') return new Response(null, { status: 404 });
  return new Response('Pièce justificative de démonstration (mode mock).', {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'content-disposition': 'attachment; filename="piece-demo.txt"',
    },
  });
}
