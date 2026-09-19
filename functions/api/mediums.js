/* ============================================
   Cloudflare Pages Functions — Neon API
   /api/mediums
   ============================================ */

import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  const { env } = context;

  try {
    const sql = env.DATABASE_URL ? neon(env.DATABASE_URL) : null;

    if (!sql) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const mediums = await sql`
      SELECT id, name, color, sort_order
      FROM mediums
      ORDER BY sort_order ASC
    `;

    return new Response(JSON.stringify(mediums), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
