"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Application = {
  id: string;
  job_id: string;
  candidate_id: string | null;
  status: string;
  resume_url: string | null;
  cover_letter: string | null;
  supplemental_answers: Record<string, unknown> | null;
  applied_at: string;
  candidate: {
    name: string;
    email: string;
    phone: string | null;
    resume_url: string | null;
    linkedin_url: string | null;
    github_url: string | null;
    offer_deadline: string | null;
  } | null;
};

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  status: string;
};

export default function JobApplicationsPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  // Monitor authentication state and redirect on sign-out
  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setApplications([]);
        setJob(null);
        router.push('/auth/sign-in');
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        // Fetch job details and applications in parallel
        const [jobRes, appsRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`, { cache: "no-store" }),
          fetch(`/api/jobs/${jobId}/applications`, { cache: "no-store" }),
        ]);

        if (!jobRes.ok || !appsRes.ok) {
          if (jobRes.status === 401 || appsRes.status === 401) {
            router.push("/auth/sign-in?redirect=/recruiter/jobs");
            return;
          }
          if (jobRes.status === 403 || appsRes.status === 403) {
            throw new Error("You don't have permission to view this job");
          }
          throw new Error("Failed to fetch data");
        }

        const [jobData, appsData] = await Promise.all([
          jobRes.json(),
          appsRes.json(),
        ]);

        if (mounted) {
          setJob(jobData);
          setApplications(appsData);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [jobId, router]);

  // Helper to convert DB format to API format
  const toApiFormat = (dbStatus: string): string => {
    const map: Record<string, string> = {
      "applied": "Applied",
      "under_review": "Under Review",
      "interview": "Interview",
      "offer": "Offer",
      "hired": "Hired",
      "rejected": "Rejected",
    };
    return map[dbStatus] || dbStatus;
  };

  // Helper to convert API format to DB format
  const toDbFormat = (apiStatus: string): string => {
    const map: Record<string, string> = {
      "Applied": "applied",
      "Under Review": "under_review",
      "Interview": "interview",
      "Offer": "offer",
      "Hired": "hired",
      "Rejected": "rejected",
    };
    return map[apiStatus] || apiStatus;
  };

  const updateStatus = async (applicationId: string, newStatus: string) => {
    setUpdating(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Convert back to DB format for local state
        const dbStatus = toDbFormat(newStatus);
        setApplications((prev) =>
          prev.map((app) =>
            app.id === applicationId ? { ...app, status: dbStatus } : app
          )
        );
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "applied":
        return "bg-blue-100 text-blue-800";
      case "under_review":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "offer":
        return "bg-green-100 text-green-800";
      case "hired":
        return "bg-green-200 text-green-900";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getDeadlineUrgency = (deadline: string | null) => {
    if (!deadline) return null;

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntil < 0)
      return { level: "expired", text: "Expired", color: "bg-red-200 text-red-900" };
    if (daysUntil <= 3)
      return {
        level: "urgent",
        text: `${daysUntil}d left`,
        color: "bg-red-100 text-red-800",
      };
    if (daysUntil <= 7)
      return {
        level: "soon",
        text: `${daysUntil}d left`,
        color: "bg-orange-100 text-orange-800",
      };
    return {
      level: "normal",
      text: `${daysUntil}d left`,
      color: "bg-gray-100 text-gray-700",
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading applications...</p>
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
        <Link href="/recruiter/jobs">
          <Button variant="outline">Back to Jobs</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <Link href="/recruiter/jobs">
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
          <p className="text-sm text-muted-foreground">
            {job.company} • {job.location} • {applications.length}{" "}
            {applications.length === 1 ? "application" : "applications"}
          </p>
        </div>
      </div>

      {/* Applications Table */}
      {applications.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-base text-gray-600 font-medium">No applications yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Applications will appear here once candidates apply to this position
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
              <div className="col-span-3">Candidate</div>
              <div className="col-span-2">Applied Date</div>
              <div className="col-span-2">Offer Deadline</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Actions</div>
            </div>
          </div>

          <div className="divide-y">
            {applications.map((app) => {
              const urgency = getDeadlineUrgency(app.candidate?.offer_deadline || null);
              return (
                <div key={app.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <div className="font-medium">
                        {app.candidate?.name || "Anonymous"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {app.candidate?.email || ""}
                      </div>
                      {app.candidate?.phone && (
                        <div className="text-xs text-gray-500">
                          {app.candidate.phone}
                        </div>
                      )}
                      <div className="flex gap-2 mt-1">
                        {app.candidate?.resume_url && (
                          <a
                            href={app.candidate.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Resume
                          </a>
                        )}
                        {app.candidate?.linkedin_url && (
                          <a
                            href={app.candidate.linkedin_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            LinkedIn
                          </a>
                        )}
                        {app.candidate?.github_url && (
                          <a
                            href={app.candidate.github_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="col-span-2 text-sm">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      {urgency ? (
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgency.color}`}
                        >
                          {urgency.text}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No deadline</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(
                          app.status
                        )}`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={toApiFormat(app.status)}
                        onValueChange={(value) => updateStatus(app.id, value)}
                        disabled={updating === app.id}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Applied">Applied</SelectItem>
                          <SelectItem value="Under Review">Under Review</SelectItem>
                          <SelectItem value="Interview">Interview</SelectItem>
                          <SelectItem value="Offer">Offer</SelectItem>
                          <SelectItem value="Hired">Hired</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
