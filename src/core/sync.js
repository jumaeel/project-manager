/* ---------- cloud sync (Cloudflare D1 through /api) ----------
   The browser keeps a local copy for instant loads; the server holds the real one.
   When /api is missing (plain `npm run dev`) the app runs local-only. */
import { S, setSaveHook } from './store.js';

let version = 0;
let pushT = null;
let pushing = false;
let again = false;
export const cloud = { on: false, onConflict: null, onError: null };

const snapshot = () => ({ data: S.data, prefs: S.prefs, views: S.views });
function apply(st) {
  if (!st) return;
  if (st.data) S.data = st.data;
  if (st.prefs) Object.assign(S.prefs, st.prefs);
  if (st.views) S.views = st.views;
}

async function api(method, path, body) {
  const r = await fetch('/api/' + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  const isJson = (r.headers.get('content-type') || '').includes('application/json');
  return { status: r.status, json: isJson ? await r.json() : null, isJson };
}

/* 'ok' (signed in, state loaded), 'login' (needs password) or 'local' (no server). */
export async function startSync() {
  let res;
  try {
    res = await api('GET', 'state');
  } catch {
    return 'local';
  }
  if (!res.isJson) return 'local';
  if (res.status === 401) return 'login';
  if (res.status !== 200) return 'local';
  cloud.on = true;
  version = res.json.version;
  if (res.json.state) apply(res.json.state);
  else push(true); // first sign-in: upload what this browser has
  setSaveHook(() => push());
  return 'ok';
}

export async function signIn(password) {
  const res = await api('POST', 'login', { password });
  return res.status === 200;
}

export async function signOut() {
  await api('DELETE', 'login').catch(() => {});
}

export function push(now) {
  clearTimeout(pushT);
  pushT = setTimeout(send, now ? 0 : 700);
}

async function send() {
  if (pushing) return void (again = true);
  pushing = true;
  try {
    const res = await api('PUT', 'state', { state: snapshot(), version });
    if (res.status === 200) version = res.json.version;
    else if (res.status === 409) {
      version = res.json.version;
      apply(res.json.state);
      cloud.onConflict?.();
    } else if (res.status === 401) cloud.onError?.('signed-out');
    else cloud.onError?.('failed');
  } catch {
    cloud.onError?.('offline');
  } finally {
    pushing = false;
    if (again) {
      again = false;
      push(true);
    }
  }
}
