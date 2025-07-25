import { expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockPrisma } from '../services/__tests__/PartyService.helpers';

/**
 * Base class for service testing that provides common setup/teardown and test patterns
 */
export abstract class ServiceTestBase<TService> {
  protected service!: TService;
  protected mockPrisma!: ReturnType<typeof createMockPrisma>;

  /**
   * Subclasses must implement this to create their specific service
   */
  protected abstract createService(prisma: any): TService;

  /**
   * Standard setup for service tests
   */
  protected setup() {
    this.mockPrisma = createMockPrisma();
    this.service = this.createService(this.mockPrisma);
    vi.clearAllMocks();
  }

  /**
   * Standard cleanup for service tests
   */
  protected cleanup() {
    vi.resetAllMocks();
  }

  /**
   * Configure vitest hooks - call this in your describe block
   */
  protected configureHooks() {
    beforeEach(() => {
      this.setup();
    });

    afterEach(() => {
      this.cleanup();
    });
  }

  /**
   * Common test pattern: entity not found during update
   */
  protected async testUpdateNotFound(
    methodName: string,
    entityId: string,
    userId: string,
    updateData: any
  ) {
    vi.spyOn(this.service as any, 'findById').mockResolvedValue(null);
    
    const result = await (this.service as any)[methodName](entityId, userId, updateData);
    
    expect(result).toBeNull();
  }

  /**
   * Common test pattern: entity not found during delete
   */
  protected async testDeleteNotFound(
    methodName: string,
    entityId: string,
    userId: string
  ) {
    vi.spyOn(this.service as any, 'findById').mockResolvedValue(null);
    
    const result = await (this.service as any)[methodName](entityId, userId);
    
    expect(result).toBe(false);
  }

  /**
   * Common test pattern: successful operation with mock return
   */
  protected async testSuccessfulOperation<T>(
    methodName: string,
    expectedResult: T,
    mockPrismaEntity: string,
    mockPrismaMethod: string,
    ...methodArgs: any[]
  ) {
    (this.mockPrisma as any)[mockPrismaEntity][mockPrismaMethod]
      .mockResolvedValue(expectedResult);
    
    const result = await (this.service as any)[methodName](...methodArgs);
    
    expect(result).toEqual(expectedResult);
    return result;
  }
}