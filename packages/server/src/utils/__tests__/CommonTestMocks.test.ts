import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommonTestMocks } from '../CommonTestMocks';

describe('CommonTestMocks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
  });

  describe('createRouteServiceMocks', () => {
    it('should be a static method', () => {
      expect(typeof CommonTestMocks.createRouteServiceMocks).toBe('function');
    });

    it('should use vi.hoisted for creating mocks', () => {
      // vi.hoisted is used for module-level mocking
      // We can't easily test the return value in isolation
      // But we can verify the method exists and is callable
      expect(() => CommonTestMocks.createRouteServiceMocks()).not.toThrow();
    });
  });

  describe('createServiceMockFactory', () => {
    it('should create a mock function that returns the provided mocks', () => {
      const mockMethods = {
        create: vi.fn(),
        findById: vi.fn(),
        update: vi.fn()
      };

      const factory = CommonTestMocks.createServiceMockFactory(mockMethods);

      expect(vi.isMockFunction(factory)).toBe(true);
      
      const instance = factory();
      expect(instance).toBe(mockMethods);
    });

    it('should create a factory that can be called multiple times', () => {
      const mockMethods = {
        create: vi.fn(),
        findById: vi.fn()
      };

      const factory = CommonTestMocks.createServiceMockFactory(mockMethods);

      const instance1 = factory();
      const instance2 = factory();

      expect(instance1).toBe(mockMethods);
      expect(instance2).toBe(mockMethods);
      expect(factory).toHaveBeenCalledTimes(2);
    });

    it('should handle empty mock objects', () => {
      const emptyMocks = {};
      const factory = CommonTestMocks.createServiceMockFactory(emptyMocks);

      const instance = factory();
      expect(instance).toEqual({});
    });
  });

  describe('setupServiceSpies', () => {
    it('should create spies for all specified methods', () => {
      const mockService = {
        create: vi.fn(),
        findById: vi.fn(),
        update: vi.fn(),
        delete: vi.fn()
      };

      const methods = ['create', 'findById', 'update'];
      const spies = CommonTestMocks.setupServiceSpies(mockService, methods);

      expect(spies).toHaveProperty('create');
      expect(spies).toHaveProperty('findById');
      expect(spies).toHaveProperty('update');
      expect(spies).not.toHaveProperty('delete'); // Not in methods array

      expect(vi.isMockFunction(spies.create)).toBe(true);
      expect(vi.isMockFunction(spies.findById)).toBe(true);
      expect(vi.isMockFunction(spies.update)).toBe(true);
    });

    it('should create working spies that track method calls', () => {
      const mockService = {
        testMethod: vi.fn().mockReturnValue('test result')
      };

      const spies = CommonTestMocks.setupServiceSpies(mockService, ['testMethod']);

      // Call the original method
      const result = mockService.testMethod('test arg');

      expect(result).toBe('test result');
      expect(spies.testMethod).toHaveBeenCalledWith('test arg');
      expect(spies.testMethod).toHaveBeenCalledTimes(1);
    });

    it('should handle empty methods array', () => {
      const mockService = {
        create: vi.fn(),
        findById: vi.fn()
      };

      const spies = CommonTestMocks.setupServiceSpies(mockService, []);

      expect(spies).toEqual({});
    });

    it('should handle methods that do not exist on service', () => {
      const mockService = {
        existingMethod: vi.fn()
      };

      // This will throw because vi.spyOn requires the method to exist
      expect(() => {
        CommonTestMocks.setupServiceSpies(mockService, ['nonExistentMethod']);
      }).toThrow('nonExistentMethod does not exist');
    });
  });

  describe('createStandardTestData', () => {
    it('should return an object with all required test data properties', () => {
      const testData = CommonTestMocks.createStandardTestData();

      expect(testData).toHaveProperty('validUserId');
      expect(testData).toHaveProperty('invalidUserId');
      expect(testData).toHaveProperty('entityId');
      expect(testData).toHaveProperty('nonExistentId');
    });

    it('should return consistent data structure', () => {
      const testData = CommonTestMocks.createStandardTestData();

      expect(testData.validUserId).toBe('user_123');
      expect(testData.invalidUserId).toBe('invalid_user');
      expect(testData.entityId).toBe('entity_123');
      expect(testData.nonExistentId).toBe('nonexistent_123');
    });

    it('should return the same values on multiple calls', () => {
      const testData1 = CommonTestMocks.createStandardTestData();
      const testData2 = CommonTestMocks.createStandardTestData();

      expect(testData1).toEqual(testData2);
    });

    it('should return string values for all properties', () => {
      const testData = CommonTestMocks.createStandardTestData();

      expect(typeof testData.validUserId).toBe('string');
      expect(typeof testData.invalidUserId).toBe('string');
      expect(typeof testData.entityId).toBe('string');
      expect(typeof testData.nonExistentId).toBe('string');
    });

    it('should return non-empty strings for all properties', () => {
      const testData = CommonTestMocks.createStandardTestData();

      expect(testData.validUserId.length).toBeGreaterThan(0);
      expect(testData.invalidUserId.length).toBeGreaterThan(0);
      expect(testData.entityId.length).toBeGreaterThan(0);
      expect(testData.nonExistentId.length).toBeGreaterThan(0);
    });
  });
});