import { z } from 'zod';

/**
 * Validation Schema for Candidate Profile Data
 * 
 * This schema defines validation rules for candidate profile data
 * to ensure data quality before normalization and storage.
 */

// Work experience validation schema
const WorkExperienceSchema = z.object({
  company: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  title: z.string().min(1, 'Job title is required').max(100, 'Job title too long'),
  start_date: z.string().regex(/^\d{4}-\d{2}$/, 'Start date must be in YYYY-MM format'),
  end_date: z.string().regex(/^\d{4}-\d{2}$/, 'End date must be in YYYY-MM format').nullable(),
  description: z.string().max(1000, 'Description too long').default('') // Required field, defaults to empty string
});

// Certification validation schema
const CertificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required').max(100, 'Certification name too long'),
  issuer: z.string().min(1, 'Issuer is required').max(100, 'Issuer name too long'),
  date: z.string().regex(/^\d{4}-\d{2}$/, 'Date must be in YYYY-MM format'),
  expiry: z.string().regex(/^\d{4}-\d{2}$/, 'Expiry date must be in YYYY-MM format').nullable()
});

// URL validation schema
const UrlSchema = z.string().url('Invalid URL format').optional().or(z.literal(''));

// Phone validation schema (flexible format)
const PhoneSchema = z.string().regex(
  /^[\+]?[1-9][\d]{0,15}$|^[\+]?[(]?[\d\s\-\(\)]{10,}$|^$/,
  'Invalid phone number format'
).optional().or(z.literal(''));

// Email validation schema
const EmailSchema = z.string().email('Invalid email format');

// Name validation schema
const NameSchema = z.string().min(1, 'Name is required').max(100, 'Name too long');

// Skills validation schema - allow empty strings but limit length
const SkillsSchema = z.array(z.string().max(50, 'Skill name too long'))
  .max(50, 'Too many skills (max 50)');

// Main candidate profile validation schema for insertion
export const CandidateProfileInsertSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  name: NameSchema,
  email: EmailSchema,
  phone: PhoneSchema.nullable().optional(),
  education: z.string().max(200, 'Education description too long').nullable().optional(),
  resume_url: UrlSchema.nullable().optional(),
  skills: SkillsSchema.optional(),
  experience: z.array(WorkExperienceSchema).max(20, 'Too many work experiences (max 20)').optional(),
  certifications: z.array(CertificationSchema).max(20, 'Too many certifications (max 20)').optional(),
  linkedin_url: UrlSchema.nullable().optional(),
  github_url: UrlSchema.nullable().optional(),
  portfolio_url: UrlSchema.nullable().optional(),
  offer_deadline: z.string().datetime('Invalid deadline format').nullable().optional()
});

// Candidate profile validation schema for updates (all fields optional)
export const CandidateProfileUpdateSchema = z.object({
  name: NameSchema.optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema.nullable().optional(),
  education: z.string().max(200, 'Education description too long').nullable().optional(),
  resume_url: UrlSchema.nullable().optional(),
  skills: SkillsSchema.optional(),
  experience: z.array(WorkExperienceSchema).max(20, 'Too many work experiences (max 20)').optional(),
  certifications: z.array(CertificationSchema).max(20, 'Too many certifications (max 20)').optional(),
  linkedin_url: UrlSchema.nullable().optional(),
  github_url: UrlSchema.nullable().optional(),
  portfolio_url: UrlSchema.nullable().optional(),
  offer_deadline: z.string().datetime('Invalid deadline format').nullable().optional()
});

// Type exports for use in other modules
export type CandidateProfileInsertValidated = z.infer<typeof CandidateProfileInsertSchema>;
export type CandidateProfileUpdateValidated = z.infer<typeof CandidateProfileUpdateSchema>;

/**
 * Validate candidate profile data for insertion
 * @param data - Raw candidate profile data
 * @returns Validated data or throws error
 */
export function validateCandidateProfileInsert(data: unknown): CandidateProfileInsertValidated {
  return CandidateProfileInsertSchema.parse(data);
}

/**
 * Validate candidate profile data for update
 * @param data - Raw candidate profile data
 * @returns Validated data or throws error
 */
export function validateCandidateProfileUpdate(data: unknown): CandidateProfileUpdateValidated {
  return CandidateProfileUpdateSchema.parse(data);
}

/**
 * Safe validation that returns result instead of throwing
 * @param data - Raw candidate profile data
 * @returns Validation result with success/error information
 */
export function safeValidateCandidateProfileInsert(data: unknown): {
  success: boolean;
  data?: CandidateProfileInsertValidated;
  error?: z.ZodError;
} {
  try {
    const validated = CandidateProfileInsertSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}

/**
 * Safe validation for updates that returns result instead of throwing
 * @param data - Raw candidate profile data
 * @returns Validation result with success/error information
 */
export function safeValidateCandidateProfileUpdate(data: unknown): {
  success: boolean;
  data?: CandidateProfileUpdateValidated;
  error?: z.ZodError;
} {
  try {
    const validated = CandidateProfileUpdateSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error };
    }
    throw error;
  }
}
