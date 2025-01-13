import client from "@/util/mongo";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	let model = searchParams.get("model");

	if (!model || model.length < 3) return new Response("Missing model", { status: 400 });

	const collection = client.db("primecpu").collection("cpus");
	const agg = [
		{ $search: { index: "autocomplete", autocomplete: { query: model, path: "name" } } },
		{ $limit: 3 },
		{ $project: { name: 1, _id: 0 } },
	];

	const results = (await collection.aggregate<{ name: string }>(agg).toArray()).map((item) => item.name);
	return Response.json(results);
}
