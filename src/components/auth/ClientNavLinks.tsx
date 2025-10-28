"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ClientNavLinks() {
  const [ready, setReady] = useState(false);
  const [isAuthed, setAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setAuthed(!!data.session);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setAuthed(!!session);
    });
    return () => {
      sub.subscription.unsubscribe();
      mounted = false;
    };
  }, []);

  if (!ready) {
    // Render basic links while loading; middleware will still enforce protection.
    return (
      <>
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/candidate" className="hover:underline">Candidate</Link>
        <Link href="/recruiter" className="hover:underline">Recruiter</Link>
        <Link href="/profile" className="hover:underline">Profile</Link>
      </>
    );
  }

  if (isAuthed) {
    return (
      <>
        <Link href="/" className="hover:underline">Home</Link>
        <Link href="/candidate" className="hover:underline">Candidate</Link>
        <Link href="/recruiter" className="hover:underline">Recruiter</Link>
        <Link href="/profile" className="hover:underline">Profile</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/" className="hover:underline">Home</Link>
      <Link href={{ pathname: "/auth/sign-in", query: { redirect: "/candidate" } }} className="hover:underline">Candidate</Link>
      <Link href={{ pathname: "/auth/sign-in", query: { redirect: "/recruiter" } }} className="hover:underline">Recruiter</Link>
      <Link href={{ pathname: "/auth/sign-in", query: { redirect: "/profile" } }} className="hover:underline">Profile</Link>
    </>
  );
}
