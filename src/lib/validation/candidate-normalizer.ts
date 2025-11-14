import type { 
  CandidateProfile, 
  CandidateProfileInsert, 
  CandidateProfileUpdate,
  WorkExperience,
  Certification 
} from '@/lib/types/database';
import type { CandidateProfileInsertValidated, CandidateProfileUpdateValidated } from '@/lib/validation/candidate-schema';

/**
 * Data Standardization & Validation Service
 * 
 * This module provides normalization rules for candidate data to ensure
 * consistent formatting and validation before storage in the database.
 * 
 * Normalization Rules:
 * - Names: Title case (e.g., "john doe" → "John Doe")
 * - Emails: Lowercase and trim whitespace
 * - Phone: Standardized format (e.g., "+1-XXX-XXX-XXXX" or "(XXX) XXX-XXXX")
 * - Skills: Lowercase, deduplicate, trim whitespace
 * - URLs: Validate format, ensure https:// protocol
 * - Dates: ISO format validation for experience/certification dates
 */

/**
 * Normalize a name to title case
 * @param name - Raw name input
 * @returns Normalized name in title case
 */
export function normalizeName(name: string): string {
  if (!name || typeof name !== 'string') {
    return '';
  }
  
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize an email address
 * @param email - Raw email input
 * @returns Normalized email in lowercase
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  return email.trim().toLowerCase();
}

/**
 * Normalize a phone number to standard format
 * @param phone - Raw phone input
 * @returns Normalized phone number or empty string if invalid
 */
export function normalizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Handle different phone number lengths
  if (digits.length === 10) {
    // US format: (XXX) XXX-XXXX
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // US format with country code: +1-XXX-XXX-XXXX
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  } else if (digits.length > 11) {
    // International format: +X-XXX-XXX-XXXX
    const countryCode = digits.slice(0, -10);
    const number = digits.slice(-10);
    return `+${countryCode}-${number.slice(0, 3)}-${number.slice(3, 6)}-${number.slice(6)}`;
  }
  
  // Return original if can't normalize
  return phone.trim();
}

/**
 * Normalize skills array
 * @param skills - Raw skills array
 * @returns Normalized, deduplicated skills array
 */
export function normalizeSkills(skills: string[]): string[] {
  if (!Array.isArray(skills)) {
    return [];
  }
  
  return [...new Set(
    skills
      .filter(skill => typeof skill === 'string' && skill.trim())
      .map(skill => skill.trim().toLowerCase())
  )];
}

/**
 * Normalize a URL to ensure https:// protocol
 * @param url - Raw URL input
 * @returns Normalized URL or empty string if invalid
 */
export function normalizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }
  
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  
  try {
    // If URL doesn't have protocol, add https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const urlWithProtocol = `https://${trimmed}`;
      new URL(urlWithProtocol); // Validate URL
      return urlWithProtocol;
    }
    
    // Validate existing URL
    new URL(trimmed);
    return trimmed;
  } catch {
    // Return empty string for invalid URLs
    return '';
  }
}

/**
 * Normalize work experience data
 * @param experience - Raw experience array
 * @returns Normalized experience array
 */
export function normalizeExperience(experience: WorkExperience[]): WorkExperience[] {
  if (!Array.isArray(experience)) {
    return [];
  }
  
  return experience
    .filter(exp => exp && typeof exp === 'object')
    .map(exp => ({
      company: exp.company?.trim() || '',
      title: exp.title?.trim() || '',
      start_date: normalizeDate(exp.start_date),
      end_date: exp.end_date ? normalizeDate(exp.end_date) : null,
      description: exp.description?.trim() || ''
    }))
    .filter(exp => exp.company && exp.title && exp.start_date);
}

/**
 * Normalize certification data
 * @param certifications - Raw certifications array
 * @returns Normalized certifications array
 */
