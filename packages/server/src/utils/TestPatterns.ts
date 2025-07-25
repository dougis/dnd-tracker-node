import request from 'supertest';
import { expect } from 'vitest';
import type { Application } from 'express';

/**
 * Common test patterns to eliminate duplication
 */
export class TestPatterns {
  /**
   * Test successful creation endpoint
   */
  static async testSuccessfulCreation(
    app: Application,
    endpoint: string,
    createData: any,
    expectedResponse: any,
    mockFn: any,
    expectedUserId: string = 'user123'
  ) {
    mockFn.mockResolvedValue(expectedResponse);

    const response = await request(app)
      .post(endpoint)
      .send(createData)
      .expect(201);

    expect(response.body).toEqual({
      success: true,
      data: expectedResponse,
      message: expect.stringContaining('created successfully')
    });

    expect(mockFn).toHaveBeenCalledWith(expectedUserId, createData);
  }

  /**
   * Test validation failure
   */
  static async testValidationFailure(
    app: Application,
    endpoint: string,
    invalidData: any
  ) {
    const response = await request(app)
      .post(endpoint)
      .send(invalidData)
      .expect(400);

    expect(response.body).toEqual({
      success: false,
      message: 'Validation failed',
      errors: expect.any(Array)
    });
  }

  /**
   * Test service error
   */
  static async testServiceError(
    app: Application,
    endpoint: string,
    data: any,
    mockFn: any,
    errorMessage: string
  ) {
    mockFn.mockRejectedValue(new Error(errorMessage));

    const response = await request(app)
      .post(endpoint)
      .send(data)
      .expect(500);

    expect(response.body).toEqual({
      success: false,
      message: errorMessage
    });
  }

  /**
   * Test successful GET by ID
   */
  static async testSuccessfulGetById(
    app: Application,
    endpoint: string,
    entityId: string,
    expectedResponse: any,
    mockFn: any
  ) {
    mockFn.mockResolvedValue(expectedResponse);

    const response = await request(app)
      .get(`${endpoint}/${entityId}`)
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
  static async testNotFound(
    app: Application,
    endpoint: string,
    entityId: string,
    mockFn: any,
    entityType: string
  ) {
    mockFn.mockResolvedValue(null);

    const response = await request(app)
      .get(`${endpoint}/${entityId}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: `${entityType} not found`
    });
  }

  /**
   * Test successful update
   */
  static async testSuccessfulUpdate(
    app: Application,
    endpoint: string,
    entityId: string,
    updateData: any,
    expectedResponse: any,
    mockFn: any
  ) {
    mockFn.mockResolvedValue(expectedResponse);

    const response = await request(app)
      .put(`${endpoint}/${entityId}`)
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
  static async testSuccessfulDeletion(
    app: Application,
    endpoint: string,
    entityId: string,
    mockFn: any,
    entityType: string
  ) {
    mockFn.mockResolvedValue(true);

    const response = await request(app)
      .delete(`${endpoint}/${entityId}`)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: `${entityType} deleted successfully`
    });
  }

  /**
   * Test delete not found
   */
  static async testDeleteNotFound(
    app: Application,
    endpoint: string,
    entityId: string,
    mockFn: any,
    entityType: string
  ) {
    mockFn.mockResolvedValue(false);

    const response = await request(app)
      .delete(`${endpoint}/${entityId}`)
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      message: `${entityType} not found`
    });
  }

  /**
   * Test GET collection endpoint
   */
  static async testGetCollection(
    app: Application,
    endpoint: string,
    expectedResponse: any[],
    mockFn: any,
    entityType: string,
    expectedUserId: string = 'user123'
  ) {
    mockFn.mockResolvedValue(expectedResponse);

    const response = await request(app)
      .get(endpoint)
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: expectedResponse,
      message: `${entityType} retrieved successfully`
    });

    // Check that the mock was called with the correct user ID
    if (entityType === 'Parties') {
      expect(mockFn).toHaveBeenCalledWith(expectedUserId, false);
    } else if (entityType === 'Characters') {
      // For characters by party, we expect partyId and userId
      expect(mockFn).toHaveBeenCalledWith(expect.any(String), expectedUserId);
    }
  }
}

/**
 * Common service test patterns
 */
export class ServiceTestPatterns {
  /**
   * Test successful service creation
   */
  static async testSuccessfulCreate(
    service: any,
    method: string,
    userId: string,
    createData: any,
    expectedResult: any,
    mockPrisma: any,
    prismaModel: string
  ) {
    mockPrisma[prismaModel].create.mockResolvedValue(expectedResult);

    const result = await service[method](userId, createData);

    expect(result).toEqual(expectedResult);
    expect(mockPrisma[prismaModel].create).toHaveBeenCalledWith({
      data: expect.objectContaining(createData)
    });
  }

  /**
   * Test validation error
   */
  static async testValidationError(
    service: any,
    method: string,
    userId: string,
    invalidData: any,
    expectedErrorMessage: string
  ) {
    await expect(service[method](userId, invalidData))
      .rejects.toThrow(expectedErrorMessage);
  }

  /**
   * Test database error
   */
  static async testDatabaseError(
    service: any,
    method: string,
    userId: string,
    data: any,
    mockPrisma: any,
    prismaModel: string,
    operation: string = 'create'
  ) {
    mockPrisma[prismaModel][operation].mockRejectedValue(new Error('Database error'));

    await expect(service[method](userId, data))
      .rejects.toThrow(expect.stringContaining('Failed to'));
  }

  /**
   * Test successful find by ID
   */
  static async testSuccessfulFindById(
    service: any,
    method: string,
    entityId: string,
    userId: string,
    expectedResult: any,
    mockPrisma: any,
    prismaModel: string
  ) {
    mockPrisma[prismaModel].findFirst.mockResolvedValue(expectedResult);

    const result = await service[method](entityId, userId);

    expect(result).toEqual(expectedResult);
  }

  /**
   * Test entity not found
   */
  static async testNotFound(
    service: any,
    method: string,
    entityId: string,
    userId: string,
    mockPrisma: any,
    prismaModel: string
  ) {
    mockPrisma[prismaModel].findFirst.mockResolvedValue(null);

    const result = await service[method](entityId, userId);

    expect(result).toBeNull();
  }
}