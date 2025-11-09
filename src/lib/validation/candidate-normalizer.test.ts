import { describe, it, expect } from 'vitest';
import {
  normalizeName,
  normalizeEmail,
  normalizePhone,
  normalizeSkills,
  normalizeUrl,
  normalizeExperience,
  normalizeCertifications,
  normalizeDate,
  normalizeOfferDeadline,
  normalizeCandidateData
} from '@/lib/validation/candidate-normalizer';
import {
  validateCandidateProfileInsert,
  validateCandidateProfileUpdate,
  safeValidateCandidateProfileInsert,
  safeValidateCandidateProfileUpdate
} from '@/lib/validation/candidate-schema';
import type { 
  CandidateProfileInsert, 
  CandidateProfileUpdate,
  WorkExperience,
  Certification 
} from '@/lib/types/database';

describe('Candidate Data Normalization', () => {
  describe('normalizeName', () => {
    it('should convert to title case', () => {
      expect(normalizeName('john doe')).toBe('John Doe');
      expect(normalizeName('MARY JANE SMITH')).toBe('Mary Jane Smith');
      expect(normalizeName('alice-bob charlie')).toBe('Alice-bob Charlie');
    });

    it('should handle edge cases', () => {
      expect(normalizeName('')).toBe('');
      expect(normalizeName('   ')).toBe('');
      expect(normalizeName('a')).toBe('A');
      expect(normalizeName('a b c')).toBe('A B C');
    });

    it('should handle non-string inputs', () => {
      expect(normalizeName(null as any)).toBe('');
      expect(normalizeName(undefined as any)).toBe('');
      expect(normalizeName(123 as any)).toBe('');
    });
  });

  describe('normalizeEmail', () => {
    it('should convert to lowercase and trim', () => {
      expect(normalizeEmail('Test@Example.COM')).toBe('test@example.com');
      expect(normalizeEmail('  USER@DOMAIN.ORG  ')).toBe('user@domain.org');
      expect(normalizeEmail('Mixed@Case.Email')).toBe('mixed@case.email');
    });

    it('should handle edge cases', () => {
      expect(normalizeEmail('')).toBe('');
      expect(normalizeEmail('   ')).toBe('');
      expect(normalizeEmail(null as any)).toBe('');
    });
  });

  describe('normalizePhone', () => {
    it('should format 10-digit US numbers', () => {
      expect(normalizePhone('1234567890')).toBe('(123) 456-7890');
      expect(normalizePhone('555-123-4567')).toBe('(555) 123-4567');
      expect(normalizePhone('555.123.4567')).toBe('(555) 123-4567');
    });

    it('should format 11-digit US numbers with country code', () => {
      expect(normalizePhone('11234567890')).toBe('+1-123-456-7890');
      expect(normalizePhone('+11234567890')).toBe('+1-123-456-7890');
    });

    it('should handle international numbers', () => {
      expect(normalizePhone('441234567890')).toBe('+44-123-456-7890');
      expect(normalizePhone('+441234567890')).toBe('+44-123-456-7890');
    });

    it('should handle edge cases', () => {
      expect(normalizePhone('')).toBe('');
      expect(normalizePhone('123')).toBe('123');
      expect(normalizePhone('invalid')).toBe('invalid');
    });
  });

  describe('normalizeSkills', () => {
    it('should lowercase, deduplicate, and trim skills', () => {
      expect(normalizeSkills(['JavaScript', 'javascript', 'JAVASCRIPT'])).toEqual(['javascript']);
      expect(normalizeSkills(['React', '  Vue  ', 'Angular', 'react'])).toEqual(['react', 'vue', 'angular']);
    });

    it('should handle empty and invalid inputs', () => {
      expect(normalizeSkills([])).toEqual([]);
      expect(normalizeSkills(['', '   ', 'valid'])).toEqual(['valid']);
      expect(normalizeSkills(null as any)).toEqual([]);
      expect(normalizeSkills(undefined as any)).toEqual([]);
    });

    it('should filter out non-string values', () => {
      expect(normalizeSkills(['valid', 123 as any, null as any, 'another'])).toEqual(['valid', 'another']);
    });
  });

  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
      expect(normalizeUrl('github.com/user')).toBe('https://github.com/user');
    });

    it('should preserve existing protocols', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should handle invalid URLs', () => {
      expect(normalizeUrl('')).toBe('');
      expect(normalizeUrl('   ')).toBe('');
      expect(normalizeUrl('://invalid')).toBe('');
    });

    it('should handle edge cases', () => {
      expect(normalizeUrl(null as any)).toBe('');
      expect(normalizeUrl(undefined as any)).toBe('');
    });
  });

  describe('normalizeDate', () => {
    it('should convert dates to YYYY-MM format', () => {
      expect(normalizeDate('2023-06-15')).toBe('2023-06');
      expect(normalizeDate('2023-06-15T10:30:00Z')).toBe('2023-06');
      expect(normalizeDate('June 15, 2023')).toBe('2023-06');
    });

    it('should handle invalid dates', () => {
      expect(normalizeDate('invalid-date')).toBe('');
      expect(normalizeDate('')).toBe('');
      expect(normalizeDate('13-45')).toBe('');
    });
  });

  describe('normalizeOfferDeadline', () => {
    it('should convert to ISO timestamp', () => {
      const result = normalizeOfferDeadline('2024-12-31');
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should handle invalid dates', () => {
      expect(normalizeOfferDeadline('invalid')).toBeNull();
      expect(normalizeOfferDeadline('')).toBeNull();
      expect(normalizeOfferDeadline(null as any)).toBeNull();
    });
  });

  describe('normalizeExperience', () => {
    it('should normalize work experience data', () => {
      const experience: WorkExperience[] = [
        {
          company: '  Google  ',
          title: 'SOFTWARE ENGINEER',
          start_date: '2020-01-15',
          end_date: '2022-12-31',
          description: '  Developed web applications  '
        }
      ];

      const result = normalizeExperience(experience);
      expect(result).toEqual([
        {
          company: 'Google',
          title: 'SOFTWARE ENGINEER',
          start_date: '2020-01',
          end_date: '2022-12',
          description: 'Developed web applications'
        }
      ]);
    });

    it('should filter out invalid experience entries', () => {
      const experience: any[] = [
        { company: 'Valid Company', title: 'Valid Title', start_date: '2020-01' },
        { company: '', title: 'Valid Title', start_date: '2020-01' }, // Invalid - no company
        { company: 'Valid Company', title: '', start_date: '2020-01' }, // Invalid - no title
        null,
        undefined
      ];

      const result = normalizeExperience(experience);
      expect(result).toHaveLength(1);
      expect(result[0].company).toBe('Valid Company');
    });
  });

  describe('normalizeCertifications', () => {
    it('should normalize certification data', () => {
      const certifications: Certification[] = [
        {
          name: '  AWS CERTIFIED DEVELOPER  ',
          issuer: 'Amazon Web Services',
          date: '2023-06-15',
          expiry: '2026-06-15'
        }
      ];

      const result = normalizeCertifications(certifications);
      expect(result).toEqual([
        {
          name: 'AWS CERTIFIED DEVELOPER',
          issuer: 'Amazon Web Services',
          date: '2023-06',
          expiry: '2026-06'
        }
      ]);
    });
  });

  describe('normalizeCandidateData', () => {
    it('should normalize all fields in candidate data', () => {
      const input: Partial<CandidateProfileInsert> = {
        name: 'john doe',
        email: 'JOHN@EXAMPLE.COM',
        phone: '1234567890',
        skills: ['JavaScript', 'javascript', 'React'],
        linkedin_url: 'linkedin.com/in/johndoe',
        experience: [
          {
            company: 'Google',
            title: 'Engineer',
            start_date: '2020-01-15',
            end_date: null,
            description: 'Worked on web apps'
          }
        ]
      };

      const result = normalizeCandidateData(input);
      expect(result).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '(123) 456-7890',
        skills: ['javascript', 'react'],
        linkedin_url: 'https://linkedin.com/in/johndoe',
        experience: [
          {
            company: 'Google',
            title: 'Engineer',
            start_date: '2020-01',
            end_date: null,
            description: 'Worked on web apps'
          }
        ]
      });
    });
  });
});

