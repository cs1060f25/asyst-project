"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, Phone, Linkedin, Github, Globe, FileText, Calendar, Briefcase, GraduationCap, Award } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type ApplicationDetail = {
  application: {
    id: string;
    jobId: string;
    candidateId: string;
    status: string;
    resumeUrl: string | null;
    coverLetter: string | null;
    supplementalAnswers: Record<string, any> | null;
    appliedAt: string;
    updatedAt: string;
  };
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string | null;
    salaryRange: string | null;
    requirements: Record<string, any> | null;
    status: string;
  };
  candidate: {
    userId: string;
    name: string;
    email: string;
    phone: string | null;
    education: string | null;
    resumeUrl: string | null;
    skills: string[] | null;
    experience: any[] | null;
    certifications: string[] | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    portfolioUrl: string | null;
    offerDeadline: string | null;
  };
};

export default function ApplicationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = params.id as string;

  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitor authentication state
  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/sign-in');
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  // Fetch application details
  useEffect(() => {
    async function fetchApplicationDetails() {
      try {
        setLoading(true);
        const response = await fetch(`/api/applications/${applicationId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch application details");
        }

        const applicationData = await response.json();
        setData(applicationData);
      } catch (err: any) {
        console.error("Error fetching application:", err);
        setError(err.message || "Failed to load application");
      } finally {
        setLoading(false);
      }
    }

    if (applicationId) {
      fetchApplicationDetails();
    }
  }, [applicationId]);

  const updateStatus = async (newStatus: string) => {
    if (!data) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setData({
          ...data,
          application: {
            ...data.application,
            status: newStatus,
          },
        });
      } else {
        console.error("Failed to update status");
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      Applied: "bg-blue-100 text-blue-800",
      "Under Review": "bg-yellow-100 text-yellow-800",
      Interview: "bg-purple-100 text-purple-800",
      Offer: "bg-green-100 text-green-800",
      Hired: "bg-emerald-100 text-emerald-800",
      Rejected: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getDeadlineUrgency = (deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { text: "Expired", color: "bg-gray-100 text-gray-600" };
    } else if (daysUntil === 0) {
      return { text: "Today!", color: "bg-red-100 text-red-800" };
    } else if (daysUntil <= 3) {
      return { text: `${daysUntil} days left`, color: "bg-red-100 text-red-800" };
    } else if (daysUntil <= 7) {
      return { text: `${daysUntil} days left`, color: "bg-yellow-100 text-yellow-800" };
    } else {
      return { text: `${daysUntil} days left`, color: "bg-green-100 text-green-800" };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading application details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <p className="text-red-600">{error || "Application not found"}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  const { application, job, candidate } = data;
  const urgency = getDeadlineUrgency(candidate.offerDeadline);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Application Details</h1>
            <p className="text-gray-600">Applied {new Date(application.appliedAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.status)}`}>
            {application.status}
          </span>
          <Select
            value={application.status}
            onValueChange={updateStatus}
            disabled={updating}
          >
            <SelectTrigger className="w-48">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Candidate Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Profile Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold">{candidate.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${candidate.email}`} className="hover:text-blue-600">
                      {candidate.email}
                    </a>
                  </div>
                  {candidate.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <a href={`tel:${candidate.phone}`} className="hover:text-blue-600">
                        {candidate.phone}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              {urgency && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${urgency.color}`}>
                  <Calendar className="h-4 w-4 inline mr-1" />
                  {urgency.text}
                </span>
              )}
            </div>

            {/* Social Links */}
            <div className="flex gap-3 mb-4">
              {candidate.linkedinUrl && (
                <a
                  href={candidate.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Linkedin className="h-4 w-4" />
                  LinkedIn
                </a>
              )}
              {candidate.githubUrl && (
                <a
                  href={candidate.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              )}
              {candidate.portfolioUrl && (
                <a
                  href={candidate.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Portfolio
                </a>
              )}
              {candidate.resumeUrl && (
                <a
                  href={candidate.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Resume
                </a>
              )}
            </div>

            {/* Education */}
            {candidate.education && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </div>
                <p className="text-gray-600">{candidate.education}</p>
              </div>
            )}

            {/* Skills */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Award className="h-5 w-5" />
                  Skills
                </div>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Experience */}
            {candidate.experience && candidate.experience.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </div>
                <div className="space-y-3">
                  {candidate.experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4">
                      <h4 className="font-medium">{exp.title || exp.position}</h4>
                      <p className="text-gray-600 text-sm">{exp.company}</p>
                      {exp.duration && (
                        <p className="text-gray-500 text-xs">{exp.duration}</p>
                      )}
                      {exp.description && (
                        <p className="text-gray-600 text-sm mt-1">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {candidate.certifications && candidate.certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 text-gray-700 font-semibold mb-2">
                  <Award className="h-5 w-5" />
                  Certifications
                </div>
                <ul className="list-disc list-inside text-gray-600">
                  {candidate.certifications.map((cert, index) => (
                    <li key={index}>{cert}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Cover Letter */}
          {application.coverLetter && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Cover Letter</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{application.coverLetter}</p>
            </div>
          )}

          {/* Supplemental Answers */}
          {application.supplementalAnswers && Object.keys(application.supplementalAnswers).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Supplemental Answers</h3>
              <div className="space-y-4">
                {Object.entries(application.supplementalAnswers).map(([questionId, answer], index) => {
                  // Find the actual question text from job's supplemental questions
                  const supplementalQuestions = (job as any).supplementalQuestions || [];
                  const questionObj = supplementalQuestions.find((q: any) => q.id === questionId);
                  const questionText = questionObj?.question || questionId;
                  
                  return (
                    <div key={index} className="border-b border-gray-100 pb-4 last:border-0">
                      <p className="font-medium text-gray-700 mb-2">{questionText}</p>
                      <p className="text-gray-600">{String(answer)}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Job Info */}
        <div className="space-y-6">
          {/* Job Details Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="font-medium">{job.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Company</p>
                <p className="font-medium">{job.company}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Location</p>
                <p className="font-medium">{job.location}</p>
              </div>
              {job.salaryRange && (
                <div>
                  <p className="text-sm text-gray-500">Salary Range</p>
                  <p className="font-medium">{job.salaryRange}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Job Status</p>
                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  job.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {job.status}
                </span>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              variant="outline"
              onClick={() => router.push(`/recruiter/jobs/${job.id}`)}
            >
              View All Applicants
            </Button>
          </div>

          {/* Application Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Applied</p>
                <p className="font-medium">{new Date(application.appliedAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Updated</p>
                <p className="font-medium">{new Date(application.updatedAt).toLocaleString()}</p>
              </div>
              {candidate.offerDeadline && (
                <div>
                  <p className="text-sm text-gray-500">Offer Deadline</p>
                  <p className="font-medium">{new Date(candidate.offerDeadline).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
