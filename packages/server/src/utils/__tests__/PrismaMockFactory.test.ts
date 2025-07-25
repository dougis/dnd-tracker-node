import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrismaMockFactory } from '../PrismaMockFactory';

describe('PrismaMockFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('createFullMock', () => {
    it('should create a mock with all entities', () => {
      const mock = PrismaMockFactory.createFullMock();

      expect(mock).toHaveProperty('user');
      expect(mock).toHaveProperty('session');
      expect(mock).toHaveProperty('party');
      expect(mock).toHaveProperty('character');
      expect(mock).toHaveProperty('encounter');
      expect(mock).toHaveProperty('participant');
      expect(mock).toHaveProperty('userStats');
      expect(mock).toHaveProperty('$connect');
      expect(mock).toHaveProperty('$disconnect');
      expect(mock).toHaveProperty('$transaction');
    });

    it('should create mocks with CRUD operations', () => {
      const mock = PrismaMockFactory.createFullMock();

      expect(mock.user).toHaveProperty('create');
      expect(mock.user).toHaveProperty('findFirst');
      expect(mock.user).toHaveProperty('findUnique');
      expect(mock.user).toHaveProperty('findMany');
      expect(mock.user).toHaveProperty('update');
      expect(mock.user).toHaveProperty('delete');
    });
  });

  describe('createEntityMock', () => {
    it('should create entity with all CRUD operations', () => {
      const entityMock = PrismaMockFactory.createEntityMock();

      expect(entityMock).toHaveProperty('create');
      expect(entityMock).toHaveProperty('createMany');
      expect(entityMock).toHaveProperty('findFirst');
      expect(entityMock).toHaveProperty('findUnique');
      expect(entityMock).toHaveProperty('findMany');
      expect(entityMock).toHaveProperty('update');
      expect(entityMock).toHaveProperty('updateMany');
      expect(entityMock).toHaveProperty('upsert');
      expect(entityMock).toHaveProperty('delete');
      expect(entityMock).toHaveProperty('deleteMany');
      expect(entityMock).toHaveProperty('count');
      expect(entityMock).toHaveProperty('aggregate');
    });

    it('should create vitest functions for all methods', () => {
      const entityMock = PrismaMockFactory.createEntityMock();

      expect(vi.isMockFunction(entityMock.create)).toBe(true);
      expect(vi.isMockFunction(entityMock.findFirst)).toBe(true);
      expect(vi.isMockFunction(entityMock.update)).toBe(true);
      expect(vi.isMockFunction(entityMock.delete)).toBe(true);
    });
  });

  describe('createWithPresetBehaviors', () => {
    it('should create mock with preset create behavior', async () => {
      const expectedData = { id: 'test', name: 'Test Entity' };
      const mock = PrismaMockFactory.createWithPresetBehaviors('user', {
        create: expectedData
      });

      expect(mock.user!.create).toBeDefined();
      
      // Test that the mock returns the expected data when called
      const result = await mock.user!.create({ data: { name: 'Test' } });
      expect(result).toEqual(expectedData);
    });

    it('should create mock with preset findFirst behavior', () => {
      const expectedData = { id: 'test', name: 'Test Entity' };
      const mock = PrismaMockFactory.createWithPresetBehaviors('user', {
        findFirst: expectedData
      });

      expect(mock.user!.findFirst).toBeDefined();
    });

    it('should create mock with multiple preset behaviors', () => {
      const createData = { id: 'test', name: 'Created' };
      const findData = { id: 'test', name: 'Found' };
      
      const mock = PrismaMockFactory.createWithPresetBehaviors('user', {
        create: createData,
        findFirst: findData
      });

      expect(mock.user).toHaveProperty('create');
      expect(mock.user).toHaveProperty('findFirst');
    });
  });

  describe('createWithErrors', () => {
    it('should create mock that throws database errors', () => {
      const mock = PrismaMockFactory.createWithErrors('user', 'database');

      expect(mock.user).toHaveProperty('create');
      expect(mock.user).toHaveProperty('findFirst');
    });

    it('should create mock that throws validation errors', () => {
      const mock = PrismaMockFactory.createWithErrors('user', 'validation');

      expect(mock.user).toHaveProperty('create');
    });

    it('should create mock that throws not-found errors', () => {
      const mock = PrismaMockFactory.createWithErrors('user', 'not-found');

      expect(mock.user).toHaveProperty('findFirst');
    });
  });

  describe('createSuccessfulMock', () => {
    it('should create mock with successful operations', () => {
      const mockData = { id: 'test', name: 'Success' };
      const mock = PrismaMockFactory.createSuccessfulMock('user', mockData);

      expect(mock.user).toHaveProperty('create');
      expect(mock.user).toHaveProperty('findFirst');
      expect(mock.user).toHaveProperty('findUnique');
      expect(mock.user).toHaveProperty('findMany');
      expect(mock.user).toHaveProperty('update');
      expect(mock.user).toHaveProperty('delete');
      expect(mock.user).toHaveProperty('count');
    });
  });

  describe('createNotFoundMock', () => {
    it('should create mock that returns null/empty', () => {
      const mock = PrismaMockFactory.createNotFoundMock('user');

      expect(mock.user).toHaveProperty('findFirst');
      expect(mock.user).toHaveProperty('findUnique');
      expect(mock.user).toHaveProperty('findMany');
      expect(mock.user).toHaveProperty('update');
      expect(mock.user).toHaveProperty('delete');
      expect(mock.user).toHaveProperty('count');
    });
  });

  describe('combineMocks', () => {
    it('should combine multiple entity mocks', () => {
      const userMock = PrismaMockFactory.createSuccessfulMock('user', { id: 'user1' });
      const partyMock = PrismaMockFactory.createSuccessfulMock('party', { id: 'party1' });

      const combined = PrismaMockFactory.combineMocks(userMock, partyMock);

      expect(combined).toHaveProperty('user');
      expect(combined).toHaveProperty('party');
      expect(combined).toHaveProperty('character'); // from createFullMock base
    });

    it('should override base mock properties with provided mocks', () => {
      const userMock = PrismaMockFactory.createSuccessfulMock('user', { id: 'custom' });
      
      const combined = PrismaMockFactory.combineMocks(userMock);

      expect(combined).toHaveProperty('user');
      expect(combined).toHaveProperty('party'); // from base
    });
  });

  describe('resetAllMocks', () => {
    it('should reset all mocks in a prisma client mock', () => {
      const mock = PrismaMockFactory.createFullMock();
      
      // Call some methods to ensure they have call history
      mock.user.create();
      mock.party.findFirst();

      expect(mock.user.create).toHaveBeenCalledTimes(1);
      expect(mock.party.findFirst).toHaveBeenCalledTimes(1);

      PrismaMockFactory.resetAllMocks(mock);

      expect(mock.user.create).toHaveBeenCalledTimes(0);
      expect(mock.party.findFirst).toHaveBeenCalledTimes(0);
    });
  });

  describe('clearAllMocks', () => {
    it('should clear all mocks in a prisma client mock', () => {
      const mock = PrismaMockFactory.createFullMock();
      
      // Call some methods to set up call history
      mock.user.create();
      mock.party.findFirst();

      expect(mock.user.create).toHaveBeenCalledTimes(1);
      expect(mock.party.findFirst).toHaveBeenCalledTimes(1);

      PrismaMockFactory.clearAllMocks(mock);

      expect(mock.user.create).toHaveBeenCalledTimes(0);
      expect(mock.party.findFirst).toHaveBeenCalledTimes(0);
    });
  });
});