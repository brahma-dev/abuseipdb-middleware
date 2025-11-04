import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createAbuseIPDBPlugin } from '../src/core';

describe('Core Logic', () => {
	const apiKey = 'test-api-key';

	it('should throw an error if no API key is provided', () => {
		expect(() => createAbuseIPDBPlugin({ apiKey: '' })).toThrow(
			'AbuseIPDB plugin requires an API key'
		);
	});

	it('should use default suspicious paths', () => {
		const { suspiciousPaths } = createAbuseIPDBPlugin({ apiKey });
		expect(suspiciousPaths).toContain('/.env');
	});

	it('should override default paths with `paths` option', () => {
		const { suspiciousPaths } = createAbuseIPDBPlugin({
			apiKey,
			paths: ['/custom-path'],
		});
		expect(suspiciousPaths).toEqual(['/custom-path']);
		expect(suspiciousPaths).not.toContain('/.env');
	});

	it('should add to default paths with `additionalPaths` option', () => {
		const { suspiciousPaths } = createAbuseIPDBPlugin({
			apiKey,
			additionalPaths: ['/extra-path'],
		});
		expect(suspiciousPaths).toContain('/.env');
		expect(suspiciousPaths).toContain('/extra-path');
	});

	describe('reportToAbuseIPDB Caching', () => {
		vi.useFakeTimers();
		const cacheTTL = 1000 * 60; // 1 minute
		const ip = '123.45.67.89';
		const path = '/.env';

		// Declare the function here, but initialize it before each test
		let reportToAbuseIPDB: (ip: string, path: string) => Promise<void>;

		// This hook runs before each test in this describe block
		beforeEach(() => {
			// Re-create the plugin instance to get a fresh, empty cache
			const plugin = createAbuseIPDBPlugin({ apiKey, cacheTTL });
			reportToAbuseIPDB = plugin.reportToAbuseIPDB;
		});

		it('should report an IP on the first attempt', async () => {
			await reportToAbuseIPDB(ip, path);
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('should NOT report the same IP within the cache TTL', async () => {
			// First report (in this isolated test)
			await reportToAbuseIPDB(ip, path);
			expect(fetch).toHaveBeenCalledTimes(1);

			// Second (cached) report
			await reportToAbuseIPDB(ip, path);
			// The fetch count should still be 1 because the second call was skipped
			expect(fetch).toHaveBeenCalledTimes(1);
		});

		it('should report the same IP again after the cache TTL expires', async () => {
			// First report
			await reportToAbuseIPDB(ip, path);
			expect(fetch).toHaveBeenCalledTimes(1);

			// Advance time by more than the cache TTL
			vi.advanceTimersByTime(cacheTTL + 1);

			// Report again after TTL expiry
			await reportToAbuseIPDB(ip, path);
			// The fetch count should now be 2
			expect(fetch).toHaveBeenCalledTimes(2);
		});
	});
});
