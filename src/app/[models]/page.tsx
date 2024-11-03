import { beautifyNames, splitFirst } from "@/util/formatting";
import Comparison from "../../components/comparison";
import type { Selection } from "@/components/selector";

// export const generateMetadata = ({ params }: { params: { models: string } }): Metadata => {
// 	const models = params.models.split("&").map((s) => splitFirst(decodeURI(s), "-").pop()!);
//
// 	let title = "Compare any CPU you want";
// 	let description = "PrimeCPU lets you compare CPUs and GPUs in an instant!";
// 	let image = "/banner.png";
// 	if (models.length === 2) {
// 		const [fName, sName] = models.map((s) => beautifyNames(s || ""));
// 		title = `${fName} vs ${sName}`;
// 		description = `Compare ${fName} and ${sName} in an instant!`;
// 		image = `/api/banner?f=${fName}&s=${sName}`;
// 	}
//
// 	return {
// 		title: `${title} | PrimeCPU`,
// 		description,
// 		keywords: ["cpu", "compare", "comparator", "intel", "amd", "tool", "app"],
// 		openGraph: {
// 			...openGraph,
// 			images: [
// 				{
// 					url: image,
// 					width: 1200,
// 					height: 630,
// 				},
// 			],
// 			title: `${title} | PrimeCPU`,
// 			description,
// 			url: "https://prime.pkozak.org",
// 		},
// 		twitter: {
// 			...twitter,
// 			images: [
// 				{
// 					url: image,
// 					width: 1200,
// 					height: 630,
// 				},
// 			],
// 			title: "Compare any CPU you want",
// 			description: "PrimeCPU lets you compare CPUs and GPUs in an instant!",
// 		},
// 	};
// };

// Generate initial selection to prevent a flash of models appearing in the selector
const getInitialSelections = (params: string): Selection[] => {
	if (params === undefined)
		return [
			{ manufacturer: "intel", state: "idle", model: "" },
			{ manufacturer: "intel", state: "idle", model: "" },
		];

	const models = decodeURIComponent(params).split("&");
	const selections = models.map((model) => {
		const [manufacturer, name] = splitFirst(model, "-");
		// If the manufacturer is not intel or amd, default to intel
		if (manufacturer !== "intel" && manufacturer !== "amd" ) return { manufacturer: "intel", state: "idle", model: "" } as Selection;
		return { manufacturer: manufacturer , state: "loading", model: beautifyNames(name) } as Selection;
	});

	if (selections.length === 1) selections.push({ manufacturer: "intel", state: "idle", model: "" });
	return selections;
};

export default async function Page(props: { params: Promise<{ models: string }> }) {
    const params = await props.params;
    return <Comparison models={getInitialSelections(params.models)} />;
}
