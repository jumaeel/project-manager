/* "How to fill it" guides for each Traction page, from the Traction fill-in guide. */
const ol = items => `<ol>${items.map(i => `<li>${i}</li>`).join('')}</ol>`;
const ul = items => `<ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`;

export const GUIDES = {
  l10: `<p>Three meetings keep the Rocks on track. The weekly one follows five rules: <b>same day, same time, same printed agenda, start on time, end on time.</b> Do not cancel it; the routine is the value.</p>
    ${ul([
      '<b>Weekly (L10):</b> every week, 60 minutes solo. Check numbers and Rocks, solve issues.',
      '<b>Quarterly:</b> every 90 days. Score last quarter, review the vision, set new Rocks.',
      '<b>Annual:</b> once a year, two days. Rebuild the 3-year picture and write the 1-year plan.',
    ])}
    <p><b>Syllabi calendar:</b> start the weekly meeting this week with your Q4 Rocks, and keep it through the exam peak. First quarterly in the first week of January, with 1 to 2 days for annual planning. Other quarterlies in early April (before the May/June peak) and early July. Exam peaks are release-freeze weeks: put support and uptime first.</p>`,

  issues: `<p>Every obstacle goes on a list the moment you notice it. Solo, keep two lists: <b>short-term</b> for the weekly meeting, <b>long-term</b> for the quarterly. Anything not solvable this week and not urgent moves to long-term.</p>
    <p><b>IDS: Identify, Discuss, Solve</b></p>
    ${ol([
      '<b>Pick the top three</b> (click the circles). Do not just work down from the top; the most important issue may be near the bottom.',
      '<b>Identify</b> the real issue. The stated problem is usually a symptom; keep asking why until you reach the root.',
      '<b>Discuss</b> it fully. Stay on this one issue, no tangents.',
      '<b>Solve</b> it out loud: "I will do X by Friday." It gets an owner and becomes a to-do.',
    ])}
    <p>The answer is one of three: live with it, end it, or change it. Solve it with a to-do, not a promise to think about it.</p>`,

  todos: `<p>To-dos are <b>7-day action items</b>, mostly created when you solve an issue. Each week, review every one as done or not done, and aim for about 90% done.</p>
    <p>Anything still open after two weeks is a sign the issue was not really solved: put it back on the Issues list.</p>`,

  scorecard: `<p>5 to 15 numbers you review every week, each with one owner and a weekly goal. Fewer is better. They track activity that predicts revenue, so you spot trouble weeks before the money shows it.</p>
    ${ol([
      'Imagine you are stranded with one sheet of paper. Which numbers must be on it to feel the pulse of the business? Cut to 5 to 15.',
      'Name one owner per number. The owner delivers it, even if someone else types it in.',
      'Set a weekly goal for each, tied to the 1-year plan. Wait for 3 to 4 weeks of data first.',
      'Decide who fills it in each week, and where the data comes from (Supabase, orders, the support inbox).',
      'Review it every week. After 13 weeks you see a quarter at a glance.',
      'A number that misses goes red; send it to Issues.',
    ])}
    ${ul([
      'Use weekly activity numbers (signups, trials, conversions), not totals from the P&amp;L.',
      'It does not replace monthly statements and a budget.',
      'Expect the first version to be about 85% right; it takes around three months to rely on.',
      'Exam Prep peaks in Oct/Nov and May/June: compare with the same week last year, not last month.',
    ])}`,

  rocks: `<p>3 to 7 priorities for the next 90 days, each with one owner and a due date. Everything else waits.</p>
    ${ol([
      'List everything you want done in the next 90 days. Expect 10 to 20 items.',
      'Keep, kill or combine until 3 to 7 remain.',
      "Set the due date, normally the quarter's last day.",
      'Write each so nobody can argue whether it was done. "Hire a controller" works; "work on support" does not.',
      'Give each exactly one owner. Solo, that is you, but still write it down.',
      'Move anything left over to the Issues list.',
      'Review them every week in the meeting.',
    ])}
    <p><b>The wall:</b> once Rocks are set, no new priorities enter this quarter; new ideas go to Issues. <b>Scoring:</b> at quarter end each Rock is done or not done. Aim for 80%, not 100%.</p>`,

  vision: `<p>Eight questions answered in order, because each answer narrows the next. Fill it once, then review it every quarter. The Syllabi answers are drafts from your handoff notes: replace them with your own words.</p>
    <p>Set aside one to two days for the first pass. Solo, split it into three two-hour sessions: questions 1 to 3, then 4 to 6, then 7 and 8. Print it on one page and keep it where you work.</p>`,

  people: `<p>Every person needs two things: they share your core values (<b>right person</b>), and they sit in a seat that fits their strengths and capacity (<b>right seat</b>).</p>
    <p><b>Accountability chart</b></p>
    ${ol([
      'Draw the structure first, with every name blank. Build it for where you want to be.',
      'Under the top seat sit three functions: sales and marketing, operations, finance. Split them as needed.',
      'Write five main roles for each seat as short bullets.',
      'Only then put names in. One name can hold several seats; a seat never has two names.',
      'As you grow, hand off the seats that drain you and keep the ones you do best.',
    ])}
    <p><b>People analyzer:</b> decide your bar first (the minimum you accept). Rate each person on each core value: + most of the time, ± sometimes, − rarely. Then GWC: <b>gets it</b>, <b>wants it</b>, has the <b>capacity</b>. One "no" means the wrong seat; move the person rather than lose them. Redo it every quarter, including your own row.</p>`,

  processes: `<p>A core process is a repeatable way of doing a key part of the business. Written down, the business runs without you in every task, and new people follow the same steps.</p>
    ${ol([
      '<b>Identify</b> your core processes, usually six or seven. Name each one and use that exact name everywhere.',
      "<b>Document</b> each at a high level. The seat's owner writes it. Capture the 20% of steps that deliver 80% of the result: named steps with a few bullets each.",
      '<b>Package and follow it.</b> Train people on it and check they follow it. When something goes wrong, first ask whether a step was skipped.',
    ])}
    <p>Identify before you document, or you end up with 100 loose procedures. Once the CMS exists, build the content pipeline steps into it as statuses.</p>`,

  checkup: `<p>20 statements, each scored 1 (weak) to 5 (strong); the total is a percentage. Do it in your first week, then every six months. Progress, not perfection: 55% to 63% is a good result.</p>
    ${ol([
      'Score each line honestly, on your own.',
      'Save it to get your percentage.',
      'For every line scored 1 to 3, decide one action: a Rock if big, a to-do if small, an issue if unsure.',
      'Repeat in six months and compare.',
    ])}
    <p>Solo, read "everyone" as you plus anyone who works with you. Lines about the team will score low until you hire; use them to decide what to build first.</p>`,
};