export function normalizeCertifications(certifications: Certification[]): Certification[] {
  if (!Array.isArray(certifications)) {
    return [];
  }
  
  return certifications
    .filter(cert => cert && typeof cert === 'object')
    .map(cert => ({
      name: cert.name?.trim() || '',
      issuer: cert.issuer?.trim() || '',
      date: normalizeDate(cert.date),
      expiry: cert.expiry ? normalizeDate(cert.expiry) : null
    }))
    .filter(cert => cert.name && cert.issuer && cert.date);
}

/**
 * Normalize date to YYYY-MM format
 * @param date - Raw date input
 * @returns Normalized date in YYYY-MM format or empty string if invalid
 */
export function normalizeDate(date: string): string {
  if (!date || typeof date !== 'string') {
    return '';
  }
  
  const trimmed = date.trim();
  if (!trimmed) {
    return '';
  }
  
  try {
    const dateObj = new Date(trimmed);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    // Return YYYY-MM format
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  } catch {
    return '';
  }
}

/**
 * Normalize offer deadline to ISO timestamp
 * @param deadline - Raw deadline input
 * @returns Normalized ISO timestamp or null if invalid
 */
export function normalizeOfferDeadline(deadline: string): string | null {
  if (!deadline || typeof deadline !== 'string') {
    return null;
  }
  
  const trimmed = deadline.trim();
  if (!trimmed) {
    return null;
  }
  
  try {
    const date = new Date(trimmed);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toISOString();
  } catch {
    return null;
  }
}

/**
 * Normalize all candidate profile data
 * @param data - Raw candidate profile data
 * @returns Normalized candidate profile data
 */
