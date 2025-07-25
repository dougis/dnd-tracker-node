import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PartyService, CreatePartyData } from '../PartyService';
import { createMockParty, createMockPrisma } from './PartyService.helpers';

describe('PartyService - create operations', () => {
  let partyService: PartyService;
  let mockPrisma: ReturnType<typeof createMockPrisma>;

  const validCreateData: CreatePartyData = {
    name: 'Adventure Party',
    description: 'A group of brave adventurers'
  };

  beforeEach(() => {
    mockPrisma = createMockPrisma();
    partyService = new PartyService(mockPrisma);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('create', () => {
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
      const invalidData = { ...validCreateData, name: '' };

      await expect(partyService.create('user_123', invalidData))
        .rejects.toThrow('Party name is required');

      expect(mockPrisma.party.create).not.toHaveBeenCalled();
    });

    it('should throw error for whitespace-only name', async () => {
      const invalidData = { ...validCreateData, name: '   ' };

      await expect(partyService.create('user_123', invalidData))
        .rejects.toThrow('Party name is required');
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

    it('should handle Prisma validation errors', async () => {
      const prismaValidationError = new Error('Invalid input data');
      prismaValidationError.name = 'PrismaClientValidationError';
      
      mockPrisma.party.create = vi.fn().mockRejectedValue(prismaValidationError);

      await expect(partyService.create('user_123', { name: 'Test Party' }))
        .rejects.toThrow('Failed to create party: Invalid input data');
    });
  });
});