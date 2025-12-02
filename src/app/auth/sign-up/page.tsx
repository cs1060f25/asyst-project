"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthCallbackUrl } from "@/lib/url";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
  name: z.string().min(2, "Name must be at least 2 characters"),
}).refine((val: any) => val.password === val.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

function SignUpInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password, confirm, name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }

    setLoading(true);
    try {
      // 1. Sign up the user with Supabase Auth
      const redirectTo = getAuthCallbackUrl();
      // Derive first/last from full name input
      const trimmedName = name.trim();
      const [first_name, ...rest] = trimmedName.split(/\s+/);
      const last_name = rest.join(" ");

      const { data: authData, error: authError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          ...(redirectTo ? { emailRedirectTo: redirectTo } : {}),
          data: {
            full_name: trimmedName,
            first_name: first_name || trimmedName,
            last_name: last_name || "",
          },
        },
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
      
      if (!authData.user) {
        throw new Error("Failed to create user account");
      }
      
      // Check if this is a new account that needs email confirmation
      if (authData.user && !authData.session) {
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

      // 2. Create candidate profile directly with client-side Supabase
      const { data: profileData, error: profileError } = await supabase
        .from('candidate_profiles')
        .insert({
          user_id: authData.user.id,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: null,
          education: null,
          resume_url: null,
          skills: [],
          experience: [],
          certifications: [],
          linkedin_url: null,
          github_url: null,
          portfolio_url: null,
          offer_deadline: null,
        })
        .select()
        .single();

      if (profileError) {
        console.error("Profile creation error:", profileError);
        throw new Error(profileError.message || "Failed to create candidate profile");
      }

      // 3. Redirect to candidate dashboard or specified redirect
      const redirect = searchParams.get("redirect");
      router.push(redirect && redirect.startsWith("/") ? redirect : "/candidate");
    } catch (err: any) {
      setError(err.message || "Sign-up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm w-full space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">Sign up with your email and password.</p>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Full Name</label>
          <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <div className="text-sm space-y-2">
        <p>
          Didn't receive a confirmation email?
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={!email || loading}
          onClick={async () => {
            setLoading(true);
            setError(null);
            try {
              const { error: resendError } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: getAuthCallbackUrl() } });
              if (resendError) throw resendError;
              setError("Confirmation email sent. Please check your inbox (and spam folder).");
            } catch (err: any) {
              setError(err.message || "Failed to resend confirmation email");
            } finally {
              setLoading(false);
            }
          }}
        >
          Resend confirmation email
        </Button>
      </div>
      <p className="text-sm">
        Already have an account? <Link className="underline" href="/auth/sign-in">Sign in</Link>
      </p>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="max-w-sm w-full space-y-6"><h1 className="text-2xl font-semibold tracking-tight">Create account</h1></div>}>
      <SignUpInner />
    </Suspense>
  );
}
