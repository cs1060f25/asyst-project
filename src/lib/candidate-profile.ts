import type { 
  CandidateProfile, 
  CandidateProfileInsert, 
  CandidateProfileUpdate 
} from '@/lib/types/database';
import { normalizeCandidateData } from './validation/candidate-normalizer';
import { 
  validateCandidateProfileInsert, 
  validateCandidateProfileUpdate,
  safeValidateCandidateProfileInsert,
  CandidateProfileUpdateSchema
} from './validation/candidate-schema';
import { z } from 'zod';
import type { CandidateProfileInsertValidated } from './validation/candidate-schema';
import { 
  getCandidateProfile, 
  createCandidateProfile, 
  updateCandidateProfile, 
  deleteCandidateProfile 
} from './storage';

/**
 * Candidate Profile Integration Layer
 * 
 * This module combines validation, normalization, and database operations
 * to provide a high-level interface for candidate profile management.
 * 
 * Data Flow:
 * 1. Raw input → Validation (Zod schema)
 * 2. Validated data → Normalization (formatting rules)
 * 3. Normalized data → Database storage (Supabase)
 */

/**
 * Save a candidate profile with validation and normalization
 * @param userId - The user ID
 * @param data - Raw candidate profile data
 * @returns Promise<CandidateProfile>
 */
export async function saveCandidateProfile(
  userId: string, 
  data: Partial<CandidateProfileInsert>
): Promise<CandidateProfile> {
  // Step 1: Validate the input data
  const validatedData = validateCandidateProfileInsert({
    ...data,
    user_id: userId
  });
  
  // Step 2: Normalize the validated data
  const normalizedData = normalizeCandidateData(validatedData) as CandidateProfileInsertValidated;
  const forInsert: CandidateProfileInsert = {
    user_id: userId,
    name: normalizedData.name,
    email: normalizedData.email,
    phone: normalizedData.phone ?? null,
    education: normalizedData.education ?? null,
    major: normalizedData.major ?? null,
    resume_url: normalizedData.resume_url ?? null,
    skills: normalizedData.skills ?? [],
    experience: normalizedData.experience ?? [],
    certifications: normalizedData.certifications ?? [],
    linkedin_url: normalizedData.linkedin_url ?? null,
    github_url: normalizedData.github_url ?? null,
    portfolio_url: normalizedData.portfolio_url ?? null,
    website_url: normalizedData.website_url ?? null,
    twitter_url: normalizedData.twitter_url ?? null,
    mastodon_url: normalizedData.mastodon_url ?? null,
    dribbble_url: normalizedData.dribbble_url ?? null,
    leetcode_url: normalizedData.leetcode_url ?? null,
    codeforces_url: normalizedData.codeforces_url ?? null,
    hackerrank_url: normalizedData.hackerrank_url ?? null,
    offer_deadline: normalizedData.offer_deadline ?? null,
    eeo_gender: normalizedData.eeo_gender ?? null,
    eeo_race_ethnicity: normalizedData.eeo_race_ethnicity ?? null,
    eeo_veteran_status: normalizedData.eeo_veteran_status ?? null,
    eeo_disability_status: normalizedData.eeo_disability_status ?? null,
    location: normalizedData.location ?? null,
    school: normalizedData.school ?? null,
    degree_level: normalizedData.degree_level ?? null,
    graduation_date: normalizedData.graduation_date ?? null,
    gpa: normalizedData.gpa ?? null,
    years_of_experience: normalizedData.years_of_experience ?? null,
    work_authorization: normalizedData.work_authorization ?? null,
    requires_sponsorship: normalizedData.requires_sponsorship ?? null,
    open_to_relocation: normalizedData.open_to_relocation ?? null,
    employment_types: normalizedData.employment_types ?? [],
    pronouns: normalizedData.pronouns ?? null,
    languages: normalizedData.languages ?? [],
    frameworks: normalizedData.frameworks ?? [],
    timezone: normalizedData.timezone ?? null,
    referral_source: normalizedData.referral_source ?? null,
  };
  
  // Step 3: Store in database
  return await createCandidateProfile(forInsert);
}

/**
 * Fetch a candidate profile by user ID
 * @param userId - The user ID
 * @returns Promise<CandidateProfile | null>
 */
export async function fetchCandidateProfile(userId: string): Promise<CandidateProfile | null> {
  return await getCandidateProfile(userId);
}

/**
 * Update a candidate profile with validation and normalization
 * @param userId - The user ID
 * @param data - Raw candidate profile update data
 * @returns Promise<CandidateProfile>
 */
export async function updateCandidateProfileWithValidation(
  userId: string, 
  data: Partial<CandidateProfileUpdate>
): Promise<CandidateProfile> {
  // Step 1: Validate the input data
  const validatedData = validateCandidateProfileUpdate(data);
  
  // Step 2: Normalize the validated data
  const normalizedData = normalizeCandidateData(validatedData) as CandidateProfileUpdate;
  
  // Step 3: Update in database
  return await updateCandidateProfile(userId, normalizedData);
}

