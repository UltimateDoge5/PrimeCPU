import type { CheerioAPI } from "cheerio";
import { load } from "cheerio";
import type { CPU, Memory } from "../../../CPU";
import { normaliseMarket } from "../formatting";
import elementSelector from "../selectors";
import type { Redis } from "@upstash/redis";
import { reject, resolve, type ScrapeResult } from "./result";

let $: CheerioAPI;

const scrapeIntel = async (redis: Redis, model: string, noCache: boolean): Promise<ScrapeResult> => {
	if (!noCache) {
		const cache = (await redis.json.get(`intel-${model.replace(/ /g, "-")}`, "$")) as [CPU] | null;
		const cpu = cache?.[0];
		if (cpu !== undefined && cpu?.schemaVer === parseFloat(process.env.MIN_SCHEMA_VERSION)) return resolve({ ...cpu, fromCache: true });
	}

	const token = (await redis.get<string>("intel-token")) ?? (await refreshToken(redis));

	// Get the url
	let query = await fetch("https://platform.cloud.coveo.com/rest/search/v2?f:@tabfilter=[Products]", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + token,
		},
		body: JSON.stringify({
			q: model,
			numberOfResults: 1,
		}),
	});

	console.log("Search query status:", query.status);
	if (query.status === 401 || query.status === 419) {
		const token = await refreshToken(redis);
		query = await fetch("https://platform.cloud.coveo.com/rest/search/v2?f:@tabfilter=[Products]", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: "Bearer " + token,
			},
			body: JSON.stringify({
				q: model,
				numberOfResults: 1,
			}),
		});
	}

	if (!query.ok) {
		console.error(await query.text());
		return reject({ code: 500, message: "Error while searching for cpu data" });
	}

	const data = (await query.json()) as { results: { uri: string }[] };
	let url = data?.results[0]?.uri;

	if (!url) return reject({ code: 404, message: "CPU not found" });

	// Sometimes the url path is good, but the last part is wrong
	if (!url.includes("specifications")) {
		const temp = url.split("/");
		temp.pop();
		temp.push("specifications");
		url = temp.join("/");
	}

	// Sometimes the search url is from a different language
	if (!url.includes("us/en")) url = url.replace(/www(\/\w{2}\/)(\w{2})/g, "www/us/en");
	// Sometimes the url doesn't end with .html
	if (!url.endsWith(".html")) url += ".html";

	if (process.env.NODE_ENV !== "production") console.log("Fetching page: ", url);

	// Get the data
	const page = await fetch(url, {
		headers: {
			"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
		},
	});

	if (!page.ok) {
		console.error("Error while fetching the CPU data from the website");
		console.error(page.statusText, url, model);
		return reject({ code: 500, message: "Error while fetching the CPU data from the website" });
	}

	$ = load(await page.text());

	let cpuName = getParameter("Processor Number") ?? $(".headline").first().text().trim();
	if (!cpuName?.includes("Intel")) cpuName = "Intel " + cpuName;

	model = model.replace(/ /g, "-").toLowerCase();

	let graphics: false | CPU["graphics"] = false;
	if (cpuName?.includes("F")) {
		graphics = {
			baseFrequency: getFloatParameter("Graphics Base Frequency"),
			maxFrequency: getFloatParameter("Graphics Max Dynamic Frequency"),
			displays: getFloatParameter("Max # of Displays Supported") ?? getFloatParameter("# of Displays Supported"),
		};
	}

	const cpu: CPU = {
		name: cpuName,
		manufacturer: "intel",
		MSRP: getPrice(getParameter("Recommended Customer Price")),
		marketSegment: normaliseMarket(getParameter("Vertical Segment")),
		lithography: getParameter("Lithography"),
		cache: getFloatParameter("Cache"),
		cores: {
			total: getFloatParameter("Total Cores"),
			efficient: getFloatParameter("# of Efficient-cores"),
			performance: getFloatParameter("# of Performance-cores"),
		},
		threads: getFloatParameter("Total Threads"),
		baseFrequency: getFloatParameter("Processor Base Frequency") ?? getFloatParameter("Performance-core Base Frequency"),
		maxFrequency: getFloatParameter("Max Turbo Frequency"),
		tdp: getFloatParameter("Configurable TDP-up") ?? getFloatParameter("TDP") ?? getFloatParameter("Maximum Turbo Power"),
		launchDate: getParameter("Launch Date")!,
		memory: {
			types: getMemoryDetails(),
			maxSize: getFloatParameter("Max Memory Size"),
		},
		graphics,
		source: url,
		ref: "/cpu/intel-" + model,
		scrapedAt: new Date().toString(),
		schemaVer: parseFloat(process.env.MIN_SCHEMA_VERSION),
	};

	if (process.env.NODE_ENV !== "test") await redis.json.set(`intel-${model}`, "$", cpu as unknown as Record<string, never>);
	return resolve({ ...cpu, fromCache: false });
};

const getParameter = (name: string) =>
	elementSelector($, ".tech-label span", name)?.parent().parent().find(".tech-data span").text() ?? null;

const getFloatParameter = (name: string) => {
	const param = getParameter(name)?.split(" ");

	let multiplier: number;
	switch (param?.[1]?.[0]) {
		case "G":
			multiplier = 1e9;
			break;
		case "M":
			multiplier = 1e6;
			break;
		case "K":
			multiplier = 1e3;
			break;
		default:
			multiplier = 1;
	}

	const floatValue = parseFloat(param?.[0] ?? "") * multiplier;
	return isNaN(floatValue) ? null : floatValue;
};

const getMemoryDetails = (): Memory["types"] => {
	let memory = getParameter("Memory Types");
	if (!memory) return [];

	// Example:
	// Up to DDR5 4800 MT/s
	// Up to DDR4 3200 MT/s
	if (memory.includes("Up to")) {
		return memory
			.replaceAll("Up to", "")
			.split("MT/s")
			.map((mem) => {
				if (!mem) return null;
				const [type, speed] = mem.trim().split(" ");

				return { type: type, speed: parseInt(speed) };
			})
			.filter((mem) => mem !== null) as Memory["types"];
	}

	memory = memory.replaceAll(/@.*/g, "").replaceAll(", ", ",").trim().replaceAll(" ", "-");

	// DDR4-2133/2400, DDR3L-1333/1600 @ 1.35V
	return memory
		.split(",")
		.map((mem) => {
			const [type, speed] = mem.trim().split("-");

			return { type: type, speed: parseInt(speed.split("/").pop()!) };
		})
		.filter((mem) => mem?.speed !== null || mem !== null);
};

const getPrice = (s: string | null): number | null => {
	if (s === null) return s;
	s = s.split("-").pop()!.replace("$", "");
	return parseFloat(s);
};

export const refreshToken = async (redis: Redis) => {
	const token = await fetch("https://www.intel.pl/libs/intel/services/replatform?searchHub=entepriseSearch");

	if (!token.ok) {
		console.error(await token.text());
		return;
	}

	const data = (await token.json()) as { token: string };
	await redis.set("intel-token", data.token);
	return data.token;
};

export default scrapeIntel;
