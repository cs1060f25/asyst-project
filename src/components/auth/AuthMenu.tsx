"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";

export default function AuthMenu() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setEmail(data.session?.user?.email ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  if (loading) return null;

  if (!email) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link href="/auth/sign-in" className="hover:underline">Sign in</Link>
        <Link href="/auth/sign-up" className="hover:underline">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-muted-foreground hidden sm:inline">{email}</span>
      <Button size="sm" variant="secondary" onClick={signOut}>Sign out</Button>
    </div>
  );
}
