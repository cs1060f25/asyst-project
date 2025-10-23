# HW7 Submission Checklist

## ✅ Completed
- [x] Read Git documentation
- [x] Implement Feature 1: ASYST-15 Company Dashboard UI (commit: 30b145f)
- [x] Implement Feature 2: ASYST-19 Offer Deadline Field (commits: a78bed7, dcbb59c)
- [x] Create 20 passing unit tests
- [x] Bug Fix 1: Deadline validation (commit: 646784e)
- [x] Bug Fix 2: Candidate status types (commit: 5ded37b)
- [x] Git workflow: branches, rebase, merge

## ❌ TODO Before Submission

### 1. Create Linear Issues (CRITICAL)
- [ ] Create ASYST-15 feature issue in Linear
  - Add background and description
  - Add test plan
  - Add AI prompts used in Notes section
- [ ] Create ASYST-19 feature issue in Linear
  - Add background and description
  - Add test plan
  - Add AI prompts used in Notes section
- [ ] Create Bug Issue #1 (deadline validation)
  - Description: "System allowed setting past dates for offer deadlines"
  - Link to fix commit
- [ ] Create Bug Issue #2 (candidate status types)
  - Description: "Candidate dashboard only supported 2 status types, missing 4 others"
  - Link to fix commit

### 2. Take Screenshots
Run: `npm run dev` and capture:
- [ ] Company dashboard at /recruiter showing:
  - Applications table with candidate info
  - Offer deadline urgency indicators
  - Status update dropdowns
  - Summary statistics
- [ ] Profile page at /profile showing:
  - Offer deadline date input field
  - Form working correctly
- [ ] Candidate dashboard at /candidate showing:
  - Color-coded status badges
  - All 6 status types displaying correctly
- [ ] Upload all screenshots to respective Linear issues

### 3. Update Architecture Diagram
- [ ] Add ASYST-15 label/note to Company Dashboard component
- [ ] Add ASYST-19 label/note to Profile/Deadline interaction
- [ ] Save updated diagram

### 4. Push to GitHub
```bash
cd /Users/b-lin/Downloads/Asyst-project
git push origin main
```

### 5. Get GitHub Commit URLs
After pushing, go to your GitHub repo and get full URLs:
- [ ] Feature 1: https://github.com/[your-org]/Asyst-project/commit/30b145f...
- [ ] Feature 2: https://github.com/[your-org]/Asyst-project/commit/dcbb59c...
- [ ] Bug Fix 1: https://github.com/[your-org]/Asyst-project/commit/646784e...
- [ ] Bug Fix 2: https://github.com/[your-org]/Asyst-project/commit/5ded37b...

### 6. Prepare 7-Line Submission
Format:
```
Line 1: [URL of Project Index]
Line 2: [URL of Architecture Diagram]
Line 3: [URL of Linear Project]
Line 4: [GitHub URL of first feature commit - 30b145f]
Line 5: [GitHub URL of second feature commit - dcbb59c]
Line 6: [GitHub URL of first bug commit - 646784e]
Line 7: [GitHub URL of second bug commit - 5ded37b]
```

## AI Prompts to Document in Linear

### ASYST-15 Prompts:
1. "Implement comprehensive company dashboard UI with application management"
2. "Add search and filter functionality for applications"
3. "Create status update functionality with API endpoint"
4. "Add Radix UI Select component for status updates"

### ASYST-19 Prompts:
1. "Add offer deadline field to candidate profiles"
2. "Create API endpoint for applications with candidate information"
3. "Enhance recruiter dashboard to show deadline urgency"
4. "Implement smart sorting by deadline priority"
5. "Add color-coded urgency indicators"

### Bug Fix Prompts:
1. "Add validation to prevent past dates for offer deadlines"
2. "Update candidate dashboard to support all application status types"
