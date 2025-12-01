import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/storage";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let ctaHref = "/auth/role-selection";
  if (user?.id) {
    const role = await getUserRole(user.id);
    if (role === "candidate") ctaHref = "/candidate";
    else if (role === "recruiter") ctaHref = "/recruiter";
  }

  return (
    <div className="font-sans min-h-[60vh] flex items-center">
      <main className="w-full">
        <section className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Centralized job applications, simplified.</h1>
          <p className="mt-3 text-muted-foreground">
            Discover roles, apply in one click, and track your progress. Recruiters can post jobs and manage applicants in one place.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <a
              href={ctaHref}
              className="inline-flex items-center justify-center rounded-md bg-foreground text-background h-10 px-5 text-sm font-medium hover:opacity-90"
            >
              Get Started
            </a>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-md border p-4">
            <h2 className="font-medium">For Candidates</h2>
            <p className="mt-1 text-sm text-muted-foreground">Search open roles and apply instantly with a unified application.</p>
          </div>
          <div className="rounded-md border p-4">
            <h2 className="font-medium">For Recruiters</h2>
            <p className="mt-1 text-sm text-muted-foreground">Create job posts and review applicants from one dashboard.</p>
          </div>
          <div className="rounded-md border p-4">
            <h2 className="font-medium">Track Progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">Stay updated on application status from application to offer.</p>
          </div>
        </section>
      </main>
    </div>
  );
}

