# Deployment Guide - Vercel

This guide covers deploying the Asyst project to Vercel and testing all features.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Project**: Ensure you have a Supabase project with:
   - Database migrations applied
   - Environment variables ready

## Step 1: Vercel Project Setup

1. **Connect GitHub Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository: `cs1060f25/Asyst-project`
   - Select the repository and click "Import"

2. **Configure Project Settings**
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)
   - **Node.js Version**: 20.x (recommended)

## Step 2: Environment Variables

Configure the following environment variables in Vercel:

1. Go to your project settings → **Environment Variables**
2. Add the following variables:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   **Where to find these values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → API
   - Copy the "Project URL" → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy the "anon public" key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Apply to all environments**: Production, Preview, and Development

## Step 3: Database Migrations

Ensure all database migrations are applied to your Supabase project:

1. **Connect to Supabase**:
   ```bash
   # Use Supabase CLI or SQL Editor in dashboard
   ```

2. **Apply migrations**:
   - `001_add_composite_index_applications.sql`
   - `002_add_composite_index_jobs.sql`
   - `003_create_candidate_profiles.sql`

3. **Verify tables exist**:
   - `jobs`
   - `applications`
   - `candidate_profiles`

## Step 4: Deploy

1. **Initial Deployment**:
   - After configuring environment variables, Vercel will automatically trigger a deployment
   - Monitor the build logs for any errors

2. **Build Process**:
   - Vercel will run `npm install`
   - Then run `npm run build`
   - Deploy the `.next` output

3. **Deployment URL**:
   - Once deployed, Vercel provides a production URL
   - Format: `https://your-project-name.vercel.app`

## Step 5: Post-Deployment Verification

### Check Build Success
- [ ] Build completes without errors
- [ ] No TypeScript compilation errors
- [ ] All environment variables are set correctly

### Test Basic Functionality
- [ ] Home page loads (`/`)
- [ ] No console errors in browser DevTools
- [ ] Navigation links work
- [ ] Responsive design works on mobile/tablet/desktop

## Step 6: Comprehensive Feature Testing

### A. Authentication Features
- [ ] **Sign-up Page** (`/auth/sign-up`)
  - Form loads correctly
  - Can create new account
  - Validation errors display correctly
  - Redirects after successful sign-up
  - Handles duplicate email errors

- [ ] **Sign-in Page** (`/auth/sign-in`)
  - Form loads correctly
  - Can sign in with valid credentials
  - Shows error for invalid credentials
  - Session persists after page refresh
  - Redirects to appropriate dashboard

### B. Profile Management (`/profile`)
- [ ] **Profile Page Loads**
  - Page renders without errors
  - Form fields populate with existing data (if any)

- [ ] **GET `/api/profile`**
  - Returns profile data correctly
  - Handles missing profile gracefully

- [ ] **PUT `/api/profile`**
  - Can update name
  - Can update email
  - Can update education
  - Validation errors display correctly
  - Success message appears after update

- [ ] **POST `/api/resume`**
  - Can upload PDF resume
  - Can upload DOC resume
  - Can upload DOCX resume
  - Rejects invalid file types
  - Rejects files > 5MB
  - Shows success message after upload

- [ ] **DELETE `/api/resume`**
  - Can delete resume
  - Confirms deletion

### C. Candidate Dashboard (`/candidate`)
- [ ] **Page Loads**
  - Requires authentication
  - Shows applications list
  - Application status badges display correctly
  - Can navigate to job details

### D. Recruiter Dashboard (`/recruiter`)
- [ ] **Page Loads**
  - Requires authentication
  - Shows applications table
  - Can filter/sort applications (if applicable)
  - Offer deadline indicators work
  - Can update application status

### E. Jobs Features
- [ ] **Job List** (`/api/jobs`)
  - Returns list of jobs
  - Handles empty state

- [ ] **Job Detail** (`/jobs/[id]`)
  - Page loads for valid job ID
  - Shows job information correctly
  - Handles invalid job ID with error