describe('Candidate Data Validation', () => {
  describe('validateCandidateProfileInsert', () => {
    it('should validate valid candidate profile data', () => {
      const validData: CandidateProfileInsert = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1-555-123-4567',
        education: 'Bachelor of Computer Science',
        skills: ['javascript', 'react'],
        experience: [
          {
            company: 'Google',
            title: 'Software Engineer',
            start_date: '2020-01',
            end_date: '2022-12',
            description: 'Developed web applications'
          }
        ],
        certifications: [
          {
            name: 'AWS Certified Developer',
            issuer: 'Amazon Web Services',
            date: '2023-06',
            expiry: '2026-06'
          }
        ]
      };

      expect(() => validateCandidateProfileInsert(validData)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'invalid-email'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        user_id: 'not-a-uuid',
        name: 'John Doe',
        email: 'john@example.com'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: '',
        email: 'john@example.com'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid date format in experience', () => {
      const invalidData = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        experience: [
          {
            company: 'Google',
            title: 'Engineer',
            start_date: 'invalid-date',
            end_date: null,
            description: 'Work'
          }
        ]
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });
  });

  describe('validateCandidateProfileUpdate', () => {
    it('should validate partial update data', () => {
      const updateData: CandidateProfileUpdate = {
        name: 'John Updated',
        skills: ['javascript', 'typescript', 'react']
      };

      expect(() => validateCandidateProfileUpdate(updateData)).not.toThrow();
    });

    it('should reject invalid data in updates', () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };

      expect(() => validateCandidateProfileUpdate(invalidUpdate)).toThrow();
    });
  });

  describe('safeValidateCandidateProfileInsert', () => {
    it('should return success for valid data', () => {
      const validData: CandidateProfileInsert = {
        user_id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com'
      };

      const result = safeValidateCandidateProfileInsert(validData);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        user_id: 'not-a-uuid',
        name: 'John Doe',
        email: 'invalid-email'
      };

      const result = safeValidateCandidateProfileInsert(invalidData);
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
    });
  });

  describe('safeValidateCandidateProfileUpdate', () => {
    it('should return success for valid update data', () => {
      const validUpdate: CandidateProfileUpdate = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      };

      const result = safeValidateCandidateProfileUpdate(validUpdate);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return error for invalid update data', () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };

      const result = safeValidateCandidateProfileUpdate(invalidUpdate);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
