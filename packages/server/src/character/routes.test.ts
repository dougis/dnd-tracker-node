import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { characterRoutes } from './routes';
import { CharacterService } from '../services/CharacterService';

// Mock the service and middleware
vi.mock('../services/CharacterService');
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn().mockImplementation(() => ({}))
}));
vi.mock('../auth/middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    req.user = { id: 'user123', email: 'test@example.com' };
    next();
  }
}));

describe('Character Routes', () => {
  let app: express.Application;
  let mockCharacterService: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    mockCharacterService = {
      create: vi.fn(),
      findByPartyId: vi.fn(),
      findById: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    (CharacterService as any).mockImplementation(() => mockCharacterService);

    app.use('/api/characters', characterRoutes);
  });

  describe('POST /api/characters', () => {
    it('should create a new character successfully', async () => {
      const newCharacter = {
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
      
      const mockCreatedCharacter = {
        id: 'char123',
        ...newCharacter,
        tempHp: 0,
        speed: 30,
        proficiencyBonus: 3,
        features: [],
        equipment: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCharacterService.create.mockResolvedValue(mockCreatedCharacter);

      const response = await request(app)
        .post('/api/characters')
        .send(newCharacter);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCreatedCharacter);
      expect(mockCharacterService.create).toHaveBeenCalledWith('user123', newCharacter);
    });

    it('should return 400 for invalid character data', async () => {
      const invalidCharacter = {
        partyId: 'party123',
        name: '', // Empty name should fail validation
        race: 'Human'
      };

      const response = await request(app)
        .post('/api/characters')
        .send(invalidCharacter);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should return 400 for missing required fields', async () => {
      const invalidCharacter = {
        name: 'Test Character'
        // Missing partyId and race
      };

      const response = await request(app)
        .post('/api/characters')
        .send(invalidCharacter);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
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
          createdAt: new Date(),
          updatedAt: new Date()
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
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockCharacterService.findByPartyId.mockResolvedValue(mockCharacters);

      const response = await request(app)
        .get('/api/characters/party/party123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCharacters);
      expect(mockCharacterService.findByPartyId).toHaveBeenCalledWith('party123', 'user123');
    });

    it('should return empty array when party has no characters', async () => {
      mockCharacterService.findByPartyId.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/characters/party/party123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCharacterService.findById.mockResolvedValue(mockCharacter);

      const response = await request(app)
        .get('/api/characters/char123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockCharacter);
      expect(mockCharacterService.findById).toHaveBeenCalledWith('char123', 'user123');
    });

    it('should return 404 when character not found', async () => {
      mockCharacterService.findById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/characters/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Character not found');
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockCharacterService.update.mockResolvedValue(mockUpdatedCharacter);

      const response = await request(app)
        .put('/api/characters/char123')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockUpdatedCharacter);
      expect(mockCharacterService.update).toHaveBeenCalledWith('char123', 'user123', updateData);
    });

    it('should return 404 when updating non-existent character', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      mockCharacterService.update.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/characters/nonexistent')
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Character not found');
    });

    it('should return 400 for invalid update data', async () => {
      const invalidUpdate = {
        name: '', // Empty name should fail validation
        currentHp: -5 // Negative HP should fail validation
      };

      const response = await request(app)
        .put('/api/characters/char123')
        .send(invalidUpdate);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/characters/:id', () => {
    it('should delete character successfully', async () => {
      mockCharacterService.delete.mockResolvedValue(true);

      const response = await request(app)
        .delete('/api/characters/char123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Character deleted successfully');
      expect(mockCharacterService.delete).toHaveBeenCalledWith('char123', 'user123');
    });

    it('should return 404 when deleting non-existent character', async () => {
      mockCharacterService.delete.mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/characters/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Character not found');
    });
  });
});