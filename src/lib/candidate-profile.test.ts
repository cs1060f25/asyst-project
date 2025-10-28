import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { 
  CandidateProfile, 
  CandidateProfileInsert, 
  CandidateProfileUpdate,
  WorkExperience,
  Certification 
} from '@/lib/types/database';

// Mock Supabase client
const mockSupabaseClient = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn()
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn()
    }))
  }))
};

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient))
}));

// Import after mocking
import {
  getCandidateProfile,
  createCandidateProfile,
  updateCandidateProfile,
  deleteCandidateProfile,
} from '@/lib/storage';

describe('Candidate Profile Database Operations', () => {
  const mockUserId = 'test-user-id-123';
  const mockProfileId = 'test-profile-id-456';
  
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

  const mockCandidateProfile: CandidateProfile = {
    id: mockProfileId,
    user_id: mockUserId,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-123-4567',
    education: 'Bachelor of Computer Science',
    resume_url: 'https://example.com/resume.pdf',
    skills: ['javascript', 'typescript', 'react'],
    experience: [mockWorkExperience],
    certifications: [mockCertification],
    linkedin_url: 'https://linkedin.com/in/johndoe',
    github_url: 'https://github.com/johndoe',
    portfolio_url: 'https://johndoe.dev',
    offer_deadline: '2024-02-15T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCandidateProfile', () => {
    it('should return candidate profile when found', async () => {
      // Mock successful response
      const mockSingle = mockSupabaseClient.from().select().eq().single;
      mockSingle.mockResolvedValueOnce({
        data: mockCandidateProfile,
        error: null
      });

      const result = await getCandidateProfile(mockUserId);

      expect(result).toEqual(mockCandidateProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('candidate_profiles');
    });

    it('should return null when profile not found', async () => {
      // Mock no rows response
      const mockSingle = mockSupabaseClient.from().select().eq().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }
      });

      const result = await getCandidateProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('should throw error on database error', async () => {
      // Mock database error
      const mockSingle = mockSupabaseClient.from().select().eq().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(getCandidateProfile(mockUserId)).rejects.toThrow();
    });
  });

  describe('createCandidateProfile', () => {
    it('should create new candidate profile successfully', async () => {
      const profileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        skills: ['python', 'django'],
        experience: [],
        certifications: []
      };

      // Mock successful creation
      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: mockCandidateProfile,
        error: null
      });

      const result = await createCandidateProfile(profileInsert);

      expect(result).toEqual(mockCandidateProfile);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('candidate_profiles');
    });

    it('should handle profile creation with all fields', async () => {
      const fullProfileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Full Profile User',
        email: 'full@example.com',
        phone: '+1-555-987-6543',
        education: 'Master of Science',
        resume_url: 'https://example.com/full-resume.pdf',
        skills: ['java', 'spring', 'microservices'],
        experience: [mockWorkExperience],
        certifications: [mockCertification],
        linkedin_url: 'https://linkedin.com/in/fulluser',
        github_url: 'https://github.com/fulluser',
        portfolio_url: 'https://fulluser.dev',
        offer_deadline: '2024-03-01T00:00:00Z'
      };

      // Mock successful creation
      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: mockCandidateProfile,
        error: null
      });

      const result = await createCandidateProfile(fullProfileInsert);

      expect(result).toEqual(mockCandidateProfile);
    });

    it('should throw error on creation failure', async () => {
      const profileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Test User',
        email: 'test@example.com'
      };

      // Mock creation error
      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Duplicate email' }
      });

      await expect(createCandidateProfile(profileInsert)).rejects.toThrow();
    });
  });

  describe('updateCandidateProfile', () => {
    it('should update candidate profile successfully', async () => {
      const updates: CandidateProfileUpdate = {
        name: 'John Updated',
        skills: ['javascript', 'typescript', 'react', 'node.js']
      };

      // Mock successful update
      const mockSingle = mockSupabaseClient.from().update().eq().select().single;
      mockSingle.mockResolvedValueOnce({
        data: { ...mockCandidateProfile, ...updates },
        error: null
      });

      const result = await updateCandidateProfile(mockUserId, updates);

      expect(result.name).toBe('John Updated');
      expect(result.skills).toEqual(['javascript', 'typescript', 'react', 'node.js']);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('candidate_profiles');
    });

    it('should handle partial updates', async () => {
      const partialUpdates: CandidateProfileUpdate = {
        phone: '+1-555-999-8888',
        linkedin_url: 'https://linkedin.com/in/johnupdated'
      };

      // Mock successful update
      const mockSingle = mockSupabaseClient.from().update().eq().select().single;
      mockSingle.mockResolvedValueOnce({
        data: { ...mockCandidateProfile, ...partialUpdates },
        error: null
      });

      const result = await updateCandidateProfile(mockUserId, partialUpdates);

      expect(result.phone).toBe('+1-555-999-8888');
      expect(result.linkedin_url).toBe('https://linkedin.com/in/johnupdated');
    });

    it('should throw error on update failure', async () => {
      const updates: CandidateProfileUpdate = {
        email: 'invalid-email'
      };

      // Mock update error
      const mockSingle = mockSupabaseClient.from().update().eq().select().single;
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid email format' }
      });

      await expect(updateCandidateProfile(mockUserId, updates)).rejects.toThrow();
    });
  });

  describe('deleteCandidateProfile', () => {
    it('should delete candidate profile successfully', async () => {
      // Mock successful deletion
      const mockEq = mockSupabaseClient.from().delete().eq;
      mockEq.mockResolvedValueOnce({
        data: null,
        error: null
      });

      await deleteCandidateProfile(mockUserId);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('candidate_profiles');
      expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw error on deletion failure', async () => {
      // Mock deletion error
      const mockEq = mockSupabaseClient.from().delete().eq;
      mockEq.mockResolvedValueOnce({
        data: null,
        error: { message: 'Profile not found' }
      });

      await expect(deleteCandidateProfile(mockUserId)).rejects.toThrow();
    });
  });

  describe('Array and JSONB field handling', () => {
    it('should handle empty skills array', async () => {
      const profileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Empty Skills User',
        email: 'empty@example.com',
        skills: []
      };

      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: { ...mockCandidateProfile, skills: [] },
        error: null
      });

      const result = await createCandidateProfile(profileInsert);

      expect(result.skills).toEqual([]);
    });

    it('should handle multiple work experiences', async () => {
      const multipleExperiences: WorkExperience[] = [
        mockWorkExperience,
        {
          company: 'Another Company',
          title: 'Senior Developer',
          start_date: '2023-01',
          end_date: null,
          description: 'Leading development team'
        }
      ];

      const profileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Multi Experience User',
        email: 'multi@example.com',
        experience: multipleExperiences
      };

      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: { ...mockCandidateProfile, experience: multipleExperiences },
        error: null
      });

      const result = await createCandidateProfile(profileInsert);

      expect(result.experience).toHaveLength(2);
      expect(result.experience[1].company).toBe('Another Company');
    });

    it('should handle null optional fields', async () => {
      const profileInsert: CandidateProfileInsert = {
        user_id: mockUserId,
        name: 'Minimal User',
        email: 'minimal@example.com',
        phone: null,
        education: null,
        resume_url: null,
        linkedin_url: null,
        github_url: null,
        portfolio_url: null,
        offer_deadline: null
      };

      const mockSingle = mockSupabaseClient.from().insert().select().single;
      mockSingle.mockResolvedValueOnce({
        data: { ...mockCandidateProfile, ...profileInsert },
        error: null
      });

      const result = await createCandidateProfile(profileInsert);

      expect(result.phone).toBeNull();
      expect(result.education).toBeNull();
      expect(result.resume_url).toBeNull();
    });
  });
});