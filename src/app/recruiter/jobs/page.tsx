"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase } from "lucide-react";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string | null;
  status: string;
  created_at: string;
  applicationCount: number;
};

export default function RecruiterJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadJobs() {
      try {
        const response = await fetch("/api/jobs/recruiter", {
          cache: "no-store",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/sign-in?redirect=/recruiter/jobs");
            return;
          }
          throw new Error("Failed to fetch jobs");
        }

        const data = await response.json();
        if (mounted) {
          setJobs(data);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || "Failed to load jobs");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadJobs();

    return () => {
      mounted = false;
    };
  }, [router]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-900">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Job Postings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your job postings and view applicants
          </p>
        </div>
        <Button
          onClick={() => router.push("/recruiter/create-job")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Jobs Grid */}
      {jobs.length === 0 ? (
        <div className="text-center py-16 border rounded-lg">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base text-gray-600 font-medium">No jobs posted yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            Create your first job posting to start receiving applications
          </p>
          <Button onClick={() => router.push("/recruiter/create-job")}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Job
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/recruiter/jobs/${job.id}`}
              className="block group"
            >
              <div className="border rounded-lg p-6 hover:border-purple-300 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {job.title}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusBadgeColor(
                          job.status
                        )}`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <span className="font-medium">{job.company}</span>
                      <span>•</span>
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                    {job.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <div className="text-2xl font-bold text-purple-600">
                      {job.applicationCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {job.applicationCount === 1 ? "applicant" : "applicants"}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
