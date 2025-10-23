"use client";

import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

type ApplicationWithJob = Application & {
  job: Job;
};

export default function RecruiterPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          fetch("/api/applications", { cache: "no-store" }),
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
    
    return filtered.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [applications, searchQuery, statusFilter]);

  const updateStatus = async (jobId: string, newStatus: Application["status"]) => {
    setUpdating(jobId);
    try {
      const response = await fetch(`/api/applications/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        setApplications(prev => 
          prev.map(app => 
            app.jobId === jobId ? { ...app, status: newStatus } : app
          )
        );
      } else {
        console.error("Failed to update status");
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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Company Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Manage job applications and track candidate progress through your hiring pipeline.
        </p>
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
            <div className="col-span-3">Job Title</div>
            <div className="col-span-2">Company</div>
            <div className="col-span-2">Applied Date</div>
            <div className="col-span-2">Current Status</div>
            <div className="col-span-3">Actions</div>
          </div>
        </div>
        
        <div className="divide-y">
          {filteredApplications.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              {applications.length === 0 ? "No applications yet." : "No applications match your filters."}
            </div>
          ) : (
            filteredApplications.map((app) => (
              <div key={app.jobId} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-3">
                    <div className="font-medium">{app.job.title}</div>
                    <div className="text-sm text-gray-500">{app.job.location}</div>
                  </div>
                  <div className="col-span-2 text-sm">{app.job.company}</div>
                  <div className="col-span-2 text-sm">
                    {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                  <div className="col-span-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={app.status}
                      onValueChange={(value) => updateStatus(app.jobId, value as Application["status"])}
                      disabled={updating === app.jobId}
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
            ))
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
