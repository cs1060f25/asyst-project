"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

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
    return <div className="flex justify-center py-8">Loading applications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Company Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage job applications and track candidate progress through your hiring pipeline.
          </p>
        </div>
        <Button
          onClick={() => router.push("/recruiter/create-job")}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search by job title, company, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
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
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
            <div className="col-span-2">Candidate</div>
            <div className="col-span-2">Job Title</div>
            <div className="col-span-2">Applied Date</div>
            <div className="col-span-2">Offer Deadline</div>
            <div className="col-span-2">Current Status</div>
            <div className="col-span-2">Actions</div>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredApplications.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
            </div>
          ) : (
            filteredApplications.map((app) => {
              const urgency = isMounted ? getDeadlineUrgency(app.candidateInfo?.offerDeadline || null) : null;
              return (
                <div key={`${app.jobId}-${app.candidateInfo?.email || 'anonymous'}-${app.appliedAt}`} className="px-6 py-4 hover:bg-gray-50">
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
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {["Applied", "Under Review", "Interview", "Offer", "Hired", "Rejected"].map((status) => {
          const count = applications.filter(app => app.status === status).length;
          return (
            <div key={status} className="bg-white border rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{count}</div>
              <div className="text-sm text-gray-500">{status}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
