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
      <div className="flex items-center gap-3">
        <Link 
          href="/auth/sign-in" 
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/auth/role-selection"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 h-9 text-sm font-medium hover:from-blue-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all duration-200"
        >
          Get Started
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 hidden sm:inline truncate max-w-[150px]" title={email}>
        {email}
      </span>
      <Button 
        size="sm" 
        variant="outline" 
        onClick={signOut}
        className="rounded-lg hover:bg-gray-50"
      >
        Sign out
      </Button>
    </div>
  );
}
