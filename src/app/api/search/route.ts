import { NextResponse } from "next/server";
import client from "@/util/mongo";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);

	// q - query
	// p - page
	// Can assert types - null checks are still there
	let q = searchParams.get("q")!;
	let p = searchParams.get("p")!;
	if (p === null) p = "1";
	const pInt = parseInt(p) < 1 ? 1 : parseInt(p) - 1; //The app starts at p = 1, but we start at 0
	if (q === null) q = "";

	const itemsPerPage = 5;
	const skipItems = pInt * itemsPerPage;

	const collection = client.db("primecpu").collection("cpus");
	if (q === "") {
		return await collection
			.find({
				$sort: { launchDate: -1 },
				$limit: 5,
				$project: { name: 1, model: 1, manufacturer: 1 },
			})
			.toArray();
	}

	const agg = [
		{ $search: { index: "default", search: { query: q, path: "name" } } },
		{ $skip: skipItems },
		{ $limit: itemsPerPage + 1 }, // Fetch one more document than itemsPerPage
		{ $project: { name: 1, model: 1, manufacturer: 1 } },
		{ $sort: { launchDate: -1 } },
	];

	const results = await collection.aggregate(agg).toArray();

	// Determine if there are more results
	const hasMore = results.length > itemsPerPage;
	if (hasMore) results.pop();

	return NextResponse.json({ results, hasMore });
}
