/* Single-user auth: the password lives in the APP_PASSWORD secret. A session is
   `<expiry>.<hmac(expiry)>` in an HttpOnly cookie, signed with the password, so
   changing the password signs every device out. */
const COOKIE = 'pm_session';
const DAYS = 90;
const enc = new TextEncoder();

async function sign(msg, key) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, enc.encode(msg));
  return [...new Uint8Array(s)].map(b => b.toString(16).padStart(2, '0')).join('');
}

export function same(a, b) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function sessionCookie(env) {
  const exp = Date.now() + DAYS * 864e5;
  const v = `${exp}.${await sign(String(exp), env.APP_PASSWORD)}`;
  return `${COOKIE}=${v}; Path=/; Max-Age=${DAYS * 86400}; HttpOnly; Secure; SameSite=Strict`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

export async function authed(request, env) {
  if (!env.APP_PASSWORD) return false;
  const m = (request.headers.get('cookie') || '').match(new RegExp(`(?:^|; )${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return same(sig, await sign(exp, env.APP_PASSWORD));
}
