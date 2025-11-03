import type { 
  CandidateProfile, 
  CandidateProfileInsert, 
  CandidateProfileUpdate,
  WorkExperience,
  Certification 
} from '@/lib/types/database';

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
export function normalizeCandidateData(
  data: Partial<CandidateProfileInsert | CandidateProfileUpdate>
): Partial<CandidateProfileInsert | CandidateProfileUpdate> {
  const normalized: any = {};
  
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
  
  // Normalize deadline
  if (data.offer_deadline !== undefined) {
    normalized.offer_deadline = data.offer_deadline ? normalizeOfferDeadline(data.offer_deadline) : null;
  }
  
  // Preserve user_id if present (no normalization needed)
  // user_id only exists on CandidateProfileInsert, not CandidateProfileUpdate
  if ('user_id' in data && data.user_id !== undefined) {
    normalized.user_id = data.user_id;
  }
  
  return normalized;
}
