import type { 
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
export function normalizeExperienceStrings(experience: string[]): string[] {
  if (!Array.isArray(experience)) return [];
  return [...new Set(experience.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean))];
}

// Normalize YYYY-MM or wider date inputs to YYYY-MM
export function normalizeDate(date: string): string {
  if (!date || typeof date !== 'string') return '';
  const trimmed = date.trim();
  if (!trimmed) return '';
  try {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  } catch {
    return '';
  }
}

// Normalize structured WorkExperience[]
export function normalizeExperience(experience: WorkExperience[]): WorkExperience[] {
  if (!Array.isArray(experience)) return [];
  const toYYYYMM = (val: string | null): string | null => {
    if (val == null || val === '') return val;
    const n = normalizeDate(val);
    return n || null;
  };
  return experience
    .filter((e) => e && typeof e === 'object')
    .map((e) => ({
      company: (e.company || '').toString().trim(),
      title: (e.title || '').toString().trim(),
      start_date: toYYYYMM(e.start_date) || '',
      end_date: toYYYYMM(e.end_date),
      description: (e.description ?? '').toString().trim(),
    }))
    .filter((e) => !!e.company && !!e.title && !!e.start_date);
}

/**
 * Normalize certification data
 * @param certifications - Raw certifications array
 * @returns Normalized certifications array
 */
export function normalizeCertificationStrings(certifications: string[]): string[] {
  if (!Array.isArray(certifications)) return [];
  return [...new Set(certifications.filter(x => typeof x === 'string').map(x => x.trim()).filter(Boolean))];
}

// Normalize structured Certification[]
export function normalizeCertifications(certs: Certification[]): Certification[] {
  if (!Array.isArray(certs)) return [];
  const toYYYYMM = (val: string | null): string | null => {
    if (val == null || val === '') return val;
    const n = normalizeDate(val);
    return n || null;
  };
  return certs
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      name: (c.name || '').toString().trim(),
      issuer: (c.issuer || '').toString().trim(),
      date: toYYYYMM(c.date) || '',
      expiry: toYYYYMM(c.expiry),
    }))
    .filter((c) => !!c.name && !!c.issuer && !!c.date);
}

/**
 * Normalize date to YYYY-MM format
 * @param date - Raw date input
 * @returns Normalized date in YYYY-MM format or empty string if invalid
 */
export function normalizeDateYYYYMM(date: string): string {
  if (!date || typeof date !== 'string') {
    return '';
  }
  
  const trimmed = date.trim();
  if (!trimmed) {
    return '';
  }
  
  try {
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
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
    const d = new Date(trimmed);
    if (isNaN(d.getTime())) return null;
    return d.toISOString();
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
    // Prefer structured normalization; fallback to strings if provided as such
    const expUnknown = data.experience as unknown;
    if (Array.isArray(expUnknown) && expUnknown.length > 0) {
      const first = expUnknown[0];
      if (typeof first === 'object' && first !== null) {
        normalized.experience = normalizeExperience(expUnknown as WorkExperience[]);
      } else {
        normalized.experience = normalizeExperienceStrings(expUnknown as string[]);
      }
    } else {
      normalized.experience = [];
    }
  }
  
  if (data.certifications !== undefined) {
    const certsUnknown = data.certifications as unknown;
    if (Array.isArray(certsUnknown) && certsUnknown.length > 0) {
      const first = certsUnknown[0];
      if (typeof first === 'object' && first !== null) {
        normalized.certifications = normalizeCertifications(certsUnknown as Certification[]);
      } else {
        normalized.certifications = normalizeCertificationStrings(certsUnknown as string[]);
      }
    } else {
      normalized.certifications = [];
    }
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
  if (data.graduation_date !== undefined) {
    const d = new Date(String(data.graduation_date));
    if (!isNaN(d.getTime())) {
      // Use UTC components to avoid timezone shifting dates backward
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      normalized.graduation_date = `${y}-${m}-${day}`;
    } else {
      normalized.graduation_date = null;
    }
  }
  if (data.work_authorization !== undefined) normalized.work_authorization = trimOrNull(data.work_authorization);
  if (data.pronouns !== undefined) normalized.pronouns = trimOrNull(data.pronouns);
  if (data.timezone !== undefined) normalized.timezone = trimOrNull(data.timezone);
  if (data.referral_source !== undefined) normalized.referral_source = trimOrNull(data.referral_source);

  // Numeric
  if (data.gpa !== undefined) {
    const nRaw = typeof data.gpa === 'number' ? data.gpa : parseFloat(String(data.gpa));
    if (isFinite(nRaw)) {
      const n = Math.round(nRaw * 100) / 100; // round to 2 decimals to avoid -0.01 artifacts
      normalized.gpa = Math.min(4, Math.max(0, n));
    } else {
      normalized.gpa = null;
    }
  }
  if (data.years_of_experience !== undefined) {
    const n = typeof data.years_of_experience === 'number' ? data.years_of_experience : parseInt(String(data.years_of_experience), 10);
    normalized.years_of_experience = Number.isInteger(n) ? n : null;
  }

  // Booleans
  const toBoolOrNull = (v: unknown) => (typeof v === 'boolean' ? v : v == null ? null : ['true','1','yes','on'].includes(String(v).toLowerCase()) ? true : ['false','0','no','off'].includes(String(v).toLowerCase()) ? false : null);
  if (data.requires_sponsorship !== undefined) normalized.requires_sponsorship = toBoolOrNull(data.requires_sponsorship);
  if (data.open_to_relocation !== undefined) normalized.open_to_relocation = toBoolOrNull(data.open_to_relocation);
  // eeo_prefer_not_to_say not in DB

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
