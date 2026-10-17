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
// Solo version: 60 minutes, with 30 for IDS.
export const L10_AGENDA = [
  ['segue', 'Segue', 5, 'One good thing from work and one from life. Then switch from working in the business to working on it.'],
  ['scorecard', 'Scorecard', 5, 'Read each number; mark red if it missed. No discussion yet.'],
  ['rocks', 'Rock review', 5, 'Mark each Rock on track or off track. Move off-track Rocks to Issues.'],
  ['headlines', 'Headlines', 5, 'Customer news: parent emails, student reports, feedback. Problems go to Issues.'],
  ['todos', 'To-do list', 5, "Last week's to-dos: done or not done. Aim for about 90% done."],
  ['ids', 'IDS', 30, 'Take the top three issues and solve them in order.'],
  ['conclude', 'Conclude', 5, 'Restate the new to-dos, note anything to tell others, rate the meeting 1 to 10. Aim for 8+.'],
];
export const QUARTERLY_AGENDA = [
  ['segue', 'Segue', 15, 'Best news of the quarter, what works, what does not.'],
  ['review', 'Review last quarter', 60, "Last quarter's numbers, and each Rock done or not done. Aim for 80%."],
  ['vto', 'Review the V/TO', 60, 'Read the Vision page and fix anything no longer true.'],
  ['rocks', 'Set next quarter Rocks', 120, '3 to 7 Rocks, one owner each, each one impossible to argue about.'],
  ['ids', 'Tackle key issues', 180, 'Long-term issues list. Identify, discuss, solve.'],
  ['conclude', 'Next steps and conclude', 15, 'Who does what, then rate the day 1 to 10.'],
];
export const ANNUAL_AGENDA = [
  ['segue', 'Segue', 30, 'Three company wins, one personal win, what you expect from these two days.'],
  ['review', 'Review the year', 90, 'Numbers, Rocks and the one-year plan: what got done and what did not.'],
  ['swot', 'SWOT and issues', 90, 'Strengths, weaknesses, opportunities, threats. Add everything to the long-term Issues list.'],
  ['vto', 'Rebuild the V/TO', 180, 'Throw out the old 3-year picture and write a new one. Then write the 1-year plan.'],
  ['rocks', 'Set next quarter Rocks', 120, 'Day two follows the quarterly agenda from here.'],
  ['ids', 'Tackle key issues', 180, 'Long-term issues list. Identify, discuss, solve.'],
  ['conclude', 'Next steps and conclude', 15, 'Who does what, then rate the two days 1 to 10.'],
];
export const agendaFor = kind => (kind === 'quarterly' ? QUARTERLY_AGENDA : kind === 'annual' ? ANNUAL_AGENDA : L10_AGENDA);

/* ---------- people ---------- */
export const ROLE_SLOTS = 5;
export const personOf = id => {
  const p = eos().people;
  if (!p[id]) p[id] = { values: {}, gwc: { g: null, w: null, c: null } };
  return p[id];
};

/* ---------- organizational checkup: 20 statements, each scored 1 to 5 ---------- */
export const CHECKUP = [
  ['Vision', 'The vision is written down and shared with everyone.'],
  ['Vision', 'Core values are clear and used to hire, review, reward and let go.'],
  ['Vision', 'Core focus is clear, and people and systems stay inside it.'],
  ['Vision', 'The 10-year target is clear and shared.'],
  ['Vision', 'The target market is defined and all marketing aims at it.'],
  ['Vision', 'Your three uniques are clear and used in marketing.'],
  ['Vision', 'You have a named, visual proven process for customers.'],
  ['People', 'Everyone fits your culture and shares your core values.'],
  ['People', 'The accountability chart is clear, complete and current.'],
  ['People', 'Everyone is in the right seat: gets it, wants it, has capacity.'],
  ['People', 'The leadership team is open, honest and trusting.'],
  ['Traction', 'Everyone has 1 to 7 Rocks and focuses on them.'],
  ['Traction', 'Everyone takes part in regular weekly meetings.'],
  ['Traction', 'Meetings run on the same day, time and agenda, and start and end on time.'],
  ['Issues', 'Teams identify, discuss and solve issues for the greater good.'],
  ['Process', 'Core processes are documented, simplified and followed.'],
  ['Data', 'You get regular feedback from customers and employees.'],
  ['Data', 'A weekly Scorecard is in place.'],
  ['Data', 'Everyone owns at least one weekly number.'],
  ['Data', 'A budget exists and is reviewed regularly.'],
];

/* ---------- Syllabi drafts (from the Traction fill-in guide, 2026-10-17) ----------
   Everything here is a draft to edit. applySyllabiDrafts() only fills blanks and adds
   what is missing, so it never overwrites something already typed. */
