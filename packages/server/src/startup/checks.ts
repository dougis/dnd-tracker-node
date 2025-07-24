import { createClient } from 'redis';

export interface CheckResult {
  success: boolean;
  message: string;
}

export interface EnvironmentCheck {
  name: string;
  success: boolean;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  message?: string;
  checks: EnvironmentCheck[];
}

/**
 * Validate Redis configuration for production environment
 * @returns CheckResult - Result of the configuration validation
 */
function validateRedisConfiguration(): CheckResult {
  if (process.env.NODE_ENV !== 'production') {
    return {
      success: true,
      message: 'Redis check skipped (non-production environment)'
    };
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return {
      success: false,
      message: 'REDIS_URL environment variable is required in production'
    };
  }

  return { success: true, message: 'Redis configuration valid' };
}

/**
 * Create and configure Redis client
 * @returns Redis client instance
 */
function createRedisClient() {
  return createClient({
    url: process.env.REDIS_URL!,
    password: process.env.REDIS_PASSWORD || 'redispassword'
  });
}

/**
 * Attempt to disconnect Redis client safely
 * @param client - Redis client to disconnect
 */
async function safeDisconnect(client: any): Promise<void> {
  if (client) {
    try {
      await client.disconnect();
    } catch (disconnectError) {
      console.warn('Warning: Failed to disconnect Redis client:', disconnectError);
    }
  }
}

/**
 * Handle Redis connection errors with appropriate messaging
 * @param error - The error that occurred
 * @param client - The Redis client (may be null)
 * @param isConnected - Whether connection was established
 * @returns CheckResult with appropriate error message
 */
function handleRedisError(error: any, client: any, isConnected: boolean): CheckResult {
  const errorMessage = error.message || 'Unknown error';
  
  if (!client) {
    return {
      success: false,
      message: `Failed to create Redis client: ${errorMessage}`
    };
  }

  if (isConnected) {
    return {
      success: false,
      message: `Redis ping failed: ${errorMessage}`
    };
  }

  return {
    success: false,
    message: `Failed to connect to Redis: ${errorMessage}`
  };
}

/**
 * Check Redis connection in production environment
 * @returns Promise<CheckResult> - Result of the Redis connection check
 */
export async function checkRedisConnection(): Promise<CheckResult> {
  // Validate configuration first
  const configCheck = validateRedisConfiguration();
  if (!configCheck.success) {
    return configCheck;
  }

  let client = null;
  let isConnected = false;
  
  try {
    client = createRedisClient();
    await client.connect();
    isConnected = true;
    
    await client.ping();
    
    console.log('✅ Redis connection successful');
    
    return {
      success: true,
      message: 'Redis connection successful'
    };
  } catch (error: any) {
    return handleRedisError(error, client, isConnected);
  } finally {
    await safeDisconnect(client);
  }
}

/**
 * Check if DATABASE_URL is configured
 * @returns EnvironmentCheck - Result of the database URL check
 */
export function checkDatabaseUrl(): EnvironmentCheck {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return {
      name: 'Database URL',
      success: false,
      message: 'DATABASE_URL environment variable is required in production'
    };
  }

  return {
    name: 'Database URL',
    success: true,
    message: 'Database URL configured'
  };
}

/**
 * Validate production environment configuration
 * @returns Promise<ValidationResult> - Result of all environment checks
 */
export async function validateProductionEnvironment(): Promise<ValidationResult> {
  // Skip validation in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    return {
      success: true,
      message: 'Environment validation skipped (non-production)',
      checks: []
    };
  }

  console.log('🔍 Validating production environment configuration...');

  const checks: EnvironmentCheck[] = [];

  // Check database URL
  const databaseCheck = checkDatabaseUrl();
  checks.push(databaseCheck);

  // Check Redis connection
  const redisResult = await checkRedisConnection();
  checks.push({
    name: 'Redis Connection',
    success: redisResult.success,
    message: redisResult.message
  });

  // Determine overall success
  const allSuccessful = checks.every(check => check.success);

  if (allSuccessful) {
    console.log('✅ All production environment checks passed');
  } else {
    console.error('❌ Production environment validation failed:');
    checks.forEach(check => {
      if (!check.success) {
        console.error(`  - ${check.name}: ${check.message}`);
      }
    });
  }

  return {
    success: allSuccessful,
    checks
  };
}