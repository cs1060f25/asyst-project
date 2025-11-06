"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/profile", { cache: "no-store" });
        const data = (await res.json()) as Profile;
        if (mounted) {
          setProfile(data);
        }
      } catch (_error) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save profile";
      setError(message);
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
    } catch (error) {
      let msg = "Upload failed";
      if (error instanceof Error) {
        msg = error.message;
      }
      
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete resume";
      setUploadError(message);
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
