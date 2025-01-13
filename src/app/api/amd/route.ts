import client from "@/util/mongo";
import { CPU } from "@/types/cpu";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	let model = searchParams.get("model");
	const noCache = searchParams.get("no-cache") !== null;

	if (!model || model.length < 3) return new Response("Invalid model", { status: 400 });

	model = model.trim().toLowerCase();
	if (model.includes("-")) model = model.replaceAll("-", " "); // One lonely dash can cause issues

	// const result = await scrapeAMD(model, noCache);
	const mongoClient = await client.connect();
	const collection = mongoClient.db("primecpu").collection("cpus");
	const cursor = collection.aggregate<CPU>([
		{
			$search: {
				index: "default",
				text: {
					query: model,
					path: "name",
					fuzzy: {
						maxEdits: 2,
						prefixLength: 0,
						maxExpansions: 50,
					},
				},
			},
		},
	]);

	const cpu = await cursor.next();

	// if (result.error) return new Response(result.error.message, { status: result.error.code });
	if (cpu === null) return new Response("CPU not found", { status: 404 });
	return Response.json(cpu);
}
