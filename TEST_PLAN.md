# Test Plan: Frontend Job & Application Models Feature

## Feature Overview
This feature allows recruiters to create jobs with supplemental questions and requires candidates to answer these questions before applying.

## Test Coverage Areas

### 1. Job Creation (Recruiter Side)

#### 1.1 Basic Job Creation
**Test Case**: Create job with required fields only
- **Steps**:
  1. Navigate to `/recruiter`
  2. Click "Create Job" button
  3. Fill in required fields: Title, Company, Location
  4. Submit form
- **Expected**: Job is created successfully and appears in job listings
- **Priority**: High

**Test Case**: Create job with description
- **Steps**:
  1. Navigate to job creation page
  2. Fill in all fields including description
  3. Submit form
- **Expected**: Job is created with description stored
- **Priority**: Medium

#### 1.2 Supplemental Questions Management
**Test Case**: Add text question
- **Steps**:
  1. On job creation page, click "Add Question"
  2. Enter question text and select "Short Text" type
  3. Mark as required/optional
  4. Submit job
- **Expected**: Question is saved with job
- **Priority**: High

**Test Case**: Add textarea question
- **Steps**:
  1. Add question with "Long Text" type
  2. Submit job
- **Expected**: Question type is correctly saved
- **Priority**: High

**Test Case**: Add multiple choice question
- **Steps**:
  1. Add question with "Multiple Choice" type
  2. Add multiple options
  3. Submit job
- **Expected**: Question with all options is saved
- **Priority**: High

**Test Case**: Remove question
- **Steps**:
  1. Add multiple questions
  2. Remove one using X button
  3. Submit job
- **Expected**: Only remaining questions are saved
- **Priority**: Medium

**Test Case**: Required vs optional questions
- **Steps**:
  1. Add questions with different required settings
  2. Submit job
- **Expected**: Required flag is correctly saved
- **Priority**: High

#### 1.3 Form Validation
**Test Case**: Missing required fields
- **Steps**:
  1. Try to submit job without title/company/location
- **Expected**: Error message displayed, form not submitted
- **Priority**: High

**Test Case**: Empty question text
- **Steps**:
  1. Add question without entering question text
  2. Try to submit
- **Expected**: Error message about empty questions
- **Priority**: High

**Test Case**: Multiple choice without options
- **Steps**:
  1. Add multiple choice question without options
  2. Try to submit
- **Expected**: Error message about missing options
- **Priority**: High

### 2. Candidate Application Flow

#### 2.1 Jobs Without Supplemental Questions
**Test Case**: Direct application
- **Steps**:
  1. Navigate to `/candidate`
  2. Click "One-click Apply" on job without questions
- **Expected**: Application submitted immediately
- **Priority**: High

#### 2.2 Jobs With Supplemental Questions
**Test Case**: Redirect to questions page
- **Steps**:
  1. Click "One-click Apply" on job with questions
- **Expected**: Redirected to `/candidate/apply/[jobId]` page
- **Priority**: High

**Test Case**: Answer all questions and submit
- **Steps**:
  1. On questions page, answer all questions
  2. Submit application
- **Expected**: Application submitted with answers, redirected to candidate dashboard
- **Priority**: High

**Test Case**: Skip optional questions
- **Steps**:
  1. Answer only required questions
  2. Submit application
- **Expected**: Application submitted successfully
- **Priority**: High

**Test Case**: Try to submit without required answers
- **Steps**:
  1. Leave required questions empty
  2. Try to submit
- **Expected**: Error message displayed, form not submitted
- **Priority**: High

#### 2.3 Question Types Handling
**Test Case**: Text input questions
- **Steps**:
  1. Answer text input questions
  2. Submit
- **Expected**: Text answers are saved
- **Priority**: High

**Test Case**: Textarea questions
- **Steps**:
  1. Answer textarea questions with long text
  2. Submit
- **Expected**: Long text answers are saved
- **Priority**: High

**Test Case**: Multiple choice questions
- **Steps**:
  1. Select options from dropdown
  2. Submit
- **Expected**: Selected options are saved
- **Priority**: High

### 3. Data Persistence

#### 3.1 Job Storage
**Test Case**: Job data persistence
- **Steps**:
  1. Create job with questions
  2. Restart application
  3. Check if job and questions are still there
- **Expected**: All job data persists across restarts
- **Priority**: High

