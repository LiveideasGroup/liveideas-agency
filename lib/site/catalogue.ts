/**
 * The full service catalogue and case studies for the public website.
 * Prices are Francis's draft ranges (services sheet, 2026-11-24) and change here only.
 *
 * Case studies follow the agents' rule: no invented clients, results or metrics.
 * Anything not yet confirmed by Francis is left out of the copy (see TBC notes),
 * never guessed.
 */

export type CatalogueService = {
  id: string;
  name: string;
  summary: string;
  includes: string[];
  delivery: string;
  price: string;
  lead?: boolean;
  /** Industry page that goes deeper on this service, when there is one. */
  related?: string;
};

export const CATALOGUE: CatalogueService[] = [
  {
    id: "custom-build",
    name: "Custom AI system build",
    summary: "A system designed around how your business already works: agents, integrations and a dashboard your team can run.",
    includes: ["Written scope with milestones and a fixed price", "Agents connected to your tools and data", "Dashboard, documentation and handover"],
    delivery: "Our own build",
    price: "£5k–£20k",
    lead: true,
  },
  {
    id: "receptionist",
    name: "AI receptionist",
    summary: "A phone and chat assistant that answers, qualifies callers, books appointments and hands off to a person.",
    includes: ["Answers calls and messages in your words", "Takes details and books into your calendar", "Passes anything unusual to your team"],
    delivery: "Our own build, or set up on a third-party platform",
    price: "Build £3k–£8k · setup from £750",
    lead: true,
  },
  {
    id: "trading-monitoring",
    name: "AI trading monitoring and alerts",
    summary: "Chart and market monitoring, alerts, trade journalling and risk checks for trading desks and prop firms.",
    includes: ["Market and chart monitoring with alerts", "Automatic trade journal", "Risk and rule checks"],
    delivery: "Our own build, for firms",
    price: "£3k–£15k",
    lead: true,
    related: "/services/forex-and-prop-firms",
  },
  {
    id: "audit",
    name: "AI readiness audit",
    summary: "A written review of where AI fits in your business, what it would cost, and what to do first.",
    includes: ["Review of your processes and tools", "Ranked list of opportunities with costs", "A plan you can use with or without us"],
    delivery: "Fixed scope, written report",
    price: "£500–£1.5k fixed",
    lead: true,
  },
  {
    id: "sales-agent",
    name: "AI lead generation and sales agent",
    summary: "Prospect research, enrichment and drafted outreach, with a person approving every message before it is sent.",
    includes: ["Finds and qualifies prospects", "Drafts personal first emails", "Approval queue for your team"],
    delivery: "Our own build",
    price: "£2k–£6k",
  },
  {
    id: "support-agent",
    name: "AI customer support agent",
    summary: "Answers customer questions from your own help content and hands hard cases to your staff.",
    includes: ["Trained on your help centre and policies", "Runs on your chat, email or Discord", "Clear hand-off to a person"],
    delivery: "Intercom Fin, Voiceflow, or our own build",
    price: "£2k–£5k",
  },
  {
    id: "qa-automation",
    name: "AI QA and test automation",
    summary: "Test cases written from requirements, regression runs and clear bug reports for QA teams.",
    includes: ["Test cases from your stories and specs", "Automated regression runs", "Bug reports your developers can act on"],
    delivery: "Our own build",
    price: "£3k–£10k",
    related: "/services/qa-and-manual-testing",
  },
  {
    id: "pm-copilot",
    name: "AI product management copilot",
    summary: "Feedback triage, specs, release notes and roadmap summaries, inside the tools your team already uses.",
    includes: ["Feedback grouped into themes", "Draft specs and release notes", "Roadmap summaries for stakeholders"],
    delivery: "Our own build",
    price: "£2k–£6k",
    related: "/services/product-teams",
  },
  {
    id: "knowledge-assistant",
    name: "Internal knowledge assistant",
    summary: "A private assistant over your company's documents that answers with sources and respects who can see what.",
    includes: ["Connected to your documents and wiki", "Answers with links to its sources", "Access follows your permissions"],
    delivery: "Our own build",
    price: "£3k–£8k",
  },
];

export const RETAINER = {
  name: "Monthly AI care plan",
  summary: "Monitoring, fixes, prompt and model updates, and small improvements to anything we build for you.",
  price: "£500–£2k a month",
};

export type QuickSystem = { name: string; does: string; tools: string; setup: string; monthly: string };

export const QUICK_SYSTEMS: QuickSystem[] = [
  { name: "Missed-call text-back and booking", does: "Texts anyone whose call you missed and books them into your calendar.", tools: "Telnyx or Twilio, Cal.com", setup: "£750", monthly: "£150" },
  { name: "Invoice and receipt extraction", does: "Reads invoices and receipts from email and posts them to your accounts.", tools: "Xero or QuickBooks", setup: "£1,000", monthly: "£150" },
  { name: "Google review responder", does: "Drafts replies to new reviews for you to approve.", tools: "Google Business Profile", setup: "£500", monthly: "£75" },
  { name: "Meeting notes to CRM", does: "Turns call notes into CRM updates and a drafted follow-up email.", tools: "HubSpot or Pipedrive", setup: "£1,000", monthly: "£150" },
  { name: "Daily market brief", does: "A morning summary of market news and calendar events by email or Telegram. Information only.", tools: "Email or Telegram", setup: "£750", monthly: "£100" },
  { name: "CV screening and scheduling", does: "Ranks CVs against your criteria and offers interview slots. A person makes every decision.", tools: "Your ATS or inbox, Cal.com", setup: "£1,000", monthly: "£150" },
];

export type CaseStudy = {
  slug: string;
  title: string;
  service: string;
  serviceId: string;
  forWhom: string;
  status: "Live" | "In build" | "Built";
  summary: string;
  points: string[];
  /** True while Francis has not yet supplied the full write-up. */
  writeupComing: boolean;
};

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: "gold-trading-monitor",
    title: "Gold trading AI monitor",
    service: "Custom AI system build",
    serviceId: "custom-build",
    forWhom: "Our own tool",
    // TBC (Francis): live or in testing, data sources, chart platform, alert channels.
    status: "Built",
    summary:
      "An AI system built on Claude that watches the gold market and its charts and reports what it sees, so a trader doesn't have to sit in front of the screen.",
    points: [
      "Built on Claude, Anthropic's AI model",
      "Monitors the gold market and charts",
      "A monitoring and alerting tool: it gives no signals or advice",
    ],
    writeupComing: true,
  },
  {
    slug: "elenaschool-portal",
    title: "ElenaSchool portal",
    service: "Custom AI system build",
    serviceId: "custom-build",
    // TBC (Francis): permission to name ElenaSchool, users, AI features, stack.
    forWhom: "ElenaSchool",
    status: "Built",
    summary: "A web portal we built for ElenaSchool.",
    points: ["Designed and built by LiveIdeas", "Web portal for the school"],
    writeupComing: true,
  },
  {
    slug: "liveideas-receptionist",
    title: "LiveIdeas AI phone receptionist",
    service: "AI receptionist",
    serviceId: "receptionist",
    forWhom: "LiveIdeas",
    // TBC (Francis): platform and phone number once live.
    status: "In build",
    summary:
      "The AI receptionist that will answer our own phone line. We are building it for ourselves first, so you can call it and hear exactly what you would be buying.",
    points: [
      "Answers calls and explains our services",
      "Takes enquiry details and passes them to our Sales agent",
      "A person reviews every reply that follows",
    ],
    writeupComing: true,
  },
];
