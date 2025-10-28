"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
};

type Application = {
  jobId: string;
  status: "Applied" | "Under Review";
  appliedAt: string;
};

export default function JobDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = useMemo(() => apps.find((a) => a.jobId === jobId)?.status ?? null, [apps, jobId]);
  const isApplied = !!status;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [jobRes, appsRes] = await Promise.all([
          fetch(`/api/jobs/${jobId}`, { cache: "no-store" }),
          fetch(`/api/applications`, { cache: "no-store" }),
        ]);
        if (!jobRes.ok) throw new Error("Job not found");
        const [jobData, appsData] = await Promise.all([jobRes.json(), appsRes.json()]);
        if (!mounted) return;
        setJob(jobData as Job);
        setApps(appsData as Application[]);
      } catch (e: any) {
        setError(e.message || "Failed to load job");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  async function handleApply() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          details: {
            coverLetter: coverLetter.trim() || undefined,
            answers: Object.keys(answers).length ? answers : undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to apply");
      }
      // If created, reflect in local apps state
      if (data.created) {
        setApps((prev) => [
          ...prev,
          { jobId, status: data.status as Application["status"], appliedAt: new Date().toISOString() },
        ]);
      }
      // After successful apply, return to dashboard
      router.push("/candidate");
    } catch (e: any) {
      setError(e.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!job) return <div className="space-y-4"><p className="text-red-600">Job not found</p><Link className="underline" href="/candidate">Back to jobs</Link></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{job.title}</h1>
        <Link className="text-sm underline" href="/candidate">Back to jobs</Link>
      </div>
      <div className="text-sm text-muted-foreground">
        {job.company} • {job.location}
      </div>
      {job.description && (
        <p className="text-sm leading-6">{job.description}</p>
      )}

      <div className="border rounded p-4 space-y-4">
        <h2 className="text-lg font-semibold">Supplemental Application</h2>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Cover Letter (optional)</label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={6}
            className="w-full border rounded p-2 text-sm"
            placeholder="Paste your cover letter here..."
          />
        </div>
        {/* Example additional answer field */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Why do you want to work here? (optional)</label>
          <Input
            value={answers["why"] || ""}
            onChange={(e) => setAnswers((prev) => ({ ...prev, why: e.target.value }))}
            placeholder="Short response"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button onClick={handleApply} disabled={isApplied || submitting}>
          {isApplied ? "Applied" : submitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}
