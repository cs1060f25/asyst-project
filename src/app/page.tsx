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
    <div className="font-sans">
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative py-20 sm:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-purple-50 -z-10 rounded-3xl" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                Centralized job applications,{" "}
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  simplified
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Discover roles, apply in one click, and track your progress. Recruiters can post jobs and manage applicants in one unified platform.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href={ctaHref}
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white h-12 px-8 text-base font-semibold hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Get Started →
              </a>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-lg bg-white text-gray-700 h-12 px-8 text-base font-medium border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
              >
                Learn More
              </a>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mt-16 sm:mt-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12 text-gray-900">
            Everything you need to streamline hiring
          </h2>
          
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {/* Candidate Card */}
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-4 left-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">For Candidates</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Search open roles and apply instantly with a unified application. Track all your opportunities in one place.
                </p>
              </div>
            </div>

            {/* Recruiter Card */}
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -top-4 left-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">For Recruiters</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Create job posts and review applicants from one dashboard. Streamline your hiring pipeline effortlessly.
                </p>
              </div>
            </div>

            {/* Progress Card */}
            <div className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="absolute -top-4 left-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">Track Progress</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Stay updated on application status from application to offer. Never miss an important update again.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

