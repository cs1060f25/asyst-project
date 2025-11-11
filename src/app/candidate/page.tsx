"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { JobFilters } from "@/components/JobFilters";
import { JobSortDropdown } from "@/components/JobSortDropdown";
import { DeadlineBadge } from "@/components/DeadlineBadge";
import type { Job } from "@/lib/types/database";

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
  
  // Filter and sort state with localStorage
  const [currentFilter, setCurrentFilter] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jobFilter') || 'all';
    }
    return 'all';
  });
  
  const [currentSort, setCurrentSort] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jobSort') || 'deadline_asc';
    }
    return 'deadline_asc';
  });
  
  const [showExpired, setShowExpired] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('showExpired') === 'true';
    }
    return false;
  });

  // Fetch jobs with filter and sort parameters
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        // Build query string
        const params = new URLSearchParams({
          filter: currentFilter,
          sort: currentSort,
          showExpired: showExpired.toString(),
        });
        
        const [jobsRes, appsRes] = await Promise.all([
          fetch(`/api/jobs?${params.toString()}`, { cache: "no-store" }),
          fetch("/api/applications", { cache: "no-store" }),
        ]);
        const [jobsData, appsData] = await Promise.all([jobsRes.json(), appsRes.json()]);
        if (!mounted) return;
        setJobs(Array.isArray(jobsData) ? jobsData : []);
        setApps(Array.isArray(appsData) ? appsData : []);
      } catch (err) {
        console.error('Error fetching jobs:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [currentFilter, currentSort, showExpired]);
  
  // Persist filter/sort preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobFilter', currentFilter);
      localStorage.setItem('jobSort', currentSort);
      localStorage.setItem('showExpired', showExpired.toString());
    }
  }, [currentFilter, currentSort, showExpired]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.location && j.location.toLowerCase().includes(q))
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
      // Check if job has supplemental questions (stored in requirements JSONB)
      const job = jobs.find(j => j.id === jobId);
      const requirements = job?.requirements as Record<string, any> | null;
      const hasSupp = requirements?.supplementalQuestions && 
                      Array.isArray(requirements.supplementalQuestions) && 
                      requirements.supplementalQuestions.length > 0;
      
      if (hasSupp) {
        // Redirect to supplemental questions page
        router.push(`/candidate/apply/${jobId}`);
        return;
      }
      
      // No supplemental questions, apply directly
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),  // API will handle the format conversion
      });
      const data = await res.json();
      if (!res.ok) {
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Candidate Dashboard</h1>
          <p className="text-sm text-muted-foreground">Browse available jobs and apply in one click.</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3 text-sm text-gray-600">Loading jobs...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidate Dashboard</h1>
        <p className="text-sm text-muted-foreground">Browse available jobs and apply in one click.</p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles, companies, or locations"
        />
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <JobFilters
          currentFilter={currentFilter}
          showExpired={showExpired}
          onFilterChange={setCurrentFilter}
          onToggleExpired={setShowExpired}
        />
        <JobSortDropdown
          currentSort={currentSort}
          onSortChange={setCurrentSort}
        />
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">{error}</p>}

      {/* Job Listings */}
      <div className="divide-y rounded-md border">
        {filtered.map((job) => {
          const status = getStatus(job.id);
          const isApplied = !!status;
          return (
            <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Job Info */}
                <Link href={`/jobs/${job.id}`} className="min-w-0 group flex-1">
                  <div className="flex items-start gap-2 flex-wrap">
                    <div className="font-medium group-hover:underline">{job.title}</div>
                    <DeadlineBadge deadline={job.deadline} variant="compact" />
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {job.company} • {job.location || 'Location not specified'}
                  </div>
                </Link>
                
                {/* Action Buttons */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {isApplied && status ? (
                    <span className={`text-xs px-2 py-1 rounded border font-medium whitespace-nowrap ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  ) : null}
                  <Button
                    onClick={() => apply(job.id)}
                    disabled={isApplied || submitting === job.id}
                    size="sm"
                  >
                    {isApplied ? "Applied" : submitting === job.id ? "Applying..." : "One-click Apply"}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-4xl mb-2">🔍</div>
            <p className="text-sm font-medium text-gray-900 mb-1">No jobs found</p>
            <p className="text-sm text-muted-foreground">No jobs match your filters. Try adjusting your criteria.</p>
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

