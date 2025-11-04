# 🔐 Authentication Analysis - Asyst Job Application System

**Date:** 2025-11-03  
**Purpose:** Document authentication setup for ASYST-13 (Save Job Application)

---

## 1️⃣ **Auth Setup Analysis**

### ✅ **Supabase OAuth is Implemented**

#### **Middleware Protection** (`middleware.ts`)
- **Protected Routes:** `/candidate`, `/recruiter`, `/profile`, `/jobs` (and all sub-paths)
- **Auth Check:** 
  1. Fast cookie presence check (lines 19-31)
  2. Session validation via `supabase.auth.getSession()` (line 52)
  3. Redirect to `/auth/sign-in?redirect=...` if not authenticated
- **Result:** ✅ All job pages require login

#### **Auth Pages**
- `/auth/sign-in` - Email/password login
- `/auth/sign-up` - Registration
- Uses `supabase.auth.signInWithPassword()` and redirects to `/candidate`

#### **Auth Components**
- `AuthMenu.tsx` - Shows user email, sign out button
- Uses `supabase.auth.getSession()` and `onAuthStateChange()` listener

---

## 2️⃣ **User Session Access**

### **Client-Side (React Components)**

#### **Method 1: Direct Supabase Client (Legacy)**
```typescript
import { supabase } from "@/lib/supabaseClient";

// Get current session
const { data } = await supabase.auth.getSession();
const user = data.session?.user;
const userId = user?.id;
```

#### **Method 2: SSR-Safe Client (Recommended)**
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.auth.getUser();
const user = data.user;
const userId = user?.id;
```

### **Server-Side (API Routes, Server Components)**

```typescript
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  
  // Get authenticated user
  const { data, error } = await supabase.auth.getUser();
  
  if (error || !data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = data.user.id; // Use this as candidate_id
}
```

### **🎯 Key Findings:**
- ✅ **Client-side:** Use `createClient()` from `@/lib/supabase/client`
- ✅ **Server-side:** Use `await createClient()` from `@/lib/supabase/server`
- ✅ **User ID:** `user.id` is a UUID from `auth.users` table
- ❌ **Issue:** Two different client imports exist (legacy vs SSR)

---

## 3️⃣ **Frontend - Apply Button**

### **Current State:**
- ✅ `src/app/jobs/[id]/page.tsx` EXISTS
- ✅ Has an apply button (line 137)
- ❌ **Problem:** Uses OLD file-based API (`/api/applications` with `jobId` not `job_id`)
- ❌ **Problem:** Doesn't get user from auth session
- ❌ **Problem:** Not using new Supabase-based endpoint

### **Current Implementation (INSECURE):**
```typescript
// Line 68-77: Current POST request
fetch(`/api/applications`, {
  method: "POST",
  body: JSON.stringify({
    jobId,  // ❌ Wrong format (should be job_id)
    details: {
      coverLetter,  // ❌ Wrong format
      answers       // ❌ Wrong format
    }
  })
})
```

### **What's Missing:**
- ❌ No authentication check before showing button
- ❌ Doesn't get `candidate_id` from session
- ❌ Not using correct API format
- ❌ No separate `ApplyButton` component

---

## 4️⃣ **API Endpoint**

### **Current State:**
- ✅ `src/app/api/applications/route.ts` EXISTS
- ✅ Has POST handler
- ✅ Has Zod validation
- ❌ **CRITICAL SECURITY ISSUE:** Accepts `candidate_id` from request body!

### **Current Implementation (INSECURE):**
```typescript
// Lines 11-16: Current validation schema
const ApplicationCreateSchema = z.object({
  job_id: z.string().uuid(),
  candidate_id: z.string().uuid(),  // ❌ SECURITY RISK: Attacker can apply as any user!
  resume_url: ...,
  cover_letter: ...,
  supplemental_answers: ...
});
```

### **🚨 Security Vulnerability:**
Any user can submit:
```json
{
  "job_id": "real-job-uuid",
  "candidate_id": "someone-elses-uuid",  // 🚨 Impersonation attack!
  "resume_url": "..."
}
```

### **What's Missing:**
- ❌ No authentication validation
- ❌ No `getUser()` call
- ❌ Accepts `candidate_id` from untrusted input
- ❌ No 401 response for unauthenticated requests

---

## 5️⃣ **Database Schema**

### **Tables:**

#### **`auth.users`** (Supabase managed)
- `id` - UUID (primary key)
- `email` - User email
- Managed by Supabase Auth

#### **`applications`**
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  candidate_id UUID,  -- ✅ Links to auth.users.id
  status TEXT DEFAULT 'applied',
  resume_url TEXT,
  cover_letter TEXT,
  supplemental_answers JSONB,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **`candidate_profiles`**
```typescript
{
  id: string;
  user_id: string;  // ✅ Links to auth.users.id
  name: string;
  email: string;
  resume_url: string | null;  // ✅ Can use this for default resume
  skills: string[];
  // ... other fields
}
```

### **🎯 Key Findings:**
- ✅ `applications.candidate_id` links to `auth.users.id` (not a separate candidates table)
- ✅ `candidate_profiles.user_id` also links to `auth.users.id`
- ✅ Can fetch user's resume from `candidate_profiles` if exists
- ✅ Foreign key: `applications.job_id → jobs.id`

---

## 6️⃣ **Protected Routes**

### **Current State:**
- ✅ **Jobs pages ARE protected** (middleware.ts line 5: `"/jobs"`)
- ✅ Requires login to view ANY job
- ✅ Redirects to `/auth/sign-in?redirect=/jobs/[id]`

### **UX Flow:**
1. User visits `/jobs/abc-123`
2. Middleware checks auth
3. If not logged in → Redirect to `/auth/sign-in?redirect=/jobs/abc-123`
4. User signs in
5. Redirects back to `/jobs/abc-123`
6. User can now view job and apply

### **🎯 Design Decision:**
- ✅ **Jobs require login** - Good for tracking who views what
- ✅ **Apply button only shows to logged-in users** - Enforced by middleware
- ❓ **Consider:** Make job listings public, only protect apply action?

---

## 🔄 **Auth Flow Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User visits /jobs/abc-123                                │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Middleware checks auth cookies                           │
│    - Has sb-access-token? ✅                                 │
│    - supabase.auth.getSession() → Valid? ✅                  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
         ┌─────────┴─────────┐
         │                   │
      No │                   │ Yes
         │                   │
         ▼                   ▼
┌──────────────────┐  ┌──────────────────────────────────────┐
│ Redirect to      │  │ 3. Show job details page             │
│ /auth/sign-in    │  │    - Fetch job data                  │
│ ?redirect=/jobs/ │  │    - Show ApplyButton component      │
│ abc-123          │  │                                       │
└────────┬─────────┘  └──────────┬───────────────────────────┘
         │                       │
         │                       ▼
         │            ┌──────────────────────────────────────┐
         │            │ 4. User clicks "Apply"               │
         │            │    - Get session: supabase.auth      │
         │            │      .getUser()                      │
         │            │    - Extract user.id                 │
         │            └──────────┬───────────────────────────┘
         │                       │
         │                       ▼
         │            ┌──────────────────────────────────────┐
         │            │ 5. POST /api/applications            │
         │            │    Body: { job_id, resume_url, ... } │
         │            │    (NO candidate_id in body)         │
         │            └──────────┬───────────────────────────┘
         │                       │
         │                       ▼
         │            ┌──────────────────────────────────────┐
         │            │ 6. API Route validates auth          │
         │            │    - createClient() (server)         │
         │            │    - await getUser()                 │
         │            │    - If no user → 401 Unauthorized   │
         │            │    - Use user.id as candidate_id     │
         │            └──────────┬───────────────────────────┘
         │                       │
         │                       ▼
         │            ┌──────────────────────────────────────┐
         │            │ 7. Insert application                │
         │            │    INSERT INTO applications          │
         │            │    (job_id, candidate_id, ...)       │
         │            │    VALUES (..., user.id, ...)        │
         │            └──────────┬───────────────────────────┘
         │                       │
         │                       ▼
         │            ┌──────────────────────────────────────┐
         │            │ 8. Return 201 Created                │
         │            │    { application: {...}, job: {...} }│
         │            └──────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│ User signs in → Redirects back to /jobs/abc-123              │
└──────────────────────────────────────────────────────────────┘
```

