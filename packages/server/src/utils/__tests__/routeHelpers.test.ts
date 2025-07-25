import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response } from 'express';
import {
  sendSuccessResponse,
  sendErrorResponse,
  sendNotFoundResponse,
  asyncHandler
} from '../routeHelpers';

describe('routeHelpers', () => {
  let mockRes: Partial<Response>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockJson: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockStatus = vi.fn().mockReturnThis();
    mockJson = vi.fn();
    mockRes = {
      status: mockStatus,
      json: mockJson
    };
    vi.clearAllMocks();
    // Mock console.error to avoid cluttering test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('sendSuccessResponse', () => {
    it('should send success response with default status 200', () => {
      const data = { id: '123', name: 'test' };
      const message = 'Success';

      sendSuccessResponse(mockRes as Response, data, message);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message
      });
    });

    it('should send success response with custom status', () => {
      const data = { id: '123', name: 'test' };
      const message = 'Created';

      sendSuccessResponse(mockRes as Response, data, message, 201);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
        message
      });
    });

    it('should handle null data', () => {
      sendSuccessResponse(mockRes as Response, null, 'Deleted');

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Deleted'
      });
    });
  });

  describe('sendErrorResponse', () => {
    it('should send error response with error message when Error provided', () => {
      const error = new Error('Test error');
      const defaultMessage = 'Something went wrong';

      sendErrorResponse(mockRes as Response, error, defaultMessage);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Test error' // Uses error.message, not defaultMessage
      });
      expect(console.error).toHaveBeenCalledWith('Error: Something went wrong', error);
    });

    it('should send error response with custom status', () => {
      const error = new Error('Validation failed');
      const defaultMessage = 'Invalid input';

      sendErrorResponse(mockRes as Response, error, defaultMessage, 400);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed' // Uses error.message
      });
    });

    it('should use default message when error is not Error instance', () => {
      const error = 'string error';
      const defaultMessage = 'Internal server error';

      sendErrorResponse(mockRes as Response, error, defaultMessage);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error' // Uses defaultMessage for non-Error
      });
    });
  });

  describe('sendNotFoundResponse', () => {
    it('should send not found response with provided message', () => {
      const message = 'User not found';

      sendNotFoundResponse(mockRes as Response, message);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message
      });
    });
  });

  describe('asyncHandler', () => {
    it('should execute handler successfully', async () => {
      const mockReq = {};
      const handler = vi.fn().mockResolvedValue(undefined);

      const wrappedHandler = asyncHandler(handler);
      wrappedHandler(mockReq as any, mockRes as Response);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes);
    });

    it('should catch and send error response for rejected promises', async () => {
      const mockReq = {};
      const error = new Error('Handler error');
      const handler = vi.fn().mockRejectedValue(error);

      const wrappedHandler = asyncHandler(handler);
      wrappedHandler(mockReq as any, mockRes as Response);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes);
      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Handler error'
      });
    });

    it('should catch and send error response for synchronous errors', async () => {
      const mockReq = {};
      const error = new Error('Sync error');
      const handler = vi.fn().mockImplementation(() => {
        return Promise.reject(error);
      });

      const wrappedHandler = asyncHandler(handler);
      wrappedHandler(mockReq as any, mockRes as Response);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Sync error'
      });
    });
  });
});