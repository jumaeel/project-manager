/* ---------------- TRACTION actions ---------------- */
import { $, TODAY, addD, iso } from '../core/utils.js';
import { D, S, mem, save } from '../core/store.js';
import { CHECKUP, agendaFor, eos, newId, quarterEnd, quarterId, resolvePath, shiftQuarter, syllabiStarter, weekId } from '../core/eos.js';
import { mutate, toast } from '../ui/toast.js';
import { render } from '../shell/render.js';
import { l10Clock } from '../pages/traction.js';
import { A, IN, confirmDlg } from './actions.js';

const in7 = () => iso(addD(TODAY, 7));
const issue = (title, x = {}) => ({
  id: newId('is'),
  title,
  notes: '',
  owner: D().me,
  term: 'short',
  priority: 0,
  status: 'open',
  created: Date.now(),
  solved: null,
  ...x,
});

/* Inline edits: update the value and save, without a re-render (keeps typing smooth).
   data-render re-renders for fields that change how the page looks (selects). */
IN.eos = el => {
  const [o, k] = resolvePath(el.dataset.p);
  if (!o) return;
  let v = el.type === 'checkbox' ? el.checked : el.value;
  if (el.dataset.list)
    v = v
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);
  if (el.tagName === 'SELECT' && v === '') v = null;
  o[k] = v;
  save();
  if (el.dataset.render) render();
};
IN.eosWeek = el => {
  const m = eos().measurables.find(x => x.id === el.dataset.id);
  if (!m) return;
  const v = el.value.trim();
  if (v === '' || isNaN(Number(v))) delete m.weeks[el.dataset.w];
  else m.weeks[el.dataset.w] = Number(v);
  save();
  // Recolour the cell in place so focus stays put while typing.
  const td = el.closest('td');
  const g = m.goal === '' || m.goal == null ? null : Number(m.goal);
  td.classList.remove('ok', 'bad');
  if (v !== '' && g != null && !isNaN(Number(v))) {
    const a = Number(v);
    const ok = m.op === '<=' ? a <= g : m.op === '=' ? a === g : a >= g;
    td.classList.add(ok ? 'ok' : 'bad');
  }
};
IN.todoOwner = el => (S.ui.todoOwner = el.value || null);

A.eosDel = el => {
  const coll = el.dataset.coll;
  const list = eos()[coll];
  const x = list.find(i => i.id === el.dataset.id);
  if (!x) return;
  const run = () => {
    const snap = JSON.stringify(eos()[coll]);
    if (
      mutate(() => {
        eos()[coll] = list.filter(i => i !== x);
        if (coll === 'seats') eos().seats.forEach(s => s.parent === x.id && (s.parent = x.parent || null));
      })
    )
      toast('Deleted', {
        action: 'Undo',
        onAction: () =>
          mutate(() => {
            eos()[coll] = JSON.parse(snap);
          }),
      });
  };
  if (coll === 'processes' || coll === 'measurables')
    confirmDlg({
      title: `Delete “${x.name}”?`,
      body: coll === 'measurables' ? 'Its weekly history goes too.' : 'Its steps go too.',
      ok: 'Delete',
      danger: true,
      run,
    });
  else run();
};

/* ---------- starter ---------- */
A.eosStarter = () => {
  const s = syllabiStarter(D().me);
  if (
    mutate(() => {
      const e = eos();
      e.rocks.push(...s.rocks);
      e.measurables.push(...s.measurables);
      e.issues.push(...s.issues);
      e.processes.push(...s.processes);
      e.seeded = true;
    })
  )
    toast(`Added ${s.rocks.length} Rocks, ${s.measurables.length} numbers, ${s.issues.length} issues and ${s.processes.length} processes`);
};

