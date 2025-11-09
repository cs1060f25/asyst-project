"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  supplementalQuestions?: Array<{ id: string; label: string; required?: boolean; type?: string }>;
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
  const [suppModalOpen, setSuppModalOpen] = useState(false);

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
      // Fetch job details to decide if we must redirect to supplemental
      const jobRes = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (jobRes.ok) {
        const jobData: Job = await jobRes.json();
        const hasSupp = Array.isArray(jobData.supplementalQuestions) && jobData.supplementalQuestions.length > 0;
        if (hasSupp) {
          setSuppModalOpen(true);
          return;
        }
      }

      // No supplemental questions; proceed to apply directly (preserving local fields)
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
      if (data.created) {
        setApps((prev) => [
          ...prev,
          { jobId, status: data.status as Application["status"], appliedAt: new Date().toISOString() },
        ]);
      }
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

