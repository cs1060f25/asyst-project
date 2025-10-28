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
  const normalizedData = normalizeCandidateData(validatedData) as CandidateProfileInsert;
  
  // Step 3: Store in database
  return await createCandidateProfile(normalizedData);
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
        error: `Validation failed: ${validationResult.error?.errors.map(e => e.message).join(', ')}`
      };
    }
    
    // Step 2: Normalize the validated data
    const normalizedData = normalizeCandidateData(validationResult.data!) as CandidateProfileInsert;
    
    // Step 3: Store in database
    const profile = await createCandidateProfile(normalizedData);
    
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
        error: `Validation failed: ${validationResult.error?.errors.map(e => e.message).join(', ')}`
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
