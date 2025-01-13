import { expect, test } from "vitest";
// Non-relative import breaks tests
import { getMemoryDetails } from "../src/util/memory";

/**
 *  System Memory Type  DDR4 - Up to 3200MHz
 *                      LPDDR4 - Up to 4266MHz
 * Source {@link https://www.amd.com/en/product/10821}
 */
test("Memory variant no.1", () => {
	const result = getMemoryDetails(
		`DDR4 - Up to 3200MHz
		 LPDDR4 - Up to 4266MHz`,
		null,
		null
	);

	expect(result).toEqual([
		{
			type: "DDR4",
			speed: 3200,
		},
		{
			type: "LPDDR4",
			speed: 4266,
		},
	]);
});

/**
 * System Memory Type   		DDR4
 * System Memory Specification  Up to 2667MHz
 * Source {@link https://www.amd.com/en/product/8456}
 */
test("Memory variant no.2", () => {
	const result = getMemoryDetails("DDR4", 2667, null);

	expect(result).toEqual([
		{
			type: "DDR4",
			speed: 2667,
		},
	]);
});

/**
 *  System Memory Type  DDR5 (FP7r2)
 *                      LPDDR5/x (FP7, FP8)
 *  Max Memory Speed    4x2R DDR5-5600
 *                      4x2R LPDDR5x-7500
 *  Source {@link https://www.amd.com/en/product/13041}
 */
test("Memory variant no.3", () => {
	const result = getMemoryDetails(
		`DDR5 (FP7r2)
        LPDDR5/x (FP7, FP8)
        `,
		null,
		`
        4x2R
        DDR5-5600

        4x2R
        LPDDR5x-7500`
	);
	expect(result).toEqual([
		{
			type: "DDR5",
			speed: 5600,
		},
		{
			type: "LPDDR5x",
			speed: 7500,
		},
	]);
});

/**
 *  System Memory Type  DDR5

 *  Max Memory Speed    2x1R DDR5-5200
 *                      2x2R DDR5-5200
 *  Source {@link https://www.amd.com/en/product/13016}
 */
test("Memory variant no.4", () => {
	const result = getMemoryDetails(
		 `DDR5`,
		null,
        `2x1R
        DDR5-5200

        2x2R
        DDR5-5200`,
	);

	expect(result).toEqual([
		{
			type: "DDR5",
			speed: 5200,
		},
	]);
});
/**
 *
 *
 * Max Memory Speed: [{"memoryKey2":"2x1R","memoryType":["DDR5-5600"]},{"memoryKey2":"2x2R","memoryType":["DDR5-5600"]},{"memoryKey2":"4x1R","memoryType":["DDR5-3600"]},{"memoryKey2":"4x2R","memoryType":["DDR5-3600"]}]
 * Source {@link https://www.amd.com/en/products/processors/desktops/ryzen/9000-series/amd-ryzen-9-9900x.html}
 */
test("Memory variant no.5", () => {
	const result = getMemoryDetails(
		"DDR5",
		null,
		'[{"memoryKey2":"2x1R","memoryType":["DDR5-5600"]},{"memoryKey2":"2x2R","memoryType":["DDR5-5600"]},{"memoryKey2":"4x1R","memoryType":["DDR5-3600"]},{"memoryKey2":"4x2R","memoryType":["DDR5-3600"]}]'
	);

	expect(result).toEqual([
		{
			type: "DDR5",
			speed: 5600,
		},
		{
			type: "DDR5",
			speed: 3600,
		}
	]);
});