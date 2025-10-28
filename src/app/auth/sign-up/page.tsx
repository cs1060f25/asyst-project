"use client";

import { useState } from "react";
import Link from "next/link";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirm: z.string(),
}).refine((val) => val.password === val.confirm, {
  path: ["confirm"],
  message: "Passwords do not match",
});

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = schema.safeParse({ email, password, confirm });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || "Invalid input");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      // If email confirmation is enabled, user must check inbox.
      router.push("/candidate");
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
          <label className="text-sm font-medium">Email</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Password</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium">Confirm Password</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p className="text-sm">
        Already have an account? <Link className="underline" href="/auth/sign-in">Sign in</Link>
      </p>
    </div>
  );
}
