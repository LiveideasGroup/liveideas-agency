import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// The public website. Everything not listed here needs the owner's session (deny by default).
const PUBLIC_EXACT = new Set(["/", "/robots.txt", "/sitemap.xml", "/icon.svg", "/opengraph-image"]);
const PUBLIC_PREFIXES = ["/services", "/proof", "/pilot", "/contact", "/how-we-work", "/case-studies", "/legal", "/api/enquiry", "/api/activity"];
const isSite = (path: string) =>
  PUBLIC_EXACT.has(path) || PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

/** Refreshes the Supabase session and sends signed-out visitors to /login. */
export async function middleware(request: NextRequest) {
  // Public pages never touch the owner's session.
  if (isSite(request.nextUrl.pathname)) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/login") || path.startsWith("/auth");
  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const res = NextResponse.redirect(url);
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };
  if (!user) return isPublic ? response : redirect("/login");
  if (path === "/login") return redirect("/dashboard");

  // Signed in with the email link only (aal1): the second factor is required before
  // anything else. The database enforces the same rule, so this is for a clear UX.
  if (!path.startsWith("/mfa") && !isPublic) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.currentLevel !== "aal2") return redirect("/mfa");
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
