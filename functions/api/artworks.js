/* ============================================
   Cloudflare Pages Functions — Neon API
   /api/artworks
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

    const artworks = await sql`
      SELECT id, title, medium, year, dimensions, description, image_url, is_featured, is_published, created_at
      FROM artworks
      WHERE is_published = true
      ORDER BY created_at DESC
    `;

    return new Response(JSON.stringify(artworks), {
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
