import { describe, it, expect } from 'vitest';
import { MockDataFactory } from '../MockDataFactory';

describe('MockDataFactory', () => {
  describe('createUser', () => {
    it('should create a standardized user object', () => {
      const user = MockDataFactory.createUser();

      expect(user).toEqual({
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to user object', () => {
      const overrides = { id: 'custom_id', email: 'custom@example.com' };
      const user = MockDataFactory.createUser(overrides);

      expect(user.id).toBe('custom_id');
      expect(user.email).toBe('custom@example.com');
      expect(user.username).toBe('testuser'); // unchanged
    });
  });

  describe('createParty', () => {
    it('should create a standardized party object', () => {
      const party = MockDataFactory.createParty();

      expect(party).toEqual({
        id: 'party_123',
        userId: 'user_123',
        name: 'Test Party',
        description: 'A test adventure party',
        isArchived: false,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to party object', () => {
      const overrides = { name: 'Custom Party', isArchived: true };
      const party = MockDataFactory.createParty(overrides);

      expect(party.name).toBe('Custom Party');
      expect(party.isArchived).toBe(true);
      expect(party.userId).toBe('user_123'); // unchanged
    });
  });

  describe('createCharacter', () => {
    it('should create a standardized character object', () => {
      const character = MockDataFactory.createCharacter();

      expect(character).toEqual({
        id: 'char_123',
        partyId: 'party_123',
        name: 'Test Character',
        playerName: 'Test Player',
        race: 'Human',
        classes: [{ className: 'Fighter', level: 5 }],
        level: 5,
        ac: 15,
        maxHp: 45,
        currentHp: 45,
        tempHp: 0,
        speed: 30,
        proficiencyBonus: 3,
        abilities: {
          str: 14,
          dex: 12,
          con: 16,
          int: 10,
          wis: 13,
          cha: 8
        },
        features: [],
        equipment: [],
        notes: null,
        hitDice: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to character object', () => {
      const overrides = { name: 'Custom Character', level: 10 };
      const character = MockDataFactory.createCharacter(overrides);

      expect(character.name).toBe('Custom Character');
      expect(character.level).toBe(10);
      expect(character.race).toBe('Human'); // unchanged
    });
  });

  describe('createSession', () => {
    it('should create a standardized session object', () => {
      const session = MockDataFactory.createSession();

      expect(session).toEqual({
        id: 'session_123',
        userId: 'user_123',
        token: 'mock_session_token',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        expiresAt: new Date('2025-02-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to session object', () => {
      const overrides = { token: 'custom_token' };
      const session = MockDataFactory.createSession(overrides);

      expect(session.token).toBe('custom_token');
      expect(session.userId).toBe('user_123'); // unchanged
    });
  });

  describe('createEncounter', () => {
    it('should create a standardized encounter object', () => {
      const encounter = MockDataFactory.createEncounter();

      expect(encounter).toEqual({
        id: 'encounter_123',
        userId: 'user_123',
        name: 'Test Encounter',
        description: 'A test combat encounter',
        status: 'PLANNING',
        round: 1,
        turn: 0,
        isActive: false,
        participants: [],
        lairActions: null,
        combatLogs: [],
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to encounter object', () => {
      const overrides = { name: 'Boss Fight', status: 'ACTIVE' as const };
      const encounter = MockDataFactory.createEncounter(overrides);

      expect(encounter.name).toBe('Boss Fight');
      expect(encounter.status).toBe('ACTIVE');
      expect(encounter.round).toBe(1); // unchanged
    });
  });

  describe('createParticipant', () => {
    it('should create a standardized participant object', () => {
      const participant = MockDataFactory.createParticipant();

      expect(participant).toEqual({
        id: 'participant_123',
        encounterId: 'encounter_123',
        type: 'CHARACTER',
        characterId: 'char_123',
        creatureId: null,
        name: 'Test Participant',
        initiative: 15,
        initiativeRoll: 12,
        currentHp: 45,
        maxHp: 45,
        tempHp: 0,
        ac: 15,
        conditions: [],
        isActive: true,
        notes: null,
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      });
    });

    it('should apply overrides to participant object', () => {
      const overrides = { name: 'Boss Monster', type: 'CREATURE' as const };
      const participant = MockDataFactory.createParticipant(overrides);

      expect(participant.name).toBe('Boss Monster');
      expect(participant.type).toBe('CREATURE');
      expect(participant.initiative).toBe(15); // unchanged
    });
  });

  describe('createMultiple', () => {
    it('should create multiple objects using factory method', () => {
      const users = MockDataFactory.createMultiple(MockDataFactory.createUser, 3);

      expect(users).toHaveLength(3);
      expect(users[0]).toHaveProperty('id');
      expect(users[1]).toHaveProperty('id');
      expect(users[2]).toHaveProperty('id');
    });

    it('should apply different overrides to each object', () => {
      const overrides = [
        { name: 'Party One' },
        { name: 'Party Two' },
        { name: 'Party Three' },
      ];
      const parties = MockDataFactory.createMultiple(MockDataFactory.createParty, 3, overrides);

      expect(parties).toHaveLength(3);
      expect(parties[0].name).toBe('Party One');
      expect(parties[1].name).toBe('Party Two');
      expect(parties[2].name).toBe('Party Three');
    });

    it('should use default id pattern when no overrides provided', () => {
      const users = MockDataFactory.createMultiple(MockDataFactory.createUser, 2);

      expect(users).toHaveLength(2);
      expect(users[0]).toHaveProperty('id');
      expect(users[1]).toHaveProperty('id');
    });
  });

  describe('createWithVariations', () => {
    it('should create objects with different variations', () => {
      const variations = {
        fighter: { classes: [{ className: 'Fighter', level: 5 }] },
        wizard: { classes: [{ className: 'Wizard', level: 3 }] },
        rogue: { classes: [{ className: 'Rogue', level: 4 }] },
      };

      const characters = MockDataFactory.createWithVariations(MockDataFactory.createCharacter, variations);

      expect(characters).toHaveProperty('fighter');
      expect(characters).toHaveProperty('wizard');
      expect(characters).toHaveProperty('rogue');
      
      expect(characters.fighter.classes[0].className).toBe('Fighter');
      expect(characters.wizard.classes[0].className).toBe('Wizard');
      expect(characters.rogue.classes[0].className).toBe('Rogue');
    });

    it('should maintain base properties for all variations', () => {
      const variations = {
        active: { isActive: true },
        inactive: { isActive: false },
      };

      const participants = MockDataFactory.createWithVariations(MockDataFactory.createParticipant, variations);

      expect(participants.active.name).toBe('Test Participant'); // base property
      expect(participants.inactive.name).toBe('Test Participant'); // base property
      expect(participants.active.isActive).toBe(true);
      expect(participants.inactive.isActive).toBe(false);
    });
  });
});