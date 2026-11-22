"use client";
import { useRef, useState } from "react";

type Kind = "proof" | "pilot" | "question";
type Niche = "forex" | "product" | "manual_testing" | "";

const KINDS: { id: Kind; label: string }[] = [
  { id: "proof", label: "Free proof" },
  { id: "pilot", label: "Pilot" },
  { id: "question", label: "A question" },
];
const NICHES: { id: Niche; label: string }[] = [
  { id: "forex", label: "Forex or prop firm" },
  { id: "product", label: "Product team" },
  { id: "manual_testing", label: "QA and testing" },
  { id: "", label: "Something else" },
];
const PROMPTS: Record<Kind, { label: string; hint: string; placeholder: string }> = {
  proof: {
    label: "What should the proof show?",
    hint: "The problem, where it happens, and what good would look like.",
    placeholder: "Our support team answers the same payout questions all day on Discord. We'd like to see an assistant answer them from our rules page.",
  },
  pilot: {
    label: "Tell us about the pilot",
    hint: "What you want it connected to, and any dates that matter.",
    placeholder: "We'd like the regression pilot on our staging site. We have about 200 manual test cases in TestRail.",
  },
  question: {
    label: "Your question",
    hint: "We reply by email, usually within one working day.",
    placeholder: "Can the support assistant run inside our existing Intercom?",
  },
};

export function EnquiryForm({ kind: initialKind = "proof", niche: initialNiche = "", fixedKind = false }: { kind?: Kind; niche?: Niche; fixedKind?: boolean }) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const [niche, setNiche] = useState<Niche>(initialNiche);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const opened = useRef(Date.now());

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) ?? "");
    setState("sending");
    setFields({});
    setError("");
    try {
      const res = await fetch("/api/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          niche: niche || null,
          name: get("name"),
          email: get("email"),
          company: get("company"),
          website: get("website"),
          role: get("role"),
          message: get("message"),
          consent: f.get("consent") === "on",
          nickname: get("nickname"),
          elapsedMs: Date.now() - opened.current,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok) return setState("sent");
      setFields(body.fields ?? {});
      setError(body.error ?? "Something went wrong. Try again.");
      setState("error");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="success" role="status">
        <span className="tick-lg" aria-hidden="true">✓</span>
        <h2 className="h-md">Got it. The Sales agent is on it.</h2>
        <p className="muted">
          You&apos;ll get a written reply by email, checked by a person before it is sent. {kind === "proof" ? "If we need anything to build the proof, we'll ask in that email." : ""}
        </p>
      </div>
    );
  }

  const prompt = PROMPTS[kind];
  const err = (k: string) => fields[k] && <span className="err" id={`${k}-err`}>{fields[k]}</span>;
  const inv = (k: string) => (fields[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});

  return (
    <form className="form" onSubmit={submit} noValidate>
      {!fixedKind && (
        <fieldset className="field full segmented">
          <legend>What would you like?</legend>
          {KINDS.map((k) => (
            <label key={k.id}>
              <input type="radio" name="kind" id={`kind-${k.id}`} value={k.id} checked={kind === k.id} onChange={() => setKind(k.id)} />
              <span>{k.label}</span>
            </label>
          ))}
        </fieldset>
      )}
      <fieldset className="field full segmented">
        <legend>Your industry</legend>
        {NICHES.map((n) => (
          <label key={n.id || "other"}>
            <input type="radio" name="niche" id={`niche-${n.id || "other"}`} value={n.id} checked={niche === n.id} onChange={() => setNiche(n.id)} />
            <span>{n.label}</span>
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="name">Your name</label>
        <input id="name" name="name" autoComplete="name" required maxLength={120} {...inv("name")} />
        {err("name")}
      </div>
      <div className="field">
        <label htmlFor="email">Work email</label>
        <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} {...inv("email")} />
        {err("email")}
      </div>
      <div className="field">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" autoComplete="organization" required maxLength={160} {...inv("company")} />
        {err("company")}
      </div>
      <div className="field">
        <label htmlFor="website">Company website <span className="hint">optional</span></label>
        <input id="website" name="website" inputMode="url" placeholder="yourcompany.com" maxLength={300} {...inv("website")} />
        {err("website")}
      </div>
      <div className="field full">
        <label htmlFor="role">Your role <span className="hint">optional</span></label>
        <input id="role" name="role" autoComplete="organization-title" maxLength={120} />
      </div>
      <div className="field full">
        <label htmlFor="message">{prompt.label} <span className="hint">{prompt.hint}</span></label>
        <textarea id="message" name="message" required maxLength={4000} placeholder={prompt.placeholder} {...inv("message")} />
        {err("message")}
      </div>
      <div className="hp" aria-hidden="true">
        <label htmlFor="nickname">Leave this empty</label>
        <input id="nickname" name="nickname" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="consent" htmlFor="consent">
        <input id="consent" name="consent" type="checkbox" required />
        <span>
          You can reply to me by email about this request. I understand replies are drafted by AI agents and checked by a person. See the{" "}
          <a href="/legal/privacy" className="link">privacy notice</a>.
        </span>
      </label>
      {fields.consent && <span className="err" style={{ gridColumn: "1 / -1" }}>{fields.consent}</span>}
      {state === "error" && <p className="form-error" role="alert">{error}</p>}
      <div className="form-foot">
        <span className="small muted">No call. No mailing list.</span>
        <button type="submit" className="btn btn-primary" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : kind === "proof" ? "Request my free proof" : kind === "pilot" ? "Send pilot request" : "Send question"}
          {state !== "sending" && <span className="arrow" aria-hidden="true">→</span>}
        </button>
      </div>
    </form>
  );
}
