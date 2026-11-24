import Link from "next/link";
import type { CaseStudy, CatalogueService } from "@/lib/site/catalogue";

export function ServiceCard({ s }: { s: CatalogueService }) {
  return (
    <article className={`svc${s.lead ? " svc-lead" : ""}`} id={s.id}>
      <div className="step-top">
        <span className="step-no">{s.delivery}</span>
        {s.lead && <span className="pill pill-accent">Popular</span>}
      </div>
      <h3 className="h-md">{s.name}</h3>
      <p>{s.summary}</p>
      <ul>{s.includes.map((i) => <li key={i}>{i}</li>)}</ul>
      <div className="step-meta">
        <span>{s.related ? <Link href={s.related} className="link">More detail</Link> : "Typical price"}</span>
        <span className="num">{s.price}</span>
      </div>
    </article>
  );
}

export function CaseCard({ c, href }: { c: CaseStudy; href?: string }) {
  const body = (
    <>
      <div className="step-top">
        <span className="step-no">{c.service}</span>
        <span className={`pill${c.status === "In build" ? "" : " pill-accent"}`}>{c.status}</span>
      </div>
      <h3 className="h-md">{c.title}</h3>
      <p>{c.summary}</p>
      <div className="step-meta"><span>For</span><span>{c.forWhom}</span></div>
    </>
  );
  return href ? <Link href={href} className="case-card">{body}</Link> : <article className="case-card">{body}</article>;
}
