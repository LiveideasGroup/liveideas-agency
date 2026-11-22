import Link from "next/link";
import { pilotCheckoutUrl } from "@/lib/site/stripe";
import { gbp, type Service } from "@/lib/site/content";

export function BuyPilot({ service, ghost = false }: { service: Service; ghost?: boolean }) {
  const url = pilotCheckoutUrl(service.id);
  const cls = `btn ${ghost ? "btn-ghost" : "btn-primary"}`;
  return url ? (
    <a href={url} className={cls} rel="noopener">Buy pilot · {gbp(service.pilotPriceGbp)} <span className="arrow" aria-hidden="true">→</span></a>
  ) : (
    <Link href={`/contact?type=pilot&niche=${service.id}`} className={cls}>Request this pilot <span className="arrow" aria-hidden="true">→</span></Link>
  );
}