export const SYLLABI_VTO = {
  coreValues: [
    'Simple for students: plain words, short questions',
    'Vet before it ships: Islamic content and Dhivehi copy get checked first',
    'Staging first: nothing reaches live students untested',
    'Respect their language and faith: plain register, honorifics only where due',
  ],
  coreFocus: { purpose: 'Learn in your own language', niche: 'Dhivehi-first study tools for Maldivian students' },
  tenYear:
    'N Maldivian students study with Syllabi every month by 2036. (Pick N: start from about 2,800 accounts today and decide what 10x or 50x looks like.)',
  marketing: {
    target: 'Exam Prep: O/A-Level students in the Maldives and their parents. Games: parents of Preschool to Grade 8 children.',
    uniques: ['Dhivehi content', 'Past papers with AI marking in Dhivehi', 'Learning games, not only quizzes'],
    process: 'Exam Prep: pick subjects → practise by unit → past papers → fix mistakes → mock exam',
    guarantee: '3-day Games trial and a free Exam Prep period. Decide whether to state a stronger promise.',
  },
  threeYear: {
    date: '31 Dec 2029',
    revenue: '',
    profit: '',
    measurables: ['Paying subscribers', 'Subjects covered', 'Games live'],
    looks: [
      'One Syllabi account works across every product, with a home launcher',
      "Exam Prep covers more than today's two live subjects",
      'Games has a stable library, with free and premium sets chosen',
      'Hired content developers update both products through the CMS, with review and publish steps',
      'Offline mode works on Android',
    ],
  },
  oneYear: {
    date: '31 Dec 2026',
    revenue: '',
    profit: '',
    goals: [
      'Syllabi Games live on 26 Oct with the 3-day trial and MVR 199, 399 and 594 plans',
      'CMS v1 handling content for both products, replacing the old admin',
      'Islam questions vetted and released',
      'All waiting migrations applied on staging, then live',
    ],
  },
};
const ROCKS = [
  ['Launch Syllabi Games: live on main with the trial and three plans', '2026-10-26', 'Launch Syllabi Games'],
  ['Ship CMS v1 for both products: content team can add and fix content without you', '2026-12-31', 'Finish the new CMS (content for both products)'],
  ['Vet and release Islam questions: reviewer sign-off recorded, questions live', '2026-12-31', 'Vet the Islam question set'],
  ['Apply waiting migrations: on staging, then live, drift check passes', '2026-10-31', 'Apply the waiting migrations on staging, then live'],
];
const MEASURABLES = [
  ['New signups', '>='],
  ['Students who finish onboarding', '>='],
  ['Practice sessions per active student', '>='],
  ['Games trials started', '>='],
  ['Trial to paid conversion', '>=', '%'],
  ['New paid subscribers', '>='],
  ['Cancellations', '<='],
  ['Questions published and reviewed', '>='],
  ['Open support emails', '<='],
];
const ISSUES = [
  ['Reverse the mock-submit XP farm, or not', 'Decide on reversing the mock-submit XP farm'],
  ['Which Games are free, which are premium', 'Choose the free Games set'],
  ['Native-speaker checks on Dhivehi copy across games and apps', 'Native-speaker checks for Dhivehi copy'],
  ['Vet Islam questions and the Judge game sources', 'Vet Islam questions and Judge game sources'],
  ['Merge staging-only features to main', 'Merge staging features to main'],
  ['The dead WhatsApp support link', 'Decide the dead WhatsApp support link'],
  ['Content developers cannot edit content safely yet (the CMS)'],
];
const PROCESSES = [
  [
    'Content pipeline',
    'Operations, content',
    [
      'Source',
      '- Pick the syllabus unit; use the textbook as the base',
      '- Set the grade and subject',
      'Generate',
      '- Draft questions with the model; keep wording simple',
      'Review',
      '- Check Dhivehi register',
      "- Islam content waits for a named vetter's sign-off",
      'Publish',
      '- Move from draft to published; record who approved it',
      'Fix',
      '- Read student reports weekly; correct the item and close the report',
    ],
    'Question pipeline',
  ],
  [
    'Release',
    'Operations, product and tech',
    [
      'Check the calendar for a release freeze (exam peaks)',
      'Lint, format and build',
      'Test on staging end to end',
      'Deploy to production',
      'Smoke-test production',
    ],
    'Release',
  ],
  [
    'Database change',
    'Operations, product and tech',
    [
      'Write the migration',
      '- Keep it reversible',
      'Apply on staging and test the affected screens',
      'Get a written approval',
      'Apply on live',
      'Fold it into schema.sql; run the drift check',
    ],
    'Database change',
  ],
  ['Orders and payments', 'Finance', ['Bank slip received', 'Verify the payment', 'Grant access and email the code', 'Record the order']],
  ['Support', 'Operations, support', ['Email in', 'Reply within one working day', 'Record repeat problems as issues'], 'Support'],
  ['Marketing', 'Sales and marketing', ['Plan seasonal campaigns around exam peaks', 'Blog', 'Email', 'Social']],
  [
    'Hiring',
    'Founder',
    ['Define the seat and its five roles', 'Trial task', 'People Analyzer against the core values, plus GWC', 'First review after 30 days'],
  ],
];
// Old starter wording that the drafts replace (only when still untouched).
const OLD_MEAS = ['Weekly active students', 'Paid subscribers', 'MRR', 'Churned subscribers', 'Questions published', 'Production incidents'];
const OLD_PROC_STEPS = {
  'Question pipeline': 'Generate questions from the textbook',
  'New game or content launch': 'Content vetted and on staging',
  Release: 'Check the calendar for a release freeze\nLint',
  Support: 'Reply to new emails within one working day',
  'Database change': 'Write the migration\n- Keep it reversible\nApply on staging\nTest',
};
const SEATS = [
  [
    'f',
    'Founder (Visionary + Integrator)',
    [
      'Vision, values and the 10-year target',
      'Runs the weekly meeting',
      'Sets Rocks and holds the seats accountable',
      'Big relationships: schools, partners',
      'Final call on content and pricing',
    ],
    null,
  ],
  [
    'sm',
    'Sales and marketing',
    ['Social channels and launches', 'Seasonal campaigns around exam peaks', 'Blog and email', 'Brand', 'Parent and school outreach'],
    'f',
  ],
  [
    'op',
    'Operations',
    [
      'Content, product and support run on time',
      'Releases and incidents',
      'Core processes followed',
      'Quality of what students see',
      'Hiring for operations seats',
    ],
    'f',
  ],
  ['fi', 'Finance', ['Orders, bank slips and passes', 'Budget', 'Bookkeeping', 'Pricing review', 'Monthly numbers'], 'f'],
  ['ct', 'Content', ['Lesson notes and questions', 'Vetting and review', 'Dhivehi register checks', 'Content calendar', 'Fix student-reported errors'], 'op'],
  ['pt', 'Product and tech', ['Exam Prep, Games and the CMS', 'Staging first, then live', 'Database changes', 'Uptime', 'Android apps'], 'op'],
  ['sp', 'Support', ['Support inbox', 'Reply within one working day', 'Record repeat problems', 'Parent questions', 'Account and pass fixes'], 'op'],
];

