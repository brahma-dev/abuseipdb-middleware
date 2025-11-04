# AbuseIPDB Middleware

A universal middleware for reporting malicious IP addresses to [AbuseIPDB](https://www.abuseipdb.com/). Works with Elysia, Express, Koa, Fastify, and Hono.

## Installation

```bash
npm install abuseipdb-middleware
```

## Features

- **Universal**: Works with all major Node.js/Bun frameworks.
- **Manual Reporting**: Exposes a `report` function to manually flag IPs for any reason.
- **Configurable**: Customize suspicious paths and report categories.
- **Efficient**: Caches reported IPs to avoid duplicate API calls.
- **Lightweight**: Minimal dependencies.

## Usage

First, get your API key from the [AbuseIPDB dashboard](https://www.abuseipdb.com/account/api).

The middleware initializer returns an object containing the `middleware` itself and a `report` function for manual use.

### Express

```typescript
import express from 'express';
import { abuseIPDBExpress } from 'abuseipdb-middleware';

const app = express();
const { middleware, report } = abuseIPDBExpress({ apiKey: 'YOUR_API_KEY' });

app.use(middleware);
// ... your routes
```

### Koa

```typescript
import Koa from 'koa';
import { abuseIPDBKoa } from 'abuseipdb-middleware';

const app = new Koa();
const { middleware, report } = abuseIPDBKoa({ apiKey: 'YOUR_API_KEY' });

app.use(middleware);
// ... your routes
```

### Fastify

Fastify is slightly different. The `report` function is attached to the `fastify` instance via a decorator as `app.abuseipdb.report`.

```typescript
import fastify from 'fastify';
import { abuseIPDBFastify } from 'abuseipdb-middleware';

const app = fastify();
app.register(abuseIPDBFastify, { apiKey: 'YOUR_API_KEY' });
// ... your routes
```

### Hono

```typescript
import { Hono } from 'hono';
import { abuseIPDBHono } from 'abuseipdb-middleware';

const app = new Hono();
const { middleware, report } = abuseIPDBHono({ apiKey: 'YOUR_API_KEY' });

app.use('*', middleware);
// ... your routes
```

### Elysia

For Elysia, it's recommended to also use the `elysia-ip` plugin to ensure the IP address is correctly identified.

```bash
bun add elysia-ip
```
```ts
import { Elysia } from 'elysia';
import { ip } from 'elysia-ip';
import { abuseIPDBElysia } from 'abuseipdb-middleware';

const { middleware, report } = abuseIPDBElysia({ apiKey: 'YOUR_API_KEY' });

new Elysia()
  .use(ip()) // Recommended: makes `context.ip` available
  .use(middleware)
  .get('/', () => 'Hello Elysia')
  .listen(3000);```

## Manual Reporting

The exposed `report` function allows you to report IPs for application-specific reasons, such as failed login attempts, spam, or unusual API usage.

The function has the following signature:
`report(ip: string, comment: string, categories?: string): Promise<void>`

- **`ip`**: The IP address to report.
- **`comment`**: A description of the malicious activity.
- **`categories`** (optional): A comma-separated string of AbuseIPDB category codes. Defaults to the one in the options.

### Example: Reporting a Failed Login (Express)
```typescript
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const {loginSuccess, attemptCount } = authenticate(username, password); // Your auth logic

  if (!loginSuccess ) {
    if(attemptCount>10) {
      // Report the IP for a failed login (Category 18: Brute-Force)
      report(req.ip, `Failed login attempt for user "${username}"`, '18');
    }
    return res.status(401).send('Authentication failed.');
  }
  
  res.send('Logged in!');
});
```

### Example: Manual Reporting (Fastify)
```typescript
app.post('/comment', (req, reply) => {
    const isSpam = detectSpam(req.body); // Your spam detection logic
    if (isSpam) {
        // Use the decorator to report the IP
        app.abuseipdb.report(req.ip, 'User submitted spam comment.', '14');
        return reply.status(400).send('Spam detected.');
    }
    //...
});
```

### Configuration Options

You can pass an options object to the middleware factory:

```typescript
interface AbuseIPDBOptions {
  apiKey: string; // Required
  paths?: string[]; // Replace default suspicious paths
  additionalPaths?: string[]; // Add to default suspicious paths
  categories?: string; // Comma-separated AbuseIPDB category codes (defaults to "21")
  cacheTTL?: number; // How long to cache IPs in ms (defaults to 1 hour)
}
```