/* ---------- issues ---------- */
A.eosAddIssue = f => {
  const inp = $('#new-issue', f);
  const t = inp.value.trim();
  if (!t) return inp.focus();
  const term = S.ui.route === 'issues' ? S.ui.issueTerm || 'short' : eos().live?.kind === 'quarterly' ? 'long' : 'short';
  mutate(() => eos().issues.push(issue(t, { term })));
  $('#new-issue')?.focus();
};
A.eosIssuePrio = el => {
  const x = eos().issues.find(i => i.id === el.dataset.id);
  if (!x) return;
  const next = ((x.priority || 0) + 1) % 4;
  mutate(() => {
    // Priorities 1-3 are unique: taking a number bumps whoever had it.
    if (next) eos().issues.forEach(i => i !== x && i.status === 'open' && i.term === x.term && i.priority === next && (i.priority = 0));
    x.priority = next;
  });
};
A.eosIssueToggle = el => {
  S.ui.issueOpen = S.ui.issueOpen === el.dataset.id ? null : el.dataset.id;
  render();
};
A.eosIssueTerm = el => {
  const x = eos().issues.find(i => i.id === el.dataset.id);
  if (x && mutate(() => ((x.term = x.term === 'long' ? 'short' : 'long'), (x.priority = 0)))) toast(`Moved to ${x.term}-term`);
};
A.eosIssueReopen = el => {
  const x = eos().issues.find(i => i.id === el.dataset.id);
  if (x) mutate(() => Object.assign(x, { status: 'open', solved: null }));
};
A.eosSolve = f => {
  const x = eos().issues.find(i => i.id === f.dataset.id);
  if (!x) return;
  const title = $(`#solve-${x.id}`, f).value.trim();
  if (
    mutate(() => {
      Object.assign(x, { status: 'solved', solved: Date.now(), priority: 0 });
      if (title)
        eos().todos.push({ id: newId('td'), title, owner: x.owner || D().me, due: in7(), done: false, doneAt: null, created: Date.now(), issue: x.id });
    })
  ) {
    S.ui.issueOpen = null;
    render();
    toast(title ? `Solved. To-do added for ${mem(x.owner || D().me)?.name || 'you'}` : 'Solved');
  }
};
A.eosToIssue = el => {
  const e = eos();
  let t = '';
  if (el.dataset.kind === 'meas') {
    const m = e.measurables.find(x => x.id === el.dataset.id);
    t = `Off track: ${m.name} (${m.weeks[weekId()] ?? '—'} vs goal ${m.op} ${m.goal})`;
  } else {
    const r = e.rocks.find(x => x.id === el.dataset.id);
    t = `Rock off track: ${r.title}`;
  }
  if (e.issues.some(i => i.status === 'open' && i.title === t)) return toast('Already on the Issues list', { kind: 'info' });
  if (mutate(() => e.issues.push(issue(t)))) toast('Added to Issues');
};

/* ---------- to-dos ---------- */
A.eosAddTodo = f => {
  const inp = $('#new-todo', f);
  const t = inp.value.trim();
  if (!t) return inp.focus();
  mutate(() => eos().todos.push({ id: newId('td'), title: t, owner: S.ui.todoOwner || D().me, due: in7(), done: false, doneAt: null, created: Date.now() }));
  $('#new-todo')?.focus();
};
A.eosTodoToggle = el => {
  const t = eos().todos.find(x => x.id === el.dataset.id);
  if (t) mutate(() => Object.assign(t, { done: !t.done, doneAt: t.done ? null : Date.now() }));
};

/* ---------- scorecard ---------- */
A.eosAddMeas = f => {
  const inp = $('#new-meas', f);
  const t = inp.value.trim();
  if (!t) return inp.focus();
  mutate(() => eos().measurables.push({ id: newId('ms'), name: t, owner: D().me, goal: '', op: '>=', unit: '', weeks: {} }));
  $('#new-meas')?.focus();
};

/* ---------- rocks ---------- */
A.eosQuarter = el => {
  S.ui.rockQ = shiftQuarter(S.ui.rockQ || quarterId(), +el.dataset.d);
  render();
};
A.eosAddRock = f => {
  const inp = $('#new-rock', f);
  const t = inp.value.trim();
  if (!t) return inp.focus();
  const q = S.ui.rockQ || quarterId();
  mutate(() => eos().rocks.push({ id: newId('rk'), title: t, owner: D().me, quarter: q, status: 'on', project: null, due: quarterEnd(q) }));
  $('#new-rock')?.focus();
};

