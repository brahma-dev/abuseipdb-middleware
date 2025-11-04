import type { Context, Next } from 'koa';
import { createAbuseIPDBPlugin, AbuseIPDBOptions } from './core';

export const abuseIPDBKoa = (options: AbuseIPDBOptions) => {
	const { suspiciousPaths, reportToAbuseIPDB } = createAbuseIPDBPlugin(options);
	return async (ctx: Context, next: Next) => {
		if (suspiciousPaths.some(p => ctx.path.startsWith(p))) {
			const ip = ctx.ip || "unknown";
			if (ip !== "unknown") {
				await reportToAbuseIPDB(ip, ctx.path);
			}
		}
		await next();
	};
};
