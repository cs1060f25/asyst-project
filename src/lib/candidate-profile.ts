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
  safeValidateCandidateProfileUpdate 
} from './validation/candidate-schema';
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
  const normalizedData = normalizeCandidateData(validatedData);
  const forInsert: CandidateProfileInsert = {
    user_id: userId,
    name: normalizedData.name,
    email: normalizedData.email,
    phone: normalizedData.phone ?? null,
    education: normalizedData.education ?? null,
    resume_url: normalizedData.resume_url ?? null,
    skills: normalizedData.skills ?? [],
    experience: (normalizedData.experience ?? []).map(e => ({
      company: e.company,
      title: e.title,
      start_date: e.start_date,
      end_date: e.end_date ?? null,
      description: e.description ?? "",
    })),
    certifications: (normalizedData.certifications ?? []).map(c => ({
      name: c.name,
      issuer: c.issuer,
      date: c.date,
      expiry: c.expiry ?? null,
    })),
    linkedin_url: normalizedData.linkedin_url ?? null,
    github_url: normalizedData.github_url ?? null,
    portfolio_url: normalizedData.portfolio_url ?? null,
    offer_deadline: normalizedData.offer_deadline ?? null,
    eeo_gender: normalizedData.eeo_gender ?? null,
    eeo_race_ethnicity: normalizedData.eeo_race_ethnicity ?? null,
    eeo_veteran_status: normalizedData.eeo_veteran_status ?? null,
    eeo_disability_status: normalizedData.eeo_disability_status ?? null,
    eeo_prefer_not_to_say: normalizedData.eeo_prefer_not_to_say ?? null,
    location: normalizedData.location ?? null,
    school: normalizedData.school ?? null,
    degree_level: normalizedData.degree_level ?? null,
    graduation_date: normalizedData.graduation_date ?? null,
    gpa: normalizedData.gpa ?? null,
    years_experience: normalizedData.years_experience ?? null,
    work_authorization: normalizedData.work_authorization ?? null,
    requires_sponsorship: normalizedData.requires_sponsorship ?? null,
    open_to_relocation: normalizedData.open_to_relocation ?? null,
    employment_types: normalizedData.employment_types ?? [],
    pronouns: normalizedData.pronouns ?? null,
    languages: normalizedData.languages ?? [],
    frameworks: normalizedData.frameworks ?? [],
    timezone: normalizedData.timezone ?? null,
    website_url: normalizedData.website_url ?? null,
    twitter_url: normalizedData.twitter_url ?? null,
    mastodon_url: normalizedData.mastodon_url ?? null,
    dribbble_url: normalizedData.dribbble_url ?? null,
    leetcode_url: normalizedData.leetcode_url ?? null,
    codeforces_url: normalizedData.codeforces_url ?? null,
    hackerrank_url: normalizedData.hackerrank_url ?? null,
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
    const normalizedData = normalizeCandidateData(validationResult.data!);
    const forInsert: CandidateProfileInsert = {
      user_id: userId,
      name: normalizedData.name,
      email: normalizedData.email,
      phone: normalizedData.phone ?? null,
      education: normalizedData.education ?? null,
      resume_url: normalizedData.resume_url ?? null,
      skills: normalizedData.skills ?? [],
      experience: (normalizedData.experience ?? []).map(e => ({
        company: e.company,
        title: e.title,
        start_date: e.start_date,
        end_date: e.end_date ?? null,
        description: e.description ?? "",
      })),
      certifications: (normalizedData.certifications ?? []).map(c => ({
        name: c.name,
        issuer: c.issuer,
        date: c.date,
        expiry: c.expiry ?? null,
      })),
      linkedin_url: normalizedData.linkedin_url ?? null,
      github_url: normalizedData.github_url ?? null,
      portfolio_url: normalizedData.portfolio_url ?? null,
      offer_deadline: normalizedData.offer_deadline ?? null,
      eeo_gender: normalizedData.eeo_gender ?? null,
      eeo_race_ethnicity: normalizedData.eeo_race_ethnicity ?? null,
      eeo_veteran_status: normalizedData.eeo_veteran_status ?? null,
      eeo_disability_status: normalizedData.eeo_disability_status ?? null,
      eeo_prefer_not_to_say: normalizedData.eeo_prefer_not_to_say ?? null,
      location: normalizedData.location ?? null,
      school: normalizedData.school ?? null,
      degree_level: normalizedData.degree_level ?? null,
      graduation_date: normalizedData.graduation_date ?? null,
      gpa: normalizedData.gpa ?? null,
      years_experience: normalizedData.years_experience ?? null,
      work_authorization: normalizedData.work_authorization ?? null,
      requires_sponsorship: normalizedData.requires_sponsorship ?? null,
      open_to_relocation: normalizedData.open_to_relocation ?? null,
      employment_types: normalizedData.employment_types ?? [],
      pronouns: normalizedData.pronouns ?? null,
      languages: normalizedData.languages ?? [],
      frameworks: normalizedData.frameworks ?? [],
      timezone: normalizedData.timezone ?? null,
      website_url: normalizedData.website_url ?? null,
      twitter_url: normalizedData.twitter_url ?? null,
      mastodon_url: normalizedData.mastodon_url ?? null,
      dribbble_url: normalizedData.dribbble_url ?? null,
      leetcode_url: normalizedData.leetcode_url ?? null,
      codeforces_url: normalizedData.codeforces_url ?? null,
      hackerrank_url: normalizedData.hackerrank_url ?? null,
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
    // Step 1: Safe validation
    const validationResult = safeValidateCandidateProfileUpdate(data);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: `Validation failed: ${validationResult.error?.issues.map(i => i.message).join(', ')}`
      };
    }
    
    // Step 2: Normalize the validated data
    const normalizedData = normalizeCandidateData(validationResult.data!) as CandidateProfileUpdate;
    
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
