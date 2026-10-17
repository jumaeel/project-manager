/* ---------- Traction (EOS) data ----------
   Everything lives under D().eos, created on first use so saved workspaces
   upgrade without a reset (same pattern as teamsList()). */
import { TODAY, addD, iso, parse, uid } from './utils.js';
import { D } from './store.js';

const EMPTY = () => ({
  vto: {
    coreValues: [],
    coreFocus: { purpose: '', niche: '' },
    tenYear: '',
    marketing: { target: '', uniques: [], process: '', guarantee: '' },
    threeYear: { date: '', revenue: '', profit: '', measurables: [], looks: [] },
    oneYear: { date: '', revenue: '', profit: '', goals: [] },
  },
  measurables: [],
  rocks: [],
  issues: [],
  todos: [],
  meetings: [],
  live: null,
  seats: [],
  people: {},
  processes: [],
  checkups: [],
});

export function eos() {
  const d = D();
  if (!d.eos) d.eos = EMPTY();
  const e = d.eos;
  const base = EMPTY();
  for (const k in base) if (e[k] === undefined) e[k] = base[k];
  for (const k in base.vto) if (e.vto[k] === undefined) e.vto[k] = base.vto[k];
  return e;
}

/* Paths like "issues/<id>/title" or "vto/coreFocus/purpose": array steps match by id. */
export function resolvePath(path) {
  const ks = path.split('/');
  let o = eos();
  for (let i = 0; i < ks.length - 1; i++) {
    const k = ks[i];
    if (Array.isArray(o)) o = o.find(x => x.id === k);
    else {
      if (o[k] == null) o[k] = {};
      o = o[k];
    }
    if (!o) return [null, null];
  }
  return [o, ks[ks.length - 1]];
}

export const newId = p => uid(p);

/* ---------- weeks and quarters ---------- */
export function weekId(d = TODAY) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = t.getUTCFullYear();
  const w = Math.ceil(((t - Date.UTC(y, 0, 1)) / 864e5 + 1) / 7);
  return `${y}-W${String(w).padStart(2, '0')}`;
}
/* Monday of each of the last n weeks, oldest first. */
export function lastWeeks(n) {
  const mon = addD(TODAY, -((TODAY.getDay() + 6) % 7));
  return Array.from({ length: n }, (_, i) => addD(mon, -7 * (n - 1 - i)));
}
export const weekLabel = d => `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]}`;

export const quarterId = (d = TODAY) => `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}`;
export function shiftQuarter(q, n) {
  const [y, qq] = q.split('-Q').map(Number);
  const i = y * 4 + (qq - 1) + n;
  return `${Math.floor(i / 4)}-Q${(i % 4) + 1}`;
}
export function quarterEnd(q) {
  const [y, qq] = q.split('-Q').map(Number);
  return iso(new Date(y, qq * 3, 0));
}
export const quarterLabel = q => q.replace('-Q', ' · Q');

/* Oct/Nov and May/Jun are exam peaks: treat them as release-freeze windows. */
export const inFreeze = (d = TODAY) => [4, 5, 9, 10].includes(d.getMonth());

/* ---------- scorecard ---------- */
export function measOk(m, v) {
  if (v === '' || v == null || m.goal === '' || m.goal == null) return null;
  const a = Number(v),
    g = Number(m.goal);
  if (m.op === '<=') return a <= g;
  if (m.op === '=') return a === g;
  return a >= g;
}

/* ---------- rocks ---------- */
export function rockStats(q) {
  const rs = eos().rocks.filter(r => r.quarter === q && r.status !== 'dropped');
  const done = rs.filter(r => r.status === 'done').length;
  return { total: rs.length, done, pct: rs.length ? Math.round((done / rs.length) * 100) : 0, off: rs.filter(r => r.status === 'off').length };
}

/* ---------- to-dos (7-day commitments) ---------- */
export function todoStats() {
  const since = iso(addD(TODAY, -7));
  const due = eos().todos.filter(t => t.due && t.due >= since && t.due <= iso(TODAY));
  const done = due.filter(t => t.done).length;
  return { due: due.length, done, pct: due.length ? Math.round((done / due.length) * 100) : null };
}
export const isOverdueTodo = t => !t.done && t.due && parse(t.due) < TODAY;

/* ---------- meetings ---------- */
export const L10_AGENDA = [
  ['segue', 'Segue', 5, 'Good news: one personal, one business.'],
  ['scorecard', 'Scorecard', 5, 'On or off track? Off-track numbers go to the Issues list.'],
  ['rocks', 'Rock review', 5, 'On or off track? Off-track Rocks go to the Issues list.'],
  ['headlines', 'Headlines', 5, 'Customer and team news, one line each.'],
  ['todos', 'To-do list', 5, "Last week's to-dos: done or not done."],
  ['ids', 'IDS', 60, 'Pick the top 3 issues. Identify, discuss, solve.'],
  ['conclude', 'Conclude', 5, 'Recap new to-dos, then rate the meeting 1 to 10.'],
];
export const QUARTERLY_AGENDA = [
  ['segue', 'Segue', 15, 'Best news, what is working, expectations for the day.'],
  ['review', 'Review last quarter', 60, 'Numbers and Rock completion. Aim for 80%.'],
  ['vto', 'Review the V/TO', 60, 'Is the vision still right? Update it.'],
  ['rocks', 'Set next quarter Rocks', 120, '3 to 7 Rocks, each with a clear finish line.'],
  ['ids', 'Tackle key issues', 180, 'Long-term issues list. Identify, discuss, solve.'],
  ['conclude', 'Next steps and conclude', 15, 'Who does what, then rate the day 1 to 10.'],
];
export const agendaFor = kind => (kind === 'quarterly' ? QUARTERLY_AGENDA : L10_AGENDA);

