# @philiprehberger/healthcheck

[![CI](https://github.com/philiprehberger/healthcheck/actions/workflows/ci.yml/badge.svg)](https://github.com/philiprehberger/healthcheck/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@philiprehberger/healthcheck.svg)](https://www.npmjs.com/package/@philiprehberger/healthcheck)
[![Last updated](https://img.shields.io/github/last-commit/philiprehberger/healthcheck)](https://github.com/philiprehberger/healthcheck/commits/main)

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

## Support

If you find this project useful:

⭐ [Star the repo](https://github.com/philiprehberger/healthcheck)

🐛 [Report issues](https://github.com/philiprehberger/healthcheck/issues?q=is%3Aissue+is%3Aopen+label%3Abug)

💡 [Suggest features](https://github.com/philiprehberger/healthcheck/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement)

❤️ [Sponsor development](https://github.com/sponsors/philiprehberger)

🌐 [All Open Source Projects](https://philiprehberger.com/open-source-packages)

💻 [GitHub Profile](https://github.com/philiprehberger)

🔗 [LinkedIn Profile](https://www.linkedin.com/in/philiprehberger)

## License

[MIT](LICENSE)