---

## 📝 **Summary of Current Issues**

### **🚨 Critical Security Issues:**
1. ❌ API accepts `candidate_id` from request body (impersonation risk)
2. ❌ No authentication validation in API route
3. ❌ No `getUser()` call to verify session

### **⚠️ Implementation Issues:**
4. ❌ Frontend uses wrong API format (`jobId` vs `job_id`)
5. ❌ Frontend doesn't get user from session
6. ❌ No separate ApplyButton component
7. ❌ Two different Supabase client imports (confusing)

### **✅ What Works:**
- ✅ Middleware protects job routes
- ✅ Auth pages (sign-in/sign-up) work
- ✅ Session management via cookies
- ✅ Database schema is correct

---

## 🎯 **Required Changes**

### **1. Secure API Endpoint**
```typescript
// ❌ Remove candidate_id from schema
// ✅ Add auth validation
// ✅ Get user.id from session
```

### **2. Create ApplyButton Component**
```typescript
// ✅ Check auth state
// ✅ Get user from session
// ✅ Use correct API format
// ✅ Handle all response codes
```

### **3. Update Job Details Page**
```typescript
// ✅ Use new ApplyButton component
// ✅ Remove old apply logic
```

### **4. Update Test Script**
```typescript
// ✅ Test auth validation
// ✅ Test impersonation prevention
```

---

## 🔐 **Security Checklist**

- [ ] API validates authentication
- [ ] API gets candidate_id from session (not request)
- [ ] Frontend gets user from session
- [ ] No user can apply as another user
- [ ] 401 returned for unauthenticated requests
- [ ] 409 returned for duplicate applications
- [ ] Proper error messages
- [ ] Test impersonation attack

---

**Ready to implement secure solution!** ✅