/**
 * Safe save operation that returns result instead of throwing
 * @param userId - The user ID
 * @param data - Raw candidate profile data
 * @returns Promise with success/error result
 */
export async function safeSaveCandidateProfile(
  userId: string, 
  data: Partial<CandidateProfileInsert>
): Promise<{
  success: boolean;
  data?: CandidateProfile;
  error?: string;
}> {
  try {
    // Step 1: Safe validation
    const validationResult = safeValidateCandidateProfileInsert({
      ...data,
      user_id: userId
    });
    
    if (!validationResult.success) {
      return {
        success: false,
        error: `Validation failed: ${validationResult.error?.issues.map(i => i.message).join(', ')}`
      };
    }
    
    // Step 2: Normalize the validated data
    const normalizedData = normalizeCandidateData(validationResult.data!) as CandidateProfileInsertValidated;
    const forInsert: CandidateProfileInsert = {
      user_id: userId,
      name: normalizedData.name,
      email: normalizedData.email,
      phone: normalizedData.phone ?? null,
      education: normalizedData.education ?? null,
      major: normalizedData.major ?? null,
      resume_url: normalizedData.resume_url ?? null,
      skills: normalizedData.skills ?? [],
      experience: normalizedData.experience ?? [],
      certifications: normalizedData.certifications ?? [],
      linkedin_url: normalizedData.linkedin_url ?? null,
      github_url: normalizedData.github_url ?? null,
      portfolio_url: normalizedData.portfolio_url ?? null,
      website_url: normalizedData.website_url ?? null,
      twitter_url: normalizedData.twitter_url ?? null,
      mastodon_url: normalizedData.mastodon_url ?? null,
      dribbble_url: normalizedData.dribbble_url ?? null,
      leetcode_url: normalizedData.leetcode_url ?? null,
      codeforces_url: normalizedData.codeforces_url ?? null,
      hackerrank_url: normalizedData.hackerrank_url ?? null,
      offer_deadline: normalizedData.offer_deadline ?? null,
      eeo_gender: normalizedData.eeo_gender ?? null,
      eeo_race_ethnicity: normalizedData.eeo_race_ethnicity ?? null,
      eeo_veteran_status: normalizedData.eeo_veteran_status ?? null,
      eeo_disability_status: normalizedData.eeo_disability_status ?? null,
      location: normalizedData.location ?? null,
      school: normalizedData.school ?? null,
      degree_level: normalizedData.degree_level ?? null,
      graduation_date: normalizedData.graduation_date ?? null,
      gpa: normalizedData.gpa ?? null,
      years_of_experience: normalizedData.years_of_experience ?? null,
      work_authorization: normalizedData.work_authorization ?? null,
      requires_sponsorship: normalizedData.requires_sponsorship ?? null,
      open_to_relocation: normalizedData.open_to_relocation ?? null,
      employment_types: normalizedData.employment_types ?? [],
      pronouns: normalizedData.pronouns ?? null,
      languages: normalizedData.languages ?? [],
      frameworks: normalizedData.frameworks ?? [],
      timezone: normalizedData.timezone ?? null,
      referral_source: normalizedData.referral_source ?? null,
    };

    const profile = await createCandidateProfile(forInsert);
    
    return {
      success: true,
      data: profile
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Safe update operation that returns result instead of throwing
 * @param userId - The user ID
 * @param data - Raw candidate profile update data
 * @returns Promise with success/error result
 */
export async function safeUpdateCandidateProfile(
  userId: string, 
  data: Partial<CandidateProfileUpdate>
): Promise<{
  success: boolean;
  data?: CandidateProfile;
  error?: string;
}> {
  try {
    // Step 1: Validate fields individually to allow partial updates
    const shape = CandidateProfileUpdateSchema.shape as Record<string, z.ZodTypeAny>;
    const clean: Record<string, unknown> = {};
    const invalid: string[] = [];
    for (const [key, value] of Object.entries(data || {})) {
      if (!(key in shape)) continue;
      const single = z.object({ [key]: shape[key] });
      const res = single.safeParse({ [key]: value });
      if (res.success) {
        clean[key] = (res.data as Record<string, unknown>)[key];
      } else {
        invalid.push(key);
      }
    }
    if (Object.keys(clean).length === 0) {
      return {
        success: false,
        error: invalid.length ? `Validation failed for fields: ${invalid.join(', ')}` : 'No valid fields to update'
      };
    }

    // Step 2: Normalize the sanitized data
    const normalizedData = normalizeCandidateData(clean) as CandidateProfileUpdate;
    
    // Step 3: Update in database
    const profile = await updateCandidateProfile(userId, normalizedData);
    
    return {
      success: true,
      data: profile
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Delete a candidate profile
 * @param userId - The user ID
 * @returns Promise<void>
 */
export async function removeCandidateProfile(userId: string): Promise<void> {
  return await deleteCandidateProfile(userId);
}
