import { Request, Response, NextFunction } from 'express';
import { 
  API_VERSION, 
  API_VERSION_HEADER, 
  API_VERSION_RESPONSE_HEADER,
  HTTP_STATUS 
} from '@dnd-tracker/shared';

// Extend Express Request to include apiVersion
declare module 'express-serve-static-core' {
  interface Request {
    apiVersion?: string;
  }
}

/**
 * Extracts API version from URL path
 * @param path - Request path
 * @returns Version string or null if not found
 */
export function extractVersion(path: string): string | null {
  const versionMatch = path.match(/^\/api\/(v\d+)\//);
  return versionMatch ? versionMatch[1] : null;
}

/**
 * Validates if the provided version is supported
 * @param version - Version string to validate
 * @returns True if version is supported
 */
export function validateVersion(version: string | null | undefined): boolean {
  if (!version) return false;
  return (API_VERSION.SUPPORTED as readonly string[]).includes(version);
}

/**
 * Determines if deprecation warning should be sent
 * @param version - API version
 * @returns Deprecation info if deprecated, null otherwise
 */
function getDeprecationInfo(version: string): { deprecated: boolean; sunset?: string } | null {
  // Currently no versions are deprecated
  // Future versions can be added here
  const deprecatedVersions: Record<string, { sunset?: string }> = {
    // 'v0': { sunset: '2024-12-31T23:59:59Z' }
  };

  if (deprecatedVersions[version]) {
    return {
      deprecated: true,
      sunset: deprecatedVersions[version].sunset
    };
  }

  return null;
}

/**
 * API versioning middleware
 * Handles version extraction, validation, and response headers
 */
export function apiVersioningMiddleware(
  req: Request, 
  res: Response, 
  next: NextFunction
): void {
  // Skip versioning for non-API routes
  if (!req.path.startsWith('/api')) {
    return next();
  }

  let version: string | null = null;

  // 1. Try to extract version from URL first (highest priority)
  version = extractVersion(req.path);

  // 2. If no URL version, check API-Version header
  if (!version) {
    const headerVersion = req.get(API_VERSION_HEADER);
    if (headerVersion) {
      version = headerVersion;
    }
  }

  // 3. If we have a version, validate it
  if (version) {
    if (!validateVersion(version)) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Unsupported API Version',
        message: `API version '${version}' is not supported. Supported versions: ${API_VERSION.SUPPORTED.join(', ')}`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        timestamp: new Date().toISOString(),
        version: API_VERSION.DEFAULT
      });
      return;
    }

    // Set version on request
    req.apiVersion = version;

    // Add version to response headers
    res.set(API_VERSION_RESPONSE_HEADER, version);

    // Check for deprecation warnings
    const deprecationInfo = getDeprecationInfo(version);
    if (deprecationInfo?.deprecated) {
      res.set('Deprecation', 'true');
      if (deprecationInfo.sunset) {
        res.set('Sunset', deprecationInfo.sunset);
      }
    }
  } else {
    // For versioned API paths without explicit version, return error
    if (req.path.startsWith('/api/') && !req.path.startsWith('/api/v')) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: 'Missing API Version',
        message: `API version is required. Please specify version in URL (/api/v1/...) or use ${API_VERSION_HEADER} header`,
        statusCode: HTTP_STATUS.BAD_REQUEST,
        timestamp: new Date().toISOString(),
        version: API_VERSION.DEFAULT
      });
      return;
    }
  }

  next();
}

/**
 * Creates a version-specific router prefix
 * @param version - API version
 * @returns Router prefix string
 */
export function getVersionPrefix(version: string = API_VERSION.CURRENT): string {
  return `/api/${version}`;
}

/**
 * Checks if a request is for a specific API version
 * @param req - Express request
 * @param targetVersion - Version to check against
 * @returns True if request is for the target version
 */
export function isApiVersion(req: Request, targetVersion: string): boolean {
  return req.apiVersion === targetVersion;
}