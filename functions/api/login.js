import { clearCookie, same, sessionCookie } from '../../server/auth.js';

export async function onRequestPost({ request, env }) {
  const { password = '' } = await request.json().catch(() => ({}));
  if (!env.APP_PASSWORD || !same(String(password), env.APP_PASSWORD)) {
    await new Promise(r => setTimeout(r, 800)); // slow down guessing
    return Response.json({ error: 'Wrong password' }, { status: 401 });
  }
  return Response.json({ ok: true }, { headers: { 'set-cookie': await sessionCookie(env) } });
}

export async function onRequestDelete() {
  return Response.json({ ok: true }, { headers: { 'set-cookie': clearCookie() } });
}
