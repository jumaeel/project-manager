/* ---------------- TRACTION (EOS) ---------------- */
import { TODAY, esc, fmtDate, iso, parse } from '../core/utils.js';
import { ic } from '../core/icons.js';
import { D, S, mem, visibleProjects } from '../core/store.js';
import { av, empty } from '../ui/helpers.js';
import { GUIDES, VTO_HELP } from './traction-guides.js';
import {
  CHECKUP,
  ROLE_SLOTS,
  agendaFor,
  eos,
  inFreeze,
  isOverdueTodo,
  lastWeeks,
  measOk,
  personOf,
  quarterId,
  quarterLabel,
  rockStats,
  todoStats,
  weekId,
  weekLabel,
} from '../core/eos.js';

/* ---------- shared bits ---------- */
const people = () => D().members.filter(m => m.status !== 'deactivated');
function ownerSel(path, val, id, cls = '') {
  return `<select class="select ${cls}" id="${id}" data-in="eos" data-p="${path}" data-render="1" aria-label="Owner"><option value="">No owner</option>${people()
    .map(m => `<option value="${m.id}" ${m.id === val ? 'selected' : ''}>${esc(m.name)}</option>`)
    .join('')}</select>`;
}
const field = (path, val, id, ph = '', extra = '') =>
  `<input class="input" id="${id}" data-in="eos" data-p="${path}" value="${esc(val)}" placeholder="${esc(ph)}" ${extra}>`;
const area = (path, val, id, ph = '', rows = 3, list = false) =>
  `<textarea class="textarea" id="${id}" data-in="eos" data-p="${path}" ${list ? 'data-list="1"' : ''} rows="${rows}" placeholder="${esc(ph)}">${esc(list ? (val || []).join('\n') : val)}</textarea>`;
const freezeBanner = () =>
  inFreeze()
    ? `<div class="alert info" style="margin-bottom:14px">${ic('snowflake', 15)}<span><b>Exam season: release freeze.</b> Oct/Nov and May/Jun are exam peaks. Ship fixes only.</span></div>`
    : '';
const starterBtn = () =>
  eos().drafts
    ? ''
    : `<button class="btn btn-secondary" data-a="eosStarter" data-tip="Fills blanks and adds missing items only">${ic('sparkles', 14)}Fill in Syllabi drafts</button>`;
/* Collapsible "How to fill it" panel at the top of each page; the open/closed choice is saved. */
function guide(route) {
  const open = !(S.prefs.guidesClosed || {})[route];
  return `<section class="panel tr-guide ${open ? 'open' : ''}"><button class="tr-guide-h" data-a="eosGuide" data-r="${route}" aria-expanded="${open}">${ic('book-open', 15)}<b>How to fill it</b><span class="sp"></span>${ic('chevron-down', 15, 'tr-guide-chev')}</button>${open ? `<div class="tr-guide-b">${GUIDES[route]}</div>` : ''}</section>`;
}
const header = (title, sub, acts = '', route = '') =>
  `<div class="ph"><div><h1>${title}</h1><p>${sub}</p></div><div class="acts">${acts}</div></div>${route ? guide(route) : ''}`;
const addForm = (submit, id, ph, extra = '') =>
  `<form class="row tr-add" data-submit="${submit}" style="gap:8px;margin-bottom:14px"><input class="input grow" id="${id}" placeholder="${esc(ph)}" autocomplete="off">${extra}<button class="btn btn-primary">${ic('plus', 14)}Add</button></form>`;
const pctBar = (pct, goal) =>
  `<span class="tr-bar" role="img" aria-label="${pct}%"><span style="width:${Math.min(100, pct)}%;background:${pct >= goal ? 'var(--green)' : 'var(--amber)'}"></span>${goal ? `<i style="left:${goal}%"></i>` : ''}</span>`;

/* =====================================================================
   ISSUES (IDS)
   ===================================================================== */
