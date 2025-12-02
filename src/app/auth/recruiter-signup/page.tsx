"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";
import type { CompanySize } from "@/lib/types/database";
import { getAuthCallbackUrl } from "@/lib/url";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  companyName: z.string().min(2, "Company name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  companySize: z.enum(["startup", "small", "medium", "large", "enterprise"]).optional(),
}).refine((val) => val.password === val.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

function RecruiterSignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    
    const parsed = schema.safeParse({ 
      email, 
      password, 
      confirm, 
      name, 
      companyName, 
      jobTitle,
      companySize: companySize || undefined
    });
    
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

 
    
    setLoading(true);
    
    try {
      // 1. Sign up the user with Supabase Auth
      const trimmedName = name.trim();
      const [first_name, ...rest] = trimmedName.split(/\s+/);
      const last_name = rest.join(" ");
      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: getAuthCallbackUrl(),
          data: {
            full_name: trimmedName,
            first_name: first_name || trimmedName,
            last_name: last_name || "",
          },
        }
      });
      
      if (authError) {
        // Handle duplicate email with user-friendly message
        if (authError.message.includes("already registered") || 
            authError.message.includes("already been registered") ||
            authError.message.includes("User already registered")) {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        throw authError;
      }
      
      // Supabase behavior: 
      // - New user + email confirmation OFF: authData.user exists, authData.session exists
      // - New user + email confirmation ON: authData.user exists, authData.session is null
      // - Existing user: Usually returns user but no session, or an error
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // Check if this is a new account that needs email confirmation
      if (authData.user && !authData.session) {
        // This could be either:
        // 1. New account created, needs email confirmation
        // 2. Existing account, Supabase returned user but no session
        
        // Check if user was just created (created_at is very recent)
        const userCreatedAt = new Date(authData.user.created_at);
        const now = new Date();
        const timeDiff = now.getTime() - userCreatedAt.getTime();
        const isNewUser = timeDiff < 5000; // Less than 5 seconds ago
        
        if (isNewUser) {
          setError("Account created successfully! Please check your email to confirm your account, then sign in.");
        } else {
          setError("An account with this email already exists. Please sign in instead.");
        }
        return;
      }
      

      // 2. Create recruiter profile directly with client-side Supabase
      // This bypasses the server-side session issue
      const { data: profileData, error: profileError } = await supabase
        .from('recruiter_profiles')
        .insert({
          user_id: authData.user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          company_name: companyName.trim(),
          job_title: jobTitle.trim(),
          company_size: companySize || null,
          phone: null,
          linkedin_url: null,
          company_website: null,
        })
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", profileError);
        console.error("User ID attempted:", authData.user.id);
        console.error("Error details:", JSON.stringify(profileError, null, 2));
        throw new Error(`Failed to create recruiter profile: ${profileError.message}`);
      }

      // 3. Redirect to recruiter dashboard or specified redirect
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/recruiter");
    } catch (err: any) {
      setError(err.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Recruiter Account</h1>
        <p className="text-sm text-muted-foreground">
          Sign up to start posting jobs and hiring candidates
        </p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">Personal Information</h3>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Full Name *</label>
            <Input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="John Smith" 
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Email *</label>
            <Input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="john@company.com" 
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Password *</label>
            <Input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Confirm Password *</label>
            <Input 
              type="password" 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              placeholder="••••••••" 
              required
            />
          </div>
        </div>

        {/* Company Information */}
        <div className="space-y-4 pt-4 border-t">
          <h3 className="text-sm font-medium text-muted-foreground">Company Information</h3>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Company Name *</label>
            <Input 
              type="text" 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              placeholder="Acme Corp" 
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Job Title *</label>
            <Input 
              type="text" 
              value={jobTitle} 
              onChange={(e) => setJobTitle(e.target.value)} 
              placeholder="Senior Recruiter" 
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Company Size</label>
            <Select value={companySize} onValueChange={(val) => setCompanySize(val as CompanySize)}>
              <SelectTrigger>
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
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating Account..." : "Create Recruiter Account"}
        </Button>
      </form>

      <p className="text-sm text-center">
        Already have an account?{" "}
        <Link className="underline text-blue-600 hover:text-blue-700" href="/auth/sign-in">
          Sign in
        </Link>
      </p>

      <p className="text-sm text-center text-muted-foreground">
        Looking for a job instead?{" "}
        <Link className="underline text-blue-600 hover:text-blue-700" href="/auth/sign-up">
          Sign up as a candidate
        </Link>
      </p>
    </div>
  );
}

export default function RecruiterSignUpPage() {
  return (
    <Suspense fallback={<div className="max-w-md w-full space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Create Recruiter Account</h1></div>}>
      <RecruiterSignUpInner />
    </Suspense>
  );
}
