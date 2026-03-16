# @philiprehberger/ts-healthcheck

[![CI](https://github.com/philiprehberger/ts-healthcheck/actions/workflows/publish.yml/badge.svg)](https://github.com/philiprehberger/ts-healthcheck/actions/workflows/publish.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/ts-healthcheck.svg)](https://www.npmjs.com/package/@philiprehberger/ts-healthcheck)
[![License](https://img.shields.io/github/license/philiprehberger/ts-healthcheck)](LICENSE)

Production readiness health check builder with typed check results.

## Installation

```bash
npm install @philiprehberger/ts-healthcheck
```

## Usage

```ts
import { createHealthcheck, check } from '@philiprehberger/ts-healthcheck';

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
| `createHealthcheck(checks)` | Returns async function that runs all checks in parallel |
| `check(name, fn)` | Define a named health check |

### `HealthResult`

| Property | Type | Description |
|----------|------|-------------|
| `status` | `'healthy' \| 'degraded' \| 'unhealthy'` | Overall status |
| `checks` | `Record<string, CheckResult>` | Per-check results |
| `timestamp` | `string` | ISO timestamp |


## Development

```bash
npm install
npm run build
npm test
```

## License

MIT
