import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock the startup checks module
vi.mock('./checks', () => ({
  validateProductionEnvironment: vi.fn()
}));

// Mock express and http
vi.mock('express', () => {
  const mockApp = {
    use: vi.fn(),
    get: vi.fn(),
    listen: vi.fn()
  };
  const mockExpress = vi.fn(() => mockApp);
  // Add json and urlencoded as methods on the main function
  Object.assign(mockExpress, {
    json: vi.fn(),
    urlencoded: vi.fn()
  });
  return { default: mockExpress };
});

vi.mock('http', () => ({
  createServer: vi.fn(() => ({
    listen: vi.fn((port, callback) => {
      if (callback) callback();
    })
  }))
}));

// Mock other dependencies
vi.mock('cors', () => ({ default: vi.fn() }));
vi.mock('helmet', () => ({ default: vi.fn() }));
vi.mock('compression', () => ({ default: vi.fn() }));
vi.mock('cookie-parser', () => ({ default: vi.fn() }));
vi.mock('../auth/routes', () => ({ authRoutes: {} }));
vi.mock('../encounters/routes', () => ({ encounterRoutes: {} }));

describe('Server Startup', () => {
  const originalEnv = process.env;
  const originalExit = process.exit;
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;

  let mockExit: any;
  let mockConsoleLog: any;
  let mockConsoleError: any;
  let mockValidateProductionEnvironment: any;

  beforeEach(async () => {
    vi.resetAllMocks();
    
    // Setup mocks
    mockExit = vi.fn();
    mockConsoleLog = vi.fn();
    mockConsoleError = vi.fn();
    
    (process as any).exit = mockExit;
    (console as any).log = mockConsoleLog;
    (console as any).error = mockConsoleError;
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Get the mocked validate function
    const checksModule = await import('./checks');
    mockValidateProductionEnvironment = checksModule.validateProductionEnvironment as any;
  });

  afterEach(() => {
    process.env = originalEnv;
    process.exit = originalExit;
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  it('should start server successfully when production validation passes', async () => {
    process.env.NODE_ENV = 'production';
    
    mockValidateProductionEnvironment.mockResolvedValue({
      success: true,
      checks: [
        { name: 'Database URL', success: true, message: 'Database URL configured' },
        { name: 'Redis Connection', success: true, message: 'Redis connection successful' }
      ]
    });

    // Import the server module to trigger startup
    await import('../index');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockValidateProductionEnvironment).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server running on port 5000');
    expect(mockConsoleLog).toHaveBeenCalledWith('✅ Production environment validation completed successfully');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should exit with code 1 when production validation fails', async () => {
    process.env.NODE_ENV = 'production';
    
    mockValidateProductionEnvironment.mockResolvedValue({
      success: false,
      checks: [
        { name: 'Database URL', success: true, message: 'Database URL configured' },
        { name: 'Redis Connection', success: false, message: 'Failed to connect to Redis: Connection refused' }
      ]
    });

    // Import the server module to trigger startup
    await import('../index');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockValidateProductionEnvironment).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('💥 Production environment validation failed. Server cannot start.');
    expect(mockConsoleError).toHaveBeenCalledWith('❌ Redis Connection: Failed to connect to Redis: Connection refused');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should exit with code 1 when validation throws an error', async () => {
    process.env.NODE_ENV = 'production';
    
    mockValidateProductionEnvironment.mockRejectedValue(new Error('Validation error'));

    // Import the server module to trigger startup
    await import('../index');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockValidateProductionEnvironment).toHaveBeenCalled();
    expect(mockConsoleError).toHaveBeenCalledWith('💥 Failed to start server:', expect.any(Error));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should skip validation in development environment', async () => {
    process.env.NODE_ENV = 'development';
    
    mockValidateProductionEnvironment.mockResolvedValue({
      success: true,
      message: 'Environment validation skipped (non-production)',
      checks: []
    });

    // Import the server module to trigger startup
    await import('../index');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockValidateProductionEnvironment).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalledWith('🚀 Server running on port 5000');
    expect(mockConsoleLog).not.toHaveBeenCalledWith('✅ Production environment validation completed successfully');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should not start server in test environment', async () => {
    process.env.NODE_ENV = 'test';

    // Import the server module
    await import('../index');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(mockValidateProductionEnvironment).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });
});