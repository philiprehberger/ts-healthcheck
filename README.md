# @philiprehberger/healthcheck

[![CI](https://github.com/philiprehberger/ts-healthcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/ts-healthcheck/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/healthcheck.svg)](https://www.npmjs.com/package/@philiprehberger/healthcheck)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/ts-healthcheck)](https://github.com/philiprehberger/ts-healthcheck/commits/main)

Production readiness health check builder with typed check results

## Installation

```bash
npm install @philiprehberger/healthcheck
```

## Usage

```ts
import { createHealthcheck, check } from '@philiprehberger/healthcheck';

const health = createHealthcheck([
  check('database', async () => { await db.ping(); }),
  check('redis', async () => { await redis.ping(); }),
  check('api', async () => {
    const res = await fetch('https://api.example.com/health');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  }),
]);

// Express/Fastify handler
app.get('/health', async (req, res) => {
  const result = await health();
  res.status(result.status === 'healthy' ? 200 : 503).json(result);
});
```

### Check Dependencies

Use `dependsOn` to ensure a check only runs after its dependencies pass. If a dependency fails, the dependent check is automatically marked unhealthy.

```ts
import { createHealthcheck, check } from '@philiprehberger/healthcheck';

const health = createHealthcheck([
  check('database', async () => { await db.ping(); }),
  check('migrations', async () => { await db.checkMigrations(); }, {
    dependsOn: ['database'],
  }),
  check('seed-data', async () => { await db.checkSeeds(); }, {
    dependsOn: ['database', 'migrations'],
  }),
]);
```

### Degraded Status

Configure a threshold to distinguish between "degraded" and "unhealthy". When the percentage of passing checks is at or above the threshold, the overall status is "degraded" instead of "unhealthy".

```ts
import { createHealthcheck, check } from '@philiprehberger/healthcheck';

const health = createHealthcheck(
  [
    check('database', async () => { await db.ping(); }),
    check('redis', async () => { await redis.ping(); }),
    check('cdn', async () => { await cdn.ping(); }),
    check('search', async () => { await search.ping(); }),
  ],
  { degradedThreshold: 50 },
);

// If 3 of 4 pass (75%) -> "degraded" (above 50% threshold)
// If 1 of 4 pass (25%) -> "unhealthy" (below 50% threshold)
// If 4 of 4 pass (100%) -> "healthy"
```

### Check Grouping

Organize checks into named groups for structured health reports. Each group gets its own aggregated status.

```ts
import { createHealthcheck, check, group } from '@philiprehberger/healthcheck';

const health = createHealthcheck([
  ...group('database', [
    check('postgres', async () => { await pg.ping(); }),
    check('migrations', async () => { await pg.checkMigrations(); }),
  ]),
  ...group('cache', [
    check('redis', async () => { await redis.ping(); }),
    check('memcached', async () => { await memcached.ping(); }),
  ]),
  ...group('external', [
    check('stripe', async () => { await stripe.ping(); }),
    check('sendgrid', async () => { await sendgrid.ping(); }),
  ]),
]);

const result = await health();
// result.groups['database'].status => 'healthy'
// result.groups['cache'].checks['redis'].status => 'healthy'
```

### Per-Check Timeout

Set a timeout per check in milliseconds. If the check does not complete within the timeout, it is marked unhealthy with a timeout error.

```ts
import { createHealthcheck, check } from '@philiprehberger/healthcheck';

const health = createHealthcheck([
  check('database', async () => { await db.ping(); }, { timeout: 3000 }),
  check('external-api', async () => {
    const res = await fetch('https://slow-api.example.com/health');
    if (!res.ok) throw new Error(`Status ${res.status}`);
  }, { timeout: 5000 }),
]);
```

### Response

```json
{
  "status": "healthy",
  "checks": {
    "database": { "status": "healthy", "duration": 12 },
    "redis": { "status": "healthy", "duration": 3 },
    "api": { "status": "healthy", "duration": 45 }
  },
  "timestamp": "2026-03-13T10:00:00.000Z"
}
```

## API

| Export | Description |
|--------|-------------|
| `createHealthcheck(checks, config?)` | Returns async function that runs all checks, respecting dependencies |
| `check(name, fn, options?)` | Define a named health check with optional configuration |
| `group(name, checks)` | Assign a group name to an array of checks |

### `CheckOptions`

| Property | Type | Description |
|----------|------|-------------|
| `dependsOn` | `string[]` | Names of checks that must pass before this check runs |
| `timeout` | `number` | Timeout in milliseconds; check fails if exceeded |
| `group` | `string` | Group name for categorizing this check |

### `HealthcheckConfig`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `degradedThreshold` | `number` | `50` | Percentage (0-100) of checks that must pass for "degraded" instead of "unhealthy" |

### `HealthResult`

| Property | Type | Description |
|----------|------|-------------|
| `status` | `'healthy' \| 'degraded' \| 'unhealthy'` | Overall status |
| `checks` | `Record<string, CheckResult>` | Per-check results |
| `groups` | `Record<string, GroupResult>` | Per-group aggregated results (present when groups are used) |
| `timestamp` | `string` | ISO timestamp |

### `CheckResult`

| Property | Type | Description |
|----------|------|-------------|
| `status` | `'healthy' \| 'degraded' \| 'unhealthy'` | Check status |
| `duration` | `number` | Execution time in milliseconds |
| `error` | `string` | Error message (when unhealthy) |
| `group` | `string` | Group name (when assigned) |

### `GroupResult`

| Property | Type | Description |
|----------|------|-------------|
| `status` | `'healthy' \| 'degraded' \| 'unhealthy'` | Aggregated group status |
| `checks` | `Record<string, CheckResult>` | Checks belonging to this group |

## Development

```bash
npm install
npm run build
npm test
```

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/ts-healthcheck)

🐛 [Report issues](https://github.com/philiprehberger/ts-healthcheck/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/ts-healthcheck/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
