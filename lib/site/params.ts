export type SP = Promise<Record<string, string | string[] | undefined>>;
const NICHES = ["forex", "product", "manual_testing"] as const;
export function pickNiche(v: unknown): (typeof NICHES)[number] | "" {
  return typeof v === "string" && (NICHES as readonly string[]).includes(v) ? (v as (typeof NICHES)[number]) : "";
}
