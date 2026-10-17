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
/* Project Manager brand: a board glyph on a dark tile, plus the name as the wordmark. */
export const LOGO = (h = 22) =>
  `<span class="logo" role="img" aria-label="Project Manager" style="display:inline-flex;align-items:center;gap:${Math.round(h * 0.3)}px;font-weight:650;font-size:${Math.round(h * 0.68)}px;letter-spacing:-0.01em;white-space:nowrap">${MARK(h)}Project Manager</span>`;
export const MARK = (px = 22) =>
  `<svg width="${px}" height="${px}" viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="5" fill="#1D1C1A"/><g fill="#fff"><rect x="5" y="6" width="3.6" height="12" rx="1"/><rect x="10.2" y="6" width="3.6" height="8" rx="1"/><rect x="15.4" y="6" width="3.6" height="10" rx="1"/></g></svg>`;
export function wsLogo(w, px = 22) {
  return w && w.brand
    ? `<span class="ws-logo brand" style="width:${px}px;height:${px}px">${MARK(px)}</span>`
    : `<span class="ws-logo" style="--c:${w.c};width:${px}px;height:${px}px;font-size:${Math.max(9, Math.round(px * 0.46))}px">${esc(w.name[0])}</span>`;
}
