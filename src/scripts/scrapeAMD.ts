import { unescape } from "jsr:@std/html/entities";
import { CPU } from "../types/cpu.ts";
import { getMemoryDetails } from "../util/memory.ts";
import { MongoClient } from "mongodb";
import { exit } from "https://deno.land/std@0.173.0/node/process.ts";

const prefixes = {
	base: 1,
	k: 1e4,
	m: 1e6,
	g: 1e9,
};

const unescapeNull = (value: string | null) => (value ? unescape(value) : null);

// Due to the recent changes in the AMD website, the scraping code is broken.
// While analyzing the website, I found that the data on the cpus is available in the form of 7MB of embedded JSON data in a data tag.
// There even exists data for cpus that do not have a product page.
// I decided to switch to using the data from the embedded JSON data and scrape it in one go using this script, instead of doing it on demand.

async function fetchSpecsFromAmd() {
	console.log("Fetching AMD website");
	const res = await fetch("https://www.amd.com/en/products/specifications/processors.html");
	if (!res.ok) throw new Error("Failed to fetch AMD website: " + res.statusText);
	const text = await res.text();

	// Find data-json and capture everything between the quotes
	// We take advantage that the quotes are not escaped in the JSON data and appear as &#34;
	const json = text.match(/"({[^"]+)/)?.[1];
	if (!json) throw new Error("Failed to find JSON data in AMD website");
	const { items } = JSON.parse(unescape(json)) as { items: any[] };
	console.log("Found", items.length, "cpus");

	// The specs' list is not exhaustive, so we need to scrape the individual pages for more data.
	// Replace the items with the data from the product page if it exists.
	// To avoid getting blocked, we will scrape by batches of 10
	const batchSize = 10;
	let start = 0;

	while (start < items.length) {
		console.log("Fetching batch", start / batchSize + 1, "of", Math.round(items.length / batchSize));
		const batch = items.slice(start, start + batchSize);
		const urls = (batch.map((item) => item.productPages.en) as (string | undefined)[]).filter((url) => url !== undefined) as string[];

		const responses = await Promise.allSettled(urls.map((url) => fetch(url)));

		for (const response of responses) {
			if (response.status === "fulfilled") {
				const text = await response.value.text();
				const json = text.match(/"({[^"]+)/)?.[1];
				if (!json) throw new Error("Failed to find JSON data in AMD website");
				const item = JSON.parse(unescape(json));
				const index = items.findIndex((i) => i.productPages.en === item.productPages.en);
				items[index] = item;
			} else {
				console.error("Failed to fetch product page", response.reason);
			}

			// Wait for a bit before making the next request
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		start += batchSize;
	}

	return items;
}

function scrapeCpusFromSpecs(items: any[]) {
	const cpus: CPU[] = [];

	for (const item of items) {
		const name = item.elements.name.formatValue?.replace("&trade;", "");

		if (!name) {
			console.error("No name found for item", item.title);
			continue;
		}

		const cpu: CPU = {
			name,
			model: name.toLowerCase().replaceAll(" ", "-"),
			manufacturer: "amd",
			msrp: null,
			marketSegment: null,
			cores: {
				total: parseFloat(item.elements.numOfCpuCores.value),
				efficient: null,
				performance: null,
			},
			tdp: parseFloat(item.elements.defaultTdp.value),
			threads: parseFloat(item.elements.numOfThreads.value),
			baseFrequency: multiplyByPrefix(item.elements.baseClock.formatValue),
			maxFrequency: multiplyByPrefix(item.elements.maxBoostClock.formatValue),
			lithography: item.elements.processorTechnologyForCpuCores.formatValue,
			cache: multiplyByPrefix(item.elements.l3Cache.formatValue),
			launchQuarter: getLaunchDate(item.elements.launchDate.formatValue, "quarter")!,
			// For sorting purposes
			launchDate: getLaunchDate(item.elements.launchDate.formatValue, "date"),
			memory: {
				types: getMemoryDetails(
					unescapeNull(item.elements.systemMemoryType?.formatValue),
					safeParseFloat(item.elements.systemMemorySpecification?.formatValue),
					unescapeNull(item.elements.maxMemorySpeed?.formatValue)
				),
				maxSize: multiplyByPrefix(item.elements.maxMemory?.formatValue),
			},
			graphics:
				item.elements.graphicsModel.formatValue !== undefined
					? {
							baseFrequency: multiplyByPrefix(item.elements.graphicsFrequency.formatValue),
							maxFrequency: null,
							displays: safeParseFloat(item.elements.maxDisplays?.value),
						}
					: false,
			source: item.productPages.en ?? "https://www.amd.com/en/products/specifications/processors.html",
			ref: "/cpu/" + name.toLowerCase().replaceAll(" ", "-"),
			scrapedAt: new Date().toJSON(),
		} satisfies CPU;

		cpus.push(cpu);
	}

	return cpus;
}

