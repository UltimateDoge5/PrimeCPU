export interface CPU {
	name: string;
	// Normalised name of the CPU
	model: string;
	msrp: number | null;
	marketSegment: MarketType | null;
	lithography: string | null;
	manufacturer: Manufacturer;
	cores: Cores;
	cache: number | null;
	threads: number | null;
	baseFrequency: number | null;
	maxFrequency: number | null;
	tdp: number | null;
	launchDate: string;
	memory: Memory;
	graphics: false | Graphics;
	source: string;
	schemaVer: number;
	// Url to the cpu page
	scrapedAt?: string;
	ref: string;
}

export interface Cores {
	total: number | null;
	efficient: number | null;
	performance: number | null;
}

export interface Memory {
	types: {
		speed: number;
		type: string;
	}[];
	maxSize: number | null;
}

export interface Graphics {
	baseFrequency: number | null;
	maxFrequency: number | null;
	displays: number | null;
}

export type MarketType = "desktop" | "embedded" | "mobile" | "server";

export const Manufacturer = {
	INTEL: "intel",
	AMD: "amd",
} as const;

export type Manufacturer = (typeof Manufacturer)[keyof typeof Manufacturer];
