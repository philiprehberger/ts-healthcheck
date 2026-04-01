export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface CheckOptions {
  /** Names of checks that must pass before this check runs */
  dependsOn?: string[];
  /** Timeout in milliseconds; check fails if exceeded */
  timeout?: number;
  /** Group name for organizing checks into categories */
  group?: string;
}

export interface CheckResult {
  status: HealthStatus;
  duration: number;
  error?: string;
  group?: string;
}

export interface GroupResult {
  status: HealthStatus;
  checks: Record<string, CheckResult>;
}

export interface HealthcheckConfig {
  /**
   * Percentage (0-100) of checks that must pass to be considered "degraded"
   * rather than "unhealthy". Defaults to 50.
   * - 100% pass = "healthy"
   * - >= threshold pass = "degraded"
   * - < threshold pass = "unhealthy"
   */
  degradedThreshold?: number;
}

export interface HealthResult {
  status: HealthStatus;
  checks: Record<string, CheckResult>;
  groups?: Record<string, GroupResult>;
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  fn: () => Promise<void>;
  options?: CheckOptions;
}
