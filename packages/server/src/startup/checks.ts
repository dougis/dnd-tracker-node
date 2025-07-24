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
 * Check Redis connection in production environment
 * @returns Promise<CheckResult> - Result of the Redis connection check
 */
export async function checkRedisConnection(): Promise<CheckResult> {
  // Skip Redis check in non-production environments
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

  let client = null;
  let isConnected = false;
  
  try {
    // Create Redis client
    client = createClient({
      url: redisUrl,
      password: process.env.REDIS_PASSWORD || 'redispassword'
    });

    // Connect to Redis
    await client.connect();
    isConnected = true;
    
    // Test the connection with ping
    await client.ping();
    
    console.log('✅ Redis connection successful');
    
    return {
      success: true,
      message: 'Redis connection successful'
    };
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    
    if (!client) {
      return {
        success: false,
        message: `Failed to create Redis client: ${errorMessage}`
      };
    }

    // If we connected successfully but ping failed, it's a ping issue
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
  } finally {
    // Always attempt to close the connection
    if (client) {
      try {
        await client.disconnect();
      } catch (disconnectError) {
        console.warn('Warning: Failed to disconnect Redis client:', disconnectError);
      }
    }
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