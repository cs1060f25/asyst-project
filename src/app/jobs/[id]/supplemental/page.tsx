"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Question = { id: string; label: string; required?: boolean; type?: string };

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  supplementalQuestions?: Question[];
};

export default function SupplementalQuestionsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const jobId = params?.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [coverLetter, setCoverLetter] = useState<string>("");

  const questions = useMemo(() => job?.supplementalQuestions ?? [], [job]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
        if (!res.ok) throw new Error("Job not found");
        const data: Job = await res.json();
        if (!mounted) return;
        setJob(data);
      } catch (e: any) {
        setError(e.message || "Failed to load job");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [jobId]);

  function validate(): string | null {
    for (const q of questions) {
      if (q.required && !((answers[q.id] || "").trim())) {
        return `Please answer: ${q.label}`;
      }
    }
    return null;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const validationError = validate();
      if (validationError) {
        throw new Error(validationError);
      }
      const res = await fetch(`/api/applications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          details: {
            coverLetter: coverLetter.trim() || undefined,
            answers,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to apply");
      }
      // success -> redirect to candidate dashboard
      router.push("/candidate");
    } catch (e: any) {
      setError(e.message || "Failed to apply");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (!job) return (
    <div className="space-y-4">
      <p className="text-red-600">Job not found</p>
      <Link className="underline" href="/candidate">Back to jobs</Link>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Supplemental Questions</h1>
        <Link className="text-sm underline" href={`/jobs/${jobId}`}>Back to job</Link>
      </div>
      <div className="text-sm text-muted-foreground">
        {job.title} • {job.company}
      </div>

      <div className="border rounded p-4 space-y-4">
        {questions.length === 0 ? (
          <p className="text-sm">This job has no supplemental questions. You can apply directly from the job page.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div className="grid gap-2" key={q.id}>
                <label className="text-sm font-medium">
                  {q.label} {q.required ? <span className="text-red-600">*</span> : null}
                </label>
                <Input
                  value={answers[q.id] || ""}
                  onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                  placeholder={q.type === "text" ? "Your answer" : undefined}
                />
              </div>
            ))}
          </div>
        )}

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()} disabled={submitting}>Back</Button>
          <Button onClick={handleSubmit} disabled={submitting || questions.length === 0 && false}>
            {submitting ? "Submitting..." : "Submit and Apply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
