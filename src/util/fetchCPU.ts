import type { CPU, Manufacturer } from "@/types/cpu";
// import client from "@/util/mongo";

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