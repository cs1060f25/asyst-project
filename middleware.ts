import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Protect selected routes: require a logged-in Supabase session
const PROTECTED = ["/candidate", "/recruiter", "/profile", "/jobs"]; // prefixes

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

  // Role-based access control for candidate and recruiter routes
  const isRecruiterRoute = pathname === "/recruiter" || pathname.startsWith("/recruiter/");
  const isCandidateRoute = pathname === "/candidate" || pathname.startsWith("/candidate/");

  if (isRecruiterRoute || isCandidateRoute) {
    try {
      // Check candidate profiles
      const { data: candidateData } = await supabase
        .from('candidate_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      const isCandidate = !!candidateData;

      // Check recruiter profiles  
      const { data: recruiterData } = await supabase
        .from('recruiter_profiles')
        .select('user_id')
        .eq('user_id', session.user.id)
        .single();

      const isRecruiter = !!recruiterData;

      // If user has no role profile, redirect to role selection
      if (!isCandidate && !isRecruiter) {
        const url = req.nextUrl.clone();
        url.pathname = "/auth/role-selection";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
      }

      // Enforce role-based access
      if (isRecruiterRoute && !isRecruiter) {
        // Recruiters trying to access recruiter routes but they're candidates
        const url = req.nextUrl.clone();
        url.pathname = "/candidate";
        return NextResponse.redirect(url);
      }

      if (isCandidateRoute && !isCandidate) {
        // Candidates trying to access candidate routes but they're recruiters
        const url = req.nextUrl.clone();
        url.pathname = "/recruiter";
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Error checking user role:", error);
      // On error, allow through but log the issue
    }
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
    "/jobs",
    "/jobs/:path*",
  ],
};
