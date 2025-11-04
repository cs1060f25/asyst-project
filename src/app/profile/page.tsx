"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type ResumeInfo = {
  url: string;
  originalName: string;
  size: number;
  mimeType: string;
  updatedAt: string;
};

type Profile = {
  name: string;
  email: string;
  education: string;
  resume: ResumeInfo | null;
  offerDeadline: string | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    education: "",
    resume: null,
    offerDeadline: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Enhanced candidate profile (Supabase-backed)
  const [candidate, setCandidate] = useState<any>({
    name: "",
    email: "",
    phone: "",
    education: "",
    resume_url: "",
    skills: [] as string[],
    experience: [] as any[],
    certifications: [] as any[],
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    offer_deadline: null as string | null,
    location: "",
    school: "",
    degree_level: "",
    graduation_date: "",
    gpa: undefined as number | undefined,
    years_experience: undefined as number | undefined,
    work_authorization: "",
    requires_sponsorship: null as boolean | null,
    open_to_relocation: null as boolean | null,
    employment_types: [] as string[],
    pronouns: "",
    languages: [] as string[],
    frameworks: [] as string[],
    timezone: "",
    website_url: "",
    twitter_url: "",
    mastodon_url: "",
    dribbble_url: "",
    leetcode_url: "",
    codeforces_url: "",
    hackerrank_url: "",
    referral_source: "",
    eeo_gender: "",
    eeo_race_ethnicity: "",
    eeo_veteran_status: "",
    eeo_disability_status: "",
    eeo_prefer_not_to_say: null as boolean | null,
  });
  const [candidateError, setCandidateError] = useState<string | null>(null);
  const [candidateSaving, setCandidateSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = (await res.json()) as Profile;
        if (mounted) {
          setProfile(data);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Load enhanced candidate profile if authenticated
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/candidate-profile", { cache: "no-store" });
        if (!res.ok) return; // likely 401 when not authed
        const data = await res.json();
        if (mounted && data) {
          setCandidate((prev: any) => ({ ...prev, ...data }));
        }
      } catch {
        // ignore
      }
    })();
    return () => { mounted = false };
  }, []);

  function parseCommaList(v: string): string[] {
    return v.split(",").map(s => s.trim()).filter(Boolean);
  }

  async function saveCandidateProfile() {
    setCandidateSaving(true);
    setCandidateError(null);
    try {
      const res = await fetch("/api/candidate-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(candidate),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to save candidate profile");
      setCandidate((prev: any) => ({ ...prev, ...data }));
    } catch (e: any) {
      setCandidateError(e?.message || "Failed to save candidate profile");
    } finally {
      setCandidateSaving(false);
    }
  }

  const canSave = useMemo(() => {
    return (
      profile.name.trim().length > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)
    );
  }, [profile.name, profile.email]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          education: profile.education,
          offerDeadline: profile.offerDeadline,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save profile");
      }
      const data = (await res.json()) as Profile;
      setProfile(data);
    } catch (e: any) {
      setError(e.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(file: File) {
    setUploadError(null);
    if (!ALLOWED_TYPES.has(file.type)) {
      setUploadError("Invalid file type. Allowed: PDF, DOC, DOCX");
      return;
    }
    if (file.size > MAX_BYTES) {
      setUploadError("File too large. Max 5MB");
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body: form });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to upload resume");
      }
      const data = (await res.json()) as Profile;
      setProfile(data);
    } catch (e: any) {
      const msg = String(e?.message || "Upload failed");
      if (msg.includes("INVALID_FILE_TYPE")) {
        setUploadError("Invalid file type. Allowed: PDF, DOC, DOCX");
      } else if (msg.includes("FILE_TOO_LARGE")) {
        setUploadError("File too large. Max 5MB");
      } else {
        setUploadError("Failed to upload resume");
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    setUploading(true);
    setUploadError(null);
    try {
      const res = await fetch("/api/resume", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to delete resume");
      }
      const data = (await res.json()) as Profile;
      setProfile(data);
    } catch (e: any) {
      setUploadError(e.message || "Failed to delete resume");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Manage your personal information and resume.
        </p>
      </div>

      <section className="space-y-4">
        <div className="grid gap-2">
          <label className="text-sm font-medium">Name</label>
          <Input
            value={profile.name}
            placeholder="Jane Doe"
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={profile.email}
            placeholder="jane@example.com"
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Education</label>
          <Input
            value={profile.education}
            placeholder="B.S. in Computer Science, Stanford University"
            onChange={(e) => setProfile((p) => ({ ...p, education: e.target.value }))}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Offer Deadline</label>
          <Input
            type="date"
            value={profile.offerDeadline ? profile.offerDeadline.split('T')[0] : ""}
            min={new Date().toISOString().split('T')[0]} // Prevent selecting past dates
            onChange={(e) => {
              const dateValue = e.target.value;
              setProfile((p) => ({ 
                ...p, 
                offerDeadline: dateValue ? new Date(dateValue).toISOString() : null 
              }));
            }}
          />
          <p className="text-xs text-muted-foreground">
            Set a deadline for competing offers to help recruiters prioritize your applications.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Candidate Profile (Enhanced)</h2>
        <p className="text-sm text-muted-foreground">Common SWE fields and optional voluntary disclosures. These save to your Supabase-backed profile.</p>

        {/* Links */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">GitHub URL</label>
          <Input value={candidate.github_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, github_url: e.target.value }))} placeholder="https://github.com/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">LinkedIn URL</label>
          <Input value={candidate.linkedin_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://www.linkedin.com/in/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Portfolio URL</label>
          <Input value={candidate.portfolio_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, portfolio_url: e.target.value }))} placeholder="https://your-portfolio.com" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Website URL</label>
          <Input value={candidate.website_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, website_url: e.target.value }))} placeholder="https://your-site.com" />
        </div>

        {/* Education & basics */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">School</label>
          <Select
            value={(candidate.school && [
              "Stanford University","MIT","UC Berkeley","Harvard University","Carnegie Mellon University","UIUC","Georgia Tech"
            ].includes(candidate.school)) ? candidate.school : (candidate.school ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, school: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select school" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stanford University">Stanford University</SelectItem>
              <SelectItem value="MIT">MIT</SelectItem>
              <SelectItem value="UC Berkeley">UC Berkeley</SelectItem>
              <SelectItem value="Harvard University">Harvard University</SelectItem>
              <SelectItem value="Carnegie Mellon University">Carnegie Mellon University</SelectItem>
              <SelectItem value="UIUC">UIUC</SelectItem>
              <SelectItem value="Georgia Tech">Georgia Tech</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.school && ![
            "Stanford University","MIT","UC Berkeley","Harvard University","Carnegie Mellon University","UIUC","Georgia Tech"
          ].includes(candidate.school)) && (
            <Input value={candidate.school || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, school: e.target.value }))} placeholder="Enter school" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Degree Level</label>
          <Select
            value={(candidate.degree_level && ["High School","Associate","Bachelor's","Master's","PhD","Bootcamp"].includes(candidate.degree_level)) ? candidate.degree_level : (candidate.degree_level ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return; // show text input below
              setCandidate((p: any) => ({ ...p, degree_level: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select degree level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High School">High School</SelectItem>
              <SelectItem value="Associate">Associate</SelectItem>
              <SelectItem value="Bachelor's">Bachelor's</SelectItem>
              <SelectItem value="Master's">Master's</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
              <SelectItem value="Bootcamp">Bootcamp</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.degree_level && !["High School","Associate","Bachelor's","Master's","PhD","Bootcamp"].includes(candidate.degree_level)) && (
            <Input value={candidate.degree_level || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, degree_level: e.target.value }))} placeholder="Enter degree level" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Graduation Date</label>
          <Input type="month" value={candidate.graduation_date || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, graduation_date: e.target.value }))} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">GPA (0.0 - 4.0)</label>
            <Input type="number" step="0.01" min={0} max={4} value={candidate.gpa ?? ""} onChange={(e) => setCandidate((p: any) => ({ ...p, gpa: e.target.value === "" ? undefined : Number(e.target.value) }))} />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium">Years of Experience</label>
            <Input type="number" min={0} value={candidate.years_experience ?? ""} onChange={(e) => setCandidate((p: any) => ({ ...p, years_experience: e.target.value === "" ? undefined : Number(e.target.value) }))} />
          </div>
        </div>

        {/* Work auth & preferences */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Work Authorization</label>
          <Select
            value={(candidate.work_authorization && [
              "US Citizen","US Permanent Resident","H1B","F1 OPT","F1 CPT","TN"
            ].includes(candidate.work_authorization)) ? candidate.work_authorization : (candidate.work_authorization ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, work_authorization: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select work authorization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="US Citizen">US Citizen</SelectItem>
              <SelectItem value="US Permanent Resident">US Permanent Resident</SelectItem>
              <SelectItem value="H1B">H1B</SelectItem>
              <SelectItem value="F1 OPT">F1 OPT</SelectItem>
              <SelectItem value="F1 CPT">F1 CPT</SelectItem>
              <SelectItem value="TN">TN</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.work_authorization && ![
            "US Citizen","US Permanent Resident","H1B","F1 OPT","F1 CPT","TN"
          ].includes(candidate.work_authorization)) && (
            <Input value={candidate.work_authorization || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, work_authorization: e.target.value }))} placeholder="Enter work authorization" />
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!candidate.requires_sponsorship} onChange={(e) => setCandidate((p: any) => ({ ...p, requires_sponsorship: e.target.checked }))} />
            Requires Sponsorship
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!candidate.open_to_relocation} onChange={(e) => setCandidate((p: any) => ({ ...p, open_to_relocation: e.target.checked }))} />
            Open to Relocation
          </label>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Employment Types (comma-separated)</label>
          <Input value={(candidate.employment_types || []).join(", ")} onChange={(e) => setCandidate((p: any) => ({ ...p, employment_types: parseCommaList(e.target.value) }))} placeholder="internship, full_time, part_time, contract" />
        </div>

        {/* Skills/Tech stacks */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Languages (comma-separated)</label>
          <Input value={(candidate.languages || []).join(", ")} onChange={(e) => setCandidate((p: any) => ({ ...p, languages: parseCommaList(e.target.value) }))} placeholder="TypeScript, Python, Go" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Frameworks (comma-separated)</label>
          <Input value={(candidate.frameworks || []).join(", ")} onChange={(e) => setCandidate((p: any) => ({ ...p, frameworks: parseCommaList(e.target.value) }))} placeholder="React, Next.js, Django" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Timezone</label>
          <Input value={candidate.timezone || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, timezone: e.target.value }))} placeholder="e.g., PST, EST, UTC+2" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Pronouns</label>
          <Select
            value={(candidate.pronouns && ["she/her","he/him","they/them","she/they","he/they"].includes(candidate.pronouns)) ? candidate.pronouns : (candidate.pronouns ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, pronouns: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pronouns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="she/her">she/her</SelectItem>
              <SelectItem value="he/him">he/him</SelectItem>
              <SelectItem value="they/them">they/them</SelectItem>
              <SelectItem value="she/they">she/they</SelectItem>
              <SelectItem value="he/they">he/they</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.pronouns && !["she/her","he/him","they/them","she/they","he/they"].includes(candidate.pronouns)) && (
            <Input value={candidate.pronouns || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, pronouns: e.target.value }))} placeholder="Enter pronouns" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Referral Source</label>
          <Input value={candidate.referral_source || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, referral_source: e.target.value }))} placeholder="Where did you hear about us?" />
        </div>

        {/* Additional profiles */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Twitter URL</label>
          <Input value={candidate.twitter_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, twitter_url: e.target.value }))} placeholder="https://twitter.com/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Mastodon URL</label>
          <Input value={candidate.mastodon_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, mastodon_url: e.target.value }))} placeholder="https://mastodon.social/@username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Dribbble URL</label>
          <Input value={candidate.dribbble_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, dribbble_url: e.target.value }))} placeholder="https://dribbble.com/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">LeetCode URL</label>
          <Input value={candidate.leetcode_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, leetcode_url: e.target.value }))} placeholder="https://leetcode.com/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Codeforces URL</label>
          <Input value={candidate.codeforces_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, codeforces_url: e.target.value }))} placeholder="https://codeforces.com/profile/username" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">HackerRank URL</label>
          <Input value={candidate.hackerrank_url || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, hackerrank_url: e.target.value }))} placeholder="https://www.hackerrank.com/profile/username" />
        </div>

        {/* Voluntary EEO disclosures (optional) */}
        <div className="grid gap-2">
          <label className="text-sm font-medium">Gender (optional)</label>
          <Select
            value={(() => {
              if (candidate.eeo_prefer_not_to_say) return "__pnts__";
              const options = ["Woman","Man","Non-binary"];
              if (!candidate.eeo_gender) return "";
              return options.includes(candidate.eeo_gender) ? candidate.eeo_gender : "__other__";
            })()}
            onValueChange={(v) => {
              if (v === "__pnts__") {
                setCandidate((p: any) => ({ ...p, eeo_prefer_not_to_say: true, eeo_gender: "" }));
              } else if (v === "__other__") {
                setCandidate((p: any) => ({ ...p, eeo_prefer_not_to_say: false }));
              } else {
                setCandidate((p: any) => ({ ...p, eeo_gender: v, eeo_prefer_not_to_say: false }));
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Woman">Woman</SelectItem>
              <SelectItem value="Man">Man</SelectItem>
              <SelectItem value="Non-binary">Non-binary</SelectItem>
              <SelectItem value="__other__">Self-describe</SelectItem>
              <SelectItem value="__pnts__">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
          {(!candidate.eeo_prefer_not_to_say && candidate.eeo_gender && !["Woman","Man","Non-binary"].includes(candidate.eeo_gender)) && (
            <Input value={candidate.eeo_gender || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, eeo_gender: e.target.value }))} placeholder="Self-describe" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Race/Ethnicity (optional)</label>
          <Select
            value={(candidate.eeo_race_ethnicity && [
              "American Indian or Alaska Native",
              "Asian",
              "Black or African American",
              "Hispanic or Latino",
              "Native Hawaiian or Other Pacific Islander",
              "White",
              "Two or More Races"
            ].includes(candidate.eeo_race_ethnicity)) ? candidate.eeo_race_ethnicity : (candidate.eeo_race_ethnicity ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, eeo_race_ethnicity: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select race/ethnicity (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="American Indian or Alaska Native">American Indian or Alaska Native</SelectItem>
              <SelectItem value="Asian">Asian</SelectItem>
              <SelectItem value="Black or African American">Black or African American</SelectItem>
              <SelectItem value="Hispanic or Latino">Hispanic or Latino</SelectItem>
              <SelectItem value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</SelectItem>
              <SelectItem value="White">White</SelectItem>
              <SelectItem value="Two or More Races">Two or More Races</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.eeo_race_ethnicity && ![
            "American Indian or Alaska Native","Asian","Black or African American","Hispanic or Latino","Native Hawaiian or Other Pacific Islander","White","Two or More Races"
          ].includes(candidate.eeo_race_ethnicity)) && (
            <Input value={candidate.eeo_race_ethnicity || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, eeo_race_ethnicity: e.target.value }))} placeholder="Self-identify" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Veteran Status (optional)</label>
          <Select
            value={(candidate.eeo_veteran_status && ["Not a veteran","Veteran","Protected Veteran"].includes(candidate.eeo_veteran_status)) ? candidate.eeo_veteran_status : (candidate.eeo_veteran_status ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, eeo_veteran_status: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select veteran status (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Not a veteran">Not a veteran</SelectItem>
              <SelectItem value="Veteran">Veteran</SelectItem>
              <SelectItem value="Protected Veteran">Protected Veteran</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.eeo_veteran_status && !["Not a veteran","Veteran","Protected Veteran"].includes(candidate.eeo_veteran_status)) && (
            <Input value={candidate.eeo_veteran_status || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, eeo_veteran_status: e.target.value }))} placeholder="Self-identify" />
          )}
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Disability Status (optional)</label>
          <Select
            value={(candidate.eeo_disability_status && ["Yes","No","Prefer not to say"].includes(candidate.eeo_disability_status)) ? candidate.eeo_disability_status : (candidate.eeo_disability_status ? "__other__" : "")}
            onValueChange={(v) => {
              if (v === "__other__") return;
              setCandidate((p: any) => ({ ...p, eeo_disability_status: v }))
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select disability status (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Yes">Yes</SelectItem>
              <SelectItem value="No">No</SelectItem>
              <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
              <SelectItem value="__other__">Other</SelectItem>
            </SelectContent>
          </Select>
          {(candidate.eeo_disability_status && !["Yes","No","Prefer not to say"].includes(candidate.eeo_disability_status)) && (
            <Input value={candidate.eeo_disability_status || ""} onChange={(e) => setCandidate((p: any) => ({ ...p, eeo_disability_status: e.target.value }))} placeholder="Self-identify" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={!!candidate.eeo_prefer_not_to_say} onChange={(e) => setCandidate((p: any) => ({ ...p, eeo_prefer_not_to_say: e.target.checked }))} />
          <span className="text-sm">Prefer not to say</span>
        </div>

        {candidateError && <p className="text-sm text-red-600">{candidateError}</p>}
        <div className="flex gap-2">
          <Button onClick={saveCandidateProfile} disabled={candidateSaving}>
            {candidateSaving ? "Saving..." : "Save Candidate Profile"}
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Resume</h2>
        {profile.resume ? (
          <div className="space-y-2">
            <div className="text-sm">
              <p>
                <span className="font-medium">Current:</span> {profile.resume.originalName}
              </p>
              <p className="text-muted-foreground">
                Updated {new Date(profile.resume.updatedAt).toLocaleString()}
              </p>
              <p>
                <a className="text-blue-600 underline" href={profile.resume.url} target="_blank" rel="noreferrer">
                  View file
                </a>
              </p>
            </div>
            <div className="flex gap-2">
              <label className="inline-flex items-center gap-2">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleUpload(f);
                    e.currentTarget.value = ""; // reset
                  }}
                  disabled={uploading}
                />
              </label>
              <Button variant="secondary" onClick={handleDelete} disabled={uploading}>
                {uploading ? "Working..." : "Delete"}
              </Button>
            </div>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                  e.currentTarget.value = "";
                }}
                disabled={uploading}
              />
            </label>
            {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
