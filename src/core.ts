export interface AbuseIPDBOptions {
	apiKey: string;
	paths?: string[];
	additionalPaths?: string[];
	categories?: string;
	cacheTTL?: number;
}

export const createAbuseIPDBPlugin = (options: AbuseIPDBOptions) => {
	const {
		apiKey,
		paths,
		additionalPaths = [],
		categories = "21", // Default category: Web App Attack
		cacheTTL = 1000 * 60 * 60,
	} = options;

	if (!apiKey) throw new Error("AbuseIPDB plugin requires an API key");

	const defaultPaths = [
		"/wp-login.php", "/xmlrpc.php", "/.env", "/admin", "/phpmyadmin",
		"/wp-admin", "/wp-content", "/wp-includes", "/shell", "/login.php"
	];

	const suspiciousPaths = paths ?? [...defaultPaths, ...additionalPaths];
	const reportedIPs = new Map<string, number>();

	async function reportToAbuseIPDB(ip: string, comment: string, reportCategories?: string) {
		const now = Date.now();
		const lastReported = reportedIPs.get(ip);
		if (lastReported && now - lastReported < cacheTTL) {
			console.log(`⏳ Skipping duplicate report for ${ip}`);
			return;
		}
		reportedIPs.set(ip, now);

		try {
			await fetch("https://api.abuseipdb.com/api/v2/report", {
				method: "POST",
				headers: {
					"Key": apiKey,
					"Accept": "application/json",
					"Content-Type": "application/x-www-form-urlencoded"
				},
				body: new URLSearchParams({
					ip,
					categories: reportCategories ?? categories,
					comment,
					timestamp: new Date().toISOString()
				})
			});
			console.log(`Reported IP ${ip} to AbuseIPDB: "${comment}"`);
		} catch (err) {
			console.error("Failed to report to AbuseIPDB:", err);
		}
	}

	return { suspiciousPaths, reportToAbuseIPDB };
};
