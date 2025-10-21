"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
};

type Application = {
  jobId: string;
  status: "Applied" | "Under Review";
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
              <div className="min-w-0">
                <div className="font-medium truncate">{job.title}</div>
                <div className="text-sm text-muted-foreground truncate">
                  {job.company} • {job.location}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isApplied ? (
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 border text-gray-700">{status}</span>
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
