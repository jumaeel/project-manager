/* ---------- seed data: a fresh, empty workspace ---------- */
export function seed() {
  return {
    ws: { name: 'Gr8r Studio', url: 'gr8rstudio', c: '#1D1C1A', brand: true },
    workspaces: [{ id: 'w1', name: 'Gr8r Studio', c: '#1D1C1A', plan: 'Free', brand: true }],
    me: 'm1',
    members: [{ id: 'm1', name: 'You', email: '', role: 'Owner', team: 'product', title: '', c: '#5A67D8', status: 'active', last: 0, tz: '' }],
    projects: [],
    tasks: [],
    comments: [],
    activity: [],
    notifs: [],
    files: [],
    events: [],
    projOrder: [],
    savedViews: [],
    recentSearches: [],
    sessions: [{ id: 'se1', dev: 'This device', loc: '', at: 'Active now', cur: true }],
    invoices: [],
    tfa: false,
    notifPrefs: {
      email_mention: true,
      email_assign: true,
      email_digest: true,
      email_comment: false,
      push_mention: true,
      push_assign: true,
      push_comment: true,
      push_due: true,
      mention_all: true,
      assign_self: true,
    },
  };
}