- [ ] **Apply to Job** (if applicable)
  - Apply button works
  - Creates application successfully
  - Shows confirmation

### F. API Routes Testing

**Applications API** (`/api/applications`)
- [ ] GET - Fetch all applications
- [ ] POST - Create new application
- [ ] PATCH `/api/applications/[jobId]` - Update application status

**Jobs API** (`/api/jobs`)
- [ ] GET - Fetch all jobs
- [ ] GET `/api/jobs/[id]` - Fetch single job

**Profile API** (`/api/profile`)
- [ ] GET - Fetch profile
- [ ] PUT - Update profile

**Resume API** (`/api/resume`)
- [ ] POST - Upload resume
- [ ] DELETE - Delete resume

### G. Database & Supabase Integration
- [ ] **Test Supabase Connection** (`/api/test-supabase`)
  - Connection successful
  - Returns expected response

- [ ] **Database Queries**
  - Can fetch candidate profiles
  - Can create candidate profiles
  - Can update candidate profiles
  - RLS policies work correctly

### H. Responsive Design
- [ ] **Mobile** (320px - 768px)
  - All pages render correctly
  - Navigation works
  - Forms are usable
  - No horizontal scrolling

- [ ] **Tablet** (768px - 1024px)
  - Layout adapts correctly

- [ ] **Desktop** (1024px+)
  - Full layout works
  - All features accessible

### I. Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] Mobile browsers

### J. Performance & Error Checking
- [ ] **Console Errors**
  - Open browser DevTools
  - Check Console tab for errors
  - Check Network tab for failed requests

- [ ] **Server Logs**
  - Check Vercel deployment logs
  - Look for runtime errors
  - Monitor API response times

- [ ] **Page Load Times**
  - Initial page load < 3 seconds
  - API responses < 1 second

## Step 7: Bug Logging

For each bug found during testing:

1. **Create Linear Ticket** with:
   - **Title**: `[HW8] [Brief description]`
   - **Label**: `HW8`
   - **Description**:
     - Expected Behavior
     - Actual Behavior
     - Steps to Reproduce
     - Affected Feature (link to original ticket)
     - Environment: Vercel Production
     - Browser/Device
     - Screenshots (if applicable)
     - Console Errors

2. **Example Ticket**:
   ```
   Title: [HW8] Profile update fails with validation error
   
   Expected: Profile updates successfully when valid data provided
   Actual: Validation error shown even with valid email format
   
   Steps:
   1. Navigate to /profile
   2. Update email to valid format
   3. Click Save
   4. See validation error
   
   Environment: Vercel Production
   Browser: Chrome 120
   ```

## Troubleshooting

### Build Fails
- **Issue**: TypeScript compilation errors
- **Solution**: Check build logs, ensure all type errors are fixed

### Environment Variables Not Working
- **Issue**: Supabase connection fails
- **Solution**: 
  - Verify variables are set in Vercel dashboard
  - Ensure variables are prefixed with `NEXT_PUBLIC_` for client-side access
  - Redeploy after adding variables

### Database Connection Issues
- **Issue**: API routes return database errors
- **Solution**:
  - Verify Supabase project is active
  - Check RLS policies are configured
  - Ensure migrations are applied

### Page Not Loading
- **Issue**: 500 errors or blank pages
- **Solution**:
  - Check Vercel function logs
  - Verify environment variables
  - Check browser console for errors

## Deployment Checklist

- [ ] Vercel project created and connected to GitHub
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Initial deployment successful
- [ ] All features tested and documented
- [ ] Linear tickets created for bugs
- [ ] Deployment URL documented
- [ ] README updated with deployment info

## Next Steps

After successful deployment:
1. Share deployment URL with team
2. Monitor Vercel analytics for errors
3. Set up error tracking (e.g., Sentry)
4. Configure custom domain (optional)
5. Set up staging environment for testing

## Support

For deployment issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- Check Supabase [Deployment Guide](https://supabase.com/docs/guides/platform)

