import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { enquirySchema } from "@/lib/site/enquiry";

const json = (status: number, body: Record<string, unknown>) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  // Same-origin only: the form on this site is the only caller.
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host")) return json(403, { error: "Send the form from our website." });
  if (!request.headers.get("content-type")?.includes("application/json")) return json(415, { error: "Unsupported request." });
  const raw = await request.text();
  if (raw.length > 12_000) return json(413, { error: "That message is too long. Keep it under 4,000 characters." });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json(400, { error: "We couldn't read the form. Refresh the page and try again." });
  }
  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) {
    const fields = Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message]));
    return json(422, { error: "Check the highlighted fields.", fields });
  }
  const e = parsed.data;
  // Bots fill hidden fields and submit instantly. Pretend it worked so they learn nothing.
  if (e.nickname || e.elapsedMs < 3000) return json(200, { ok: true });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return json(503, { error: `The form is not connected yet. Email us instead.` });

  const client = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await sb.rpc("submit_enquiry", {
    p_kind: e.kind,
    p_niche: e.niche,
    p_name: e.name,
    p_email: e.email,
    p_company: e.company,
    p_website: e.website || null,
    p_role: e.role || null,
    p_message: e.message,
    p_client: client,
  });
  if (error) {
    if (error.message.includes("rate_limited")) return json(429, { error: "We've had a lot of requests. Try again in an hour, or email us." });
    console.error("enquiry failed:", error.message);
    return json(500, { error: "Something went wrong on our side. Try again, or email us." });
  }
  return json(200, { ok: true });
}
