import { vi } from 'vitest';

/**
 * Common mock patterns used across different test files
 */
export class CommonTestMocks {
  /**
   * Standard route test mocks - reduces duplication in route test files
   */
  static createRouteServiceMocks() {
    return vi.hoisted(() => ({
      mockCreate: vi.fn(),
      mockFindByUserId: vi.fn(),
      mockFindById: vi.fn(),
      mockUpdate: vi.fn(),
      mockDelete: vi.fn(),
    }));
  }

  /**
   * Create a service mock factory function
   */
  static createServiceMockFactory(mocks: any) {
    return vi.fn().mockImplementation(() => mocks);
  }

  /**
   * Standard mock spy setup for service methods
   */
  static setupServiceSpies(service: any, methods: string[]) {
    const spies: Record<string, any> = {};
    methods.forEach(method => {
      spies[method] = vi.spyOn(service, method);
    });
    return spies;
  }

  /**
   * Common mock data patterns
   */
  static createStandardTestData() {
    return {
      validUserId: 'user_123',
      invalidUserId: 'invalid_user',
      entityId: 'entity_123',
      nonExistentId: 'nonexistent_123'
    };
  }
}