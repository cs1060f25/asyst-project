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
    <div className="max-w-md w-full mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-2">
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-600">Sign in to your account to continue</p>
        </div>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Email</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="you@example.com"
              className="h-11 rounded-lg border-gray-300"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">Password</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••"
              className="h-11 rounded-lg border-gray-300"
            />
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
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
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="pt-4 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link className="font-semibold text-blue-600 hover:text-blue-700" href="/auth/role-selection">
              Get started
            </Link>
          </p>
        </div>
      </div>
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
