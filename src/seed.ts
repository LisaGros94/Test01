import type { State } from "./types";
import { daysFromNow, uid, weekOf } from "./lib";

/**
 * Seed data — every module ships with worked examples so empty states teach.
 * Internal operations only. No client or prospect data, ever.
 */
export function seed(): State {
  const now = new Date().toISOString();
  const people = [
    { id: "p1", name: "You", initials: "YO", city: "London" as const },
    { id: "p2", name: "Camille", initials: "CA", city: "Paris" as const },
    { id: "p3", name: "Jonas", initials: "JO", city: "Berlin" as const },
    { id: "p4", name: "Priya", initials: "PR", city: "London" as const },
    { id: "p5", name: "Mathilde", initials: "MA", city: "Paris" as const },
    { id: "p6", name: "Felix", initials: "FE", city: "Berlin" as const },
  ];

  const workstreams = [
    { id: "w1", name: "Fundraise", ownerId: "p1", description: "Pre-seed close and investor relations.", archived: false },
    { id: "w2", name: "Product — Advisory Engine", ownerId: "p3", description: "Core product build: the advisory engine and client-facing surface.", archived: false },
    { id: "w3", name: "Regulatory & Licensing", ownerId: "p4", description: "FCA, AMF and BaFin scoping; compliance groundwork across UK / FR / DE.", archived: false },
    { id: "w4", name: "Brand & Site", ownerId: "p5", description: "Identity, website, and the story we tell in public.", archived: false },
    { id: "w5", name: "Hiring & Ops", ownerId: "p2", description: "The path from 6 to 15 people without breaking anything.", archived: false },
  ];

  const act = (actorId: string, text: string, daysAgo = 0) => ({
    at: new Date(Date.now() - daysAgo * 86400000).toISOString(),
    actorId,
    text,
  });

  const c = (
    partial: Partial<State["commitments"][number]> &
      Pick<State["commitments"][number], "workstreamId" | "title" | "status">
  ): State["commitments"][number] => ({
    id: uid("c"),
    description: "",
    ownerId: null,
    contributorIds: [],
    dueDate: null,
    originalDueDate: partial.dueDate ?? null,
    blockedBy: null,
    labels: [],
    createdAt: now,
    completedAt: null,
    activity: [act(partial.ownerId ?? "p1", "created this commitment", 14)],
    comments: [],
    ...partial,
  });

  const commitments = [
    c({
      id: "c1", workstreamId: "w1", title: "Close the pre-seed round",
      description: "Signed docs from all participating angels and the lead. Wire dates confirmed.",
      ownerId: "p1", contributorIds: ["p2"], dueDate: daysFromNow(9),
      status: "in_progress", labels: ["fundraise", "legal"],
    }),
    c({
      id: "c2", workstreamId: "w1", title: "Investor data room v1",
      description: "Deck, model, cap table, regulatory memo. One folder, one link, no loose files.",
      ownerId: "p2", dueDate: daysFromNow(-3), status: "in_progress",
      labels: ["fundraise"],
      comments: [{ id: uid("cm"), authorId: "p1", at: new Date(Date.now() - 2 * 86400000).toISOString(), text: "Model still shows the old hiring plan — needs the 15-headcount version before this goes out." }],
    }),
    c({
      id: "c3", workstreamId: "w2", title: "Advisory engine prototype in front of 5 design partners",
      description: "Clickable prototype of the portfolio-review flow, tested live with five friendly advisors.",
      ownerId: "p3", contributorIds: ["p6"], dueDate: daysFromNow(14),
      status: "in_progress", labels: ["product", "research"],
    }),
    c({
      id: "c4", workstreamId: "w2", title: "Define the v1 data model for portfolios",
      description: "Schema for accounts, holdings, and advice events. Reviewed by compliance before anything is built on it.",
      ownerId: "p6", dueDate: daysFromNow(4), status: "blocked", blockedBy: "c5",
      labels: ["product", "engineering"],
    }),
    c({
      id: "c5", workstreamId: "w3", title: "Regulatory perimeter memo — UK / FR / DE",
      description: "External counsel's memo on what we can and cannot do pre-licence in each jurisdiction.",
      ownerId: "p4", dueDate: daysFromNow(2), status: "in_progress",
      labels: ["regulatory", "legal"],
    }),
    c({
      id: "c6", workstreamId: "w3", title: "Appoint compliance consultant",
      description: "Shortlist of three, references checked, engagement letter signed.",
      ownerId: "p4", dueDate: daysFromNow(-6), status: "not_started",
      labels: ["regulatory"],
    }),
    c({
      id: "c7", workstreamId: "w4", title: "Ship the holding page",
      description: "One page, the name, one sentence, a waitlist field. Byredo-quiet.",
      ownerId: "p5", dueDate: daysFromNow(-10), status: "done",
      completedAt: new Date(Date.now() - 11 * 86400000).toISOString(),
      labels: ["brand"],
    }),
    c({
      id: "c8", workstreamId: "w4", title: "Brand identity v1 — wordmark and type",
      description: "Wordmark, typeface licence, and usage rules. Enough to be consistent everywhere.",
      ownerId: "p5", dueDate: daysFromNow(21), status: "in_progress",
      labels: ["brand", "design"],
    }),
    c({
      id: "c9", workstreamId: "w5", title: "Founding engineer offer out",
      description: "Final loop done, references, offer letter with EMI terms.",
      ownerId: "p2", contributorIds: ["p1", "p3"], dueDate: daysFromNow(6),
      status: "in_progress", labels: ["hiring"],
    }),
    c({
      id: "c10", workstreamId: "w5", title: "EMI option pool approved",
      description: "Board approval, valuation filed with HMRC, scheme docs signed.",
      ownerId: "p1", dueDate: daysFromNow(-1), status: "in_progress",
      labels: ["hiring", "legal", "equity"],
    }),
    c({
      id: "c11", workstreamId: "w5", title: "Payroll running in all three countries",
      description: "UK PAYE live; FR and DE via EOR until entities exist. One provider decision, written down.",
      ownerId: null, dueDate: null, status: "not_started",
      labels: ["ops"],
    }),
    c({
      id: "c12", workstreamId: "w2", title: "Instrument the prototype with basic analytics",
      description: "Enough telemetry to see where design partners stall. Nothing more.",
      ownerId: "p6", dueDate: null, status: "not_started",
      labels: ["product", "engineering"],
    }),
    // Closed over the trailing weeks — this history powers the on-time trend
    ...([
      { id: "c14", workstreamId: "w5", title: "Company incorporated, board minutes filed", labels: ["legal"], daysAgo: 54, late: false, ownerId: "p1" },
      { id: "c15", workstreamId: "w5", title: "Business banking and expense cards live", labels: ["ops"], daysAgo: 48, late: false, ownerId: "p2" },
      { id: "c16", workstreamId: "w1", title: "Seed narrative deck v2", labels: ["fundraise"], daysAgo: 41, late: true, ownerId: "p1" },
      { id: "c17", workstreamId: "w2", title: "Design partner outreach list — 100 names", labels: ["research"], daysAgo: 33, late: false, ownerId: "p3" },
      { id: "c18", workstreamId: "w2", title: "First three design partner calls done", labels: ["research"], daysAgo: 26, late: false, ownerId: "p6" },
      { id: "c19", workstreamId: "w4", title: "Careers page live with first two roles", labels: ["hiring", "brand"], daysAgo: 19, late: true, ownerId: "p5" },
      { id: "c20", workstreamId: "w5", title: "Option pool board resolution drafted", labels: ["equity", "legal"], daysAgo: 13, late: false, ownerId: "p4" },
    ] as const).map((d) =>
      c({
        id: d.id, workstreamId: d.workstreamId, title: d.title,
        ownerId: d.ownerId, labels: [...d.labels], status: "done",
        dueDate: daysFromNow(-d.daysAgo + (d.late ? -3 : 1)),
        completedAt: new Date(Date.now() - d.daysAgo * 86400000).toISOString(),
      })
    ),
    c({
      id: "c13", workstreamId: "w1", title: "First investor update sent",
      description: "Monthly cadence starts the week the round closes. Template agreed.",
      ownerId: "p1", dueDate: daysFromNow(-4), status: "done",
      completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      labels: ["fundraise", "comms"],
    }),
  ];

  const t = (
    partial: Partial<State["tasks"][number]> &
      Pick<State["tasks"][number], "commitmentId" | "title" | "status">
  ): State["tasks"][number] => ({
    id: uid("t"),
    assigneeId: null,
    dueDate: null,
    checklist: [],
    estimate: null,
    createdAt: now,
    completedAt: null,
    activity: [],
    comments: [],
    ...partial,
  });

  const tasks = [
    t({ commitmentId: "c1", title: "Chase outstanding signature — lead investor", assigneeId: "p1", dueDate: daysFromNow(1), status: "in_progress" }),
    t({ commitmentId: "c1", title: "Confirm wire instructions with the bank", assigneeId: "p2", dueDate: daysFromNow(3), status: "not_started" }),
    t({
      commitmentId: "c2", title: "Refresh financial model with 15-headcount plan",
      assigneeId: "p2", dueDate: daysFromNow(-1), status: "in_progress",
      checklist: [
        { text: "Update salary bands per city", done: true },
        { text: "Rebuild runway sheet", done: false },
        { text: "Sanity-check with founder", done: false },
      ],
    }),
    t({ commitmentId: "c3", title: "Recruit design partners four and five", assigneeId: "p3", dueDate: daysFromNow(5), status: "in_progress" }),
    t({ commitmentId: "c3", title: "Script the portfolio-review walkthrough", assigneeId: "p6", dueDate: daysFromNow(7), status: "not_started", estimate: "2d" }),
    t({ commitmentId: "c5", title: "Review counsel's first draft", assigneeId: "p4", dueDate: daysFromNow(1), status: "in_progress" }),
    t({ commitmentId: "c9", title: "Collect written feedback from final loop", assigneeId: "p2", dueDate: daysFromNow(2), status: "not_started" }),
    t({ commitmentId: "c9", title: "Draft offer letter with EMI schedule", assigneeId: "p1", dueDate: daysFromNow(4), status: "not_started" }),
    t({ commitmentId: "c10", title: "File EMI valuation with HMRC", assigneeId: "p1", dueDate: daysFromNow(-2), status: "in_progress" }),
    t({ commitmentId: "c8", title: "Shortlist three typefaces with licences", assigneeId: "p5", dueDate: daysFromNow(9), status: "in_progress" }),
    t({ commitmentId: "c4", title: "Draft holdings schema", assigneeId: "p6", dueDate: null, status: "not_started" }),
  ];

  const knowledgeLinks = [
    { id: "k1", section: "Handbook", title: "Employee handbook", url: "https://drive.google.com/drive/folders/handbook", ownerId: "p2", note: "How we work, what we expect, what you can expect. Start here." },
    { id: "k2", section: "Handbook", title: "Team directory", url: "https://drive.google.com/drive/folders/directory", ownerId: "p2", note: "Who does what, where they sit, and how to reach them." },
    { id: "k3", section: "Policies", title: "Expenses & travel", url: "https://drive.google.com/drive/folders/expenses", ownerId: "p2", note: "What you can spend without asking, and how to claim it back." },
    { id: "k4", section: "Policies", title: "Leave & remote work", url: "https://drive.google.com/drive/folders/leave", ownerId: "p2", note: "Holiday, sick leave, and the rules for working from anywhere." },
    { id: "k5", section: "Policies", title: "IT & security", url: "https://drive.google.com/drive/folders/security", ownerId: "p6", note: "Device setup, password manager, what never leaves the laptop." },
    { id: "k6", section: "Payroll & benefits — by jurisdiction", title: "UK — payroll & benefits", url: "https://drive.google.com/drive/folders/uk-payroll", ownerId: "p1", note: "PAYE, pension, private health. UK-employed people only." },
    { id: "k7", section: "Payroll & benefits — by jurisdiction", title: "FR — payroll & benefits", url: "https://drive.google.com/drive/folders/fr-payroll", ownerId: "p5", note: "EOR setup, mutuelle, tickets resto. France differs — read this one, not the UK one." },
    { id: "k8", section: "Payroll & benefits — by jurisdiction", title: "DE — payroll & benefits", url: "https://drive.google.com/drive/folders/de-payroll", ownerId: "p3", note: "EOR setup, Krankenkasse, pension contributions for Berlin." },
    { id: "k9", section: "Equity", title: "EMI options explainer", url: "https://drive.google.com/drive/folders/emi", ownerId: "p1", note: "What your options are worth, vesting, and what happens if you leave." },
    { id: "k10", section: "Legal & entity", title: "Entity structure & key documents", url: "https://drive.google.com/drive/folders/legal", ownerId: "p4", note: "Where the company is incorporated and where the signed documents live." },
  ];

  // Numbers — eight metrics, manual entry, one named owner each.
  const weeks = Array.from({ length: 12 }, (_, i) =>
    weekOf(new Date(Date.now() - (11 - i) * 7 * 86400000))
  );
  const hist = (values: number[]) =>
    weeks.map((weekOfWk, i) => ({ weekOf: weekOfWk, value: values[i] }));
  const updated = (daysAgo: number) =>
    new Date(Date.now() - daysAgo * 86400000).toISOString();

  const metrics = [
    { id: "m1", name: "Waitlist signups", unit: "", target: 500, ownerId: "p5", updatedAt: updated(2), focus: true,
      definition: "Unique emails on the holding-page waitlist, cumulative. Deduplicated, team and investor emails excluded.",
      history: hist([48, 64, 79, 102, 118, 141, 163, 189, 214, 246, 271, 293]) },
    { id: "m2", name: "Design partner interviews", unit: "/wk", target: 5, ownerId: "p3", updatedAt: updated(2), focus: true,
      definition: "Completed discovery or prototype sessions this week with a named advisor or client-side participant.",
      history: hist([0, 1, 1, 2, 2, 3, 2, 4, 3, 4, 5, 4]) },
    { id: "m3", name: "Prototype sessions", unit: "/wk", target: 10, ownerId: "p6", updatedAt: updated(9),
      definition: "Distinct sessions in the clickable prototype, excluding the team. A session is 2+ minutes of activity.",
      history: hist([0, 0, 0, 0, 3, 5, 4, 7, 6, 9, 8, 11]) },
    { id: "m4", name: "Runway", unit: "mo", target: 18, ownerId: "p1", updatedAt: updated(2),
      definition: "Months of runway at current monthly burn, counting only cash in the bank — committed-not-wired excluded.",
      history: hist([14, 14, 13, 13, 13, 12, 12, 12, 20, 20, 19, 19]) },
    { id: "m5", name: "Monthly burn", unit: "£k", target: 45, ownerId: "p2", updatedAt: updated(2),
      definition: "Total cash out per calendar month: payroll, contractors, tools, legal. Target is a ceiling, not a goal.",
      history: hist([28, 28, 30, 31, 31, 33, 34, 36, 38, 39, 41, 42]) },
    { id: "m6", name: "Candidates in final loop", unit: "", target: 3, ownerId: "p2", updatedAt: updated(16),
      definition: "Candidates for open roles who have completed the penultimate interview. Pipeline, not offers.",
      history: hist([0, 0, 1, 1, 2, 1, 1, 2, 2, 3, 2, 2]) },
    { id: "m7", name: "Active investor conversations", unit: "", target: 12, ownerId: "p1", updatedAt: updated(5),
      definition: "Funds or angels with a live thread: meeting held or scheduled within 14 days. Cold outreach doesn't count.",
      history: hist([4, 6, 9, 11, 14, 15, 13, 12, 10, 8, 7, 6]) },
    { id: "m8", name: "Regulatory milestones cleared", unit: "/6", target: 6, ownerId: "p4", updatedAt: updated(21),
      definition: "Of the six pre-licence milestones in the perimeter memo: counsel appointed, memo signed, entity scoped, etc.",
      history: hist([0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 3, 3]) },
  ];

  return { people, meId: "p1", workstreams, commitments, tasks, knowledgeLinks, metrics };
}