export function issueRows(list, opt = {}) {
  const open = S.ui.issueOpen;
  return list
    .map(x => {
      const exp = open === x.id;
      return `<div class="tr-issue ${x.status === 'solved' ? 'solved' : ''}">
        <div class="row" style="gap:8px">
          <button class="tr-prio p${x.priority || 0}" data-a="eosIssuePrio" data-id="${x.id}" data-tip="Priority (click to change)" aria-label="Priority ${x.priority || 'none'}">${x.priority || '·'}</button>
          <input class="input tr-flat grow" id="is-t-${x.id}" data-in="eos" data-p="issues/${x.id}/title" value="${esc(x.title)}" aria-label="Issue">
          ${opt.compact ? '' : `<span class="hide-m" style="width:150px">${ownerSel(`issues/${x.id}/owner`, x.owner, `is-o-${x.id}`, 'select-sm')}</span>`}
          ${x.status === 'solved' ? `<span class="badge green">Solved</span><button class="ibtn ibtn-sm" data-a="eosIssueReopen" data-id="${x.id}" data-tip="Reopen" aria-label="Reopen">${ic('rotate-ccw', 14)}</button>` : `<button class="btn btn-secondary btn-sm" data-a="eosIssueToggle" data-id="${x.id}">${exp ? 'Close' : 'IDS'}</button>`}
          ${opt.compact ? '' : `<button class="ibtn ibtn-sm" data-a="eosIssueTerm" data-id="${x.id}" data-tip="Move to ${x.term === 'long' ? 'short' : 'long'}-term" aria-label="Move list">${ic('arrow-left-right', 14)}</button><button class="ibtn ibtn-sm" data-a="eosDel" data-coll="issues" data-id="${x.id}" data-tip="Delete" aria-label="Delete">${ic('trash-2', 14)}</button>`}
        </div>
        ${
          exp
            ? `<div class="tr-ids">
          <div class="tr-steps"><span><b>Identify</b> the real problem, not the symptom.</span><span><b>Discuss</b> once; no tangents.</span><span><b>Solve</b> with a to-do someone owns.</span></div>
          ${area(`issues/${x.id}/notes`, x.notes, `is-n-${x.id}`, 'Notes: what is the real issue? What did we decide?', 3)}
          <form class="row" data-submit="eosSolve" data-id="${x.id}" style="gap:8px;flex-wrap:wrap"><input class="input grow" id="solve-${x.id}" placeholder="To-do that solves it (due in 7 days)" value="${esc('Follow up: ' + x.title)}">${ownerSel(`issues/${x.id}/owner`, x.owner, `is-o2-${x.id}`)}<button class="btn btn-primary">${ic('check', 14)}Solve</button></form>
        </div>`
            : ''
        }
      </div>`;
    })
    .join('');
}
export function pageIssues() {
  const e = eos();
  const term = S.ui.issueTerm || 'short';
  const open = e.issues.filter(x => x.status === 'open' && x.term === term).sort((a, b) => (a.priority || 9) - (b.priority || 9) || a.created - b.created);
  const solved = e.issues.filter(x => x.status === 'solved' && x.term === term).sort((a, b) => b.solved - a.solved);
  const n = t => e.issues.filter(x => x.status === 'open' && x.term === t).length;
  return `<div class="page" style="max-width:980px">
    ${header('Issues', 'One list. Rank the top 3, then identify, discuss and solve them.', starterBtn(), 'issues')}
    <div class="tabs" style="margin-bottom:14px">${[
      ['short', `Short-term · ${n('short')}`],
      ['long', `Long-term · ${n('long')}`],
    ]
      .map(([k, l]) => `<button class="tab ${term === k ? 'on' : ''}" data-a="set" data-k="issueTerm" data-v="${k}">${l}</button>`)
      .join('')}</div>
    ${addForm('eosAddIssue', 'new-issue', term === 'short' ? 'Add an issue for this week…' : 'Add a long-term issue (for the quarterly meeting)…')}
    <section class="panel">${open.length ? issueRows(open) : empty('circle-alert', 'No open issues', 'Add anything that is in the way: problems, ideas, decisions.', '', '', 3)}</section>
    ${solved.length ? `<details class="tr-details"><summary>${solved.length} solved</summary><section class="panel">${issueRows(solved.slice(0, 50))}</section></details>` : ''}
  </div>`;
}

/* =====================================================================
   TO-DOS (7-day commitments)
   ===================================================================== */
export function todoRows(list) {
  return list
    .map(
      t => `<div class="tr-todo ${t.done ? 'done' : ''}">
      <input type="checkbox" class="check" data-a="eosTodoToggle" data-id="${t.id}" ${t.done ? 'checked' : ''} aria-label="Done">
      <input class="input tr-flat grow" id="td-t-${t.id}" data-in="eos" data-p="todos/${t.id}/title" value="${esc(t.title)}" aria-label="To-do">
      ${av(t.owner, 'sm')}
      <span class="tr-due ${isOverdueTodo(t) ? 'late' : ''}">${t.due ? fmtDate(t.due) : ''}</span>
      <button class="ibtn ibtn-sm" data-a="eosDel" data-coll="todos" data-id="${t.id}" aria-label="Delete">${ic('trash-2', 14)}</button>
    </div>`,
    )
    .join('');
}
export function pageTodos() {
  const e = eos();
  const st = todoStats();
  const open = e.todos.filter(t => !t.done).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
  const done = e.todos.filter(t => t.done).sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0));
  return `<div class="page" style="max-width:980px">
    ${header('To-dos', 'Seven-day commitments. Each week, every one is either done or not done.', '', 'todos')}
    <div class="stats" style="margin-bottom:16px">
      <div class="stat"><span class="k">${ic('list-todo', 14)}Open</span><span class="v">${open.length}</span><span class="d">${open.filter(isOverdueTodo).length} overdue</span></div>
      <div class="stat"><span class="k">${ic('circle-check', 14)}Done this week</span><span class="v">${st.pct == null ? '—' : st.pct + '%'}</span><span class="d">${st.done} of ${st.due} due in the last 7 days · aim for 90%</span></div>
    </div>
    ${addForm('eosAddTodo', 'new-todo', 'Add a to-do (due in 7 days)…', `<span style="width:160px" class="hide-m">${ownerSel('', S.ui.todoOwner || D().me, 'new-todo-owner').replace('data-in="eos"', 'data-in="todoOwner"')}</span>`)}
    <section class="panel">${open.length ? todoRows(open) : empty('list-todo', 'Nothing open', 'To-dos come from solved issues or can be added here.', '', '', 3)}</section>
    ${done.length ? `<details class="tr-details"><summary>${done.length} done</summary><section class="panel">${todoRows(done.slice(0, 60))}</section></details>` : ''}
  </div>`;
}

/* =====================================================================
   SCORECARD
   ===================================================================== */
