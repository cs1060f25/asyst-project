"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/url";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function SignInInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      if (!data.user) {
        throw new Error("Sign in failed");
      }

      // Detect user role to redirect correctly
      const userId = data.user.id;
      console.log("[Sign-in] Detecting role for user:", userId);
      
      // Check recruiter profile first
      const { data: recruiterProfile, error: recruiterError } = await supabase
        .from('recruiter_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      console.log("[Sign-in] Recruiter profile check:", { recruiterProfile, recruiterError });
      
      if (recruiterProfile && !recruiterError) {
        const redirect = search.get("redirect");
        console.log("[Sign-in] User is recruiter, redirecting to:", redirect || "/recruiter");
        router.push(redirect && redirect.startsWith("/") ? redirect : "/recruiter");
        return;
      }
      
      // Check candidate profile
      const { data: candidateProfile, error: candidateError } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', userId)
        .single();
      
      console.log("[Sign-in] Candidate profile check:", { candidateProfile, candidateError });
      
      if (candidateProfile && !candidateError) {
        const redirect = search.get("redirect");
        console.log("[Sign-in] User is candidate, redirecting to:", redirect || "/candidate");
        router.push(redirect && redirect.startsWith("/") ? redirect : "/candidate");
        return;
      }
      
      // No profile found - shouldn't happen, but redirect to role selection
      console.warn("[Sign-in] No profile found for user:", userId);
      router.push("/auth/role-selection");
    } catch (err: any) {
      const msg = err?.message || "Sign-in failed";
      setError(msg);
      // Detect unconfirmed email
      if (msg.toLowerCase().includes("confirm") || msg.toLowerCase().includes("email not confirmed")) {
        setNeedsConfirmation(true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Use your email and password.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {needsConfirmation && (
          <div className="space-y-2">
            <p className="text-sm">Didn&apos;t receive a confirmation email?</p>
            <Button
              type="button"
              variant="outline"
              disabled={!email || loading}
              onClick={async () => {
                setLoading(true);
                try {
                  const { error: resendError } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: getAuthCallbackUrl() } });
                  if (resendError) throw resendError;
                  setError("Confirmation email sent. Please check your inbox (and spam folder).");
                } catch (e: any) {
                  setError(e?.message || "Failed to resend confirmation email");
                } finally {
                  setLoading(false);
                }
              }}
            >
              Resend confirmation email
            </Button>
          </div>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
      <p className="text-sm">
        Don't have an account? <Link className="underline" href="/auth/role-selection">Get started</Link>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="max-w-sm w-full space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Sign in</h1></div>}>
      <SignInInner />
    </Suspense>
  );
}