/* Per-question help on the Vision page. */
export const VTO_HELP = {
  1: `3 to 7 timeless principles you hire, fire, review and reward by. ${ol([
    'List three people you would clone (contractors, teachers or past teammates count).',
    'Write the qualities each shows day to day. Make the list long.',
    'Cross out the non-essential and merge near-duplicates, down to 5 to 15.',
    'Debate to a final 3 to 7.',
  ])} Check: you would hire for each value, and let someone go for breaking it.`,
  2: `<b>Purpose:</b> why you exist, 3 to 7 simple words, bigger than a goal and not about money. <b>Niche:</b> what you do better than anyone; it filters every decision. Write each alone, then refine. Test: a Dhivehi-content game fits; a generic English game does not, however popular.`,
  3: `One larger-than-life, measurable goal, usually 10 years out. Decide how far out, write the revenue you could reach, then the one target that excites you most. It should be specific enough for an outsider to judge, and scare you a little. Revisit it each quarter until it feels right.`,
  4: `Four answers in order. <b>Target market:</b> who, where, how they think, and who you will not serve. <b>Three uniques:</b> list everything that sets you apart, ask three customers, debate to three. <b>Proven process:</b> the 3 to 7 named steps every customer goes through. <b>Guarantee:</b> something that removes a buyer's fear. Exam Prep and Games have different customers: give each its own list and uniques.`,
  5: `About an hour. Pick a year-end date, write revenue then profit, choose 1 or 2 measurables that show size, then 10 to 20 bullets on people, tools, product mix and how work is done. Read it aloud: you should see it, believe it and want it.`,
  6: `About two hours. Date, revenue, profit and measurable matching the 3-year picture, plus 3 to 7 goals that are specific, measurable and attainable. "Games live with a trial and three plans by 26 Oct", not "improve Games". Check a simple budget supports it. Fewer goals get finished.`,
  7: `Comes from the Rocks page: 3 to 7 priorities for 90 days, one owner each, written so nobody can argue whether they were done.`,
  8: `Comes from the long-term Issues list: anything that makes you say "but what about" or "we cannot because". Do not soften them or solve them here.`,
};
