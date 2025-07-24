import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PartyService, CreatePartyData, UpdatePartyData } from './PartyService';

// Create mock data helpers
const createMockParty = (overrides = {}) => ({
  id: 'party_123',
  userId: 'user_123',
  name: 'Test Party',
  description: 'Test party description',
  isArchived: false,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  ...overrides
});

// Create mock Prisma client with comprehensive mocking
const mockPrisma = {
  party: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
} as unknown as PrismaClient;

describe('PartyService', () => {
  let partyService: PartyService;

  beforeEach(() => {
    partyService = new PartyService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
    const validCreateData: CreatePartyData = {
      name: 'Adventure Party',
      description: 'A group of brave adventurers'
    };

    it('should create a party with valid data', async () => {
      const mockCreatedParty = createMockParty({
        name: 'Adventure Party',
        description: 'A group of brave adventurers'
      });

      mockPrisma.party.create = vi.fn().mockResolvedValue(mockCreatedParty);

      const result = await partyService.create('user_123', validCreateData);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Adventure Party',
          description: 'A group of brave adventurers',
        },
      });

      expect(result).toEqual(mockCreatedParty);
    });

    it('should create party with minimal data (name only)', async () => {
      const minimalData: CreatePartyData = {
        name: 'Simple Party'
      };

      const expectedParty = createMockParty({
        name: 'Simple Party',
        description: null
      });

      mockPrisma.party.create = vi.fn().mockResolvedValue(expectedParty);

      const result = await partyService.create('user_123', minimalData);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Simple Party',
          description: null,
        },
      });

      expect(result).toEqual(expectedParty);
    });

    it('should trim name and description fields', async () => {
      const dataWithSpaces: CreatePartyData = {
        name: '  Spaced Party  ',
        description: '  Spaced Description  '
      };

      const expectedParty = createMockParty({
        name: 'Spaced Party',
        description: 'Spaced Description'
      });

      mockPrisma.party.create = vi.fn().mockResolvedValue(expectedParty);

      await partyService.create('user_123', dataWithSpaces);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Spaced Party',
          description: 'Spaced Description',
        },
      });
    });

    it('should convert empty description to null', async () => {
      const dataWithEmptyDescription: CreatePartyData = {
        name: 'Party With Empty Description',
        description: ''
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', dataWithEmptyDescription);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Party With Empty Description',
          description: null,
        },
      });
    });

    it('should convert whitespace-only description to null', async () => {
      const dataWithWhitespaceDescription: CreatePartyData = {
        name: 'Party With Whitespace Description',
        description: '   '
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', dataWithWhitespaceDescription);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Party With Whitespace Description',
          description: null,
        },
      });
    });

    it('should throw error for empty name', async () => {
      const invalidData: CreatePartyData = { name: '' };

      await expect(partyService.create('user_123', invalidData))
        .rejects.toThrow('Party name is required');

      expect(mockPrisma.party.create).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData: CreatePartyData = { name: '   ' };

      await expect(partyService.create('user_123', invalidData))
        .rejects.toThrow('Party name is required');

      expect(mockPrisma.party.create).not.toHaveBeenCalled();
    });

    it('should throw error for missing name', async () => {
      const invalidData = {} as CreatePartyData;

      await expect(partyService.create('user_123', invalidData))
        .rejects.toThrow('Party name is required');

      expect(mockPrisma.party.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during creation', async () => {
      mockPrisma.party.create = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.create('user_123', validCreateData))
        .rejects.toThrow('Failed to create party: Database error');
    });

    it('should handle generic errors during creation', async () => {
      mockPrisma.party.create = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.create('user_123', validCreateData))
        .rejects.toThrow('Failed to create party');
    });
  });

  describe('findByUserId', () => {
    it('should return all non-archived parties for user by default', async () => {
      const mockParties = [
        createMockParty({ id: 'party_1', name: 'Party 1', isArchived: false }),
        createMockParty({ id: 'party_2', name: 'Party 2', isArchived: false })
      ];

      mockPrisma.party.findMany = vi.fn().mockResolvedValue(mockParties);

      const result = await partyService.findByUserId('user_123');

      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
          isArchived: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(mockParties);
    });

    it('should return all parties including archived when includeArchived is true', async () => {
      const mockParties = [
        createMockParty({ id: 'party_1', name: 'Active Party', isArchived: false }),
        createMockParty({ id: 'party_2', name: 'Archived Party', isArchived: true })
      ];

      mockPrisma.party.findMany = vi.fn().mockResolvedValue(mockParties);

      const result = await partyService.findByUserId('user_123', true);

      expect(mockPrisma.party.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user_123',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      expect(result).toEqual(mockParties);
    });

    it('should return empty array when user has no parties', async () => {
      mockPrisma.party.findMany = vi.fn().mockResolvedValue([]);

      const result = await partyService.findByUserId('user_123');

      expect(result).toEqual([]);
    });

    it('should handle database errors during fetch', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties: Database error');
    });

    it('should handle generic errors during fetch', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties');
    });
  });

  describe('findById', () => {
    it('should return party when found and belongs to user', async () => {
      const mockParty = createMockParty();

      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(mockParty);

      const result = await partyService.findById('party_123', 'user_123');

      expect(mockPrisma.party.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
          userId: 'user_123',
        },
      });

      expect(result).toEqual(mockParty);
    });

    it('should return null when party not found', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      const result = await partyService.findById('nonexistent', 'user_123');

      expect(result).toBeNull();
    });

    it('should return null when party belongs to different user', async () => {
      mockPrisma.party.findFirst = vi.fn().mockResolvedValue(null);

      const result = await partyService.findById('party_123', 'different_user');

      expect(result).toBeNull();
    });

    it('should handle database errors during fetch', async () => {
      mockPrisma.party.findFirst = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.findById('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch party: Database error');
    });

    it('should handle generic errors during fetch', async () => {
      mockPrisma.party.findFirst = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.findById('party_123', 'user_123'))
        .rejects.toThrow('Failed to fetch party');
    });
  });

  describe('update', () => {
    const validUpdateData: UpdatePartyData = {
      name: 'Updated Party',
      description: 'Updated description'
    };

    it('should update party successfully', async () => {
      const existingParty = createMockParty();
      const updatedParty = createMockParty({
        name: 'Updated Party',
        description: 'Updated description'
      });

      // Mock findById to return existing party
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(updatedParty);

      const result = await partyService.update('party_123', 'user_123', validUpdateData);

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
        data: {
          name: 'Updated Party',
          description: 'Updated description',
        },
      });

      expect(result).toEqual(updatedParty);
    });

    it('should return null when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.update('nonexistent', 'user_123', validUpdateData);

      expect(result).toBeNull();
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should update only provided fields', async () => {
      const existingParty = createMockParty();
      const partialUpdateData: UpdatePartyData = {
        name: 'Only Name Updated'
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', partialUpdateData);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          name: 'Only Name Updated',
        },
      });
    });

    it('should handle string field trimming correctly', async () => {
      const existingParty = createMockParty();
      const updateDataWithSpaces: UpdatePartyData = {
        name: '  Trimmed Name  ',
        description: '  Trimmed Description  '
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataWithSpaces);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          name: 'Trimmed Name',
          description: 'Trimmed Description',
        },
      });
    });

    it('should convert empty description to null', async () => {
      const existingParty = createMockParty();
      const updateDataWithEmptyDescription: UpdatePartyData = {
        description: ''
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataWithEmptyDescription);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          description: null,
        },
      });
    });

    it('should convert whitespace-only description to null', async () => {
      const existingParty = createMockParty();
      const updateDataWithWhitespaceDescription: UpdatePartyData = {
        description: '   '
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', updateDataWithWhitespaceDescription);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          description: null,
        },
      });
    });

    it('should update isArchived field', async () => {
      const existingParty = createMockParty();
      const archiveUpdateData: UpdatePartyData = {
        isArchived: true
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', archiveUpdateData);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          isArchived: true,
        },
      });
    });

    it('should update all fields at once', async () => {
      const existingParty = createMockParty();
      const comprehensiveUpdateData: UpdatePartyData = {
        name: 'Complete Update',
        description: 'Complete description update',
        isArchived: true
      };

      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue(createMockParty());

      await partyService.update('party_123', 'user_123', comprehensiveUpdateData);

      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: { id: 'party_123' },
        data: {
          name: 'Complete Update',
          description: 'Complete description update',
          isArchived: true,
        },
      });
    });

    it('should throw error for empty name', async () => {
      const invalidData: UpdatePartyData = { name: '' };

      await expect(partyService.update('party_123', 'user_123', invalidData))
        .rejects.toThrow('Party name cannot be empty');

      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData: UpdatePartyData = { name: '   ' };

      await expect(partyService.update('party_123', 'user_123', invalidData))
        .rejects.toThrow('Party name cannot be empty');

      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during update', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.update('party_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update party: Database error');
    });

    it('should handle generic errors during update', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.update('party_123', 'user_123', validUpdateData))
        .rejects.toThrow('Failed to update party');
    });
  });

  describe('delete', () => {
    it('should soft delete party successfully', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockResolvedValue({
        ...existingParty,
        isArchived: true
      });

      const result = await partyService.delete('party_123', 'user_123');

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.update).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
        data: {
          isArchived: true,
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.delete('nonexistent', 'user_123');

      expect(result).toBe(false);
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should return false when party belongs to different user', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.delete('party_123', 'different_user');

      expect(result).toBe(false);
      expect(mockPrisma.party.update).not.toHaveBeenCalled();
    });

    it('should handle database errors during deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.delete('party_123', 'user_123'))
        .rejects.toThrow('Failed to delete party: Database error');
    });

    it('should handle generic errors during deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.update = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.delete('party_123', 'user_123'))
        .rejects.toThrow('Failed to delete party');
    });
  });

  describe('hardDelete', () => {
    it('should hard delete party successfully', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockResolvedValue(existingParty);

      const result = await partyService.hardDelete('party_123', 'user_123');

      expect(partyService.findById).toHaveBeenCalledWith('party_123', 'user_123');
      expect(mockPrisma.party.delete).toHaveBeenCalledWith({
        where: {
          id: 'party_123',
        },
      });

      expect(result).toBe(true);
    });

    it('should return false when party not found', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.hardDelete('nonexistent', 'user_123');

      expect(result).toBe(false);
      expect(mockPrisma.party.delete).not.toHaveBeenCalled();
    });

    it('should return false when party belongs to different user', async () => {
      vi.spyOn(partyService, 'findById').mockResolvedValue(null);

      const result = await partyService.hardDelete('party_123', 'different_user');

      expect(result).toBe(false);
      expect(mockPrisma.party.delete).not.toHaveBeenCalled();
    });

    it('should handle database errors during hard deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockRejectedValue(new Error('Database error'));

      await expect(partyService.hardDelete('party_123', 'user_123'))
        .rejects.toThrow('Failed to permanently delete party: Database error');
    });

    it('should handle generic errors during hard deletion', async () => {
      const existingParty = createMockParty();
      vi.spyOn(partyService, 'findById').mockResolvedValue(existingParty);
      mockPrisma.party.delete = vi.fn().mockRejectedValue('Unknown error');

      await expect(partyService.hardDelete('party_123', 'user_123'))
        .rejects.toThrow('Failed to permanently delete party');
    });
  });

  describe('private methods', () => {
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
        const inputData: UpdatePartyData = {
          name: undefined,
          description: undefined,
          isArchived: undefined
        };

        const result = (partyService as any).buildUpdateData(inputData);

        expect(result).toEqual({});
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null description in create', async () => {
      const dataWithNullDescription: CreatePartyData = {
        name: 'Party With Null Description',
        description: null as any
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', dataWithNullDescription);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Party With Null Description',
          description: null,
        },
      });
    });

    it('should handle undefined description in create', async () => {
      const dataWithUndefinedDescription: CreatePartyData = {
        name: 'Party With Undefined Description'
        // description is undefined
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', dataWithUndefinedDescription);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: 'Party With Undefined Description',
          description: null,
        },
      });
    });

    it('should handle very long names and descriptions', async () => {
      const longString = 'a'.repeat(1000);
      const dataWithLongStrings: CreatePartyData = {
        name: longString,
        description: longString
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', dataWithLongStrings);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: longString,
          description: longString,
        },
      });
    });

    it('should handle special characters in names and descriptions', async () => {
      const specialCharsData: CreatePartyData = {
        name: "Party with 'quotes' and \"double quotes\"",
        description: "Description with émojis 🎲 and unicode ñ characters"
      };

      mockPrisma.party.create = vi.fn().mockResolvedValue(createMockParty());

      await partyService.create('user_123', specialCharsData);

      expect(mockPrisma.party.create).toHaveBeenCalledWith({
        data: {
          userId: 'user_123',
          name: "Party with 'quotes' and \"double quotes\"",
          description: "Description with émojis 🎲 and unicode ñ characters",
        },
      });
    });

    it('should handle database connection errors gracefully', async () => {
      mockPrisma.party.findMany = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(partyService.findByUserId('user_123'))
        .rejects.toThrow('Failed to fetch parties: ECONNREFUSED');
    });

    it('should handle Prisma validation errors', async () => {
      const prismaValidationError = new Error('Invalid input data');
      prismaValidationError.name = 'PrismaClientValidationError';
      
      mockPrisma.party.create = vi.fn().mockRejectedValue(prismaValidationError);

      await expect(partyService.create('user_123', { name: 'Test Party' }))
        .rejects.toThrow('Failed to create party: Invalid input data');
    });
  });
});