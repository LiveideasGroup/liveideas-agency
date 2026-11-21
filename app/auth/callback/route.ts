import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("sign-in callback failed:", error.message);
    return NextResponse.redirect(new URL("/login?error=link_invalid", url.origin));
  }
  // Always to a fixed path on our own origin: no open redirects.
  return NextResponse.redirect(new URL("/mfa", url.origin));
}
