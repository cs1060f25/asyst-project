"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
};

type Application = {
  id: string;
  jobId: string;
  status: "Applied" | "Under Review" | "Interview" | "Offer" | "Hired" | "Rejected";
  appliedAt: string;
  candidateInfo?: {
    name: string;
    email: string;
    offerDeadline: string | null;
    resumeUrl: string | null;
  };
};

type ApplicationWithJob = Application & {
  job: Job;
};

export default function RecruiterPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Monitor authentication state and clear data on sign-out
  useEffect(() => {
    const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        // User signed out - clear sensitive data and redirect
        setApplications([]);
        setJobs([]);
        setLoading(false);
        router.push('/auth/sign-in?redirect=/recruiter');
      } else if (event === 'SIGNED_IN' && session) {
        // User signed in - reload data
        setLoading(true);
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, [router]);

  // Load applications and jobs data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          fetch("/api/applications/with-candidates", { cache: "no-store" }),
          fetch("/api/jobs", { cache: "no-store" }),
        ]);
        
        const [appsData, jobsData] = await Promise.all([
          appsRes.json(),
          jobsRes.json(),
        ]);
        
        if (!mounted) return;
        
        setJobs(jobsData as Job[]);
        
        // Combine applications with job data
        const appsWithJobs = (appsData as Application[]).map(app => {
          const job = jobsData.find((j: Job) => j.id === app.jobId);
          return {
            ...app,
            job: job || { id: app.jobId, title: "Unknown Job", company: "Unknown", location: "Unknown" }
          };
        });
        
        setApplications(appsWithJobs);
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    
    return () => {
      mounted = false;
    };
  }, []);

  const getDeadlineUrgency = (deadline: string | null) => {
    if (!deadline) return null;
    
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntil = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return { level: "expired", text: "Expired", color: "bg-red-200 text-red-900" };
    if (daysUntil <= 3) return { level: "urgent", text: `${daysUntil}d left`, color: "bg-red-100 text-red-800" };
    if (daysUntil <= 7) return { level: "soon", text: `${daysUntil}d left`, color: "bg-orange-100 text-orange-800" };
    return { level: "normal", text: `${daysUntil}d left`, color: "bg-gray-100 text-gray-700" };
  };

  const filteredApplications = useMemo(() => {
    let filtered = applications;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(app => 
        app.job.title.toLowerCase().includes(query) ||
        app.job.company.toLowerCase().includes(query) ||
        app.status.toLowerCase().includes(query)
      );
    }
    
    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Sort by deadline urgency first, then by application date
    // Only calculate urgency on client side to avoid hydration mismatch
    if (!isMounted) {
      return filtered;
    }
    
    return filtered.sort((a, b) => {
      const urgencyA = getDeadlineUrgency(a.candidateInfo?.offerDeadline || null);
      const urgencyB = getDeadlineUrgency(b.candidateInfo?.offerDeadline || null);
      
      // Priority order: expired > urgent > soon > normal > no deadline
      const urgencyOrder = { expired: 0, urgent: 1, soon: 2, normal: 3 };
      const scoreA = urgencyA ? urgencyOrder[urgencyA.level as keyof typeof urgencyOrder] : 4;
      const scoreB = urgencyB ? urgencyOrder[urgencyB.level as keyof typeof urgencyOrder] : 4;
      
      if (scoreA !== scoreB) {
        return scoreA - scoreB;
      }
      
      // If same urgency level, sort by application date (newest first)
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });
  }, [applications, searchQuery, statusFilter, isMounted]);

  const updateStatus = async (applicationId: string, newStatus: Application["status"]) => {
    setUpdating(applicationId);
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.id === applicationId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        const errorData = await response.text();
        console.error("Failed to update status:", response.status, errorData);
      }
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getStatusColor = (status: Application["status"]) => {
    switch (status) {
      case "Applied": return "bg-blue-100 text-blue-800";
      case "Under Review": return "bg-yellow-100 text-yellow-800";
      case "Interview": return "bg-purple-100 text-purple-800";
      case "Offer": return "bg-green-100 text-green-800";
      case "Hired": return "bg-green-200 text-green-900";
      case "Rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-gray-600">Loading applications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Company Dashboard
          </h1>
          <p className="text-base text-gray-600">
            Manage job applications and track candidate progress through your hiring pipeline.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/recruiter/jobs")}
            className="flex items-center gap-2 h-11 px-6"
          >
            View All Jobs
          </Button>
          <Button
            onClick={() => router.push("/recruiter/create-job")}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all h-11 px-6"
          >
            <Plus className="h-5 w-5" />
            Create Job
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <Input
            placeholder="Search by job title, company, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-lg border-gray-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-56 h-11 rounded-lg">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Under Review">Under Review</SelectItem>
            <SelectItem value="Interview">Interview</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Hired">Hired</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Applications Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
          <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700">
            <div className="col-span-2">Candidate</div>
            <div className="col-span-2">Job Title</div>
            <div className="col-span-2">Applied Date</div>
            <div className="col-span-2">Offer Deadline</div>
            <div className="col-span-2">Current Status</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-100">
          {filteredApplications.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-base text-gray-600 font-medium">
                {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {applications.length === 0 ? "Applications will appear here once candidates apply" : "Try adjusting your search criteria"}
              </p>
            </div>
          ) : (
            filteredApplications.map((app) => {
              const urgency = isMounted ? getDeadlineUrgency(app.candidateInfo?.offerDeadline || null) : null;
              return (
                <div key={`${app.jobId}-${app.candidateInfo?.email || 'anonymous'}-${app.appliedAt}`} className="px-6 py-5 hover:bg-blue-50/50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2">
                      <div className="font-medium">{app.candidateInfo?.name || "Anonymous"}</div>
                      <div className="text-sm text-gray-500">{app.candidateInfo?.email || ""}</div>
                      {app.candidateInfo?.resumeUrl && (
                        <a 
                          href={app.candidateInfo.resumeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          View Resume
                        </a>
                      )}
                    </div>
                    <div className="col-span-2">
                      <div className="font-medium">{app.job.title}</div>
                      <div className="text-sm text-gray-500">{app.job.company} • {app.job.location}</div>
                    </div>
                    <div className="col-span-2 text-sm">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                    <div className="col-span-2">
                      {urgency ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${urgency.color}`}>
                          {urgency.text}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No deadline</span>
                      )}
                    </div>
                    <div className="col-span-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <Select
                        value={app.status}
                        onValueChange={(value) => updateStatus(app.id, value as Application["status"])}
                        disabled={updating === app.id}
                      >
                        <SelectTrigger className="w-full">
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
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { status: "Applied", gradient: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
          { status: "Under Review", gradient: "from-yellow-500 to-yellow-600", bg: "bg-yellow-50" },
          { status: "Interview", gradient: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
          { status: "Offer", gradient: "from-green-500 to-green-600", bg: "bg-green-50" },
          { status: "Hired", gradient: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
          { status: "Rejected", gradient: "from-red-500 to-red-600", bg: "bg-red-50" }
        ].map(({ status, gradient, bg }) => {
          const count = applications.filter(app => app.status === status).length;
          return (
            <div key={status} className={`relative overflow-hidden rounded-xl border border-gray-200 ${bg} p-5 shadow-sm hover:shadow-md transition-shadow`}>
              <div className="relative z-10">
                <div className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
                  {count}
                </div>
                <div className="text-sm font-medium text-gray-700 mt-1">{status}</div>
              </div>
              <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl`}></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
