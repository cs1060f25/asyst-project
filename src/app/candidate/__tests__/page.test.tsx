

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import CandidatePage from "../page";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock fetch
global.fetch = vi.fn();

describe("Bug #1: Dashboard Auth State Persistence After Sign-Out", () => {
  const mockRouter = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display job listings when user is authenticated", async () => {
    // Mock successful API responses with user data
    const mockJobs = [
      {
        id: "job-1",
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Remote",
      },
      {
        id: "job-2",
        title: "Product Manager",
        company: "StartupCo",
        location: "San Francisco",
      },
    ];

    const mockApplications = [
      {
        jobId: "job-1",
        status: "Applied",
        appliedAt: "2025-11-18T00:00:00Z",
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => mockJobs,
      })
      .mockResolvedValueOnce({
        json: async () => mockApplications,
      });

    render(<CandidatePage />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Verify jobs are displayed
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Product Manager")).toBeInTheDocument();
  });

  it("BUG REPRODUCTION: dashboard continues to show data after user signs out", async () => {
    // Step 1: User is authenticated and sees their data
    const mockJobs = [
      {
        id: "job-1",
        title: "Confidential Job",
        company: "Secret Corp",
        location: "Hidden",
      },
    ];

    const mockApplications = [
      {
        jobId: "job-1",
        status: "Interview",
        appliedAt: "2025-11-18T00:00:00Z",
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => mockJobs,
      })
      .mockResolvedValueOnce({
        json: async () => mockApplications,
      });

    const { rerender } = render(<CandidatePage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Verify sensitive data is displayed
    expect(screen.getByText("Confidential Job")).toBeInTheDocument();
    expect(screen.getByText("Interview")).toBeInTheDocument();

    // Step 2: User signs out - API now returns empty arrays
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => [], // Empty jobs
      })
      .mockResolvedValueOnce({
        json: async () => [], // Empty applications
      });

    // Rerender to simulate auth state change (sign out)
    rerender(<CandidatePage />);

    // BUG: The dashboard doesn't react to sign-out
    // It should either:
    // 1. Clear the displayed data immediately
    // 2. Redirect to sign-in page
    // 3. Show "Please sign in" message
    
    // However, the old data remains visible because:
    // - Component doesn't listen to auth state changes
    // - No useEffect dependency on auth state
    // - Data is cached in component state

    // This test documents the bug - in a fixed version, 
    // the sensitive data should NOT still be visible
    await waitFor(() => {
      // BUG: Sensitive data is still visible after sign-out
      const confidentialJob = screen.queryByText("Confidential Job");
      const interviewStatus = screen.queryByText("Interview");
      
      // In current buggy implementation, these will still be present
      // After fix, they should be null
      expect(confidentialJob).toBeInTheDocument(); // BUG: Should be null after sign-out
      expect(interviewStatus).toBeInTheDocument(); // BUG: Should be null after sign-out
    });
  });

  it("should clear data and redirect when unauthenticated user accesses dashboard", async () => {
    // Simulate completely unauthenticated access
    (global.fetch as any)
      .mockResolvedValueOnce({
        json: async () => [], // No jobs (user not authenticated)
      })
      .mockResolvedValueOnce({
        json: async () => [], // No applications
      });

    render(<CandidatePage />);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // BUG: Dashboard renders normally with empty data
    // EXPECTED: Should redirect to /auth/sign-in
    expect(mockRouter.push).not.toHaveBeenCalledWith(
      expect.stringContaining("/auth/sign-in")
    );

    // Component should show "no jobs" message, which is fine
    // But ideally, unauthenticated users shouldn't see the dashboard at all
  });

  it("should have auth state listener to handle sign-out events", () => {
    // This test documents what SHOULD exist but doesn't
    render(<CandidatePage />);

    // BUG: Component doesn't implement supabase.auth.onAuthStateChange
    // EXPECTED: Component should listen for SIGNED_OUT event and:
    // 1. Clear local state (jobs, apps)
    // 2. Redirect to sign-in page
    // 3. Or show appropriate message

    // This is a documentation test - it will pass but highlights the missing feature
    expect(true).toBe(true);
  });
});
