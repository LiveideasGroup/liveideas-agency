/**
 * The three niches from the approved plan. Agents read these as their brief,
 * so changing an offer here changes what Research looks for and what Sales says.
 */
export type NicheId = "manual_testing" | "forex" | "product";

export type Niche = {
  id: NicheId;
  name: string;
  buyers: string;
  painPoints: string;
  freeProof: string;
  pilot: string;
  fullBuild: string;
  guardrails: string;
};

export const NICHES: Record<NicheId, Niche> = {
  manual_testing: {
    id: "manual_testing",
    name: "Manual testing",
    buyers:
      "UK and European software companies (10 to 500 staff) that still test releases by hand, and QA outsourcing or testing consultancies. Decision makers: Head of QA, QA Lead, Engineering Manager, CTO.",
    painPoints:
      "Slow manual regression before every release, testers stuck on repetitive scripts, bugs escaping to production, releases delayed by testing.",
    freeProof:
      "We automate 10 of their existing manual test cases against their staging site and send them the working tests and a run report, free.",
    pilot: "Paid pilot: 50 test cases automated for £2,500.",
    fullBuild:
      "Full automated regression suite with an exploratory testing agent and release reports: £8,000 to £15,000, then £2,000 a month to run and extend.",
    guardrails:
      "Position automation as freeing testers for harder exploratory work, never as replacing them.",
  },
  forex: {
    id: "forex",
    name: "Forex businesses",
    buyers:
      "Prop trading firms, trading educators and signal communities, introducing brokers, and smaller FX/CFD brokers. Decision makers: founders, Head of Operations, Head of Support, Head of Marketing.",
    painPoints:
      "High volumes of repetitive trader support and payout questions, slow onboarding and document checks, affiliate and community leads going cold, constant content demands.",
    freeProof:
      "A demo support assistant trained on their public FAQ and rules pages that answers their traders' common questions, free.",
    pilot: "Paid pilot: support assistant live on one channel for £2,500.",
    fullBuild:
      "Full support and onboarding build: £8,000 to £15,000, then £2,000 a month to run and improve.",
    guardrails:
      "Never offer, build or describe anything that gives personal trading advice, signals or return promises to retail traders. Avoid any claim about trading performance. FCA rules on CFD marketing apply.",
  },
  product: {
    id: "product",
    name: "Product teams",
    buyers:
      "Heads of Product, CPOs and product leads at SaaS companies with 10 to 500 staff, and product consultancies.",
    painPoints:
      "Customer feedback scattered across tickets, calls and reviews; slow PRD and spec writing; release notes and status reports eating PM time.",
    freeProof:
      "A short report of the top themes in their public app-store and review-site reviews, with example quotes, free.",
    pilot: "Paid pilot: feedback synthesis connected to one source for £2,000.",
    fullBuild:
      "Full feedback-to-roadmap build in their Jira or Linear: £6,000 to £12,000, then £1,500 a month.",
    guardrails: "Sell custom work inside their own stack, not another off-the-shelf tool.",
  },
};

export const NICHE_IDS = Object.keys(NICHES) as NicheId[];

export function nicheBrief(id: NicheId): string {
  const n = NICHES[id];
  return [
    `Niche: ${n.name} (${n.id})`,
    `Buyers: ${n.buyers}`,
    `Pain points: ${n.painPoints}`,
    `Free proof we offer: ${n.freeProof}`,
    `First paid step: ${n.pilot}`,
    `Full build: ${n.fullBuild}`,
    `Rules: ${n.guardrails}`,
  ].join("\n");
}
