import { vi } from 'vitest';

/**
 * Centralized factory for creating standardized Prisma client mocks
 * Eliminates duplication of Prisma mock creation patterns across tests
 */
export class PrismaMockFactory {
  /**
   * Create a complete mock Prisma client with all common entities
   */
  static createFullMock() {
    return {
      user: this.createEntityMock(),
      session: this.createEntityMock(),
      party: this.createEntityMock(),
      character: this.createEntityMock(),
      encounter: this.createEntityMock(),
      participant: this.createEntityMock(),
      userStats: this.createEntityMock(),
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $transaction: vi.fn(),
    };
  }

  /**
   * Create a mock for a single Prisma entity with standard CRUD operations
   */
  static createEntityMock() {
    return {
      create: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    };
  }

  /**
   * Create a mock with preset behaviors for common test scenarios
   */
  static createWithPresetBehaviors(entityName: string, behaviors: {
    create?: any;
    findFirst?: any;
    findMany?: any;
    update?: any;
    delete?: any;
  }) {
    const mock = this.createEntityMock();
    
    if (behaviors.create !== undefined) {
      mock.create.mockResolvedValue(behaviors.create);
    }
    if (behaviors.findFirst !== undefined) {
      mock.findFirst.mockResolvedValue(behaviors.findFirst);
    }
    if (behaviors.findMany !== undefined) {
      mock.findMany.mockResolvedValue(behaviors.findMany);
    }
    if (behaviors.update !== undefined) {
      mock.update.mockResolvedValue(behaviors.update);
    }
    if (behaviors.delete !== undefined) {
      mock.delete.mockResolvedValue(behaviors.delete);
    }

    return { [entityName]: mock };
  }

  /**
   * Create a mock with common error scenarios
   */
  static createWithErrors(entityName: string, errorType: 'database' | 'validation' | 'not-found') {
    const mock = this.createEntityMock();
    const errorMessage = this.getErrorMessage(errorType);
    
    // Make all operations throw the specified error
    Object.keys(mock).forEach(method => {
      if (typeof mock[method] === 'function') {
        mock[method].mockRejectedValue(new Error(errorMessage));
      }
    });

    return { [entityName]: mock };
  }

  /**
   * Create a mock that simulates successful operations for a specific entity
   */
  static createSuccessfulMock(entityName: string, mockData: any) {
    const mock = this.createEntityMock();
    
    mock.create.mockResolvedValue(mockData);
    mock.findFirst.mockResolvedValue(mockData);
    mock.findUnique.mockResolvedValue(mockData);
    mock.findMany.mockResolvedValue([mockData]);
    mock.update.mockResolvedValue(mockData);
    mock.delete.mockResolvedValue(mockData);
    mock.count.mockResolvedValue(1);

    return { [entityName]: mock };
  }

  /**
   * Create a mock that simulates "not found" scenarios
   */
  static createNotFoundMock(entityName: string) {
    const mock = this.createEntityMock();
    
    mock.findFirst.mockResolvedValue(null);
    mock.findUnique.mockResolvedValue(null);
    mock.findMany.mockResolvedValue([]);
    mock.update.mockResolvedValue(null);
    mock.delete.mockResolvedValue(null);
    mock.count.mockResolvedValue(0);

    return { [entityName]: mock };
  }

  /**
   * Combine multiple entity mocks into a complete Prisma client mock
   */
  static combineMocks(...entityMocks: object[]) {
    return Object.assign({}, this.createFullMock(), ...entityMocks);
  }

  /**
   * Get standard error messages for different error types
   */
  private static getErrorMessage(errorType: 'database' | 'validation' | 'not-found'): string {
    switch (errorType) {
      case 'database':
        return 'Database connection error';
      case 'validation':
        return 'Validation failed';
      case 'not-found':
        return 'Record not found';
      default:
        return 'Unknown error';
    }
  }

  /**
   * Reset all mocks in a Prisma client mock
   */
  static resetAllMocks(prismaMock: any) {
    Object.values(prismaMock).forEach((entityMock: any) => {
      if (typeof entityMock === 'object' && entityMock !== null) {
        Object.values(entityMock).forEach((method: any) => {
          if (typeof method?.mockReset === 'function') {
            method.mockReset();
          }
        });
      }
    });
  }

  /**
   * Clear all mocks in a Prisma client mock
   */
  static clearAllMocks(prismaMock: any) {
    Object.values(prismaMock).forEach((entityMock: any) => {
      if (typeof entityMock === 'object' && entityMock !== null) {
        Object.values(entityMock).forEach((method: any) => {
          if (typeof method?.mockClear === 'function') {
            method.mockClear();
          }
        });
      }
    });
  }
}