export function normalizeCandidateData(data: CandidateProfileInsertValidated): CandidateProfileInsertValidated;
export function normalizeCandidateData(data: CandidateProfileUpdateValidated): CandidateProfileUpdateValidated;
export function normalizeCandidateData<T extends Partial<CandidateProfileInsert> | Partial<CandidateProfileUpdate>>(
  data: T
): T {
  const normalized: Record<string, unknown> = {};
  
  // Normalize basic fields
  if (data.name !== undefined) {
    normalized.name = normalizeName(data.name);
  }
  
  if (data.email !== undefined) {
    normalized.email = normalizeEmail(data.email);
  }
  
  if (data.phone !== undefined) {
    normalized.phone = data.phone ? normalizePhone(data.phone) : null;
  }
  
  if (data.education !== undefined) {
    normalized.education = data.education ? data.education.trim() : null;
  }
  
  if (data.resume_url !== undefined) {
    normalized.resume_url = data.resume_url ? normalizeUrl(data.resume_url) : null;
  }
  
  // Normalize array fields
  if (data.skills !== undefined) {
    normalized.skills = normalizeSkills(data.skills);
  }
  
  if (data.experience !== undefined) {
    normalized.experience = normalizeExperience(data.experience);
  }
  
  if (data.certifications !== undefined) {
    normalized.certifications = normalizeCertifications(data.certifications);
  }
  
  // Normalize URL fields
  if (data.linkedin_url !== undefined) {
    normalized.linkedin_url = data.linkedin_url ? normalizeUrl(data.linkedin_url) : null;
  }
  
  if (data.github_url !== undefined) {
    normalized.github_url = data.github_url ? normalizeUrl(data.github_url) : null;
  }
  
  if (data.portfolio_url !== undefined) {
    normalized.portfolio_url = data.portfolio_url ? normalizeUrl(data.portfolio_url) : null;
  }

  // Additional URLs
  if (data.website_url !== undefined) {
    normalized.website_url = data.website_url ? normalizeUrl(data.website_url) : null;
  }
  if (data.twitter_url !== undefined) {
    normalized.twitter_url = data.twitter_url ? normalizeUrl(data.twitter_url) : null;
  }
  if (data.mastodon_url !== undefined) {
    normalized.mastodon_url = data.mastodon_url ? normalizeUrl(data.mastodon_url) : null;
  }
  if (data.dribbble_url !== undefined) {
    normalized.dribbble_url = data.dribbble_url ? normalizeUrl(data.dribbble_url) : null;
  }
  if (data.leetcode_url !== undefined) {
    normalized.leetcode_url = data.leetcode_url ? normalizeUrl(data.leetcode_url) : null;
  }
  if (data.codeforces_url !== undefined) {
    normalized.codeforces_url = data.codeforces_url ? normalizeUrl(data.codeforces_url) : null;
  }
  if (data.hackerrank_url !== undefined) {
    normalized.hackerrank_url = data.hackerrank_url ? normalizeUrl(data.hackerrank_url) : null;
  }
  
  // Normalize deadline
  if (data.offer_deadline !== undefined) {
    normalized.offer_deadline = data.offer_deadline ? normalizeOfferDeadline(data.offer_deadline) : null;
  }

  // Arrays and lists
  const normalizeStringArray = (arr: unknown): string[] =>
    Array.isArray(arr)
      ? [...new Set(arr.filter((x: unknown) => typeof x === 'string' && (x as string).trim()).map((x: unknown) => (x as string).trim()))]
      : [];

  if (data.employment_types !== undefined) {
    normalized.employment_types = normalizeStringArray(data.employment_types as unknown);
  }
  if (data.languages !== undefined) {
    normalized.languages = normalizeStringArray(data.languages as unknown);
  }
  if (data.frameworks !== undefined) {
    normalized.frameworks = normalizeStringArray(data.frameworks as unknown);
  }

  // Simple strings
  const trimOrNull = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  if (data.location !== undefined) normalized.location = trimOrNull(data.location);
  if (data.school !== undefined) normalized.school = trimOrNull(data.school);
  if (data.degree_level !== undefined) normalized.degree_level = trimOrNull(data.degree_level);
  if (data.graduation_date !== undefined) normalized.graduation_date = trimOrNull(data.graduation_date);
  if (data.work_authorization !== undefined) normalized.work_authorization = trimOrNull(data.work_authorization);
  if (data.pronouns !== undefined) normalized.pronouns = trimOrNull(data.pronouns);
  if (data.timezone !== undefined) normalized.timezone = trimOrNull(data.timezone);
  if (data.referral_source !== undefined) normalized.referral_source = trimOrNull(data.referral_source);

  // Numeric
  if (data.gpa !== undefined) {
    const n = typeof data.gpa === 'number' ? data.gpa : parseFloat(String(data.gpa));
    normalized.gpa = isFinite(n) ? n : null;
  }
  if (data.years_experience !== undefined) {
    const n = typeof data.years_experience === 'number' ? data.years_experience : parseInt(String(data.years_experience), 10);
    normalized.years_experience = Number.isInteger(n) ? n : null;
  }

  // Booleans
  const toBoolOrNull = (v: unknown) => (typeof v === 'boolean' ? v : v == null ? null : ['true','1','yes','on'].includes(String(v).toLowerCase()) ? true : ['false','0','no','off'].includes(String(v).toLowerCase()) ? false : null);
  if (data.requires_sponsorship !== undefined) normalized.requires_sponsorship = toBoolOrNull(data.requires_sponsorship);
  if (data.open_to_relocation !== undefined) normalized.open_to_relocation = toBoolOrNull(data.open_to_relocation);
  if (data.eeo_prefer_not_to_say !== undefined) normalized.eeo_prefer_not_to_say = toBoolOrNull(data.eeo_prefer_not_to_say);

  // EEO strings
  if (data.eeo_gender !== undefined) normalized.eeo_gender = trimOrNull(data.eeo_gender);
  if (data.eeo_race_ethnicity !== undefined) normalized.eeo_race_ethnicity = trimOrNull(data.eeo_race_ethnicity);
  if (data.eeo_veteran_status !== undefined) normalized.eeo_veteran_status = trimOrNull(data.eeo_veteran_status);
  if (data.eeo_disability_status !== undefined) normalized.eeo_disability_status = trimOrNull(data.eeo_disability_status);
  
  // Preserve user_id if present (no normalization needed)
  if (data && typeof data === 'object' && 'user_id' in (data as Record<string, unknown>)) {
    normalized.user_id = (data as Record<string, unknown>).user_id as string;
  }
  
  return { ...(data as Record<string, unknown>), ...normalized } as T;
}
