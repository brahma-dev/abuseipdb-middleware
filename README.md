# AbuseIPDB Middleware

A universal middleware for reporting malicious IP addresses to [AbuseIPDB](https://www.abuseipdb.com/). Works with Elysia, Express, Koa, Fastify, and Hono.

## Installation

```bash
npm install abuseipdb-middleware
```

## Features

- **Universal**: Works with all major Node.js/Bun frameworks.
- **Configurable**: Customize suspicious paths and report categories.
- **Efficient**: Caches reported IPs to avoid duplicate API calls.
- **Lightweight**: Minimal dependencies.

## Usage

First, get your API key from the [AbuseIPDB dashboard](https://www.abuseipdb.com/account/api).

### Express

```typescript
import express from 'express';
import { abuseIPDBExpress } from 'abuseipdb-middleware';

const app = express();
app.use(abuseIPDBExpress({ apiKey: 'YOUR_API_KEY' }));
// ... your routes
```

### Koa

```typescript
import Koa from 'koa';
import { abuseIPDBKoa } from 'abuseipdb-middleware';

const app = new Koa();
app.use(abuseIPDBKoa({ apiKey: 'YOUR_API_KEY' }));
// ... your routes
```

### Fastify

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
app.use('*', abuseIPDBHono({ apiKey: 'YOUR_API_KEY' }));
// ... your routes```
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

new Elysia()
  .use(ip()) // Recommended: makes `context.ip` available
  .use(abuseIPDBElysia({ apiKey: 'YOUR_API_KEY' }))
  .get('/', () => 'Hello Elysia')
  .listen(3000);
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
