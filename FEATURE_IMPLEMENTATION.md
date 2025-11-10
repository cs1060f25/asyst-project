# Frontend: Job & Application Models Implementation

## Feature Overview
This implementation adds the ability for recruiters to create jobs with supplemental questions and requires candidates to answer these questions during the application process.

## Implementation Details

### 1. Data Model Updates

#### New Types Added (`src/lib/applications.ts`)
```typescript
export type SupplementalQuestion = {
  id: string;
  question: string;
  type: "text" | "textarea" | "select";
  options?: string[]; // For select type questions
  required: boolean;
};

export type SupplementalAnswer = {
  questionId: string;
  answer: string;
};
```

#### Updated Job Type
```typescript
export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description?: string;
  supplementalQuestions?: SupplementalQuestion[];
};
```

#### Updated Application Type
```typescript
export type Application = {
  jobId: string;
  status: ApplicationStatus;
  appliedAt: string;
  supplementalAnswers?: SupplementalAnswer[];
};
```

### 2. New Files Created

#### Job Storage Module (`src/lib/jobs.ts`)
- Handles job CRUD operations
- Manages job persistence to JSON file
- Supports supplemental questions

#### Job Creation Page (`src/app/recruiter/create-job/page.tsx`)
- Form for creating new jobs
- Dynamic supplemental questions builder
- Support for text, textarea, and select question types
- Form validation

#### Supplemental Questions Page (`src/app/candidate/apply/[jobId]/page.tsx`)
- Displays job details
- Renders supplemental questions based on type
- Form validation for required questions
- Submits application with answers

### 3. Updated Files

#### Jobs API (`src/app/api/jobs/route.ts`)
- Added POST endpoint for job creation
- Integrated with new jobs storage module
- Validation for required fields

#### Applications API (`src/app/api/applications/route.ts`)
- Updated to accept supplemental answers
- Passes answers to storage layer

#### Candidate Page (`src/app/candidate/page.tsx`)
- Updated to check for supplemental questions
- Redirects to questions page when needed
- Direct application for jobs without questions

#### Recruiter Page (`src/app/recruiter/page.tsx`)
- Added "Create Job" button
- Navigation to job creation page

#### Applications Library (`src/lib/applications.ts`)
- Updated `applyToJob` function to accept supplemental answers
- Stores answers with application data

### 4. User Flow

#### Recruiter Flow
1. Navigate to `/recruiter`
2. Click "Create Job" button
3. Fill in job details (title, company, location, description)
4. Add supplemental questions:
   - Text input questions
   - Textarea questions  
   - Multiple choice questions
   - Mark questions as required/optional
5. Submit job creation form
6. Job appears in system for candidates

#### Candidate Flow
1. Navigate to `/candidate`
2. Browse available jobs
3. Click "One-click Apply" on desired job
4. **If job has supplemental questions:**
   - Redirected to `/candidate/apply/[jobId]`
   - View job details
   - Answer supplemental questions
   - Submit application with answers
5. **If job has no supplemental questions:**
   - Application submitted immediately
6. Return to candidate dashboard

### 5. Question Types Supported

#### Text Input
- Short text responses
- Single line input field
- Good for names, titles, short answers

#### Textarea
- Long text responses
- Multi-line input field
- Good for cover letters, detailed explanations

#### Multiple Choice
- Select from predefined options
- Dropdown selection
- Recruiter defines all available options

### 6. Validation Rules

#### Job Creation
- Title, company, and location are required
- All supplemental questions must have text
- Select questions must have at least one option
- Empty questions are filtered out before saving

#### Application Submission
- All required supplemental questions must be answered
- Optional questions can be skipped
- Validation runs before form submission

### 7. Data Persistence

#### Jobs Storage
- Jobs stored in `data/jobs.json`
- Includes all supplemental questions
- Automatic file creation if not exists

#### Applications Storage
- Applications stored in `data/applications.json`
- Supplemental answers included with each application
- Maintains backward compatibility

### 8. API Endpoints

#### GET /api/jobs
- Returns all jobs including supplemental questions
- Used by both recruiter and candidate pages

#### POST /api/jobs
- Creates new job with supplemental questions
- Validates required fields
- Returns created job with generated ID

#### POST /api/applications
- Accepts jobId and optional supplementalAnswers
- Creates application record
- Returns creation status

### 9. UI Components Used

#### From shadcn/ui
- Button
- Input
- Select (SelectContent, SelectItem, SelectTrigger, SelectValue)

#### From lucide-react
- Plus (add question button)
- X (remove question/option button)
- ArrowLeft (back navigation)

### 10. Error Handling

#### Form Validation
- Client-side validation for required fields
- Real-time feedback for form errors
- Prevents submission with invalid data

#### API Error Handling
- Graceful error messages for API failures
- User-friendly error display
- Retry capabilities where appropriate

### 11. Responsive Design
- Forms work on mobile and desktop
- Responsive grid layouts
- Touch-friendly buttons and inputs

### 12. Accessibility Features
- Proper form labels
- Keyboard navigation support
- Screen reader compatible
- Focus management

## Testing
See `TEST_PLAN.md` for comprehensive testing strategy covering:
- Unit tests for components
- Integration tests for API endpoints
- End-to-end user flow testing
- Edge case handling
- Performance considerations

## Future Enhancements
- File upload questions
- Question dependencies (conditional questions)
- Question templates/library
- Analytics on question responses
- Bulk question import/export
- Question reordering via drag & drop