export function scorecardTable(opt = {}) {
  const e = eos();
  const weeks = lastWeeks(opt.weeks || 13).reverse(); // this week first, then older weeks
  const cur = weekId();
  if (!e.measurables.length) return empty('gauge', 'No numbers yet', 'Add 5 to 15 weekly numbers, each with an owner and a goal.', '', '', 3);
  return `<div class="tr-scroll"><table class="tr-sc">
    <thead><tr><th class="sticky">Measurable</th>${opt.compact ? '' : '<th class="hide-m">Owner</th>'}<th>Goal</th>${weeks.map(w => `<th class="num ${weekId(w) === cur ? 'cur' : ''}">${weekId(w) === cur ? 'This week' : weekLabel(w)}</th>`).join('')}${opt.compact ? '' : '<th></th>'}</tr></thead>
    <tbody>${e.measurables
      .map(m => {
        const curOk = measOk(m, m.weeks[cur]);
        return `<tr>
        <td class="sticky">${opt.compact ? esc(m.name) : `<input class="input tr-flat" id="ms-n-${m.id}" data-in="eos" data-p="measurables/${m.id}/name" value="${esc(m.name)}" aria-label="Name">`}</td>
        ${opt.compact ? '' : `<td class="hide-m" style="min-width:130px">${ownerSel(`measurables/${m.id}/owner`, m.owner, `ms-o-${m.id}`, 'select-sm')}</td>`}
        <td class="nowrap">${
          opt.compact
            ? `${m.op} ${esc(m.goal)}${esc(m.unit ? ' ' + m.unit : '')}`
            : `<select class="select select-sm" id="ms-op-${m.id}" data-in="eos" data-p="measurables/${m.id}/op" data-render="1" aria-label="Goal type" style="width:auto">${[
                '>=',
                '<=',
                '=',
              ]
                .map(o => `<option ${m.op === o ? 'selected' : ''}>${o}</option>`)
                .join(
                  '',
                )}</select><input class="input tr-num" id="ms-g-${m.id}" data-in="eos" data-p="measurables/${m.id}/goal" value="${esc(m.goal)}" inputmode="decimal" aria-label="Goal" placeholder="goal">`
        }</td>
        ${weeks
          .map(w => {
            const k = weekId(w);
            const v = m.weeks[k];
            const ok = measOk(m, v);
            return `<td class="num ${ok === true ? 'ok' : ok === false ? 'bad' : ''} ${k === cur ? 'cur' : ''}"><input class="tr-cell" id="ms-${m.id}-${k}" data-in="eosWeek" data-id="${m.id}" data-w="${k}" value="${esc(v ?? '')}" inputmode="decimal" aria-label="${esc(m.name)}, week of ${weekLabel(w)}"></td>`;
          })
          .join('')}
        ${opt.compact ? '' : `<td class="nowrap">${curOk === false ? `<button class="ibtn ibtn-sm" data-a="eosToIssue" data-kind="meas" data-id="${m.id}" data-tip="Off track: add to Issues" aria-label="Add to Issues">${ic('circle-alert', 14)}</button>` : ''}<button class="ibtn ibtn-sm" data-a="eosDel" data-coll="measurables" data-id="${m.id}" aria-label="Delete">${ic('trash-2', 14)}</button></td>`}
      </tr>`;
      })
      .join('')}</tbody></table></div>`;
}
export function pageScorecard() {
  return `<div class="page wide">
    ${header('Scorecard', 'Weekly numbers with an owner and a goal. Red means off track: drop it into Issues.', starterBtn(), 'scorecard')}
    ${addForm('eosAddMeas', 'new-meas', 'Add a measurable, e.g. New signups…')}
    <section class="panel">${scorecardTable()}</section>
    <p class="faint" style="font-size:12.5px;margin-top:10px">Keep it to about 8 numbers. Type this week's value in the highlighted column; older weeks run to the right.</p>
  </div>`;
}

/* =====================================================================
   ROCKS (90-day priorities)
   ===================================================================== */
const ROCK_ST = [
  ['on', 'On track', 'green'],
  ['off', 'Off track', 'red'],
  ['done', 'Done', 'blue'],
  ['dropped', 'Dropped', 'gray'],
];
export function rockRows(list, opt = {}) {
  const projs = visibleProjects();
  return list
    .map(
      r => `<div class="tr-rock st-${r.status}">
      <select class="select select-sm tr-rst" id="rk-s-${r.id}" data-in="eos" data-p="rocks/${r.id}/status" data-render="1" aria-label="Status">${ROCK_ST.map(([k, n]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${n}</option>`).join('')}</select>
      <input class="input tr-flat grow" id="rk-t-${r.id}" data-in="eos" data-p="rocks/${r.id}/title" value="${esc(r.title)}" aria-label="Rock">
      ${
        opt.compact
          ? av(r.owner, 'sm')
          : `<span class="hide-m" style="width:140px">${ownerSel(`rocks/${r.id}/owner`, r.owner, `rk-o-${r.id}`, 'select-sm')}</span>
      <span class="hide-m" style="width:150px"><select class="select select-sm" id="rk-p-${r.id}" data-in="eos" data-p="rocks/${r.id}/project" aria-label="Linked project"><option value="">No project</option>${projs.map(p => `<option value="${p.id}" ${r.project === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}</select></span>
      <input type="date" class="input input-sm hide-m" style="width:140px" id="rk-d-${r.id}" data-in="eos" data-p="rocks/${r.id}/due" value="${esc(r.due || '')}" aria-label="Due">
      ${r.status === 'off' ? `<button class="ibtn ibtn-sm" data-a="eosToIssue" data-kind="rock" data-id="${r.id}" data-tip="Add to Issues" aria-label="Add to Issues">${ic('circle-alert', 14)}</button>` : ''}
      <button class="ibtn ibtn-sm" data-a="eosDel" data-coll="rocks" data-id="${r.id}" aria-label="Delete">${ic('trash-2', 14)}</button>`
      }
    </div>`,
    )
    .join('');
}
export function pageRocks() {
  const q = S.ui.rockQ || quarterId();
  const rs = eos().rocks.filter(r => r.quarter === q);
  const st = rockStats(q);
  const byOwner = {};
  rs.forEach(r => (byOwner[r.owner || ''] ||= []).push(r));
  return `<div class="page" style="max-width:1100px">
    ${header('Rocks', '3 to 7 priorities per quarter, each with a clear finish line. 80% done is a win.', starterBtn(), 'rocks')}
    ${freezeBanner()}
    <div class="row" style="gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <button class="ibtn" data-a="eosQuarter" data-d="-1" aria-label="Previous quarter">${ic('chevron-left', 16)}</button>
      <b style="font-size:15px;min-width:110px;text-align:center">${quarterLabel(q)}</b>
      <button class="ibtn" data-a="eosQuarter" data-d="1" aria-label="Next quarter">${ic('chevron-right', 16)}</button>
      <span class="sp"></span>
      <span class="row" style="gap:10px;font-size:13px"><span class="muted">${st.done} of ${st.total} done</span>${pctBar(st.pct, 80)}<b>${st.pct}%</b>${st.off ? `<span class="badge red">${st.off} off track</span>` : ''}</span>
    </div>
    ${addForm('eosAddRock', 'new-rock', `Add a Rock for ${quarterLabel(q)}…`)}
    ${
      rs.length
        ? Object.entries(byOwner)
            .map(
              ([o, list]) =>
                `<section class="panel" style="margin-bottom:12px"><div class="panel-h"><h2 class="row" style="gap:8px">${av(o || null, 'sm', false)}${esc(mem(o)?.name || 'No owner')}</h2><span class="faint">${list.length}${list.length > 7 ? ' · too many' : ''}</span></div>${rockRows(list)}</section>`,
            )
            .join('')
        : `<section class="panel">${empty('mountain', 'No Rocks this quarter', 'What are the 3 to 7 most important things to finish in the next 90 days?', '', '', 3)}</section>`
    }
  </div>`;
}

