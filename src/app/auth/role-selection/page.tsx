"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

function RoleSelectionInner() {
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
        const meta: any = (user as any)?.user_metadata || {};
        const first = typeof meta.first_name === 'string' ? meta.first_name.trim() : '';
        const last = typeof meta.last_name === 'string' ? meta.last_name.trim() : '';
        const full = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
        const displayName = (first && last) ? `${first} ${last}` : (full || (user.email?.split("@")[0] || ""));
        const { data: existing } = await supabase
          .from("candidate_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertError } = await supabase
            .from("candidate_profiles")
            .insert({ user_id: user.id, name: displayName, email: user.email ?? null })
            .single();
          if (insertError) throw insertError;
        }
        router.replace(redirect && redirect.startsWith("/") ? redirect : "/candidate");
      } else {
        const meta: any = (user as any)?.user_metadata || {};
        const first = typeof meta.first_name === 'string' ? meta.first_name.trim() : '';
        const last = typeof meta.last_name === 'string' ? meta.last_name.trim() : '';
        const full = typeof meta.full_name === 'string' ? meta.full_name.trim() : '';
        const displayName = (first && last) ? `${first} ${last}` : (full || (user.email?.split("@")[0] || ""));
        const { data: existing } = await supabase
          .from("recruiter_profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!existing) {
          const { error: insertError } = await supabase
            .from("recruiter_profiles")
            .insert({ user_id: user.id, name: displayName, email: user.email ?? null, company_name: displayName || '', job_title: 'Recruiter' })
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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Candidate Card */}
        <div 
          className="relative bg-white border-2 border-gray-200 rounded-2xl p-8 space-y-6 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
          onClick={() => handleRoleSelection("candidate")}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="pt-8 text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">I'm a Candidate</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Looking for job opportunities and wanting to apply to positions
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Apply to jobs with one click</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Track application status</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Manage your profile and resume</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Get notifications on updates</span>
            </li>
          </ul>

          <Button 
            className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all" 
            size="lg" 
            disabled={loading}
          >
            Continue as Candidate →
          </Button>
        </div>

        {/* Recruiter Card */}
        <div 
          className="relative bg-white border-2 border-gray-200 rounded-2xl p-8 space-y-6 hover:border-purple-500 hover:shadow-2xl transition-all duration-300 cursor-pointer group transform hover:-translate-y-1"
          onClick={() => handleRoleSelection("recruiter")}
        >
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Briefcase className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <div className="pt-8 text-center space-y-3">
            <h2 className="text-2xl font-bold text-gray-900">I'm a Recruiter</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Looking to post jobs and hire talented candidates
            </p>
          </div>

          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Post job opportunities</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Review applications</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Manage candidates pipeline</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xs font-bold">✓</span>
              </div>
              <span className="text-gray-700">Add supplemental questions</span>
            </li>
          </ul>

          <Button 
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all" 
            size="lg" 
            disabled={loading}
          >
            Continue as Recruiter →
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

export default function RoleSelectionPage() {
  return (
    <Suspense fallback={<div className="max-w-4xl w-full space-y-8"><div className="text-center space-y-2"><h1 className="text-3xl font-bold tracking-tight">Join Asyst</h1></div></div>}>
      <RoleSelectionInner />
    </Suspense>
  );
}
