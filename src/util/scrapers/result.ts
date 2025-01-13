import type { CPU } from "@/types/cpu";

export const reject = (error: ScrapeResult["error"]): ScrapeResult => ({ cpu: null, error });

export const resolve = (cpu: CPU): ScrapeResult => ({ cpu, error: null });

export interface ScrapeResult {
	cpu: CPU | null;
	error: {
		code: number;
		message: string;
	} | null;
}
