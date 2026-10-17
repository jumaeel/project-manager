/* ---------- icons: inlined Lucide subset (src/00-icons.js), rendered to inline svg ---------- */
import { ICONS } from 'virtual:icons';
import { esc } from './utils.js';

export const _icCache = {};
export function ic(name, size = 16, cls = '') {
  const k = name + '|' + size + '|' + cls;
  if (_icCache[k]) return _icCache[k];
  const inner = ICONS[name] || '<rect x="5" y="5" width="14" height="14" rx="3"/>';
  return (_icCache[k] =
    `<svg class="i ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`);
}
/* Workspace icon (the Syllabi app icon, public/workspace-icon.png), plus the name as the wordmark. */
export const LOGO = (h = 22) =>
  `<span class="logo" role="img" aria-label="Project Manager" style="display:inline-flex;align-items:center;gap:${Math.round(h * 0.3)}px;font-weight:650;font-size:${Math.round(h * 0.68)}px;letter-spacing:-0.01em;white-space:nowrap">${MARK(h)}Project Manager</span>`;
export const MARK = (px = 22) =>
  `<img src="./workspace-icon.png" width="${px}" height="${px}" alt="" aria-hidden="true" style="display:block;border-radius:${Math.round(px * 0.22)}px">`;
export function wsLogo(w, px = 22) {
  return w && w.brand
    ? `<span class="ws-logo brand" style="width:${px}px;height:${px}px">${MARK(px)}</span>`
    : `<span class="ws-logo" style="--c:${w.c};width:${px}px;height:${px}px;font-size:${Math.max(9, Math.round(px * 0.46))}px">${esc(w.name[0])}</span>`;
}
