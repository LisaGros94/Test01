import type { State } from "./types";
import { daysFromNow, uid } from "./lib";

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

  return { people, meId: "p1", workstreams, commitments, tasks, knowledgeLinks };
}
