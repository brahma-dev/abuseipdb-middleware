import type { Elysia } from 'elysia';
import { createAbuseIPDBPlugin, AbuseIPDBOptions } from './core';

export const abuseIPDBElysia = (options: AbuseIPDBOptions) => {
    const { suspiciousPaths, reportToAbuseIPDB } = createAbuseIPDBPlugin(options);

    return (app: Elysia) =>
        app.onBeforeHandle((context: { ip?: string; request: Request }) => {
            const path = new URL(context.request.url).pathname;

            if (suspiciousPaths.some(p => path.startsWith(p))) {
                // Now, TypeScript knows `context.ip` can exist, resolving the error.
                const ip = context.ip || "unknown";

                if (ip !== "unknown") {
                    reportToAbuseIPDB(ip, path);
                }
            }
        });
};
