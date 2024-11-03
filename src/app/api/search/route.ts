import { beautifyNames } from "../../../util/formatting";
import { AMD_PRODUCTS, INTEL_PRODUCTS } from "../../../util/products";
import { NextResponse } from "next/server";

export function GET(req: Request) {
	const { searchParams } = new URL(req.url);

	// q - query
	// p - page
	// Can assert types - null checks are still there
	let q = searchParams.get("q")!;
	let p = searchParams.get("p")!;
	if (p === null) p = "1";
	const pInt = parseInt(p) < 1 ? 1 : parseInt(p) - 1; //The app starts at p = 1, but we start at 0
	if (q === null) q = "";

	// Get five cpus matching the query
	// This regex makes sure that the words in the query are in the name, but not necessarily in the same order
	const regex = new RegExp(q.split(" ").join(".*"), "i");
	const names = INTEL_PRODUCTS.concat(AMD_PRODUCTS.map((p) => p.name)).filter((cpu) => regex.test(cpu));

	const remainingItems = Math.max(names.length - Math.max(pInt, 1) * 5, 0);

	return NextResponse.json({
		names: names.slice(pInt * 5, pInt * 5 + 5).map((name) => ({
			model: beautifyNames(name),
			manufacturer: name.toLowerCase().includes("amd") ? "amd" : "intel",
		})),
		remainingItems,
	});
}
