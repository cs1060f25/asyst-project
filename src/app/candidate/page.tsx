"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
};

type Application = {
  jobId: string;
  status: "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";
  appliedAt: string;
};

export default function CandidatePage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setJobs(jobsData as Job[]);
        setApps(appsData as Application[]);
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
      // Optimistic disable handled by submitting state
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to apply");
      }
      // If created, append; if not, leave as-is.
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Candidate Dashboard</h1>
        <p className="text-sm text-muted-foreground">Browse available jobs and apply in one click.</p>
      </div>

      <div className="grid gap-4 max-w-xl">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles, companies, or locations"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="divide-y rounded-md border">
        {filtered.map((job) => {
          const status = getStatus(job.id);
          const isApplied = !!status;
          return (
            <div key={job.id} className="p-4 flex items-center justify-between gap-4">
              <Link href={`/jobs/${job.id}`} className="min-w-0 group">
                <div className="font-medium truncate group-hover:underline">{job.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {job.company} • {job.location}
                </div>
              </Link>
              <div className="flex items-center gap-3">
                {isApplied && status ? (
                  <span className={`text-xs px-2 py-1 rounded border font-medium ${getStatusColor(status)}`}>{status}</span>
                ) : null}
                <Button
                  onClick={() => apply(job.id)}
                  disabled={isApplied || submitting === job.id}
                >
                  {isApplied ? "Applied" : submitting === job.id ? "Applying..." : "One-click Apply"}
                </Button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">No jobs match your search.</div>
        )}
      </div>
    </div>
  );
}
