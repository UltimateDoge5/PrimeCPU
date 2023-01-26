import type { NextApiRequest, NextApiResponse } from "next";
import { AMD_PRODUCTS, INTEL_PRODUCTS } from "../../../util/products";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const { manufacturer } = req.query;
	let { model } = req.query;

	if (!model || typeof model !== "string" || model.length < 3) {
		res.status(400).send("Missing model");
		return;
	}

	// Get 3 amd results close to the given model
	if (manufacturer === "amd") {
		model = model.trim().replace(/ /g, "-").toLowerCase();
		if (!model.startsWith("amd-")) model = `amd-${model}`;

		const results = AMD_PRODUCTS.map((p) => p.split("/").pop() as string)
			.filter((p) => p?.includes(model as string))
			.slice(0, 3)
			.map((p) => p?.replace(/-/g, " ").replace("amd", "").replace("r", "R").trim());

		res.json(results);
		return;
	} else if (manufacturer === "intel") {
		// If there is no "core" in the string or signs of it, prepend it
		if (!/[core]/gi.test(model.trim().toLowerCase())) model = "core " + model;
		if(/i\d /i.test(model.trim().toLowerCase())) model = model.trim().replace(/(i\d) /i, "$1-");
		res.json(INTEL_PRODUCTS.filter((item) => item.toLowerCase().includes(model as string)).slice(0, 3));
		return;
	}

	res.status(400).send("Unknown manufacturer");
};

export default handler;