/* =====================================================================
   VISION (V/TO)
   ===================================================================== */
export function pageVision() {
  const v = eos().vto;
  const blk = (n, title, hint, body) =>
    `<section class="panel tr-vto"><div class="panel-h"><h2><span class="tr-n">${n}</span>${title}</h2></div><div class="panel-b col" style="gap:10px"><p class="faint" style="margin:0;font-size:12.5px">${hint}</p><details class="tr-how"><summary>How to fill it</summary><div>${VTO_HELP[n]}</div></details>${body}</div></section>`;
  const lab = (t, inner) => `<div class="field"><span class="label">${t}</span>${inner}</div>`;
  return `<div class="page tr-print" style="max-width:1000px">
    ${header('Vision', 'The Vision/Traction Organizer: eight questions on one page.', `${starterBtn()}<button class="btn btn-secondary" data-a="eosPrint">${ic('printer', 14)}Print / share</button>`, 'vision')}
    <div class="grid2 tr-vgrid">
      ${blk(1, 'Core values', '3 to 7 rules for how we behave. One per line.', area('vto/coreValues', v.coreValues, 'vto-cv', 'e.g. Students first', 5, true))}
      ${blk(2, 'Core focus', 'Why we exist, and what we are best at.', lab('Purpose', field('vto/coreFocus/purpose', v.coreFocus.purpose, 'vto-pur', 'Why do we exist?')) + lab('Niche', field('vto/coreFocus/niche', v.coreFocus.niche, 'vto-niche', 'What are we best at?')))}
      ${blk(3, '10-year target', 'One big, long-range goal.', area('vto/tenYear', v.tenYear, 'vto-10', 'e.g. Every Maldivian student…', 3))}
      ${blk(
        4,
        'Marketing strategy',
        'Who we serve and why they choose us.',
        lab('Target market', field('vto/marketing/target', v.marketing.target, 'vto-tm')) +
          lab('Three uniques (one per line)', area('vto/marketing/uniques', v.marketing.uniques, 'vto-uq', '', 3, true)) +
          lab('Proven process', field('vto/marketing/process', v.marketing.process, 'vto-pp')) +
          lab('Guarantee', field('vto/marketing/guarantee', v.marketing.guarantee, 'vto-gu')),
      )}
      ${blk(
        5,
        '3-year picture',
        'What does it look like three years out?',
        `<div class="row" style="gap:8px">${lab('Date', field('vto/threeYear/date', v.threeYear.date, 'vto-3d', 'e.g. Dec 2029'))}${lab('Revenue', field('vto/threeYear/revenue', v.threeYear.revenue, 'vto-3r'))}${lab('Profit', field('vto/threeYear/profit', v.threeYear.profit, 'vto-3p'))}</div>` +
          lab('Measurables (one per line)', area('vto/threeYear/measurables', v.threeYear.measurables, 'vto-3m', '', 3, true)) +
          lab('What it looks like (one per line)', area('vto/threeYear/looks', v.threeYear.looks, 'vto-3l', '', 4, true)),
      )}
      ${blk(
        6,
        '1-year plan',
        '3 to 7 goals for this year.',
        `<div class="row" style="gap:8px">${lab('Date', field('vto/oneYear/date', v.oneYear.date, 'vto-1d', 'e.g. Dec 2027'))}${lab('Revenue', field('vto/oneYear/revenue', v.oneYear.revenue, 'vto-1r'))}${lab('Profit', field('vto/oneYear/profit', v.oneYear.profit, 'vto-1p'))}</div>` +
          lab('Goals (one per line)', area('vto/oneYear/goals', v.oneYear.goals, 'vto-1g', '', 5, true)),
      )}
      ${blk(
        7,
        'Rocks',
        'This quarter’s priorities, from the Rocks page.',
        rockRows(
          eos().rocks.filter(r => r.quarter === quarterId()),
          { compact: true },
        ) || '<span class="faint">No Rocks yet.</span>',
      )}
      ${blk(
        8,
        'Issues',
        'Long-term issues, from the Issues page.',
        eos()
          .issues.filter(x => x.status === 'open' && x.term === 'long')
          .map(x => `<div class="row" style="gap:6px;font-size:13px">${ic('dot', 14)}${esc(x.title)}</div>`)
          .join('') || '<span class="faint">No long-term issues.</span>',
      )}
    </div>
  </div>`;
}