/* ---------- people ---------- */
export const ROLE_SLOTS = 5;
export const personOf = id => {
  const p = eos().people;
  if (!p[id]) p[id] = { values: {}, gwc: { g: null, w: null, c: null } };
  return p[id];
};

/* ---------- organizational checkup: 20 statements, each scored 1 to 5 ---------- */
export const CHECKUP = [
  ['Vision', 'We have a clear vision in writing that everyone understands and shares.'],
  ['Vision', 'Our core values are clear, and we hire, review and reward people by them.'],
  ['Vision', 'Our core focus (purpose and niche) is clear, and we keep our work aligned with it.'],
  ['Vision', 'Our 10-year target is clear and shared.'],
  ['Vision', 'Our target market is clear, and our marketing is aimed at it.'],
  ['Vision', 'Our three uniques are clear and used in our marketing.'],
  ['Vision', 'We have a proven process for delivering to customers, and it is documented.'],
  ['People', 'Everyone is in the right seat and fits our core values.'],
  ['People', 'Our accountability chart is clear and kept up to date.'],
  ['Traction', 'Everyone has a few clear quarterly priorities (Rocks) and works on them.'],
  ['Traction', 'We hold a weekly meeting that is on the same day, same time, same agenda.'],
  ['Traction', 'Our meetings start on time, end on time and stay on agenda.'],
  ['Issues', 'We regularly identify, discuss and solve issues for the long-term good.'],
  ['Process', 'Our core processes are documented, simplified and followed by everyone.'],
  ['Process', 'We have systems for getting regular feedback from customers and the team.'],
  ['Data', 'We have a scorecard of weekly numbers that tells us how we are doing.'],
  ['Data', 'Everyone has at least one number they are accountable for each week.'],
  ['Data', 'We have a budget and check it regularly.'],
  ['Issues', 'Everyone sees the same issues list and feels safe raising problems.'],
  ['Traction', 'We do what we say we will do: to-dos and Rocks get finished.'],
];

/* ---------- optional starter: real Syllabi items from the plan ---------- */
export function syllabiStarter(me) {
  const q = quarterId();
  const rock = (title, due) => ({ id: newId('rk'), title, owner: me, quarter: q, status: 'on', project: null, due: due || quarterEnd(q) });
  const issue = (title, term = 'short') => ({
    id: newId('is'),
    title,
    notes: '',
    owner: me,
    term,
    priority: 0,
    status: 'open',
    created: Date.now(),
    solved: null,
  });
  const meas = (name, op, goal, unit = '') => ({ id: newId('ms'), name, owner: me, goal, op, unit, weeks: {} });
  const proc = (name, steps) => ({ id: newId('pr'), name, owner: me, steps: steps.join('\n') });
  return {
    rocks: [
      rock('Launch Syllabi Games', `${TODAY.getFullYear()}-10-26`),
      rock('Finish the new CMS (content for both products)'),
      rock('Vet the Islam question set'),
      rock('Apply the waiting migrations on staging, then live'),
    ],
    measurables: [
      meas('Weekly active students', '>=', ''),
      meas('New signups', '>=', ''),
      meas('Trial to paid conversion', '>=', '', '%'),
      meas('Paid subscribers', '>=', ''),
      meas('MRR', '>=', '', 'MVR'),
      meas('Churned subscribers', '<=', ''),
      meas('Questions published', '>=', ''),
      meas('Open support emails', '<=', ''),
      meas('Production incidents', '<=', '0'),
    ],
    issues: [
      issue('Apply the waiting migrations'),
      issue('Decide on reversing the mock-submit XP farm'),
      issue('Choose the free Games set'),
      issue('Native-speaker checks for Dhivehi copy'),
      issue('Vet Islam questions and Judge game sources'),
      issue('Merge staging features to main'),
      issue('Decide the dead WhatsApp support link'),
    ],
    processes: [
      proc('Database change', [
        'Write the migration',
        '- Keep it reversible',
        'Apply on staging',
        'Test the affected screens on staging',
        'Apply on live',
        'Fold it into schema.sql',
      ]),
      proc('Question pipeline', [
        'Generate questions from the textbook',
        'Vet every question',
        '- Islam questions need a qualified reviewer',
        'Publish to staging and spot-check',
        'Publish to live',
      ]),
      proc('Release', ['Check the calendar for a release freeze', 'Lint, format and build', 'Test on staging end to end', 'Deploy to live', 'Smoke-test live']),
      proc('Support', ['Reply to new emails within one working day', 'Log anything repeated as an issue', 'Close the loop with the student']),
      proc('New game or content launch', [
        'Content vetted and on staging',
        'Store copy and screenshots ready',
        'Announce on social channels',
        'Watch support and incidents for a week',
      ]),
    ],
  };
}
