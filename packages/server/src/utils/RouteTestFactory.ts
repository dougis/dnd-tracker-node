import { vi } from 'vitest';
import { standardMocks } from './testHelpers';

/**
 * Factory for creating consistent route test mocks
 */
export class RouteTestFactory {
  /**
   * Create standard service mock methods
   */
  static createServiceMocks(methods: string[] = ['create', 'findById', 'update', 'delete']) {
    const mocks: Record<string, any> = {};
    methods.forEach(method => {
      mocks[`mock${method.charAt(0).toUpperCase() + method.slice(1)}`] = vi.fn();
    });
    return mocks;
  }

  /**
   * Create service mock implementation
   */
  static createServiceMockImplementation(serviceName: string, methods: Record<string, any>) {
    const implementation: Record<string, any> = {};
    Object.keys(methods).forEach(mockName => {
      const methodName = mockName.replace('mock', '').toLowerCase();
      implementation[methodName] = methods[mockName];
    });

    return {
      [serviceName]: vi.fn().mockImplementation(() => implementation)
    };
  }

  /**
   * Create standard mocks for a service with common CRUD operations
   */
  static createCRUDServiceMocks(serviceName: string, customMethods: string[] = []) {
    const defaultMethods = ['create', 'findById', 'update', 'delete'];
    const allMethods = [...defaultMethods, ...customMethods];
    
    const serviceMocks = this.createServiceMocks(allMethods);
    const serviceImplementation = this.createServiceMockImplementation(serviceName, serviceMocks);

    return {
      serviceMocks,
      serviceImplementation,
      standardMocks: {
        prismaClient: standardMocks.prismaClient,
        authMiddleware: standardMocks.authMiddleware
      }
    };
  }

  /**
   * Setup mock modules for a route test
   */
  static setupMocks(servicePath: string, serviceName: string, customMethods: string[] = []) {
    const { serviceMocks, serviceImplementation, standardMocks } = 
      this.createCRUDServiceMocks(serviceName, customMethods);

    // Setup service mock
    vi.mock(servicePath, () => serviceImplementation);
    
    // Setup standard mocks
    vi.mock('@prisma/client', () => standardMocks.prismaClient);
    vi.mock('../auth/middleware', () => standardMocks.authMiddleware);

    return serviceMocks;
  }
}