"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "candidate" | "recruiter" | null;

export default function ClientNavLinks() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setAuthed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    let mounted = true;
    
    async function loadUserData() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      
      const isAuthenticated = !!data.session;
      setAuthed(isAuthenticated);
      
      if (isAuthenticated && data.session?.user?.id) {
        // Detect user role by checking which profile exists
        try {
          const userId = data.session.user.id;
          console.log("[ClientNavLinks] Detecting role for user:", userId);
          
          // Check recruiter profile first
          const { data: recruiterProfile, error: recruiterError } = await supabase
            .from('recruiter_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          console.log("[ClientNavLinks] Recruiter profile check:", { recruiterProfile, recruiterError });
          
          if (recruiterProfile && !recruiterError) {
            console.log("[ClientNavLinks] User is a RECRUITER");
            if (mounted) {
              setUserRole('recruiter');
              setReady(true);
            }
            return;
          }
          
          // Check candidate profile
          const { data: candidateProfile, error: candidateError } = await supabase
            .from('candidate_profiles')
            .select('id')
            .eq('user_id', userId)
            .single();
          
          console.log("[ClientNavLinks] Candidate profile check:", { candidateProfile, candidateError });
          
          if (candidateProfile && !candidateError) {
            console.log("[ClientNavLinks] User is a CANDIDATE");
            if (mounted) {
              setUserRole('candidate');
              setReady(true);
            }
            return;
          }
          
          // No profile found
          console.warn("[ClientNavLinks] No profile found for user:", userId);
          if (mounted) {
            setUserRole(null);
            setReady(true);
          }
        } catch (error) {
          console.error("[ClientNavLinks] Failed to fetch user role:", error);
          if (mounted) setReady(true);
        }
      } else {
        // Not authenticated
        if (mounted) setReady(true);
      }
    }

    loadUserData();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(!!session);
      if (!session) {
        setUserRole(null);
      } else {
        // Reload role when auth state changes
        loadUserData();
      }
    });
    
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  if (!ready) {
    // Render basic links while loading; middleware will still enforce protection.
    // If authenticated, show minimal nav without "Get Started" to avoid confusion
    return (
      <>
        <Link href="/" className="hover:underline">Home</Link>
        {!isAuthed && <Link href="/auth/role-selection" className="hover:underline">Get Started</Link>}
      </>
    );
  }

  if (isAuthed && userRole) {
    return (
      <>
        <Link href="/" className="hover:underline">Home</Link>
        {userRole === "candidate" ? (
          <>
            <Link href="/candidate" className="hover:underline">Dashboard</Link>
            <Link href="/profile" className="hover:underline">Profile</Link>
          </>
        ) : (
          <>
            <Link href="/recruiter" className="hover:underline">Dashboard</Link>
            <Link href="/recruiter/jobs" className="hover:underline">Jobs</Link>
            <Link href="/recruiter/create-job" className="hover:underline">Create Job</Link>
            <Link href="/recruiter/profile" className="hover:underline">Profile</Link>
          </>
        )}
      </>
    );
  }

  // Fallback: authenticated but no role yet, or not authenticated
  return (
    <>
      <Link href="/" className="hover:underline">Home</Link>
      {!isAuthed && <Link href="/auth/role-selection" className="hover:underline">Get Started</Link>}
    </>
  );
}
