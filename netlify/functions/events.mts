import type { Config } from '@netlify/functions';
import { sql } from 'drizzle-orm';
import { getDb } from '../../db/index.js';
import { usageCounts } from '../../db/schema.js';
import { isValidEvent } from '../../lib/validate.js';

export default async (req: Request) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (req.headers.get('origin') !== new URL(req.url).origin) return new Response('Forbidden', { status: 403, headers });
  if (req.headers.get('dnt') === '1') return new Response(null, { status: 204, headers });
  if (!req.headers.get('content-type')?.startsWith('application/json')) return new Response('Expected JSON', { status: 415, headers });
  const reader = req.body?.getReader();
  if (!reader) return new Response('Invalid event', { status: 400, headers });
  let bytes = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 512) { await reader.cancel(); return new Response('Too large', { status: 413, headers }); }
      chunks.push(value);
    }
    const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (!isValidEvent(body)) return new Response('Invalid event', { status: 400, headers });
    try {
      await getDb().insert(usageCounts).values({ day: new Date().toISOString().slice(0, 10), event: body.event, symptom: body.symptom })
        .onConflictDoUpdate({ target: [usageCounts.day, usageCounts.event, usageCounts.symptom], set: { count: sql`${usageCounts.count} + 1` } });
      return new Response(null, { status: 204, headers });
    } catch {
      return new Response('Usage counting unavailable', { status: 503, headers });
    }
  } catch { return new Response('Invalid event', { status: 400, headers }); }
};

export const config: Config = {
  path: '/api/events',
  rateLimit: { windowLimit: 60, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
