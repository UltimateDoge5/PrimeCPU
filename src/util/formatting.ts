import type { MarketType } from "@/types/cpu";

export const formatNumber = (num: number | null, unit: string) => {
	if (num === null) return "N/A " + unit;

	const prefixes = ["", "K", "M", "G", "T"];
	const prefix = prefixes[Math.floor(Math.log10(num) / 3)];
	const value = num / Math.pow(10, prefixes.indexOf(prefix) * 3);
	return `${value % 1 !== 0 ? value.toFixed(2) : value} ${prefix}${unit}`;
};

export const colorDiff = (a: number | null | undefined, b: number | null | undefined, invert = false) => {
	if (a === b) return "text-slate-600/80";
	if (typeof a !== "number" || typeof b !== "number") return "text-yellow-500";
	return (invert ? b > a : a > b) ? "text-green-500" : "text-red-500";
};

export const normaliseIntel = (model: string) => {
	model = model.trim().toLowerCase();
	// if (!/[core]/gi.test(model)) model = "core " + model;
	if (/i\d /i.test(model)) model = model.trim().replace(/(i\d) /i, "$1-");
	return model;
};

export const normaliseMarket = (market: string | null): MarketType | null => {
	if (market === null) return null;

	switch (market.toLowerCase()) {
		case "desktop": // Intel or AMD
		case "boxed processor": // AMD
			return "desktop";
		case "laptop": // AMD
		case "mobile": // Intel
			return "mobile";
		case "embedded": // Intel
			return "embedded";
		case "server":
			return "server";
		default:
			return null;
	}
};

export const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : str);

// Make the names look nice
export const beautifyNames = (name: string) => {
	name = name.replace("amd", "AMD");
	name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
	name = name.replace(/([A-Z])([A-Z][a-z])/g, "$1 $2");
	return capitalize(name);
};

// Split the string on the first appearance of the separator
export const splitFirst = (str: string, separator: string) => {
	const index = str.indexOf(separator);
	return [str.substring(0, index), str.substring(index + 1)];
};
