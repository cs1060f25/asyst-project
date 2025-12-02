"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
          // Initialize answers for supplemental questions if present
          const reqs = jobResult.data?.requirements;
          const supp = reqs && typeof reqs === 'object' ? (reqs as any).supplementalQuestions : undefined;
          if (Array.isArray(supp)) {
            const initial: Record<string, string> = {};
            for (const q of supp) {
              if (q && typeof q.id === 'string') initial[q.id] = "";
            }
            setAnswers(initial);
          }
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

      // If job has supplemental questions, validate required and include answers
      let supplementalPayload: Record<string, string> | undefined = undefined;
      if (job?.requirements && typeof job.requirements === 'object') {
        const requirements = job.requirements as Record<string, any>;
        const supp: any[] = Array.isArray(requirements.supplementalQuestions) ? requirements.supplementalQuestions : [];
        if (supp.length > 0) {
          // Validate required
          const missing: string[] = [];
          for (const q of supp) {
            if (q?.required && typeof q.id === 'string') {
              const val = (answers[q.id] ?? '').trim();
              if (!val) missing.push(q.id);
            }
          }
          if (missing.length > 0) {
            setError("Please complete all required supplemental questions before applying.");
            // Keep modal pattern in case you still want the dedicated page
            setSuppModalOpen(true);
            setSubmitting(false);
            return;
          }
          supplementalPayload = Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, (v || '').trim()]));
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
          supplemental_answers: supplementalPayload || {}
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">{error || "Job not found"}</p>
        <Link className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium" href="/candidate">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <Link 
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium" 
          href="/candidate"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to jobs
        </Link>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-gray-200">
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900">{job.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="font-semibold">{job.company}</span>
              </div>
              {job.location && (
                <div className="flex items-center gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{job.location}</span>
                </div>
              )}
              {job.status && (
                <span className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-gray-700 border border-gray-300">
                  {job.status}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm space-y-6">
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
              {Object.entries(job.requirements).map(([key, value]) => {
                if (key === 'supplementalQuestions' && Array.isArray(value)) {
                  return (
                    <div key={key} className="space-y-2">
                      <div className="font-medium">Supplemental Questions:</div>
                      <div className="space-y-4">
                        {value.map((q: any, idx: number) => (
                          <div key={q?.id || idx} className="space-y-2 border rounded-md p-3">
                            <div className="text-sm font-medium">
                              {idx + 1}. {(q && (q.question || q.label)) ? (q.question || q.label) : 'Question'}
                              {q?.required ? <span className="text-red-500 ml-1">*</span> : null}
                            </div>
                            {q?.type === 'text' && (
                              <Input
                                value={answers[q.id] || ""}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Your answer"
                              />
                            )}
                            {q?.type === 'textarea' && (
                              <textarea
                                value={answers[q.id] || ""}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Your answer"
                                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical text-sm"
                              />
                            )}
                            {q?.type === 'select' && Array.isArray(q?.options) && (
                              <Select
                                value={answers[q.id] || ""}
                                onValueChange={(val) => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an option" />
                                </SelectTrigger>
                                <SelectContent>
                                  {q.options.map((opt: string, i: number) => (
                                    <SelectItem key={i} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={key} className="flex gap-2">
                    <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                    <span>{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                  </div>
                );
              })}
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
      <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 shadow-sm">
        {!user ? (
          <div className="space-y-4">
            <Button 
              onClick={handleApply} 
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              Login to Apply
            </Button>
            <p className="text-sm text-gray-600">You must be logged in to apply to this job</p>
          </div>
        ) : alreadyApplied ? (
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900">Already Applied</p>
              <p className="text-sm text-gray-600">You've submitted your application for this position</p>
            </div>
          </div>
        ) : success ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-200 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-green-900">Application Submitted!</p>
              <p className="text-sm text-green-600">Redirecting to your dashboard...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Button 
              onClick={handleApply} 
              disabled={submitting}
              className="w-full sm:w-auto h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
            >
              {submitting ? "Submitting Application..." : "Apply Now"}
            </Button>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
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
            <Button onClick={() => { setSuppModalOpen(false); router.push(`/candidate/apply/${jobId}`); }}>Continue</Button>
          </>
        }
      >
        <p className="text-sm">You will be taken to a separate page to complete the required questions.</p>
      </Modal>
    </div>
  );
}

