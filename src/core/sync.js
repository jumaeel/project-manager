/* ---------- cloud sync (Cloudflare D1 through /api) ----------
   The browser keeps a local copy for instant loads; the server holds the real one.
   When /api is missing (plain `npm run dev`) the app runs local-only.
   Unsent edits are marked in localStorage (with the server version they were
   based on), so closing the tab mid-save doesn't lose them: the next load
   sends them, unless another device has saved since. */
import { S, saved, setSaveHook, writeLocal } from './store.js';

const MARK = 'pm.sync';
const readMark = () => {
  try {
    return JSON.parse(localStorage.getItem(MARK)) || {};
  } catch {
    return {};
  }
};
const writeMark = m => {
  try {
    localStorage.setItem(MARK, JSON.stringify(m));
  } catch {
    /* storage blocked */
  }
};

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

/* 'ok' (signed in, state loaded), 'login' (needs password), 'local' (no server)
   or 'error' (server failed: run from this device's copy). */
export async function startSync() {
  let res;
  try {
    res = await api('GET', 'state');
  } catch {
    return 'local';
  }
  if (res.status >= 500) return 'error';
  if (!res.isJson) return 'local';
  if (res.status === 401) return 'login';
  if (res.status !== 200) return 'error';
  cloud.on = true;
  version = res.json.version;
  const mark = readMark();
  const unsent = saved && mark.dirty && mark.base === version;
  if (res.json.state && !unsent) apply(res.json.state);
  else push(true); // first sign-in, or edits that never reached the server
  setSaveHook(() => push());
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
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
  writeMark({ dirty: true, base: version });
  clearTimeout(pushT);
  pushT = setTimeout(send, now ? 0 : 700);
}

/* Tab closing: save locally now and try one last send (keepalive caps the body at 64 KB). */
function flush() {
  if (!cloud.on || !readMark().dirty) return;
  writeLocal();
  const body = JSON.stringify({ state: snapshot(), version });
  if (body.length < 60000 && !pushing)
    fetch('/api/state', { method: 'PUT', body, keepalive: true, credentials: 'same-origin', headers: { 'content-type': 'application/json' } }).catch(() => {});
}

async function send() {
  pushT = null;
  if (pushing) return void (again = true);
  pushing = true;
  try {
    const res = await api('PUT', 'state', { state: snapshot(), version });
    if (res.status === 200) {
      version = res.json.version;
      writeMark({ dirty: !!pushT || again, base: version });
    } else if (res.status === 409) {
      version = res.json.version;
      apply(res.json.state);
      writeMark({ dirty: false, base: version });
      writeLocal();
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
