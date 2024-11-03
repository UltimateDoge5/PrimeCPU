import scrapeAMD from "../../../util/scrapers/amd";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	let model = searchParams.get("model");
	const noCache = searchParams.get("no-cache") !== null;

	if (!model || model.length < 3) return new Response("Invalid model", { status: 400 });
	
	model = model.trim().toLowerCase();
	if (!model.startsWith("amd")) model = `amd ${model}`;
	if (model.includes("-")) model = model.replaceAll("-", " "); // One lonely dash can cause issues

	const result = await scrapeAMD(redis,model, noCache)
	if (result.error) return new Response(result.error.message, { status: result.error.code });
	return NextResponse.json(result.cpu);
}