async function uploadCpusToDB(cpus: CPU[]) {
	console.log("Connecting to MongoDB");
	const uri = Deno.env.get("MONGODB_URI");
	if (!uri) throw new Error("MONGODB_URI not found in environment");

	const client = new MongoClient(uri);
	await client.connect();

	const collection = client.db("primecpu").collection("cpus");

	const updates = cpus.map((cpu) => {
		return {
			updateOne: {
				filter: { model: cpu.model },
				update: { $set: cpu },
				upsert: true,
			},
		};
	});

	console.log("Inserting data into db");
	await collection.bulkWrite(updates);
	console.log("Done scraping");
	exit();
}

function safeParseFloat(value: string) {
	if (!value) return null;
	const number = parseFloat(value);
	return isNaN(number) ? null : number;
}

function multiplyByPrefix(value: string) {
	// Sometimes they present values as Up to 3200 MHz
	if (!value) return null;
	value = value.match(/(\d+\.?\d*)\s*(\w+)/)?.[0] ?? value;
	const [number, unit] = value.split(" ");
	const prefix = unit[0].toLowerCase(); // Get the first character of the unit

	return parseFloat(number) * (prefixes[prefix as keyof typeof prefixes] ?? 1);
}

function getLaunchDate(string: string, format: "quarter" | "date") {
	if (!string) return format === "quarter" ? "Unknown" : null;
	if (/Q\d \d{4}/.test(string)) {
		if (format === "quarter") return string;
		const [quarter, year] = string.split(" ");
		return `${year}-${(parseInt(quarter[1]) * 3).toString().padStart(2, "0")}-01`;
	}

	// Format: Q217
	if (string.startsWith("Q") && string.length === 4) {
		const quarter = parseInt(string[1]);
		const year = parseInt(string.substring(2));
		return format === "quarter" ? string : `${year}-0${quarter * 3}-01`;
	}

	// Format: 11/5/2020
	const date = new Date(string);
	let month = date.getMonth() + 1;
	let year = date.getFullYear();

	// Format: 7/2020
	// https://www.amd.com/en/product/9936
	if (year == 1970 && /\d\/\d{4}/.test(string)) {
		const dates = string.split("/");
		month = parseInt(dates[0]);
		year = parseInt(dates[1]);
	}

	if (year == 1970) return format === "quarter" ? "Unknown" : null;
	if (format === "date") return `${year}-${month.toString().padStart(2, "0")}-01`;
	const quarter = Math.floor((month + 2) / 3) + 1;
	return `Q${quarter}'${year.toString().substring(2)}`;
}

// Ask first for the mode:
// dump - Fetch the data from the AMD website and save it to a file
// scrapeFromFile - Scrape the cpus from the file dumped in the previous step
// scrapeFromWeb - Scrape the cpus from the AMD website directly
const mode = prompt("Select mode (dump, scrapeFromFile, scrapeFromWeb):");

if (mode === "dump" || mode === "1") {
	const items = await fetchSpecsFromAmd();
	const encoder = new TextEncoder();
	const data = encoder.encode(JSON.stringify(items));
	await Deno.writeFile("amd-cpus.json", data);
	exit();
} else if (mode === "scrapeFromFile" || mode === "2") {
	const decoder = new TextDecoder();
	const data = await Deno.readFile("amd-cpus.json");
	const items = JSON.parse(decoder.decode(data));
	const cpus = scrapeCpusFromSpecs(items);

	let validDates = cpus.filter((cpu) => cpu.launchDate !== null).length;
	console.log(((validDates / cpus.length) * 100).toFixed(2) + "% of the cpus have a valid launch date");

	uploadCpusToDB(cpus);
} else if (mode === "scrapeFromWeb" || mode === "3") {
	const items = await fetchSpecsFromAmd();
	const cpus = scrapeCpusFromSpecs(items);
	uploadCpusToDB(cpus);
} else {
	console.error("Invalid mode");
	exit();
}
