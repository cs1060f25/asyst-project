"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { Job } from "@/lib/types/database";
import type { User } from "@supabase/supabase-js";

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [suppModalOpen, setSuppModalOpen] = useState(false);

  // Load job data and check authentication
  useEffect(() => {
    let mounted = true;

    async function loadJobAndAuth() {
      try {
        // Load job and auth in parallel
        const [jobResult, authResult] = await Promise.all([
          supabase.from('jobs').select('*').eq('id', jobId).single(),
          supabase.auth.getUser()
        ]);

        if (!mounted) return;

        // Set job data
        if (jobResult.error || !jobResult.data) {
          setError("Job not found");
        } else {
          setJob(jobResult.data);
        }

        // Set user data - try both getUser and getSession for compatibility
        let currentUser = authResult.data.user;
        
        if (!currentUser) {
          // Fallback to getSession if getUser doesn't work
          const { data: sessionData } = await supabase.auth.getSession();
          currentUser = sessionData.session?.user || null;
        }
        
        console.log('Auth check:', { 
          hasUser: !!currentUser, 
          userId: currentUser?.id,
          email: currentUser?.email 
        });
        
        if (currentUser) {
          setUser(currentUser);
          
          // Check if user already applied
          const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', jobId)
            .eq('candidate_id', currentUser.id)
            .maybeSingle();
          
          console.log('Already applied check:', { hasApplied: !!existingApp });
          
          if (mounted && existingApp) {
            setAlreadyApplied(true);
          }
        } else {
          console.log('No user found - not authenticated');
        }
      } catch (e: any) {
        if (mounted) {
          setError(e.message || "Failed to load job");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadJobAndAuth();

    return () => {
      mounted = false;
    };
  }, [jobId, router]);

  // Handle apply button click
  async function handleApply() {
    // Redirect to login if not authenticated
    if (!user) {
      router.push(`/auth/sign-in?redirect=/jobs/${jobId}`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Get user's resume URL from profile
      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('resume_url')
        .eq('user_id', user.id)
        .maybeSingle();

      // Check if job has supplemental questions - if so, redirect to supplemental page
      if (job?.requirements && typeof job.requirements === 'object') {
        const requirements = job.requirements as Record<string, any>;
        const hasSupp = Array.isArray(requirements.supplementalQuestions) && requirements.supplementalQuestions.length > 0;
        if (hasSupp) {
          setSuppModalOpen(true);
          return;
        }
      }

      // No supplemental questions; proceed to apply directly
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          resume_url: profile?.resume_url,
          cover_letter: "Applied via job details page",
          supplemental_answers: {}
        }),
      });

      const data = await response.json();

      if (response.status === 201) {
        // Success!
        setSuccess(true);
        setAlreadyApplied(true);
        setTimeout(() => {
          router.push('/candidate');
        }, 1500);
      } else if (response.status === 401) {
        // Not authenticated
        router.push(`/auth/sign-in?redirect=/jobs/${jobId}`);
      } else if (response.status === 409) {
        // Already applied
        setAlreadyApplied(true);
        setError("You've already applied to this job");
      } else if (response.status === 403) {
        // Job not accepting applications
        setError(data.message || "This job is not currently accepting applications");
      } else {
        // Other errors
        setError(data.message || data.error || "Failed to submit application");
      }
    } catch (err: any) {
      console.error('Application error:', err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <p className="text-red-600">{error || "Job not found"}</p>
        <Link className="text-sm underline text-blue-600" href="/candidate">
          ← Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1" 
          href="/candidate"
        >
          <span>←</span> Back to jobs
        </Link>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">{job.title}</h1>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">{job.company}</span>
            {job.location && (
              <>
                <span>•</span>
                <span>{job.location}</span>
              </>
            )}
            {job.status && (
              <>
                <span>•</span>
                <span className="capitalize">{job.status}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="space-y-6">
        {job.salary_range && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Salary Range</h2>
            <p className="text-sm">{job.salary_range}</p>
          </div>
        )}

        {job.description && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Description</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </div>
          </div>
        )}

        {job.requirements && typeof job.requirements === 'object' && Object.keys(job.requirements).length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Requirements</h2>
            <div className="text-sm space-y-1">
              {Object.entries(job.requirements).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                  <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {job.deadline && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Application Deadline</h2>
            <p className="text-sm">{new Date(job.deadline).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Apply Button */}
      <div className="border-t pt-6 space-y-4">
        {!user ? (
          <div className="space-y-2">
            <Button onClick={handleApply} className="w-full sm:w-auto">
              Login to Apply
            </Button>
            <p className="text-sm text-gray-600">You must be logged in to apply to this job</p>
          </div>
        ) : alreadyApplied ? (
          <Button disabled className="w-full sm:w-auto" variant="secondary">
            ✓ Already Applied
          </Button>
        ) : success ? (
          <div className="space-y-2">
            <Button disabled className="w-full sm:w-auto bg-green-600 hover:bg-green-600">
              ✓ Application Submitted!
            </Button>
            <p className="text-sm text-green-600">Redirecting to your dashboard...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button 
              onClick={handleApply} 
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? "Submitting..." : "Apply Now"}
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>

      <Modal
        open={suppModalOpen}
        onClose={() => setSuppModalOpen(false)}
        title="Additional Questions Required"
        description="This application requires supplemental questions to be answered on the next page."
        actions={
          <>
            <Button variant="outline" onClick={() => setSuppModalOpen(false)}>Cancel</Button>
            <Button onClick={() => { setSuppModalOpen(false); router.push(`/jobs/${jobId}/supplemental`); }}>Continue</Button>
          </>
        }
      >
        <p className="text-sm">You will be taken to a separate page to complete the required questions.</p>
      </Modal>
    </div>
  );
}

