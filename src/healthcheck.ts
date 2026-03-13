import type { HealthCheck, HealthResult, CheckResult, HealthStatus } from './types.js';

export function check(name: string, fn: () => Promise<void>): HealthCheck {
  return { name, fn };
}

export function createHealthcheck(
  checks: HealthCheck[],
): () => Promise<HealthResult> {
  return async (): Promise<HealthResult> => {
    const results: Record<string, CheckResult> = {};

    await Promise.all(
      checks.map(async ({ name, fn }) => {
        const start = Date.now();
        try {
          await fn();
          results[name] = {
            status: 'healthy',
            duration: Date.now() - start,
          };
        } catch (error) {
          results[name] = {
            status: 'unhealthy',
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }),
    );

    let overall: HealthStatus = 'healthy';
    for (const result of Object.values(results)) {
      if (result.status === 'unhealthy') {
        overall = 'unhealthy';
        break;
      }
      if (result.status === 'degraded') {
        overall = 'degraded';
      }
    }

    return {
      status: overall,
      checks: results,
      timestamp: new Date().toISOString(),
    };
  };
}
