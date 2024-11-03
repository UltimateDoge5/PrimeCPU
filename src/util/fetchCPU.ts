import type { CPU, Manufacturer } from "../../CPU";
import { notFound } from "next/navigation";
import scrapeAMD from "./scrapers/amd";
import scrapeIntel from "./scrapers/intel";
import type { Redis } from "@upstash/redis";
import type { ScrapeResult } from "@/util/scrapers/result";

export const fetchCPU = async (manufacturer: Manufacturer, model: string, noCache = false) => {
	const response = await fetch(`/api/${manufacturer.toLowerCase()}?model=${model}&${noCache ? "no-cache" : ""}`);

	if (!response.ok) {
		let errorText = await response.text();

		// Sometimes the text is HTML, and we don't want that to be displayed
		if (!errorText || errorText.length > 64) {
			errorText = response.statusText;
		}

		return {
			error: {
				text: errorText,
				code: response.status,
			},
			data: {} as CPU,
		};
	}

	return { data: (await response.json()) as CPU, error: null };
};

export const fetchCPUEdge = async (redis: Redis, model: string, noCache: boolean): Promise<CPU> => {
	model = model.toLowerCase();
	const manufacturer = model.includes("intel") ? "intel" : model.includes("amd") ? "amd" : undefined;
	// if (process.env.NODE_ENV === "development") console.log(model, manufacturer);

	let result: ScrapeResult;

	if (/(core[- ]i\d)(?!.)|(core[- ]i\d[- ])(?!.)/gi.test(model.trim().toLowerCase()) || model.trim().toLowerCase() === "core") {
		notFound();
	}

	if (manufacturer === "amd") {
		model = model.replace("™", "").replaceAll("-", " ");
		result = await scrapeAMD(redis, model, noCache)
	} else {
		result = await scrapeIntel(redis, model, noCache)
	}

	if (result.error?.code === 404) {
		notFound();
	} else if (result.error?.code) {
		throw new Error(`Error ${result.error.code}: ${result.error.message}`, { cause: result.error });
	}

	return result.cpu!;
};
