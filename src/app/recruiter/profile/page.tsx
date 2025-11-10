"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { RecruiterProfile, CompanySize } from "@/lib/types/database";

export default function RecruiterProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<RecruiterProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [phone, setPhone] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/auth/sign-in");
        return;
      }

      const response = await fetch(`/api/profile/recruiter?user_id=${user.id}`);
      
      if (!response.ok) {
        throw new Error("Failed to load profile");
      }

      const profileData = await response.json();
      setProfile(profileData);
      
      // Populate form fields
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setCompanyName(profileData.company_name || "");
      setJobTitle(profileData.job_title || "");
      setCompanySize(profileData.company_size || "");
      setPhone(profileData.phone || "");
      setLinkedinUrl(profileData.linkedin_url || "");
      setCompanyWebsite(profileData.company_website || "");
    } catch (err: any) {
      setError(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/profile/recruiter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          company_size: companySize || null,
          phone: phone.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          company_website: companyWebsite.trim() || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8">Loading profile...</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/recruiter")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Recruiter Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your recruiter account and company information
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Personal Information</h2>
          
          <div className="grid gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="linkedin" className="text-sm font-medium">
              LinkedIn Profile
            </label>
            <Input
              id="linkedin"
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4 pt-4 border-t">
          <h2 className="text-lg font-medium">Company Information</h2>
          
          <div className="grid gap-2">
            <label htmlFor="company_name" className="text-sm font-medium">
              Company Name *
            </label>
            <Input
              id="company_name"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="job_title" className="text-sm font-medium">
              Your Job Title *
            </label>
            <Input
              id="job_title"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Senior Recruiter"
              required
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="company_size" className="text-sm font-medium">
              Company Size
            </label>
            <Select value={companySize} onValueChange={(val) => setCompanySize(val as CompanySize)}>
              <SelectTrigger id="company_size">
                <SelectValue placeholder="Select company size..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startup">Startup (1-10 employees)</SelectItem>
                <SelectItem value="small">Small (11-50 employees)</SelectItem>
                <SelectItem value="medium">Medium (51-200 employees)</SelectItem>
                <SelectItem value="large">Large (201-1000 employees)</SelectItem>
                <SelectItem value="enterprise">Enterprise (1000+ employees)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="company_website" className="text-sm font-medium">
              Company Website
            </label>
            <Input
              id="company_website"
              type="url"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
              placeholder="https://company.com"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-600">Profile updated successfully!</p>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/recruiter")}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
