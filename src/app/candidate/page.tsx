"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabaseClient";

import { Job } from "@/lib/applications";

type Application = {
  jobId: string;
  status: "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";
  appliedAt: string;
};

export default function CandidatePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [suppModalOpen, setSuppModalOpen] = useState(false);
  const [pendingJobForSupp, setPendingJobForSupp] = useState<string | null>(null);
  const [profileResumeUrl, setProfileResumeUrl] = useState<string | null>(null);

  // Monitor authentication state and clear data on sign-out
  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // User signed out - clear sensitive data and redirect
        setJobs([]);
        setApps([]);
        setLoading(false);
        router.push('/auth/sign-in?redirect=/candidate');
      } else if (event === 'SIGNED_IN' && session) {
        // User signed in - reload data
        setLoading(true);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  // Load jobs and applications data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          fetch("/api/jobs", { cache: "no-store" }),
          fetch("/api/applications", { cache: "no-store" }),
        ]);
        const [jobsData, appsData] = await Promise.all([jobsRes.json(), appsRes.json()]);
        if (!mounted) return;
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setApps(Array.isArray(appsData) ? appsData : []);
      } catch (_) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load candidate profile to check for resume_url
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch('/api/candidate-profile', { cache: 'no-store' });
        if (!active) return;
        if (res.ok) {
          const profile = await res.json();
          setProfileResumeUrl((profile && profile.resume_url) || null);
        } else {
          setProfileResumeUrl(null);
        }
      } catch {
        if (active) setProfileResumeUrl(null);
      }
    })();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
    );
  }, [jobs, query]);

  function getStatus(jobId: string) {
    return apps.find((a) => a.jobId === jobId)?.status ?? null;
  }

  function getStatusColor(status: Application["status"]) {
    switch (status) {
      case "Applied": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Under Review": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Interview": return "bg-purple-100 text-purple-800 border-purple-200";
      case "Offer": return "bg-green-100 text-green-800 border-green-200";
      case "Hired": return "bg-green-200 text-green-900 border-green-300";
      case "Rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  }

  async function apply(jobId: string) {
    setSubmitting(jobId);
    setError(null);
    
    try {
      // Require resume before single-click apply
      if (!profileResumeUrl) {
        setError("Please upload your resume in your Profile before applying.");
        return;
      }
      // Check if job has supplemental questions (use fresh data to avoid stale cache)
      let job = jobs.find(j => j.id === jobId);
      if (!job || !Array.isArray(job.supplementalQuestions)) {
        try {
          const res = await fetch('/api/jobs', { cache: 'no-store' });
          const latestJobs = await res.json();
          const latest = Array.isArray(latestJobs) ? latestJobs.find((j: any) => j.id === jobId) : null;
          if (latest) job = latest as unknown as Job;
        } catch {}
      }
      if (job?.supplementalQuestions && job.supplementalQuestions.length > 0) {
        // If any supplemental questions exist, always route to supplemental flow
        router.push(`/candidate/apply/${jobId}`);
        return;
      }
      
      // No supplemental questions, apply directly
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, resume_url: profileResumeUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        // If server enforces required supplementals, redirect to supplemental flow
        if (res.status === 400 && data?.error === 'Supplemental questions required') {
          setPendingJobForSupp(jobId);
          setSuppModalOpen(true);
          return;
        }
        throw new Error(data?.error || "Failed to apply");
      }
      if (data.created) {
        setApps((prev) => [
          ...prev,
          { jobId, status: data.status as Application["status"], appliedAt: new Date().toISOString() },
        ]);
      }
    } catch (e: any) {
      setError(e.message || "Failed to apply");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
          Candidate Dashboard
        </h1>
        <p className="text-base text-gray-600">Browse available jobs and apply in one click.</p>
        {!profileResumeUrl && (
          <div className="mt-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            Please upload your resume in your <Link href="/profile" className="underline font-medium">Profile</Link> to enable one-click apply.
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles, companies, or locations..."
            className="pl-10 h-12 text-base rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>

      {/* Job Listings */}
      <div className="grid gap-4">
        {filtered.map((job) => {
          const status = getStatus(job.id);
          const isApplied = !!status;
          const resumeMissing = !profileResumeUrl;
          return (
            <div 
              key={job.id} 
              className="group relative bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-start justify-between gap-6">
                <Link href={`/jobs/${job.id}`} className="flex-1 min-w-0">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">{job.company}</span>
                      <span className="text-gray-400">•</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{job.location}</span>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isApplied && status ? (
                    <span className={`text-xs px-3 py-1.5 rounded-full font-semibold whitespace-nowrap ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  ) : null}
                  <Button
                    onClick={() => apply(job.id)}
                    disabled={isApplied || submitting === job.id || resumeMissing}
                    className={isApplied ? "" : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"}
                    size="default"
                  >
                    {isApplied ? "✓ Applied" : submitting === job.id ? "Applying..." : resumeMissing ? "Add Resume in Profile" : "Apply Now"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-base text-gray-600 font-medium">No jobs match your search</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search criteria</p>
          </div>
        )}
      </div>

      <Modal
        open={suppModalOpen}
        onClose={() => setSuppModalOpen(false)}
        title="Additional Questions Required"
        description="This application requires you to answer a few supplemental questions before submitting."
        actions={
          <>
            <Button variant="outline" onClick={() => setSuppModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (pendingJobForSupp) {
                  const id = pendingJobForSupp;
                  setSuppModalOpen(false);
                  setPendingJobForSupp(null);
                  router.push(`/jobs/${id}/supplemental`);
                }
              }}
            >
              Continue
            </Button>
          </>
        }
      >
        <p className="text-sm">You will be taken to a separate page to complete these questions.</p>
      </Modal>
    </div>
  );
}

