import type { Memory } from "@/types/cpu";

export const getMemoryDetails = (memory: string | null, sysMemSpecs: number | null, maxMemSpeeds?: string | null) => {
	// const memory = testObj?.memory ?? getParameter("System Memory Type");
	if (!memory) return [];
	// Example:
	// DDR4 - Up to 3200MHz
	// LPDDR4 - Up to 4266MHz
	if (memory?.includes("Up to")) {
		return memory
			.split("Hz")
			.map((type) => {
				if (!type) return null;
				const [name, speed] = type.split("-");

				return {
					type: name.trim(),
					speed: parseInt(speed.trim().replace("Up to", "")),
				};
			})
			.filter((type) => type !== null) as Memory["types"];
	}

	// Example:
	// System Memory Type: DDR4
	// System Memory Specification: Up to 2667MHz
	if (sysMemSpecs && !isNaN(sysMemSpecs)) {
		return [
			{
				type: memory,
				speed: sysMemSpecs,
			},
		];
	}

	if (!maxMemSpeeds) return [];

	// If there is only one type of memory, return it
	if (maxMemSpeeds.split("\n").length === 1) {
		const [type, speed] = maxMemSpeeds.split("-");
		return [
			{
				type,
				speed: parseInt(speed),
			},
		];
	}

	// I don't remember why I did this, but im assuming amd did weird things ¯\_(ツ)_/¯
	const results = maxMemSpeeds.match(/.*DDR\d?.-(\d{4})/gm)?.map((match) => {
		const [type, speed] = match.split("-");
		const speedInt = parseInt(speed);

		return {
			type: type.trim(),
			speed: speedInt,
		};
	});

	// Remove duplicates
	return results?.filter((value, index, self) => self.findIndex((v) => v.type === value.type) === index) ?? [];
};