#### 3.2 Application Storage
**Test Case**: Application answers persistence
- **Steps**:
  1. Submit application with supplemental answers
  2. Check recruiter dashboard
  3. Restart application and check again
- **Expected**: Answers are visible and persist
- **Priority**: High

### 4. API Endpoints

#### 4.1 Jobs API
**Test Case**: GET /api/jobs
- **Steps**: Make GET request to jobs endpoint
- **Expected**: Returns all jobs including supplemental questions
- **Priority**: High

**Test Case**: POST /api/jobs
- **Steps**: 
  1. Send POST with job data including questions
  2. Verify response
- **Expected**: Job created and returned with ID
- **Priority**: High

**Test Case**: POST /api/jobs validation
- **Steps**: Send POST with invalid data
- **Expected**: 400 error with appropriate message
- **Priority**: Medium

#### 4.2 Applications API
**Test Case**: POST /api/applications with answers
- **Steps**: 
  1. Send POST with jobId and supplementalAnswers
  2. Verify response
- **Expected**: Application created with answers
- **Priority**: High

### 5. UI/UX Testing

#### 5.1 Responsive Design
**Test Case**: Mobile job creation
- **Steps**: Test job creation form on mobile devices
- **Expected**: Form is usable on mobile
- **Priority**: Medium

**Test Case**: Mobile question answering
- **Steps**: Test supplemental questions page on mobile
- **Expected**: Questions are answerable on mobile
- **Priority**: Medium

#### 5.2 User Experience
**Test Case**: Clear navigation
- **Steps**: Test navigation between pages
- **Expected**: Users can easily navigate back and forth
- **Priority**: Medium

**Test Case**: Loading states
- **Steps**: Test form submission loading states
- **Expected**: Clear feedback during async operations
- **Priority**: Low

### 6. Edge Cases

#### 6.1 Large Data Sets
**Test Case**: Many questions
- **Steps**: Create job with 10+ supplemental questions
- **Expected**: Page remains performant and usable
- **Priority**: Low

**Test Case**: Long question text
- **Steps**: Create questions with very long text
- **Expected**: UI handles long text gracefully
- **Priority**: Low

#### 6.2 Network Issues
**Test Case**: Failed job creation
- **Steps**: Simulate network failure during job creation
- **Expected**: Appropriate error message shown
- **Priority**: Medium

**Test Case**: Failed application submission
- **Steps**: Simulate network failure during application
- **Expected**: User can retry submission
- **Priority**: Medium

### 7. Integration Testing

#### 7.1 End-to-End Workflow
**Test Case**: Complete recruiter-to-candidate flow
- **Steps**:
  1. Recruiter creates job with questions
  2. Candidate finds job and applies
  3. Recruiter sees application with answers
- **Expected**: Complete workflow works seamlessly
- **Priority**: High

#### 7.2 Data Consistency
**Test Case**: Application status updates
- **Steps**:
  1. Submit application with answers
  2. Recruiter updates application status
  3. Verify data consistency
- **Expected**: Status updates don't affect supplemental answers
- **Priority**: Medium

## Bug Tracking

### Known Issues to Monitor
1. **Form validation timing**: Ensure validation runs at appropriate times
2. **Data race conditions**: Multiple rapid form submissions
3. **Memory leaks**: Large forms with many questions
4. **Browser compatibility**: Test across different browsers

### Bug Report Template
When reporting bugs, include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Browser/device information
- Screenshots if applicable
- Console errors if any

## Performance Considerations

### Metrics to Track
- Page load time for job creation form
- Form submission response time
- Memory usage with large question sets
- Bundle size impact of new features

### Acceptance Criteria
- Job creation form loads within 2 seconds
- Form submission completes within 5 seconds
- No memory leaks during extended usage
- Bundle size increase < 50KB

## Accessibility Testing

### Requirements
- All forms are keyboard navigable
- Screen reader compatible
- Proper ARIA labels
- Color contrast compliance
- Focus management

### Test Cases
- Navigate entire job creation flow using only keyboard
- Test with screen reader
- Verify color contrast ratios
- Test with high contrast mode

## Browser Compatibility

### Supported Browsers
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Test Matrix
Test core functionality across all supported browsers, with particular attention to:
- Form handling
- File uploads (if applicable)
- Local storage
- API calls
