import { test, expect } from "vitest";
import scrapeAMD from "../src/util/scrapers/amd";
import scrapeIntel from "../src/util/scrapers/intel";

test("Intel cpu - cache", async () => {
	const cpu = await scrapeIntel("core i5 7400", false);
	expect(cpu != null).toBe(true);
});

test("Intel cpu - no cache", async () => {
	const cpu = await scrapeIntel("core i5 7400", true);
	expect(cpu != null).toBe(true);
});

test("AMD cpu - cache", async () => {
	const cpu = await scrapeAMD("amd-ryzen-5-3600", false);
	expect(cpu != null).toBe(true);
});

test(
	"AMD cpu - no cache",
	async () => {
		const cpu = await scrapeAMD("amd-ryzen-7-5800h", true);
		expect(cpu != null).toBe(true);
	},
	{ timeout: 10000 }
);