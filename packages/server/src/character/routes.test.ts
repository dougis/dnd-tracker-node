import express from 'express';
import { describe, it, beforeEach, vi } from 'vitest';
import { createTestApp, standardMocks } from '../utils/testHelpers';
import { TestPatterns } from '../utils/TestPatterns';

// Use vi.hoisted to ensure mocks are available during hoisting
const { mockCreate, mockFindByPartyId, mockFindById, mockUpdate, mockDelete } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
  mockFindByPartyId: vi.fn(),
  mockFindById: vi.fn(),
  mockUpdate: vi.fn(),
  mockDelete: vi.fn(),
}));

// Mock the service and middleware using standard patterns
vi.mock('../services/CharacterService', () => ({
  CharacterService: vi.fn().mockImplementation(() => ({
    create: mockCreate,
    findByPartyId: mockFindByPartyId,
    findById: mockFindById,
    update: mockUpdate,
    delete: mockDelete,
  }))
}));

vi.mock('@prisma/client', () => standardMocks.prismaClient);
vi.mock('../auth/middleware', () => standardMocks.authMiddleware);

// Import routes after mocking
import { characterRoutes } from './routes';

describe('Character Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    vi.clearAllMocks();
    app = createTestApp('/api/characters', characterRoutes);
  });

  describe('POST /api/characters', () => {
    it('should create a new character successfully', async () => {
      const createData = {
        partyId: 'party123',
        name: 'Gandalf',
        playerName: 'John Doe',
        race: 'Human',
        classes: [{ className: 'Wizard', level: 5 }],
        level: 5,
        ac: 15,
        maxHp: 45,
        currentHp: 45,
        abilities: {
          str: 10,
          dex: 14,
          con: 16,
          int: 20,
          wis: 15,
          cha: 12
        }
      };
      
      const expectedResponse = {
        id: 'char123',
        ...createData,
        tempHp: 0,
        speed: 30,
        proficiencyBonus: 3,
        features: [],
        equipment: [],
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      await TestPatterns.testSuccessfulCreation(
        app, '/api/characters', createData, expectedResponse, mockCreate
      );
    });

    it('should return 400 for invalid character data', async () => {
      const invalidData = {
        partyId: 'party123',
        name: '',
        race: 'Human'
      };

      await TestPatterns.testValidationFailure(app, '/api/characters', invalidData);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = { name: 'Test Character' };
      await TestPatterns.testValidationFailure(app, '/api/characters', invalidData);
    });
  });

  describe('GET /api/characters/party/:partyId', () => {
    it('should return all characters for a party', async () => {
      const mockCharacters = [
        {
          id: 'char1',
          partyId: 'party123',
          name: 'Gandalf',
          playerName: 'John',
          race: 'Human',
          classes: [{ className: 'Wizard', level: 5 }],
          level: 5,
          ac: 15,
          maxHp: 45,
          currentHp: 45,
          abilities: { str: 10, dex: 14, con: 16, int: 20, wis: 15, cha: 12 },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        },
        {
          id: 'char2',
          partyId: 'party123',
          name: 'Legolas',
          playerName: 'Jane',
          race: 'Elf',
          classes: [{ className: 'Ranger', level: 4 }],
          level: 4,
          ac: 16,
          maxHp: 32,
          currentHp: 32,
          abilities: { str: 12, dex: 18, con: 14, int: 13, wis: 16, cha: 11 },
          createdAt: '2025-01-01T00:00:00.000Z',
          updatedAt: '2025-01-01T00:00:00.000Z'
        }
      ];

      await TestPatterns.testGetCollection(
        app, '/api/characters/party/party123', mockCharacters, mockFindByPartyId, 'Characters'
      );
    });

    it('should return empty array when party has no characters', async () => {
      await TestPatterns.testGetCollection(
        app, '/api/characters/party/party123', [], mockFindByPartyId, 'Characters'
      );
    });
  });

  describe('GET /api/characters/:id', () => {
    it('should return specific character by id', async () => {
      const mockCharacter = {
        id: 'char123',
        partyId: 'party123',
        name: 'Gandalf',
        playerName: 'John',
        race: 'Human',
        classes: [{ className: 'Wizard', level: 5 }],
        level: 5,
        ac: 15,
        maxHp: 45,
        currentHp: 45,
        abilities: { str: 10, dex: 14, con: 16, int: 20, wis: 15, cha: 12 },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      await TestPatterns.testSuccessfulGetById(
        app, '/api/characters', 'char123', mockCharacter, mockFindById
      );
    });

    it('should return 404 when character not found', async () => {
      await TestPatterns.testNotFound(
        app, '/api/characters', 'nonexistent', mockFindById, 'Character'
      );
    });
  });

  describe('PUT /api/characters/:id', () => {
    it('should update character successfully', async () => {
      const updateData = {
        name: 'Updated Character Name',
        currentHp: 30,
        tempHp: 5
      };

      const mockUpdatedCharacter = {
        id: 'char123',
        partyId: 'party123',
        name: 'Updated Character Name',
        playerName: 'John',
        race: 'Human',
        classes: [{ className: 'Wizard', level: 5 }],
        level: 5,
        ac: 15,
        maxHp: 45,
        currentHp: 30,
        tempHp: 5,
        abilities: { str: 10, dex: 14, con: 16, int: 20, wis: 15, cha: 12 },
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z'
      };

      await TestPatterns.testSuccessfulUpdate(
        app, '/api/characters', 'char123', updateData, mockUpdatedCharacter, mockUpdate
      );
    });

    it('should return 404 when updating non-existent character', async () => {
      const updateData = { name: 'Updated Name' };
      mockUpdate.mockResolvedValue(null);

      await TestPatterns.testNotFound(
        app, '/api/characters', 'nonexistent', mockUpdate, 'Character'
      );
    });

    it('should return 400 for invalid update data', async () => {
      const invalidData = { name: '', currentHp: -5 };
      await TestPatterns.testValidationFailure(app, '/api/characters', invalidData);
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should delete character successfully', async () => {
      await TestPatterns.testSuccessfulDeletion(
        app, '/api/characters', 'char123', mockDelete, 'Character'
      );
    });

    it('should return 404 when deleting non-existent character', async () => {
      await TestPatterns.testDeleteNotFound(
        app, '/api/characters', 'nonexistent', mockDelete, 'Character'
      );
    });
  });
});