export function applySyllabiDrafts(me) {
  const e = eos();
  const n = { fields: 0, rocks: 0, measurables: 0, issues: 0, processes: 0, seats: 0, updated: 0 };
  const lc = s =>
    String(s || '')
      .trim()
      .toLowerCase();
  // V/TO: fill only blank fields.
  const fill = (dst, src) => {
    for (const k in src) {
      const v = src[k];
      if (v && typeof v === 'object' && !Array.isArray(v)) fill((dst[k] ||= {}), v);
      else if (Array.isArray(v) ? v.length && !(dst[k] || []).length : v && !dst[k]) {
        dst[k] = Array.isArray(v) ? [...v] : v;
        n.fields++;
      }
    }
  };
  fill(e.vto, SYLLABI_VTO);
  // Rocks: rename old starter Rocks in place; add the rest.
  const q = quarterId();
  for (const [title, due, old] of ROCKS) {
    const ex = e.rocks.find(r => lc(r.title) === lc(title) || (old && lc(r.title) === lc(old)));
    if (ex) {
      if (lc(ex.title) !== lc(title)) {
        Object.assign(ex, { title, due });
        n.updated++;
      }
      continue;
    }
    e.rocks.push({ id: newId('rk'), title, owner: me, quarter: q, status: 'on', project: null, due });
    n.rocks++;
  }
  // Scorecard: drop untouched old starter numbers; add the guide's.
  e.measurables = e.measurables.filter(
    m => !(OLD_MEAS.includes(m.name) && !Object.keys(m.weeks || {}).length && (m.goal === '' || (m.name === 'Production incidents' && m.goal === '0'))),
  );
  for (const [name, op, unit] of MEASURABLES) {
    if (e.measurables.some(m => lc(m.name) === lc(name))) continue;
    e.measurables.push({ id: newId('ms'), name, owner: me, goal: '', op, unit: unit || '', weeks: {} });
    n.measurables++;
  }
  // Issues: reword old starter issues in place; add the rest.
  for (const [title, old] of ISSUES) {
    const ex = e.issues.find(x => lc(x.title) === lc(title) || (old && lc(x.title) === lc(old)));
    if (ex) {
      if (lc(ex.title) !== lc(title)) {
        ex.title = title;
        n.updated++;
      }
      continue;
    }
    e.issues.push({ id: newId('is'), title, notes: '', owner: me, term: 'short', priority: 0, status: 'open', created: Date.now(), solved: null });
    n.issues++;
  }
  // Processes: replace untouched old starter processes; add the rest.
  e.processes = e.processes.filter(pr => !(OLD_PROC_STEPS[pr.name] && (pr.steps || '').startsWith(OLD_PROC_STEPS[pr.name])));
  for (const [name, seat, steps] of PROCESSES) {
    if (e.processes.some(pr => lc(pr.name) === lc(name))) continue;
    e.processes.push({ id: newId('pr'), name, owner: me, seat, steps: steps.join('\n') });
    n.processes++;
  }
  // Seats: only when the chart is empty (structure first, so names come later).
  if (!e.seats.length) {
    const ids = {};
    for (const [k, name, roles, parent] of SEATS) {
      ids[k] = newId('st');
      e.seats.push({ id: ids[k], name, roles, holder: me, parent: parent ? ids[parent] : null });
      n.seats++;
    }
  }
  e.seeded = true;
  e.drafts = 1;
  return n;
}
