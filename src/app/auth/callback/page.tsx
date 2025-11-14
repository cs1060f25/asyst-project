"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

function AuthCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const code = search.get("code");
        if (!code) {
          setError("Missing code in callback URL");
          return;
        }

        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        const user = data?.user;
        if (!user) {
          setError("Failed to establish session");
          return;
        }

        // Detect role and redirect
        const userId = user.id;

        const { data: recruiterProfile } = await supabase
          .from("recruiter_profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (!mounted) return;

        if (recruiterProfile) {
          router.replace("/recruiter");
          return;
        }

        const { data: candidateProfile } = await supabase
          .from("candidate_profiles")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (candidateProfile) {
          router.replace("/candidate");
        } else {
          router.replace("/auth/role-selection");
        }
      } catch {
        setError("Authentication failed");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, search]);

  return (
    <div className="max-w-sm w-full space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Signing you in…</h1>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {!error && <p className="text-sm text-muted-foreground">Please wait while we finalize your sign-in.</p>}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="max-w-sm w-full space-y-4"><h1 className="text-2xl font-semibold tracking-tight">Signing you in…</h1><p className="text-sm text-muted-foreground">Please wait while we finalize your sign-in.</p></div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}
