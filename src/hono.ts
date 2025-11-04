import type { Context, Next } from 'hono';
import { createAbuseIPDBPlugin, AbuseIPDBOptions } from './core';

export const abuseIPDBHono = (options: AbuseIPDBOptions) => {
	const { suspiciousPaths, reportToAbuseIPDB } = createAbuseIPDBPlugin(options);

	const middleware = async (c: Context, next: Next) => {
		const path = c.req.path;

		if (suspiciousPaths.some(p => path.startsWith(p))) {
			const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || "unknown";
			if (ip !== "unknown") {
				await reportToAbuseIPDB(ip, `Attempted access to suspicious path: ${path}`);
			}
		}
		await next();
	};

	return { middleware, report: reportToAbuseIPDB };
};
