import type { NicheId } from "@/worker/src/niches";

/**
 * Pilots are paid through Stripe Payment Links: Stripe hosts the checkout, so no card data
 * and no Stripe secret key ever touch this app. Create one link per pilot in the Stripe
 * dashboard, set its confirmation page to https://<site>/pilot/thanks?niche=<id>, and put the
 * link URLs in these variables. Without a link, the button asks for a pilot by enquiry instead.
 */
const LINKS: Record<NicheId, string | undefined> = {
  forex: process.env.NEXT_PUBLIC_STRIPE_PILOT_LINK_FOREX,
  product: process.env.NEXT_PUBLIC_STRIPE_PILOT_LINK_PRODUCT,
  manual_testing: process.env.NEXT_PUBLIC_STRIPE_PILOT_LINK_QA,
};

export function pilotCheckoutUrl(niche: NicheId): string | null {
  const link = LINKS[niche];
  if (!link || !/^https:\/\/(buy|checkout)\.stripe\.com\//.test(link)) return null;
  const url = new URL(link);
  url.searchParams.set("client_reference_id", `pilot_${niche}`);
  return url.toString();
}
