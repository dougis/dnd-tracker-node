import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Base class for testing service layer with common patterns
 */
export abstract class BaseServiceTest<TService, TCreateData, TUpdateData, TEntity> {
  protected service: TService;
  protected mockPrisma: any;

  constructor(
    protected ServiceClass: new (prisma: any) => TService,
    protected createMockPrisma: () => any
  ) {}

  /**
   * Setup method to be called in beforeEach
   */
  protected setup(): void {
    this.mockPrisma = this.createMockPrisma();
    this.service = new this.ServiceClass(this.mockPrisma);
    vi.clearAllMocks();
  }

  /**
   * Cleanup method to be called in afterEach
   */
  protected cleanup(): void {
    vi.resetAllMocks();
  }

  /**
   * Test successful creation
   */
  protected async testSuccessfulCreate(
    userId: string,
    createData: TCreateData,
    expectedResult: TEntity,
    mockPrismaMethod: string
  ): Promise<void> {
    this.mockPrisma[mockPrismaMethod].create.mockResolvedValue(expectedResult);

    const result = await (this.service as any).create(userId, createData);

    expect(result).toEqual(expectedResult);
    expect(this.mockPrisma[mockPrismaMethod].create).toHaveBeenCalledWith({
      data: expect.objectContaining(createData)
    });
  }

  /**
   * Test validation errors
   */
  protected async testValidationError(
    userId: string,
    invalidData: Partial<TCreateData>,
    expectedErrorMessage: string
  ): Promise<void> {
    await expect((this.service as any).create(userId, invalidData))
      .rejects.toThrow(expectedErrorMessage);
  }

  /**
   * Test database errors
   */
  protected async testDatabaseError(
    userId: string,
    createData: TCreateData,
    mockPrismaMethod: string,
    errorMessage: string
  ): Promise<void> {
    this.mockPrisma[mockPrismaMethod].create.mockRejectedValue(new Error(errorMessage));

    await expect((this.service as any).create(userId, createData))
      .rejects.toThrow(expect.stringContaining('Failed to create'));
  }

  /**
   * Test successful retrieval by ID
   */
  protected async testSuccessfulFindById(
    entityId: string,
    userId: string,
    expectedResult: TEntity,
    mockPrismaMethod: string
  ): Promise<void> {
    this.mockPrisma[mockPrismaMethod].findFirst.mockResolvedValue(expectedResult);

    const result = await (this.service as any).findById(entityId, userId);

    expect(result).toEqual(expectedResult);
    expect(this.mockPrisma[mockPrismaMethod].findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: entityId })
    });
  }

  /**
   * Test entity not found
   */
  protected async testNotFound(
    entityId: string,
    userId: string,
    mockPrismaMethod: string
  ): Promise<void> {
    this.mockPrisma[mockPrismaMethod].findFirst.mockResolvedValue(null);

    const result = await (this.service as any).findById(entityId, userId);

    expect(result).toBeNull();
  }

  /**
   * Test successful update
   */
  protected async testSuccessfulUpdate(
    entityId: string,
    userId: string,
    updateData: TUpdateData,
    expectedResult: TEntity,
    mockPrismaMethod: string
  ): Promise<void> {
    // Mock findById to return existing entity
    this.mockPrisma[mockPrismaMethod].findFirst.mockResolvedValue({ id: entityId });
    this.mockPrisma[mockPrismaMethod].update.mockResolvedValue(expectedResult);

    const result = await (this.service as any).update(entityId, userId, updateData);

    expect(result).toEqual(expectedResult);
    expect(this.mockPrisma[mockPrismaMethod].update).toHaveBeenCalledWith({
      where: { id: entityId },
      data: expect.objectContaining(updateData)
    });
  }

  /**
   * Test successful deletion
   */
  protected async testSuccessfulDelete(
    entityId: string,
    userId: string,
    mockPrismaMethod: string
  ): Promise<void> {
    // Mock findById to return existing entity
    this.mockPrisma[mockPrismaMethod].findFirst.mockResolvedValue({ id: entityId });
    this.mockPrisma[mockPrismaMethod].delete.mockResolvedValue({ id: entityId });

    const result = await (this.service as any).delete(entityId, userId);

    expect(result).toBe(true);
    expect(this.mockPrisma[mockPrismaMethod].delete).toHaveBeenCalledWith({
      where: { id: entityId }
    });
  }

  /**
   * Test deletion when entity not found
   */
  protected async testDeleteNotFound(
    entityId: string,
    userId: string,
    mockPrismaMethod: string
  ): Promise<void> {
    this.mockPrisma[mockPrismaMethod].findFirst.mockResolvedValue(null);

    const result = await (this.service as any).delete(entityId, userId);

    expect(result).toBe(false);
    expect(this.mockPrisma[mockPrismaMethod].delete).not.toHaveBeenCalled();
  }
}