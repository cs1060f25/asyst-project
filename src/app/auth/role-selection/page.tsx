"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function RoleSelectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (!user) {
          if (mounted) setLoading(false);
          return; // unauthenticated users will see buttons that go to sign-up
        }

        // If already has a role, send to dashboard
        const [{ data: recruiter }, { data: candidate }] = await Promise.all([
          supabase.from("recruiter_profiles").select("id").eq("user_id", user.id).maybeSingle(),
          supabase.from("candidate_profiles").select("id").eq("user_id", user.id).maybeSingle(),
        ]);

        if (!mounted) return;
        if (recruiter) {
          router.replace("/recruiter");
          return;
        }
        if (candidate) {
          router.replace("/candidate");
          return;
        }
      } catch (_) {}
      if (mounted) setLoading(false);
    })();
    return () => { mounted = false };
  }, [router]);

  async function handleRoleSelection(role: "candidate" | "recruiter") {
    setError(null);
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      const params = new URLSearchParams();
      if (redirect) params.set("redirect", redirect);

      // If not authenticated, fall back to existing sign-up routes
      if (!user) {
        if (role === "candidate") {
          router.push(`/auth/sign-up?${params.toString()}`);
        } else {
          router.push(`/auth/recruiter-signup?${params.toString()}`);
        }
        return;
      }

      // Authenticated: create profile and redirect, no re-signup
      if (role === "candidate") {
        const { data: existing } = await supabase
          .from("candidate_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertError } = await supabase
            .from("candidate_profiles")
            .insert({ user_id: user.id, name: user.email?.split("@")[0] || "", email: user.email ?? null })
            .single();
          if (insertError) throw insertError;
        }
        router.replace(redirect && redirect.startsWith("/") ? redirect : "/candidate");
      } else {
        const { data: existing } = await supabase
          .from("recruiter_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertError } = await supabase
            .from("recruiter_profiles")
            .insert({ user_id: user.id, name: user.email?.split("@")[0] || "", email: user.email ?? null, company: null, title: null })
            .single();
          if (insertError) throw insertError;
        }
        router.replace(redirect && redirect.startsWith("/") ? redirect : "/recruiter");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to set role");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Join Asyst</h1>
        <p className="text-muted-foreground">
          Choose how you'd like to get started
        </p>
      </div>

      {error && (
        <div className="text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Candidate Card */}
        <div 
          className="border rounded-lg p-8 space-y-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => handleRoleSelection("candidate")}
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">I'm a Candidate</h2>
            <p className="text-sm text-muted-foreground">
              Looking for job opportunities and wanting to apply to positions
            </p>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Apply to jobs with one click</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Track application status</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Manage your profile and resume</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Get notifications on updates</span>
            </li>
          </ul>

          <Button className="w-full" size="lg" disabled={loading}>
            Continue as Candidate
          </Button>
        </div>

        {/* Recruiter Card */}
        <div 
          className="border rounded-lg p-8 space-y-4 hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group"
          onClick={() => handleRoleSelection("recruiter")}
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <Briefcase className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-semibold">I'm a Recruiter</h2>
            <p className="text-sm text-muted-foreground">
              Looking to post jobs and hire talented candidates
            </p>
          </div>

          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Post job opportunities</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Review applications</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Manage candidates pipeline</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-600">✓</span>
              <span>Add supplemental questions</span>
            </li>
          </ul>

          <Button className="w-full" variant="secondary" size="lg" disabled={loading}>
            Continue as Recruiter
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/auth/sign-in" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </div>
    </div>
  );
}