/* ---------- people ---------- */
A.eosAddSeat = el => {
  mutate(() => eos().seats.push({ id: newId('st'), name: 'New seat', roles: [], holder: null, parent: el.dataset.parent || null }));
};
A.eosSeatStarter = () => {
  mutate(() => {
    const seat = (name, roles, parent = null) => {
      const s = { id: newId('st'), name, roles, holder: D().me, parent };
      eos().seats.push(s);
      return s.id;
    };
    const v = seat('Visionary', ['Ideas and the 10-year vision', 'Big relationships', 'Culture', 'Creative problem solving', 'Research and development']);
    const i = seat(
      'Integrator',
      ['Leads and manages the team', 'Runs the weekly meeting', 'Holds people accountable', 'Executes the business plan', 'Resolves issues'],
      v,
    );
    seat('Content', ['Lesson notes and questions', 'Vetting and review', 'Content calendar'], i);
    seat('Marketing', ['Social channels', 'Launches and campaigns', 'Brand'], i);
    seat('Operations', ['Support inbox', 'Releases and incidents', 'Payments and passes'], i);
    seat('Finance', ['Budget', 'Bookkeeping', 'Pricing'], i);
  });
};
A.eosMark = el => {
  const p = eos().people;
  const id = el.dataset.id;
  p[id] ||= { values: {}, gwc: { g: null, w: null, c: null } };
  const cur = p[id].values[el.dataset.i];
  const next = { undefined: '+', '+': '+-', '+-': '-', '-': undefined }[cur];
  mutate(() => {
    if (next) p[id].values[el.dataset.i] = next;
    else delete p[id].values[el.dataset.i];
  });
};
A.eosGwc = el => {
  const p = eos().people;
  const id = el.dataset.id;
  p[id] ||= { values: {}, gwc: { g: null, w: null, c: null } };
  const cur = p[id].gwc[el.dataset.k];
  mutate(() => (p[id].gwc[el.dataset.k] = cur === true ? false : cur === false ? null : true));
};

/* ---------- processes ---------- */
A.eosAddProc = f => {
  const inp = $('#new-proc', f);
  const t = inp.value.trim();
  if (!t) return inp.focus();
  mutate(() => eos().processes.push({ id: newId('pr'), name: t, owner: D().me, steps: '' }));
};
A.eosProcRun = el => {
  S.ui.procRun = S.ui.procRun === el.dataset.id ? null : el.dataset.id;
  render();
};
A.eosProcCheck = el => {
  const c = (S.ui.procChecks ||= {});
  c[el.dataset.k] = !c[el.dataset.k];
  render();
};
A.eosProcReset = el => {
  const c = S.ui.procChecks || {};
  Object.keys(c).forEach(k => k.startsWith(el.dataset.id + ':') && delete c[k]);
  render();
};

/* ---------- checkup ---------- */
A.eosCheckScore = el => {
  S.ui.checkup ||= Array(CHECKUP.length).fill(0);
  S.ui.checkup[+el.dataset.i] = +el.dataset.v;
  render();
};
A.eosCheckSave = () => {
  const scores = S.ui.checkup;
  if (!scores || scores.some(s => !s)) return;
  if (
    mutate(() => {
      const e = eos();
      e.checkups = e.checkups.filter(c => c.date !== iso(TODAY));
      e.checkups.push({ date: iso(TODAY), scores: [...scores] });
    })
  ) {
    S.ui.checkup = null;
    render();
    toast(`Checkup saved: ${scores.reduce((a, b) => a + b, 0)} / 100`);
  }
};
A.eosCheckIssues = el => {
  const c = eos().checkups.find(x => x.date === el.dataset.date);
  if (!c) return;
  const low = c.scores.map((s, i) => [s, i]).filter(([s]) => s <= 2);
  const e = eos();
  const add = low.map(([s, i]) => `Checkup (${s}/5): ${CHECKUP[i][1]}`).filter(t => !e.issues.some(x => x.status === 'open' && x.title === t));
  if (!add.length) return toast(low.length ? 'Those are already on the Issues list' : 'No scores of 1 or 2', { kind: 'info' });
  if (mutate(() => add.forEach(t => e.issues.push(issue(t, { term: 'long' }))))) toast(`Added ${add.length} long-term issue${add.length > 1 ? 's' : ''}`);
};

