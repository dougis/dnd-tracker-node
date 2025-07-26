import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService, UpdatePartyData } from '../PartyService';
import { createMockPrisma } from './PartyService.helpers';

describe('PartyService - miscellaneous tests', () => {
  let partyService: PartyService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    partyService = new PartyService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Note: Private method tests removed as methods were consolidated into main public methods for complexity reduction
  describe.skip('private methods', () => {
    describe('validateUpdateData', () => {
      it('should not throw for valid data', () => {
        const validData: UpdatePartyData = {
          name: 'Valid Name',
          description: 'Valid description',
          isArchived: false
        };

        expect(() => (partyService as any).validateUpdateData(validData)).not.toThrow();
      });

      it('should not throw when name is undefined', () => {
        const dataWithoutName: UpdatePartyData = {
          description: 'Only description'
        };

        expect(() => (partyService as any).validateUpdateData(dataWithoutName)).not.toThrow();
      });

      it('should throw when name is empty string', () => {
        const invalidData: UpdatePartyData = { name: '' };

        expect(() => (partyService as any).validateUpdateData(invalidData))
          .toThrow('Party name cannot be empty');
      });

      it('should throw when name is whitespace only', () => {
        const invalidData: UpdatePartyData = { name: '   ' };

        expect(() => (partyService as any).validateUpdateData(invalidData))
          .toThrow('Party name cannot be empty');
      });
    });

    describe('buildUpdateData', () => {
      it('should build update data correctly with all fields', () => {
        const inputData: UpdatePartyData = {
          name: '  Test Name  ',
          description: '  Test Description  ',
          isArchived: true
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({
          name: 'Test Name',
          description: 'Test Description',
          isArchived: true
        });
      });

      it('should build update data with only name', () => {
        const inputData: UpdatePartyData = {
          name: '  Only Name  '
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({
          name: 'Only Name'
        });
      });

      it('should convert empty description to null', () => {
        const inputData: UpdatePartyData = {
          description: ''
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({
          description: null
        });
      });

      it('should convert whitespace-only description to null', () => {
        const inputData: UpdatePartyData = {
          description: '   '
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({
          description: null
        });
      });

      it('should handle isArchived field', () => {
        const inputData: UpdatePartyData = {
          isArchived: false
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({
          isArchived: false
        });
      });

      it('should return empty object when no fields provided', () => {
        const inputData: UpdatePartyData = {};

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({});
      });

      it('should handle undefined values correctly', () => {
        const inputData = {
          name: undefined,
          description: undefined,
          isArchived: undefined
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({});
      });
    });
  });
});