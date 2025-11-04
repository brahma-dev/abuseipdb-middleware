import { afterEach, beforeAll, vi } from 'vitest';

// Mock the global fetch function before all tests
beforeAll(() => {
	global.fetch = vi.fn().mockResolvedValue({
		json: () => Promise.resolve({ data: {} }), // Mock a successful API response
	});
});

// Clear mocks after each test to ensure isolation
afterEach(() => {
	vi.clearAllMocks();
});
