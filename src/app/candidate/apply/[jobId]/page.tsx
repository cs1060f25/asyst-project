"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Job, SupplementalQuestion, SupplementalAnswer } from "@/lib/applications";

export default function ApplyWithQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const jobId = params.jobId as string;
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch("/api/jobs");
        const jobs = await response.json();
        const foundJob = jobs.find((j: Job) => j.id === jobId);
        
        if (!foundJob) {
          setError("Job not found");
          return;
        }
        
        setJob(foundJob);
        
        // Initialize answers for all questions
        if (foundJob.supplementalQuestions) {
          const initialAnswers: Record<string, string> = {};
          foundJob.supplementalQuestions.forEach((q: SupplementalQuestion) => {
            initialAnswers[q.id] = "";
          });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        setError("Failed to load job details");
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const validateAnswers = (): boolean => {
    if (!job?.supplementalQuestions) return true;
    
    for (const question of job.supplementalQuestions) {
      if (question.required && !answers[question.id]?.trim()) {
        setError(`Please answer the required question: "${question.question}"`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateAnswers()) {
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Prepare supplemental answers
      const supplementalAnswers: SupplementalAnswer[] = job?.supplementalQuestions?.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ""
      })).filter(a => a.answer.trim()) || [];

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          jobId,
          supplementalAnswers 
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit application");
      }

      // Redirect back to candidate dashboard
      router.push("/candidate");
    } catch (err: any) {
      setError(err.message || "Failed to submit application");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8">Loading job details...</div>;
  }

  if (error && !job) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/candidate")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/candidate")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Complete Your Application</h1>
          <p className="text-sm text-muted-foreground">
            Please answer the following questions to complete your application for {job.title} at {job.company}.
          </p>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-medium text-lg">{job.title}</h2>
        <p className="text-sm text-muted-foreground">{job.company} • {job.location}</p>
        {job.description && (
          <p className="text-sm mt-2 text-gray-700">{job.description}</p>
        )}
      </div>

      {/* Supplemental Questions Form */}
      {job.supplementalQuestions && job.supplementalQuestions.length > 0 ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Additional Questions</h2>
            
            {job.supplementalQuestions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <label className="text-sm font-medium">
                  {index + 1}. {question.question}
                  {question.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {question.type === "text" && (
                  <Input
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                    required={question.required}
                  />
                )}
                
                {question.type === "textarea" && (
                  <textarea
                    value={answers[question.id] || ""}
                    onChange={(e) => updateAnswer(question.id, e.target.value)}
                    placeholder="Enter your answer..."
                    required={question.required}
                    className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  />
                )}
                
                {question.type === "select" && question.options && (
                  <Select
                    value={answers[question.id] || ""}
                    onValueChange={(value) => updateAnswer(question.id, value)}
                    required={question.required}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option..." />
                    </SelectTrigger>
                    <SelectContent>
                      {question.options.map((option, optionIndex) => (
                        <SelectItem key={optionIndex} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/candidate")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      ) : (
        // No supplemental questions, just submit directly
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No additional questions required. Click below to submit your application.
          </p>
          
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/candidate")}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