/* =====================================================================
   PEOPLE: accountability chart + people analyzer
   ===================================================================== */
function seatCard(s, all) {
  const kids = all.filter(x => x.parent === s.id);
  const roles = s.roles || [];
  return `<div class="tr-node"><div class="tr-seat panel">
      <div class="row" style="gap:6px"><input class="input tr-flat grow" style="font-weight:600" id="st-n-${s.id}" data-in="eos" data-p="seats/${s.id}/name" value="${esc(s.name)}" aria-label="Seat name"><button class="ibtn ibtn-xs" data-a="eosAddSeat" data-parent="${s.id}" data-tip="Add a seat under this one" aria-label="Add seat below">${ic('plus', 13)}</button><button class="ibtn ibtn-xs" data-a="eosDel" data-coll="seats" data-id="${s.id}" aria-label="Delete seat">${ic('x', 13)}</button></div>
      <div class="row" style="gap:6px;margin:6px 0">${av(s.holder || null, 'sm', false)}${ownerSel(`seats/${s.id}/holder`, s.holder, `st-h-${s.id}`, 'select-sm').replace('No owner', 'Open seat')}</div>
      <textarea class="textarea tr-roles" id="st-r-${s.id}" data-in="eos" data-p="seats/${s.id}/roles" data-list="1" rows="${ROLE_SLOTS}" placeholder="Up to 5 roles, one per line">${esc(roles.join('\n'))}</textarea>
      ${roles.length > ROLE_SLOTS ? `<span class="err">${ic('circle-alert', 12)}More than 5 roles: split the seat.</span>` : ''}
    </div>${kids.length ? `<div class="tr-kids">${kids.map(k => seatCard(k, all)).join('')}</div>` : ''}</div>`;
}
export function pagePeople() {
  const e = eos();
  const tab = S.ui.peopleTab || 'chart';
  const roots = e.seats.filter(s => !s.parent || !e.seats.some(x => x.id === s.parent));
  const values = e.vto.coreValues;
  const mark = { '+': ['+', 'green'], '+-': ['±', 'amber'], '-': ['−', 'red'] };
  return `<div class="page wide">
    ${header('People', 'Structure first, then names. One person can hold several seats.', starterBtn() + (tab === 'chart' ? `<button class="btn btn-primary" data-a="eosAddSeat">${ic('plus', 14)}Add seat</button>` : ''), 'people')}
    <div class="tabs" style="margin-bottom:14px">${[
      ['chart', 'Accountability chart'],
      ['analyzer', 'People analyzer'],
    ]
      .map(([k, l]) => `<button class="tab ${tab === k ? 'on' : ''}" data-a="set" data-k="peopleTab" data-v="${k}">${l}</button>`)
      .join('')}</div>
    ${
      tab === 'chart'
        ? roots.length
          ? `<div class="tr-scroll"><div class="tr-tree">${roots.map(r => seatCard(r, e.seats)).join('')}</div></div>`
          : `<section class="panel">${empty('network', 'No seats yet', 'Start with the functions the business needs (e.g. Visionary, Integrator, Content, Marketing, Operations), then put names in them.', `<button class="btn btn-primary" data-a="eosSeatStarter">${ic('sparkles', 14)}Start with the standard seats</button>`, '', 3)}</section>`
        : `<section class="panel">${
            values.length
              ? `<div class="tr-scroll"><table class="tr-sc tr-pa"><thead><tr><th class="sticky">Person</th>${values.map(v => `<th>${esc(v)}</th>`).join('')}<th>Gets it</th><th>Wants it</th><th>Capacity</th></tr></thead><tbody>${people()
                  .map(m => {
                    const p = personOf(m.id);
                    return `<tr><td class="sticky"><span class="row" style="gap:8px">${av(m.id, 'sm', false)}${esc(m.name)}</span></td>${values
                      .map((v, i) => {
                        const x = p.values[i];
                        return `<td><button class="tr-mark ${x ? mark[x][1] : ''}" data-a="eosMark" data-id="${m.id}" data-i="${i}" aria-label="${esc(v)}: ${x || 'not rated'}">${x ? mark[x][0] : '·'}</button></td>`;
                      })
                      .join('')}${['g', 'w', 'c']
                      .map(k => {
                        const x = p.gwc[k];
                        return `<td><button class="tr-mark ${x === true ? 'green' : x === false ? 'red' : ''}" data-a="eosGwc" data-id="${m.id}" data-k="${k}" aria-label="${k}: ${x == null ? 'not rated' : x ? 'yes' : 'no'}">${x === true ? 'Y' : x === false ? 'N' : '·'}</button></td>`;
                      })
                      .join('')}</tr>`;
                  })
                  .join(
                    '',
                  )}</tbody></table></div><p class="faint" style="font-size:12.5px;padding:0 16px 14px">Click to rate: + mostly, ± sometimes, − rarely. GWC: Y or N. Use it before hiring into a seat, too.</p>`
              : empty(
                  'heart-handshake',
                  'Add core values first',
                  'The analyzer rates each person against your core values. Write them on the Vision page.',
                  `<button class="btn btn-secondary" data-a="go" data-r="vision">Open Vision</button>`,
                  '',
                  3,
                )
          }</section>`
    }
  </div>`;
}

