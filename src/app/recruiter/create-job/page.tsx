"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, ArrowLeft } from "lucide-react";
import { SupplementalQuestion } from "@/lib/applications";

export default function CreateJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Job form data
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  
  // Supplemental questions
  const [supplementalQuestions, setSupplementalQuestions] = useState<SupplementalQuestion[]>([]);

  const addQuestion = () => {
    const newQuestion: SupplementalQuestion = {
      id: `q-${Date.now()}`,
      question: "",
      type: "text",
      required: false,
    };
    setSupplementalQuestions([...supplementalQuestions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<SupplementalQuestion>) => {
    setSupplementalQuestions(prev =>
      prev.map(q => q.id === id ? { ...q, ...updates } : q)
    );
  };

  const removeQuestion = (id: string) => {
    setSupplementalQuestions(prev => prev.filter(q => q.id !== id));
  };

  const addOption = (questionId: string) => {
    setSupplementalQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { ...q, options: [...(q.options || []), ""] }
          : q
      )
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setSupplementalQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.map((opt, idx) => idx === optionIndex ? value : opt) 
            }
          : q
      )
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setSupplementalQuestions(prev =>
      prev.map(q => 
        q.id === questionId 
          ? { 
              ...q, 
              options: q.options?.filter((_, idx) => idx !== optionIndex) 
            }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!title.trim() || !company.trim() || !location.trim()) {
        throw new Error("Please fill in all required fields");
      }

      // Validate supplemental questions
      for (const question of supplementalQuestions) {
        if (!question.question.trim()) {
          throw new Error("All supplemental questions must have text");
        }
        if (question.type === "select" && (!question.options || question.options.length === 0)) {
          throw new Error("Select questions must have at least one option");
        }
      }

      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          company: company.trim(),
          location: location.trim(),
          description: description.trim(),
          supplementalQuestions: supplementalQuestions.filter(q => q.question.trim()),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create job");
      }

      // Redirect back to recruiter dashboard
      router.push("/recruiter");
    } catch (err: any) {
      setError(err.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Create New Job</h1>
          <p className="text-sm text-muted-foreground">
            Add a new job posting with optional supplemental questions for candidates.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Job Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Job Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Job Title *
              </label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="company" className="text-sm font-medium">
                Company *
              </label>
              <Input
                id="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location *
              </label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Remote, New York, NY"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Job Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements..."
              className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
          </div>
        </div>

        {/* Supplemental Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Supplemental Questions</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addQuestion}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Question
            </Button>
          </div>
          
          {supplementalQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No supplemental questions added. Click "Add Question" to create custom questions for candidates.
            </p>
          ) : (
            <div className="space-y-4">
              {supplementalQuestions.map((question, index) => (
                <div key={question.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Question {index + 1}</h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Text</label>
                      <Input
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, { question: e.target.value })}
                        placeholder="Enter your question..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question Type</label>
                      <Select
                        value={question.type}
                        onValueChange={(value) => updateQuestion(question.id, { 
                          type: value as SupplementalQuestion["type"],
                          options: value === "select" ? [""] : undefined
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Short Text</SelectItem>
                          <SelectItem value="textarea">Long Text</SelectItem>
                          <SelectItem value="select">Multiple Choice</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {question.type === "select" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Options</label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addOption(question.id)}
                        >
                          Add Option
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {question.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <Input
                              value={option}
                              onChange={(e) => updateOption(question.id, optionIndex, e.target.value)}
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(question.id, optionIndex)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${question.id}`}
                      checked={question.required}
                      onChange={(e) => updateQuestion(question.id, { required: e.target.checked })}
                      className="rounded"
                    />
                    <label htmlFor={`required-${question.id}`} className="text-sm">
                      Required question
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
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
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Job"}
          </Button>
        </div>
      </form>
    </div>
  );
}
