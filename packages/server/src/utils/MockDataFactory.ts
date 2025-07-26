/**
 * Centralized factory for creating standardized mock data across tests
 * Eliminates duplication of mock object creation patterns
 */
export class MockDataFactory {
  /**
   * Create a standardized mock user object
   */
  static createUser(overrides: Partial<any> = {}) {
    return {
      id: 'user_123',
      email: 'test@example.com',
      username: 'testuser',
      firstName: 'Test',
      lastName: 'User',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides
    };
  }

  /**
   * Create a standardized mock party object
   */
  static createParty(overrides: Partial<any> = {}) {
    return {
      id: 'party_123',
      userId: 'user_123',
      name: 'Test Party',
      description: 'A test adventure party',
      isArchived: false,
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides
    };
  }

  /**
   * Create a standardized mock character object
   */
  static createCharacter(overrides: Partial<any> = {}) {
    return {
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
      ...overrides
    };
  }

  /**
   * Create a standardized mock session object
   */
  static createSession(overrides: Partial<any> = {}) {
    return {
      id: 'session_123',
      userId: 'user_123',
      token: 'mock_session_token',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      expiresAt: new Date('2025-02-01T00:00:00.000Z'),
      ...overrides
    };
  }

  /**
   * Create a standardized mock encounter object
   */
  static createEncounter(overrides: Partial<any> = {}) {
    return {
      id: 'encounter_123',
      userId: 'user_123',
      name: 'Test Encounter',
      description: 'A test combat encounter',
      status: 'PLANNING' as const,
      round: 1,
      turn: 0,
      isActive: false,
      participants: [],
      lairActions: [],
      combatLogs: [],
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      updatedAt: new Date('2025-01-01T00:00:00.000Z'),
      ...overrides
    };
  }

  /**
   * Create a standardized mock participant object
   */
  static createParticipant(overrides: Partial<any> = {}) {
    return {
      id: 'participant_123',
      encounterId: 'encounter_123',
      type: 'CHARACTER' as const,
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
      ...overrides
    };
  }

  /**
   * Create multiple mock objects of the same type
   */
  static createMultiple<T>(
    factoryMethod: (overrides?: any) => T,
    count: number,
    overridesArray: Partial<any>[] = []
  ): T[] {
    return Array.from({ length: count }, (_, index) => 
      factoryMethod(overridesArray[index] || { id: `${factoryMethod.name}_${index + 1}` })
    );
  }

  /**
   * Create a mock with common test variations
   */
  static createWithVariations<T>(
    factoryMethod: (overrides?: any) => T,
    variations: { [key: string]: Partial<any> }
  ): { [key: string]: T } {
    const result: { [key: string]: T } = {};
    Object.entries(variations).forEach(([name, overrides]) => {
      result[name] = factoryMethod(overrides);
    });
    return result;
  }

  /**
   * API request data factories
   */
  static createValidEncounterData() {
    return {
      name: 'Test Encounter',
      description: 'Test description',
    };
  }

  static createValidParticipantData() {
    return {
      type: 'CHARACTER',
      name: 'Test Character',
      initiative: 15,
      maxHp: 25,
      currentHp: 25,
      ac: 15,
    };
  }

  static createValidCharacterData() {
    return {
      name: 'Test Character',
      playerName: 'Test Player',
      race: 'Human',
      classes: [{ className: 'Fighter', level: 5 }],
      level: 5,
      ac: 18,
      maxHp: 45,
      currentHp: 45,
      abilities: { str: 16, dex: 14, con: 15, int: 10, wis: 12, cha: 8 },
    };
  }

  static createValidPartyData() {
    return {
      name: 'Test Party',
      description: 'A test adventuring party',
      maxMembers: 6,
    };
  }

  static createValidationError(location: string, msg: string, path: string, value?: any) {
    return {
      type: 'field',
      location,
      path,
      value,
      msg,
    };
  }

  /**
   * Test constants
   */
  static readonly VALID_MONGO_ID = '507f1f77bcf86cd799439011';
  static readonly INVALID_MONGO_ID = 'invalid_id';
  static readonly TEST_USER_ID = 'user_123';
}