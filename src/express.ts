import type { Request, Response, NextFunction } from 'express';
import { createAbuseIPDBPlugin, AbuseIPDBOptions } from './core';

export const abuseIPDBExpress = (options: AbuseIPDBOptions) => {
	const { suspiciousPaths, reportToAbuseIPDB } = createAbuseIPDBPlugin(options);
	return (req: Request, res: Response, next: NextFunction) => {
		if (suspiciousPaths.some(p => req.path.startsWith(p))) {
			const ip = req.ip || "unknown";
			if (ip !== "unknown") {
				reportToAbuseIPDB(ip, req.path);
			}
		}
		next();
	};
};
