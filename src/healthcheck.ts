import type {
  HealthCheck,
  HealthResult,
  CheckResult,
  HealthStatus,
  CheckOptions,
  GroupResult,
  HealthcheckConfig,
} from './types.js';

export function check(
  name: string,
  fn: () => Promise<void>,
  options?: CheckOptions,
): HealthCheck {
  return { name, fn, options };
}

export function group(
  groupName: string,
  checks: HealthCheck[],
): HealthCheck[] {
  return checks.map((c) => ({
    ...c,
    options: { ...c.options, group: groupName },
  }));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`Check timed out after ${ms}ms`)),
      ms,
    );
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      },
    );
  });
}

export function createHealthcheck(
  checks: HealthCheck[],
  config?: HealthcheckConfig,
): () => Promise<HealthResult> {
  const threshold = config?.degradedThreshold ?? 50;

  return async (): Promise<HealthResult> => {
    const results: Record<string, CheckResult> = {};

    // Build a map for dependency lookup
    const checkMap = new Map<string, HealthCheck>();
    for (const c of checks) {
      checkMap.set(c.name, c);
    }

    // Run a single check, resolving dependencies first
    const running = new Map<string, Promise<void>>();

    function runCheck(c: HealthCheck): Promise<void> {
      const existing = running.get(c.name);
      if (existing) return existing;

      const p = (async () => {
        const deps = c.options?.dependsOn ?? [];

        // Run dependencies first
        for (const depName of deps) {
          const dep = checkMap.get(depName);
          if (dep) {
            await runCheck(dep);
          }
        }

        // Skip if any dependency failed
        for (const depName of deps) {
          if (results[depName]?.status === 'unhealthy') {
            results[c.name] = {
              status: 'unhealthy',
              duration: 0,
              error: `Dependency "${depName}" failed`,
              ...(c.options?.group ? { group: c.options.group } : {}),
            };
            return;
          }
        }

        const start = Date.now();
        try {
          const promise = c.fn();
          if (c.options?.timeout) {
            await withTimeout(promise, c.options.timeout);
          } else {
            await promise;
          }
          results[c.name] = {
            status: 'healthy',
            duration: Date.now() - start,
            ...(c.options?.group ? { group: c.options.group } : {}),
          };
        } catch (error) {
          results[c.name] = {
            status: 'unhealthy',
            duration: Date.now() - start,
            error: error instanceof Error ? error.message : String(error),
            ...(c.options?.group ? { group: c.options.group } : {}),
          };
        }
      })();

      running.set(c.name, p);
      return p;
    }

    // Run all checks, respecting dependencies
    await Promise.all(checks.map((c) => runCheck(c)));

    // Compute overall status using threshold
    const allResults = Object.values(results);
    const total = allResults.length;
    const passed = allResults.filter((r) => r.status === 'healthy').length;
    const passRate = total > 0 ? (passed / total) * 100 : 100;

    let overall: HealthStatus;
    if (passRate === 100) {
      overall = 'healthy';
    } else if (passRate >= threshold) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    // Build group results
    const groupNames = new Set<string>();
    for (const r of allResults) {
      if (r.group) groupNames.add(r.group);
    }

    let groups: Record<string, GroupResult> | undefined;
    if (groupNames.size > 0) {
      groups = {};
      for (const gn of groupNames) {
        const groupChecks: Record<string, CheckResult> = {};
        for (const [name, result] of Object.entries(results)) {
          if (result.group === gn) {
            groupChecks[name] = result;
          }
        }
        const groupResults = Object.values(groupChecks);
        const gTotal = groupResults.length;
        const gPassed = groupResults.filter(
          (r) => r.status === 'healthy',
        ).length;
        const gRate = gTotal > 0 ? (gPassed / gTotal) * 100 : 100;

        let groupStatus: HealthStatus;
        if (gRate === 100) {
          groupStatus = 'healthy';
        } else if (gRate >= threshold) {
          groupStatus = 'degraded';
        } else {
          groupStatus = 'unhealthy';
        }

        groups[gn] = { status: groupStatus, checks: groupChecks };
      }
    }

    return {
      status: overall,
      checks: results,
      ...(groups ? { groups } : {}),
      timestamp: new Date().toISOString(),
    };
  };
}