/* =====================================================================
   PROCESSES
   ===================================================================== */
export function pageProcesses() {
  const e = eos();
  const run = S.ui.procRun;
  const checks = (S.ui.procChecks ||= {});
  return `<div class="page" style="max-width:1100px">
    ${header('Processes', 'Document the 20% of steps that give 80% of the results. Then everyone follows them.', starterBtn(), 'processes')}
    ${addForm('eosAddProc', 'new-proc', 'Add a core process, e.g. Release…')}
    ${
      e.processes.length
        ? `<div class="tr-procs">${e.processes
            .map(p => {
              const lines = (p.steps || '').split('\n').filter(l => l.trim());
              const stepN = lines.filter(l => !/^\s*-/.test(l)).length;
              const isRun = run === p.id;
              return `<section class="panel tr-proc">
              <div class="panel-h"><input class="input tr-flat" style="font-weight:600;font-size:14px" id="pr-n-${p.id}" data-in="eos" data-p="processes/${p.id}/name" value="${esc(p.name)}" aria-label="Process name"><span class="sp"></span><button class="btn btn-${isRun ? 'primary' : 'secondary'} btn-sm" data-a="eosProcRun" data-id="${p.id}">${ic(isRun ? 'pencil' : 'list-checks', 13)}${isRun ? 'Edit' : 'Checklist'}</button><button class="ibtn ibtn-sm" data-a="eosDel" data-coll="processes" data-id="${p.id}" aria-label="Delete">${ic('trash-2', 14)}</button></div>
              <div class="panel-b col" style="gap:8px">
                <div class="row" style="gap:8px"><span class="faint" style="font-size:12.5px">Owner</span>${ownerSel(`processes/${p.id}/owner`, p.owner, `pr-o-${p.id}`, 'select-sm')}<span class="sp"></span><span class="faint" style="font-size:12px">${stepN} step${stepN === 1 ? '' : 's'}${stepN > 10 ? ' · simplify it' : ''}</span></div>
                ${
                  isRun
                    ? `<div class="col" style="gap:4px">${lines
                        .map((l, i) => {
                          const sub = /^\s*-/.test(l);
                          const k = p.id + ':' + i;
                          return `<label class="tr-check ${sub ? 'sub' : ''} ${checks[k] ? 'done' : ''}"><input type="checkbox" class="check" data-a="eosProcCheck" data-k="${k}" ${checks[k] ? 'checked' : ''}>${esc(l.replace(/^\s*-\s*/, ''))}</label>`;
                        })
                        .join(
                          '',
                        )}<button class="btn btn-ghost btn-sm" style="align-self:flex-start" data-a="eosProcReset" data-id="${p.id}">Reset checklist</button></div>`
                    : `<textarea class="textarea" id="pr-s-${p.id}" data-in="eos" data-p="processes/${p.id}/steps" rows="${Math.max(5, lines.length + 1)}" placeholder="One step per line. Start a line with - for a detail under the step above.">${esc(p.steps || '')}</textarea>`
                }
              </div></section>`;
            })
            .join('')}</div>`
        : `<section class="panel">${empty('workflow', 'No processes yet', 'Start with the few that matter most: a DB change, the question pipeline, a release, support.', '', '', 3)}</section>`
    }
  </div>`;
}

/* =====================================================================
   CHECKUP
   ===================================================================== */
export function pageCheckup() {
  const e = eos();
  const draft = (S.ui.checkup ||= Array(CHECKUP.length).fill(0));
  const total = draft.reduce((a, b) => a + b, 0);
  const filled = draft.filter(Boolean).length;
  const hist = [...e.checkups].sort((a, b) => b.date.localeCompare(a.date));
  return `<div class="page" style="max-width:980px">
    ${header('Checkup', '20 statements, each scored 1 (weak) to 5 (strong). Do it twice a year; low scores become issues.', '', 'checkup')}
    <div class="grid2" style="grid-template-columns:minmax(0,1fr) 260px;align-items:start">
      <section class="panel">${CHECKUP.map(
        ([cat, text], i) =>
          `<div class="tr-cu"><div class="grow"><span class="faint" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em">${cat}</span><div style="font-size:13.5px">${i + 1}. ${esc(text)}</div></div><div class="tr-cu-s" role="radiogroup" aria-label="Score for statement ${i + 1}">${[
            1, 2, 3, 4, 5,
          ]
            .map(
              n =>
                `<button class="${draft[i] === n ? 'on' : ''} s${n}" role="radio" aria-checked="${draft[i] === n}" data-a="eosCheckScore" data-i="${i}" data-v="${n}">${n}</button>`,
            )
            .join('')}</div></div>`,
      ).join('')}</section>
      <div class="col" style="gap:12px;position:sticky;top:12px">
        <section class="panel panel-b" style="text-align:center"><div class="faint" style="font-size:12px">Score</div><div style="font-size:34px;font-weight:650">${total}<span class="faint" style="font-size:16px"> / 100</span></div><div class="faint" style="font-size:12px">${filled} of ${CHECKUP.length} answered · aim for 80+</div>
          <button class="btn btn-primary btn-block" style="margin-top:10px" data-a="eosCheckSave" ${filled === CHECKUP.length ? '' : 'disabled'}>Save checkup</button></section>
        <section class="panel"><div class="panel-h"><h2>History</h2></div>${hist.length ? hist.map(h => `<div class="mini" style="cursor:default"><span class="grow">${fmtDate(h.date, true)}</span><b>${h.scores.reduce((a, b) => a + b, 0)}</b><button class="ibtn ibtn-xs" data-a="eosCheckIssues" data-date="${h.date}" data-tip="Send scores of 1–2 to Issues" aria-label="Send low scores to Issues">${ic('circle-alert', 13)}</button></div>`).join('') : '<div class="panel-b faint">No checkups saved yet.</div>'}</section>
      </div>
    </div>
  </div>`;
}

