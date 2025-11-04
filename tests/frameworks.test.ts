import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import supertest from 'supertest';

// MOCK
vi.mock('elysia-ip', () => ({
	ip: () => (app: any) => app.derive(({ request }: { request: Request }) => {
		return {
			ip: request.headers.get('x-forwarded-for') ?? '127.0.0.1'
		}
	})
}));

// Frameworks
import express from 'express';
import Koa from 'koa';
import fastify from 'fastify';
import { Hono } from 'hono';
import { Elysia } from 'elysia';
import { ip } from 'elysia-ip'; // This now imports our improved mock

// Middleware
import {
	abuseIPDBExpress,
	abuseIPDBKoa,
	abuseIPDBFastify,
	abuseIPDBHono,
	abuseIPDBElysia,
} from '../src/index';

const options = { apiKey: 'test-key' };
const suspiciousPath = '/.env';
const normalPath = '/';
const manualPath = '/manual-report';
const testIP = '192.168.1.1';

describe('Framework Integrations', () => {
	// --- Express ---
	describe('Express', () => {
		const app = express();
		const { middleware, report } = abuseIPDBExpress(options);
		app.use(middleware);
		app.get(normalPath, (req, res) => res.sendStatus(200));
		app.get(suspiciousPath, (req, res) => res.sendStatus(200));

		it('should not report a normal path', async () => {
			await supertest(app).get(normalPath).expect(200);
			expect(fetch).not.toHaveBeenCalled();
		});

		it('should report a suspicious path', async () => {
			await supertest(app).get(suspiciousPath).expect(200);
			expect(fetch).toHaveBeenCalledOnce();
		});
	});

	// --- Koa ---
	describe('Koa', () => {
		const app = new Koa();
		const { middleware, report } = abuseIPDBKoa(options);
		app.use(middleware);
		app.use((ctx) => {
			ctx.status = 200;
		});

		it('should not report a normal path', async () => {
			await supertest(app.callback()).get(normalPath).expect(200);
			expect(fetch).not.toHaveBeenCalled();
		});

		it('should report a suspicious path', async () => {
			await supertest(app.callback()).get(suspiciousPath).expect(200);
			expect(fetch).toHaveBeenCalledOnce();
		});
	});

	// --- Fastify ---
	describe('Fastify', () => {
		const app = fastify();

		beforeAll(async () => {
			app.register(abuseIPDBFastify, options);
			app.get(normalPath, (req, reply) => reply.send({ ok: true }));
			app.get(suspiciousPath, (req, reply) => reply.send({ ok: true }));
			await app.ready();
		});

		afterAll(async () => {
			await app.close();
		});

		it('should not report a normal path', async () => {
			await supertest(app.server).get(normalPath).expect(200);
			expect(fetch).not.toHaveBeenCalled();
		});

		it('should report a suspicious path', async () => {
			await supertest(app.server).get(suspiciousPath).expect(200);
			expect(fetch).toHaveBeenCalledOnce();
		});
	});

	// --- Hono ---
	describe('Hono', () => {
		const app = new Hono();
		const { middleware, report } = abuseIPDBHono(options);
		app.use('*', middleware);
		app.get(normalPath, (c) => c.text('ok'));
		app.get(suspiciousPath, (c) => c.text('ok'));

		it('should not report a normal path', async () => {
			const req = new Request(`http://localhost${normalPath}`);
			const res = await app.fetch(req);
			expect(res.status).toBe(200);
			expect(fetch).not.toHaveBeenCalled();
		});

		it('should report a suspicious path', async () => {
			const req = new Request(`http://localhost${suspiciousPath}`, {
				headers: { 'x-forwarded-for': '127.0.0.1' },
			});
			const res = await app.fetch(req);
			expect(res.status).toBe(200);
			expect(fetch).toHaveBeenCalledOnce();
		});
	});

	// --- Elysia ---
	describe('Elysia', () => {
		let app: Elysia;

		beforeEach(() => {
			const { middleware, report } = abuseIPDBElysia(options);
			app = new Elysia()
				.use(ip())
				.use(middleware)
				.get(suspiciousPath, () => 'ok')
				.get(manualPath, ({ ip }) => {
					if (ip) report(ip, 'Manual Elysia Report');
					return 'ok';
				});
		});

		it('should report a suspicious path', async () => {
			const req = new Request(`http://localhost${suspiciousPath}`, {
				headers: {
					'x-forwarded-for': '127.0.0.1'
				}
			});
			const res = await app.handle(req);
			expect(res.status).toBe(200);
			expect(fetch).toHaveBeenCalledOnce();
		});

		it('should support manual reporting', async () => {
			const req = new Request(`http://localhost${manualPath}`, { headers: { 'x-forwarded-for': testIP } });
			await app.handle(req);
			expect(fetch).toHaveBeenCalledOnce();
		});
	});
});
