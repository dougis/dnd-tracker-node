import express from 'express';
import request from 'supertest';
import { expect, vi } from 'vitest';
import { createTestApp } from './testHelpers';

/**
 * Base class for testing CRUD routes with common patterns
 */
export abstract class BaseRouteTest<TService, TCreateData, TUpdateData, TEntity> {
  protected app: express.Application;
  protected mockService: TService;
  protected basePath: string;

  constructor(basePath: string, routeModule: any, serviceMockMethods: Record<string, any>) {
    this.basePath = basePath;
    this.mockService = serviceMockMethods as TService;
  }

  /**
   * Setup method to be called in beforeEach
   */
  protected setup(routeModule: any): void {
    vi.clearAllMocks();
    this.app = createTestApp(this.basePath, routeModule);
  }

  /**
   * Test successful creation
   */
  protected async testSuccessfulCreate(
    createData: TCreateData,
    expectedResponse: TEntity,
    mockServiceMethod: string = 'create'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockResolvedValue(expectedResponse);

    const response = await request(this.app)
      .post('/')
      .send(createData)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: expectedResponse,
      message: expect.stringContaining('created successfully')
    });

    expect((this.mockService as any)[mockServiceMethod]).toHaveBeenCalledWith(
      expect.any(String), // userId
      createData
    );
  }

  /**
   * Test validation failure
   */
  protected async testValidationFailure(invalidData: Partial<TCreateData>): Promise<void> {
    const response = await request(this.app)
      .post('/')
      .send(invalidData)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Validation failed',
      errors: expect.any(Array)
    });
  }

  /**
   * Test service error handling
   */
  protected async testServiceError(
    createData: TCreateData,
    errorMessage: string,
    mockServiceMethod: string = 'create'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockRejectedValue(new Error(errorMessage));

    const response = await request(this.app)
      .post('/')
      .send(createData)
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      message: errorMessage
    });
  }

  /**
   * Test successful retrieval by ID
   */
  protected async testSuccessfulGetById(
    entityId: string,
    expectedResponse: TEntity,
    mockServiceMethod: string = 'findById'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockResolvedValue(expectedResponse);

    const response = await request(this.app)
      .get(`/${entityId}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: expectedResponse,
      message: expect.stringContaining('retrieved successfully')
    });
  }

  /**
   * Test entity not found
   */
  protected async testNotFound(
    entityId: string,
    mockServiceMethod: string = 'findById'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockResolvedValue(null);

    const response = await request(this.app)
      .get(`/${entityId}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: expect.stringContaining('not found')
    });
  }

  /**
   * Test successful update
   */
  protected async testSuccessfulUpdate(
    entityId: string,
    updateData: TUpdateData,
    expectedResponse: TEntity,
    mockServiceMethod: string = 'update'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockResolvedValue(expectedResponse);

    const response = await request(this.app)
      .put(`/${entityId}`)
      .send(updateData)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: expectedResponse,
      message: expect.stringContaining('updated successfully')
    });
  }

  /**
   * Test successful deletion
   */
  protected async testSuccessfulDelete(
    entityId: string,
    mockServiceMethod: string = 'delete'
  ): Promise<void> {
    (this.mockService as any)[mockServiceMethod].mockResolvedValue(true);

    const response = await request(this.app)
      .delete(`/${entityId}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: expect.stringContaining('deleted successfully')
    });
  }
}