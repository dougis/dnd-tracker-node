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
    it('should send error response with default status 500', () => {
      const error = new Error('Test error');
      const message = 'Something went wrong';

      sendErrorResponse(mockRes as Response, error, message);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message
      });
      expect(console.error).toHaveBeenCalledWith('Error: Something went wrong', error);
    });

    it('should send error response with custom status', () => {
      const error = new Error('Validation failed');
      const message = 'Invalid input';

      sendErrorResponse(mockRes as Response, error, message, 400);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message
      });
    });

    it('should handle error without message', () => {
      const error = new Error('Test error');

      sendErrorResponse(mockRes as Response, error);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error'
      });
    });
  });

  describe('sendNotFoundResponse', () => {
    it('should send not found response with default message', () => {
      sendNotFoundResponse(mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Resource not found'
      });
    });

    it('should send not found response with custom message', () => {
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
      const mockNext = vi.fn();
      const handler = vi.fn().mockResolvedValue('success');

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should catch and forward errors to next', async () => {
      const mockReq = {};  
      const mockNext = vi.fn();
      const error = new Error('Handler error');
      const handler = vi.fn().mockRejectedValue(error);

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(handler).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(error);
    });

    it('should handle synchronous errors', async () => {
      const mockReq = {};
      const mockNext = vi.fn();
      const error = new Error('Sync error');
      const handler = vi.fn().mockImplementation(() => {
        throw error;
      });

      const wrappedHandler = asyncHandler(handler);
      await wrappedHandler(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});