export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface CheckResult {
  status: HealthStatus;
  duration: number;
  error?: string;
}

export interface HealthResult {
  status: HealthStatus;
  checks: Record<string, CheckResult>;
  timestamp: string;
}

export interface HealthCheck {
  name: string;
  fn: () => Promise<void>;
}