/* ---------- meetings ---------- */
/* One cheap ticker: refreshes the meeting clock whenever it is on screen. */
setInterval(() => {
  const el = document.getElementById('l10-clock');
  if (el && S.data?.eos?.live) el.outerHTML = l10Clock();
}, 1000);
A.eosStartMeeting = () => {
  const kind = S.ui.l10Kind || 'weekly';
  mutate(
    () =>
      (eos().live = { kind, seg: 0, start: Date.now(), segStart: Date.now(), headlines: [], notes: '', rating: null, reviewQ: shiftQuarter(quarterId(), -1) }),
  );
};
A.eosSeg = el => {
  const L = eos().live;
  if (!L) return;
  const i = Math.max(0, Math.min(agendaFor(L.kind).length - 1, +el.dataset.i));
  L.seg = i;
  L.segStart = Date.now();
  save();
  render();
};
A.eosHeadline = f => {
  const inp = $('#l10-hl', f);
  const t = inp.value.trim();
  if (!t) return;
  mutate(() => eos().live.headlines.push(t));
  $('#l10-hl')?.focus();
};
A.eosHeadlineDel = el => mutate(() => eos().live.headlines.splice(+el.dataset.i, 1));
A.eosRate = el => mutate(() => (eos().live.rating = +el.dataset.v));
A.eosFinishMeeting = () => {
  const e = eos();
  const L = e.live;
  if (!L?.rating) return;
  const solved = e.issues.filter(x => x.status === 'solved' && x.solved >= L.start).length;
  const todos = e.todos.filter(t => t.created >= L.start).length;
  if (
    mutate(() => {
      e.meetings.push({
        id: newId('mt'),
        date: iso(TODAY),
        kind: L.kind,
        rating: L.rating,
        headlines: L.headlines,
        notes: L.notes,
        solved,
        todos,
        minutes: Math.round((Date.now() - L.start) / 6e4),
      });
      e.live = null;
    })
  ) {
    toast(`Meeting saved: rated ${L.rating}/10, ${solved} solved, ${todos} new to-do${todos === 1 ? '' : 's'}`);
  }
};
A.eosCancelMeeting = () =>
  confirmDlg({
    title: 'Cancel this meeting?',
    body: 'Nothing is recorded. Issues and to-dos you changed stay changed.',
    ok: 'Cancel meeting',
    danger: true,
    run: () => {
      mutate(() => (eos().live = null));
    },
  });

A.eosPrint = () => window.print();

/* ---------- backup (Settings → Workspace) ---------- */
A.exportBackup = () => {
  const blob = new Blob([JSON.stringify({ app: 'project-manager', version: 1, exported: new Date().toISOString(), data: S.data, prefs: S.prefs }, null, 2)], {
    type: 'application/json',
  });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `project-manager-backup-${iso(TODAY)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup downloaded');
};
IN.importBackup = async el => {
  const file = el.files?.[0];
  el.value = '';
  if (!file) return;
  let j;
  try {
    j = JSON.parse(await file.text());
  } catch {
    return toast("That file isn't a valid backup", { kind: 'err' });
  }
  const data = j?.data;
  if (!data || !Array.isArray(data.tasks) || !Array.isArray(data.members)) return toast("That file isn't a Project Manager backup", { kind: 'err' });
  confirmDlg({
    title: 'Restore this backup?',
    body: `Everything in this workspace is replaced with the backup from <b>${j.exported ? new Date(j.exported).toLocaleString() : 'an unknown date'}</b>. Download a backup of the current state first if you might need it.`,
    ok: 'Restore',
    danger: true,
    run: () => {
      if (
        mutate(() => {
          S.data = data;
          if (j.prefs) Object.assign(S.prefs, j.prefs);
        })
      )
        toast('Backup restored');
    },
  });
};

/* ---------- sidebar: hide items, fold groups ---------- */
IN.navToggle = el => {
  const h = new Set(S.prefs.hiddenNav || []);
  if (el.checked) h.delete(el.dataset.k);
  else h.add(el.dataset.k);
  S.prefs.hiddenNav = [...h];
  save();
  render();
};
A.navShowAll = () => {
  S.prefs.hiddenNav = [];
  save();
  render();
};
A.navGroup = el => {
  const c = (S.prefs.navCollapsed = { ...(S.prefs.navCollapsed || {}) });
  c[el.dataset.g] = !c[el.dataset.g];
  save();
  render();
};
