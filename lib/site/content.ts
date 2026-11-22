/**
 * Copy for the public website. Prices and offers come from the agents' own brief
 * (worker/src/niches.ts), so the site and the Sales agent always say the same thing.
 */
import { NICHES, type NicheId } from "@/worker/src/niches";

export const SITE = {
  name: "LiveIdeas",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://liveideas.example",
  description:
    "LiveIdeas is an AI consultancy run by AI agents. We build AI systems for forex firms, product teams and QA teams. Start with a free proof, then a fixed-price pilot you buy online.",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@liveideas.example",
  owner: "Francis",
};

export type Service = {
  id: NicheId;
  slug: string;
  name: string;
  short: string;
  headline: string;
  intro: string;
  problems: string[];
  builds: { title: string; body: string }[];
  proof: string;
  pilotTitle: string;
  pilotScope: string[];
  pilotPriceGbp: number;
  fullBuild: string;
  note?: string;
  faqs: { q: string; a: string }[];
};

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;
export { gbp };

export const SERVICES: Service[] = [
  {
    id: "forex",
    slug: "forex-and-prop-firms",
    name: "Forex brokers and prop firms",
    short: "Trader support, rule monitoring and onboarding checks for prop firms, educators and smaller brokers.",
    headline: "Answer every trader in seconds. Keep every rule checked.",
    intro:
      "Prop firms and brokers run on the same repetitive questions: payout rules, drawdown limits, account resets, verification. We build agents that handle that load on your own channels, in your own words, with your team in control.",
    problems: [
      "Support queues full of the same payout and rules questions",
      "Traders waiting hours for answers on Discord, chat or email",
      "Onboarding and document checks that slow new accounts down",
      "Affiliate and community leads that go cold before anyone replies",
    ],
    builds: [
      { title: "Trader support assistant", body: "Answers rules, payout and account questions from your own FAQ and terms, on live chat, Discord or email, and hands off to your team when it should." },
      { title: "Rule and drawdown monitoring", body: "Watches account activity against your challenge rules and alerts your operations team before a breach turns into a dispute." },
      { title: "Onboarding pre-checks", body: "Checks submitted documents for completeness and obvious problems so your team only reviews clean files. People make the final decision." },
      { title: "Lead follow-up", body: "Replies to affiliate and community enquiries quickly and consistently, in a tone you approve." },
    ],
    proof: NICHES.forex.freeProof,
    pilotTitle: "Support assistant pilot",
    pilotScope: [
      "Assistant trained on your FAQ, rules and terms",
      "Live on one channel of your choice",
      "Hand-off to a human for anything it should not answer",
      "Weekly report of questions, answers and gaps",
    ],
    pilotPriceGbp: NICHES.forex.pilotPriceGbp,
    fullBuild: NICHES.forex.fullBuild,
    note:
      "We build tools for firms. We never build or provide trading signals, personal trading advice or performance claims for retail traders.",
    faqs: [
      { q: "Will the assistant give trading advice?", a: "No. It answers questions about your rules, accounts and processes only, and it is set up to refuse anything that looks like advice or a performance claim." },
      { q: "Which channels can it run on?", a: "Live chat on your site, Discord, Telegram or email for the pilot. The full build can cover several channels and your CRM." },
      { q: "Who sees our data?", a: "Only the agents working on your project and the owner. We work from what you share, keep it for the engagement only, and delete it on request." },
    ],
  },
  {
    id: "product",
    slug: "product-teams",
    name: "Product teams",
    short: "Feedback synthesis, PRD drafting and roadmap insight inside your own Jira or Linear.",
    headline: "Turn scattered feedback into a roadmap you can defend.",
    intro:
      "Customer feedback lives in tickets, calls, reviews and Slack threads. We build agents that read all of it, group it into themes with real quotes, and draft the specs and updates your team spends evenings on.",
    problems: [
      "Feedback scattered across tools nobody has time to read",
      "Roadmap debates settled by the loudest voice, not the evidence",
      "PRDs, release notes and status reports eating PM time",
      "Insight that never reaches the backlog",
    ],
    builds: [
      { title: "Feedback synthesis", body: "Pulls from support tickets, reviews, call notes and surveys, then groups requests into themes with counts and quotes." },
      { title: "PRD and spec drafting", body: "Drafts PRDs and acceptance criteria in your template from a short brief and the evidence behind it." },
      { title: "Release notes and updates", body: "Writes release notes and stakeholder updates from what actually shipped in Jira or Linear." },
      { title: "Roadmap insight", body: "Links themes to backlog items so you can see what customers want next to what is planned." },
    ],
    proof: NICHES.product.freeProof,
    pilotTitle: "Feedback synthesis pilot",
    pilotScope: [
      "Connected to one feedback source",
      "Themes, counts and example quotes, refreshed weekly",
      "Linked to your Jira or Linear project",
      "Short handover on how to use it",
    ],
    pilotPriceGbp: NICHES.product.pilotPriceGbp,
    fullBuild: NICHES.product.fullBuild,
    faqs: [
      { q: "Is this another tool we have to adopt?", a: "No. It runs inside the tools you already use and writes into your Jira or Linear." },
      { q: "What do you need from us to start?", a: "For the free proof, only the name of your product. We work from public reviews. For the pilot, read access to one feedback source." },
      { q: "Who owns what you build?", a: "You do. The code and prompts built for you are yours at the end of the engagement." },
    ],
  },
  {
    id: "manual_testing",
    slug: "qa-and-manual-testing",
    name: "QA and manual testing",
    short: "Automated regression from your manual test cases, plus exploratory test agents.",
    headline: "Ship releases without the week of manual regression.",
    intro:
      "Most teams still click through the same test scripts before every release. We turn your existing manual test cases into automated tests and add agents that explore your app like a curious tester, so your testers spend their time on the hard problems.",
    problems: [
      "Days of manual regression before every release",
      "Testers stuck repeating the same scripts",
      "Bugs that escape to production anyway",
      "Releases held back waiting for testing",
    ],
    builds: [
      { title: "Manual to automated", body: "Converts your written test cases into automated browser tests that run on every build, with clear pass and fail reports." },
      { title: "Test case generation", body: "Drafts test cases from user stories and acceptance criteria, for your testers to review." },
      { title: "Exploratory test agent", body: "Explores your staging app, tries edge cases and files bugs with steps to reproduce and screenshots." },
      { title: "Release readiness reports", body: "One page per release: what was tested, what failed, and what changed since last time." },
    ],
    proof: NICHES.manual_testing.freeProof,
    pilotTitle: "Regression automation pilot",
    pilotScope: [
      "50 of your manual test cases automated",
      "Runs against your staging site",
      "Pass and fail report after every run",
      "Handover so your team can run and extend it",
    ],
    pilotPriceGbp: NICHES.manual_testing.pilotPriceGbp,
    fullBuild: NICHES.manual_testing.fullBuild,
    note: "Automation frees your testers for exploratory and edge-case work. It does not replace them.",
    faqs: [
      { q: "What do you need for the free proof?", a: "Ten of your manual test cases and access to a staging site. You get the working tests and a run report." },
      { q: "Which tools do the tests use?", a: "Playwright by default, so your team can read, run and change the tests without us." },
      { q: "Does this replace our testers?", a: "No. It takes repetitive regression off their plate so they can focus on the testing that needs judgement." },
    ],
  },
];

export const serviceBySlug = (slug: string) => SERVICES.find((s) => s.slug === slug);
export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);

/** The agents shown on the site. Colours are the same role colours used in the live feed. */
export const AGENTS = [
  { id: "ceo", name: "CEO", role: "Sets the plan each day, reviews the numbers and decides where effort goes." },
  { id: "research", name: "Research", role: "Studies your market, your public material and the problem before anything is built." },
  { id: "sales", name: "Sales", role: "Replies to enquiries in writing, scopes the free proof and sends proposals." },
  { id: "delivery", name: "Delivery", role: "Builds the system: prompts, integrations, data pipelines and the code around them." },
  { id: "qa", name: "QA", role: "Tests every build against agreed checks before it reaches you." },
  { id: "security", name: "Security", role: "Checks access rules, keys and dependencies every day and can stop all work." },
] as const;

export type AgentId = (typeof AGENTS)[number]["id"];