/* =====================================================================
   L10 MEETING
   ===================================================================== */
const mmss = s => `${s < 0 ? '-' : ''}${Math.floor(Math.abs(s) / 60)}:${String(Math.abs(s) % 60).padStart(2, '0')}`;
export function l10Clock() {
  const L = eos().live;
  if (!L) return '';
  const seg = agendaFor(L.kind)[L.seg];
  const left = seg[2] * 60 - Math.floor((Date.now() - L.segStart) / 1000);
  return `<span class="tr-clock ${left < 0 ? 'over' : ''}" id="l10-clock">${mmss(left)}</span>`;
}
function segBody(key, L) {
  const e = eos();
  if (key === 'segue')
    return `<p class="muted">Share one personal and one business win from the last week.</p>${area('live/notes', L.notes, 'l10-notes', 'Notes (optional)', 3)}`;
  if (key === 'scorecard')
    return `<section class="panel">${scorecardTable({ compact: true, weeks: 4 })}</section><p class="faint" style="font-size:12.5px">Report on or off track only. Off-track numbers: add them on the Scorecard page, or as an issue below.</p>${addForm('eosAddIssue', 'new-issue', 'Drop an issue…')}`;
  if (key === 'rocks' || key === 'review') {
    const q = key === 'review' ? L.reviewQ || quarterId() : quarterId();
    const st = rockStats(q);
    return `<div class="row" style="gap:10px;margin-bottom:10px;font-size:13px"><b>${quarterLabel(q)}</b>${pctBar(st.pct, 80)}<span>${st.done} of ${st.total} done (${st.pct}%)</span></div><section class="panel">${
      rockRows(
        e.rocks.filter(r => r.quarter === q),
        { compact: true },
      ) || '<div class="panel-b faint">No Rocks.</div>'
    }</section>`;
  }
  if (key === 'headlines')
    return `<form class="row" data-submit="eosHeadline" style="gap:8px;margin-bottom:10px"><input class="input grow" id="l10-hl" placeholder="One-line headline: customer or team news" autocomplete="off"><button class="btn btn-secondary">${ic('plus', 14)}Add</button></form>${(L.headlines || []).map((h, i) => `<div class="mini" style="cursor:default">${ic('megaphone', 14)}<span class="grow">${esc(h)}</span><button class="ibtn ibtn-xs" data-a="eosHeadlineDel" data-i="${i}" aria-label="Remove">${ic('x', 13)}</button></div>`).join('')}`;
  if (key === 'todos') {
    const list = e.todos.filter(t => t.created < L.start).sort((a, b) => (a.due || '').localeCompare(b.due || ''));
    const recent = list.filter(t => !t.done || (t.doneAt || 0) > L.start - 8 * 864e5);
    return recent.length ? `<section class="panel">${todoRows(recent)}</section>` : '<p class="faint">No to-dos from last week.</p>';
  }
  if (key === 'swot')
    return `<p class="muted">List strengths, weaknesses, opportunities and threats. Every weakness and threat becomes a long-term issue.</p>${addForm('eosAddIssue', 'new-issue', 'Add a long-term issue…')}`;
  if (key === 'vto')
    return `<p class="muted">Read the Vision page together and fix anything that is no longer true.</p><button class="btn btn-secondary" data-a="go" data-r="vision">${ic('telescope', 14)}Open Vision</button>`;
  if (key === 'ids') {
    const term = L.kind === 'weekly' ? 'short' : 'long';
    const list = e.issues.filter(x => x.status === 'open' && x.term === term).sort((a, b) => (a.priority || 9) - (b.priority || 9) || a.created - b.created);
    const solvedNow = e.issues.filter(x => x.status === 'solved' && x.solved >= L.start).length;
    return `<p class="muted" style="margin-top:0">Number the top 3 (click the circle), then work down from 1. ${solvedNow ? `<b>${solvedNow} solved so far.</b>` : ''}</p>${addForm('eosAddIssue', 'new-issue', 'Add an issue…')}<section class="panel">${list.length ? issueRows(list, { compact: true }) : '<div class="panel-b faint">No open issues. Good meeting.</div>'}</section>`;
  }
  if (key === 'conclude') {
    const newTodos = e.todos.filter(t => t.created >= L.start);
    return `<h3 style="font-size:13px;margin:0 0 6px">New to-dos (${newTodos.length})</h3>${newTodos.length ? `<section class="panel" style="margin-bottom:14px">${todoRows(newTodos)}</section>` : '<p class="faint">None.</p>'}
      <h3 style="font-size:13px;margin:12px 0 6px">Rate this meeting</h3><div class="tr-rate" role="radiogroup" aria-label="Meeting rating">${Array.from(
        { length: 10 },
        (_, i) => i + 1,
      )
        .map(n => `<button class="${L.rating === n ? 'on' : ''}" role="radio" aria-checked="${L.rating === n}" data-a="eosRate" data-v="${n}">${n}</button>`)
        .join('')}</div><p class="faint" style="font-size:12.5px">Below 8? Say why, and fix it next week.</p>`;
  }
  return '';
}
export function pageL10() {
  const e = eos();
  const L = e.live;
  const past = [...e.meetings].sort((a, b) => b.date.localeCompare(a.date));
  const weekly = past.filter(m => m.kind === 'weekly' && m.rating);
  const avg = weekly.length ? (weekly.slice(0, 8).reduce((a, m) => a + m.rating, 0) / Math.min(8, weekly.length)).toFixed(1) : '—';
  if (!L) {
    const ag = agendaFor(S.ui.l10Kind || 'weekly');
    return `<div class="page tr-print" style="max-width:980px">
      ${header('Meetings', 'Same day, same time, same agenda. Start on time, end on time.', `<button class="btn btn-secondary" data-a="eosPrint">${ic('printer', 14)}Print agenda</button><button class="btn btn-primary" data-a="eosStartMeeting">${ic('play', 14)}Start ${{ quarterly: 'quarterly', annual: 'annual' }[S.ui.l10Kind] || 'L10'}</button>`, 'l10')}
      ${freezeBanner()}
      <div class="tabs" style="margin-bottom:14px">${[
        ['weekly', 'Weekly L10'],
        ['quarterly', 'Quarterly'],
        ['annual', 'Annual'],
      ]
        .map(([k, l]) => `<button class="tab ${(S.ui.l10Kind || 'weekly') === k ? 'on' : ''}" data-a="set" data-k="l10Kind" data-v="${k}">${l}</button>`)
        .join('')}</div>
      <div class="grid2" style="grid-template-columns:minmax(0,1fr) 280px;align-items:start">
        <section class="panel"><div class="panel-h"><h2>Agenda · ${ag.reduce((a, s) => a + s[2], 0)} min</h2><span class="faint">${fmtDate(iso(TODAY), true)}</span></div>${ag.map(([, n, m, d], i) => `<div class="tr-ag"><span class="tr-n">${i + 1}</span><div class="grow"><b>${n}</b><div class="faint" style="font-size:12.5px">${d}</div></div><span class="num muted">${m} min</span></div>`).join('')}</section>
        <div class="col" style="gap:12px">
          <section class="panel panel-b" style="text-align:center"><div class="faint" style="font-size:12px">Average rating (last 8)</div><div style="font-size:30px;font-weight:650">${avg}</div><div class="faint" style="font-size:12px">Aim for 8 or more</div></section>
          <section class="panel"><div class="panel-h"><h2>Past meetings</h2><span class="faint">${past.length}</span></div>${
            past.length
              ? past
                  .slice(0, 12)
                  .map(
                    m =>
                      `<div class="mini" style="cursor:default"><span class="grow">${fmtDate(m.date, true)}<span class="faint" style="font-size:12px"> · ${{ quarterly: 'Quarterly', annual: 'Annual' }[m.kind] || 'L10'}${m.solved ? ` · ${m.solved} solved` : ''}</span></span><b>${m.rating || '—'}</b><button class="ibtn ibtn-xs" data-a="eosDel" data-coll="meetings" data-id="${m.id}" aria-label="Delete">${ic('x', 13)}</button></div>`,
                  )
                  .join('')
              : '<div class="panel-b faint">No meetings yet.</div>'
          }</section>
        </div>
      </div>
    </div>`;
  }
  const ag = agendaFor(L.kind);
  const [key, name, , desc] = ag[L.seg];
  const last = L.seg === ag.length - 1;
  return `<div class="page" style="max-width:1000px">
    <div class="ph"><div><h1>${{ quarterly: 'Quarterly meeting', annual: 'Annual planning' }[L.kind] || 'L10 meeting'}</h1><p>Started ${new Date(L.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div><div class="acts"><button class="btn btn-ghost" data-a="eosCancelMeeting">Cancel</button></div></div>
    <div class="tr-segs">${ag.map(([, n, m], i) => `<button class="tr-seg ${i === L.seg ? 'on' : i < L.seg ? 'past' : ''}" data-a="eosSeg" data-i="${i}"><span>${n}</span><span class="faint">${m}m</span></button>`).join('')}</div>
    <section class="panel" style="margin-top:14px"><div class="panel-h"><div><h2 style="font-size:17px">${name}</h2><div class="faint" style="font-size:12.5px;font-weight:400">${desc}</div></div><span class="sp"></span>${l10Clock()}</div>
      <div class="panel-b">${segBody(key, L)}</div>
      <div class="modal-f">${L.seg > 0 ? `<button class="btn btn-secondary" data-a="eosSeg" data-i="${L.seg - 1}">${ic('chevron-left', 14)}Back</button>` : ''}<span class="sp"></span>${last ? `<button class="btn btn-primary" data-a="eosFinishMeeting" ${L.rating ? '' : 'disabled'}>${ic('check', 14)}Finish meeting</button>` : `<button class="btn btn-primary" data-a="eosSeg" data-i="${L.seg + 1}">Next: ${ag[L.seg + 1][1]}${ic('chevron-right', 14)}</button>`}</div>
    </section>
  </div>`;
}

/* Traction sidebar group. */
export const TRACTION_ROUTES = [
  ['l10', 'Meetings', 'calendar-clock'],
  ['issues', 'Issues', 'circle-alert'],
  ['todos', 'To-dos', 'list-todo'],
  ['scorecard', 'Scorecard', 'gauge'],
  ['rocks', 'Rocks', 'mountain'],
  ['vision', 'Vision', 'telescope'],
  ['people', 'People', 'network'],
  ['processes', 'Processes', 'workflow'],
  ['checkup', 'Checkup', 'clipboard-check'],
];
export const openIssueCount = () => eos().issues.filter(x => x.status === 'open' && x.term === 'short').length;
export const openTodoCount = () => eos().todos.filter(t => !t.done && t.due && parse(t.due) <= TODAY).length;
