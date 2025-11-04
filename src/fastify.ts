import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createAbuseIPDBPlugin, AbuseIPDBOptions } from './core';

export const abuseIPDBFastify = fp(async (fastify: FastifyInstance, options: AbuseIPDBOptions) => {
	const { suspiciousPaths, reportToAbuseIPDB } = createAbuseIPDBPlugin(options);
	fastify.addHook('onRequest', async (request) => {
		const path = new URL(request.raw.url!, `http://${request.headers.host}`).pathname;
		if (suspiciousPaths.some(p => path.startsWith(p))) {
			const ip = request.ip || "unknown";
			if (ip !== "unknown") {
				await reportToAbuseIPDB(ip, path);
			}
		}
	});
});
