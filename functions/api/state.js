import { authed } from '../../server/auth.js';

/* The whole workspace is one JSON row. Writes carry the version they were based on;
   a stale version gets 409 plus the current state, so a second device never
   silently overwrites newer work. */
const deny = () => Response.json({ error: 'Sign in' }, { status: 401 });

export async function onRequestGet({ request, env }) {
  if (!(await authed(request, env))) return deny();
  const row = await env.DB.prepare('SELECT data, version FROM state WHERE id = 1').first();
  return Response.json(row ? { state: JSON.parse(row.data), version: row.version } : { state: null, version: 0 });
}

export async function onRequestPut({ request, env }) {
  if (!(await authed(request, env))) return deny();
  const text = await request.text();
  if (text.length > 20e6) return Response.json({ error: 'Too large' }, { status: 413 });
  const { state, version } = JSON.parse(text);
  if (!state || typeof version !== 'number') return Response.json({ error: 'Bad request' }, { status: 400 });
  const data = JSON.stringify(state);
  const now = Date.now();
  const r =
    version === 0
      ? await env.DB.prepare('INSERT OR IGNORE INTO state (id, data, version, updated) VALUES (1, ?, 1, ?)').bind(data, now).run()
      : await env.DB.prepare('UPDATE state SET data = ?, version = version + 1, updated = ? WHERE id = 1 AND version = ?').bind(data, now, version).run();
  if (!r.meta.changes) {
    const row = await env.DB.prepare('SELECT data, version FROM state WHERE id = 1').first();
    return Response.json({ error: 'Conflict', state: row && JSON.parse(row.data), version: row ? row.version : 0 }, { status: 409 });
  }
  return Response.json({ version: version + 1 });
}
