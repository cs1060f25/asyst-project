import { describe, it, expect } from 'vitest';
import {
  validateCandidateProfileInsert,
  validateCandidateProfileUpdate,
  safeValidateCandidateProfileInsert,
  safeValidateCandidateProfileUpdate,
  CandidateProfileInsertSchema,
  CandidateProfileUpdateSchema
} from '@/lib/validation/candidate-schema';
import type { 
  CandidateProfileInsert, 
  CandidateProfileUpdate,
  WorkExperience,
  Certification 
} from '@/lib/types/database';

describe('Candidate Profile Validation Schema', () => {
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000';
  
  const mockWorkExperience: WorkExperience = {
    company: 'Test Company',
    title: 'Software Engineer',
    start_date: '2020-01',
    end_date: '2022-12',
    description: 'Developed web applications'
  };

  const mockCertification: Certification = {
    name: 'AWS Certified Developer',
    issuer: 'Amazon Web Services',
    date: '2023-06',
    expiry: '2026-06'
  };

  const validProfileInsert: CandidateProfileInsert = {
    user_id: mockUserId,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1-555-123-4567',
    education: 'Bachelor of Computer Science',
    resume_url: 'https://example.com/resume.pdf',
    skills: ['javascript', 'react', 'typescript'],
    experience: [mockWorkExperience],
    certifications: [mockCertification],
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    portfolio_url: 'https://johndoe.dev',
    offer_deadline: '2024-12-31T23:59:59Z'
  };

  describe('validateCandidateProfileInsert', () => {
    it('should validate valid candidate profile data', () => {
      expect(() => validateCandidateProfileInsert(validProfileInsert)).not.toThrow();
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validProfileInsert,
        email: 'invalid-email'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid UUID format', () => {
      const invalidData = {
        ...validProfileInsert,
        user_id: 'not-a-uuid'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject empty name', () => {
      const invalidData = {
        ...validProfileInsert,
        name: ''
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject name that is too long', () => {
      const invalidData = {
        ...validProfileInsert,
        name: 'A'.repeat(101) // Over 100 character limit
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid phone format', () => {
      const invalidData = {
        ...validProfileInsert,
        phone: 'not-a-phone'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid URL format', () => {
      const invalidData = {
        ...validProfileInsert,
        linkedin_url: 'not-a-url'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid date format in experience', () => {
      const invalidExperience: WorkExperience[] = [
        {
          company: 'Test Company',
          title: 'Engineer',
          start_date: 'invalid-date',
          end_date: null,
          description: 'Work'
        }
      ];

      const invalidData = {
        ...validProfileInsert,
        experience: invalidExperience
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject too many skills', () => {
      const invalidData = {
        ...validProfileInsert,
        skills: Array.from({ length: 51 }, (_, i) => `skill-${i}`) // Over 50 limit
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject too many work experiences', () => {
      const invalidData = {
        ...validProfileInsert,
        experience: Array.from({ length: 21 }, (_, i) => ({
          company: `Company ${i}`,
          title: `Title ${i}`,
          start_date: '2020-01',
          end_date: null,
          description: 'Work'
        }))
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should reject invalid offer deadline format', () => {
      const invalidData = {
        ...validProfileInsert,
        offer_deadline: 'not-a-datetime'
      };

      expect(() => validateCandidateProfileInsert(invalidData)).toThrow();
    });

    it('should accept valid optional fields', () => {
      const minimalData = {
        user_id: mockUserId,
        name: 'John Doe',
        email: 'john@example.com'
      };

      expect(() => validateCandidateProfileInsert(minimalData)).not.toThrow();
    });

    it('should accept null optional fields', () => {
      const dataWithNulls = {
        ...validProfileInsert,
        phone: null,
        education: null,
        resume_url: null,
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        offer_deadline: null
      };

      expect(() => validateCandidateProfileInsert(dataWithNulls)).not.toThrow();
    });
  });

  describe('validateCandidateProfileUpdate', () => {
    it('should validate valid update data', () => {
      const updateData: CandidateProfileUpdate = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      };

      expect(() => validateCandidateProfileUpdate(updateData)).not.toThrow();
    });

    it('should reject invalid email in update', () => {
      const invalidUpdate = {
        email: 'invalid-email-format'
      };

      expect(() => validateCandidateProfileUpdate(invalidUpdate)).toThrow();
    });

    it('should accept partial updates', () => {
      const partialUpdate = {
        name: 'New Name'
      };

      expect(() => validateCandidateProfileUpdate(partialUpdate)).not.toThrow();
    });

    it('should accept empty update object', () => {
      expect(() => validateCandidateProfileUpdate({})).not.toThrow();
    });
  });

  describe('safeValidateCandidateProfileInsert', () => {
    it('should return success for valid data', () => {
      const result = safeValidateCandidateProfileInsert(validProfileInsert);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.error).toBeUndefined();
    });

    it('should return error for invalid data', () => {
      const invalidData = {
        ...validProfileInsert,
        email: 'invalid-email'
      };

      const result = safeValidateCandidateProfileInsert(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBeDefined();
      expect(result.error?.issues).toHaveLength(1);
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const invalidData = {
        user_id: 'not-a-uuid',
        name: '',
        email: 'invalid-email'
      };

      const result = safeValidateCandidateProfileInsert(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error?.issues.length).toBeGreaterThan(1);
    });
  });

  describe('safeValidateCandidateProfileUpdate', () => {
    it('should return success for valid update data', () => {
      const updateData: CandidateProfileUpdate = {
        name: 'John Updated',
        skills: ['javascript', 'react']
      };

      const result = safeValidateCandidateProfileUpdate(updateData);
      
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

  describe('Schema edge cases', () => {
    it('should handle skills with empty strings', () => {
      const dataWithEmptySkills = {
        ...validProfileInsert,
        skills: ['', 'valid-skill', '']
      };

      expect(() => validateCandidateProfileInsert(dataWithEmptySkills)).not.toThrow();
    });

    it('should handle skills that are too long', () => {
      const dataWithLongSkill = {
        ...validProfileInsert,
        skills: ['a'.repeat(51)] // Over 50 character limit
      };

      expect(() => validateCandidateProfileInsert(dataWithLongSkill)).toThrow();
    });

    it('should handle work experience with empty description', () => {
      const experienceWithEmptyDesc: WorkExperience[] = [
        {
          company: 'Test Company',
          title: 'Engineer',
          start_date: '2020-01',
          end_date: null,
          description: ''
        }
      ];

      const dataWithEmptyDesc = {
        ...validProfileInsert,
        experience: experienceWithEmptyDesc
      };

      expect(() => validateCandidateProfileInsert(dataWithEmptyDesc)).not.toThrow();
    });

    it('should handle certification with null expiry', () => {
      const certWithNullExpiry: Certification[] = [
        {
          name: 'Test Certification',
          issuer: 'Test Issuer',
          date: '2023-01',
          expiry: null
        }
      ];

      const dataWithNullExpiry = {
        ...validProfileInsert,
        certifications: certWithNullExpiry
      };

      expect(() => validateCandidateProfileInsert(dataWithNullExpiry)).not.toThrow();
    });

    it('should handle education that is too long', () => {
      const dataWithLongEducation = {
        ...validProfileInsert,
        education: 'A'.repeat(201) // Over 200 character limit
      };

      expect(() => validateCandidateProfileInsert(dataWithLongEducation)).toThrow();
    });
  });
});
