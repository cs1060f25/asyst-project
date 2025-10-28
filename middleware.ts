import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Protect selected routes: require a logged-in Supabase session
const PROTECTED = ["/candidate", "/recruiter", "/profile"]; // prefixes

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only check protected paths
  const isProtected = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!isProtected) {
    return NextResponse.next();
  }

  // Quick cookie presence check (fast path) — works even if SSR client fails
  // Supabase sets access/refresh cookies; names can vary by helper version.
  // We check common names.
  const hasAnyAuthCookie = [
    "sb-access-token",
    "sb-refresh-token",
    "sb:token",
    "sb:refresh-token",
  ].some((name) => req.cookies.get(name));

  if (!hasAnyAuthCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Create a response we can pass to Supabase to manage auth cookies
  const res = NextResponse.next();

  // Create a Supabase server client using the request/response cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data } = await supabase.auth.getSession();
  const session = data.session;

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    "/candidate",
    "/candidate/:path*",
    "/recruiter",
    "/recruiter/:path*",
    "/profile",
    "/profile/:path*",
  ],
};
