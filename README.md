# Asyst-project

## The Problem

Currently, the job application process is quite slow from a candidate's perspective. Even with the help of extensions like Simplify, candidates have to find a job from a job list, go to the website for that job application, and finally fill out the form so that they can apply. This is already a long and tedious process - imagine doing that for 10 companies in a row while filling out the same information every time.

Another issue deals with the latency that candidates and companies experience while communicating with one another. For example, if a candidate got a job offer that would speed up their timeline for recruiting, then, for the other companies that they have applied to, the candidate would have to find a recruiter through Google search and then email them so that you can inform the company to speed up your interview process. This is quite rough as a process.

## The Solution

During college applications, there is a "common app", where you can apply to basically all the colleges you want to apply to through one website/portal. Of course, there are supplemental questions specific to each college, but those can also be answered on the same portal. The idea is to extend this common app idea to the job application process. I am envisioning the following app.

All companies would have their job application on our site. Each application would essentially be a one-click-apply process if there are no supplemental questions. If there are supplementals (which I think are increasingly rare these days), you can answer directly on our website. All you would have to do is upload your resume and answer basic candidate questions (like the identity disclosure questions and education inquiries). If you need to update your information, e.g. resume or offer deadlines, you can do so within the app, which will subsequently update how your application looks on the company's end automatically.

On the company side, you would be able to log in to the app, and for each position that you are hiring for, you can view each resume and applicant. Depending on people's offer deadlines, you might be able to view certain people first. The whole interview process can be set up on the site, so that you don't have to email people back and forth about interviews.

## Profile & Resume Management

This project now includes a Profile page that lets candidates manage personal information and a resume file.

Path: `src/app/profile/page.tsx`

APIs:
- `PUT /api/profile` — update `name`, `email`, `education`
- `GET /api/profile` — fetch current profile
- `POST /api/resume` — upload or replace resume (PDF, DOC, DOCX; max 5MB)
- `DELETE /api/resume` — delete current resume

Local storage is implemented using the filesystem with files saved under `public/uploads/` and profile data in `data/profile.json`. See storage helpers in `src/lib/storage.ts`.

### Configuration

- `UPLOAD_DIR`: override default upload directory. Defaults to `<project>/public/uploads`.
- `PROFILE_JSON`: override profile JSON path. Defaults to `<project>/data/profile.json`.

S3: To use S3 instead of local storage, replace the implementations in `src/lib/storage.ts` (`saveResumeFile`, `deleteResumeFileIfExists`, and `getPublicUrlForSavedFile`) with S3 SDK calls (e.g., `@aws-sdk/client-s3`). Keep validations (`MAX_RESUME_BYTES`, `isAllowedResumeType`) the same.

### Test Plan

- [x] Test successful resume upload.
- [x] Test invalid resume upload via invalid file type.
- [x] Test other form details being filled out correctly.
- [x] Test other form details being filled out with incorrect field type.
- [x] Test deleting and replacing resume.
- [x] Test uploading files that are too large.

Automated tests cover validation helpers in `src/lib/storage.test.ts` (MIME type allowlist, size limit, filename sanitization, public URL generation).

### Running Tests

1. Install dependencies (Vitest):
   - `npm install`
2. Run tests:
   - `npm run test`

### Using the Feature

1. Start the dev server: `npm run dev`.
2. Navigate to `/profile` using the top nav.
3. Update Name, Email, Education and click Save.
4. Upload a resume using PDF/DOC/DOCX up to 5MB.
5. View, delete, and replace the resume as needed.

## The Implementation

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
