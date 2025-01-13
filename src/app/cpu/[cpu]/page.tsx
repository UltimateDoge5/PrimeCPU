import { Fragment } from "react";
import type { CPU } from "@/types/cpu";
import type { Table } from "@/util/renderers";
import { RenderTable } from "@/util/renderers";
import { Metadata } from "next";
import { openGraph, twitter } from "../../shared-metadata";
import { notFound } from "next/navigation";
import client from "@/util/mongo";

async function fetchCPUServer(model: string): Promise<CPU | null> {
	model = model.toLowerCase();

	if (/(core[- ]i\d)(?!.)|(core[- ]i\d[- ])(?!.)/gi.test(model.trim().toLowerCase()) || model.trim().toLowerCase() === "core") {
		notFound();
	}

	return client
		.db("primecpu")
		.collection("cpus")
		.findOne<CPU>({ model: model.replaceAll(" ", "-") });
}

export async function generateMetadata({ params }: { params: Promise<{ cpu: string }> }): Promise<Metadata> {
	const cpuName = (await params).cpu;
	const cpu = await fetchCPUServer(cpuName);

	if (cpu === null) return {};

	return {
		title: `${cpu.name} | PrimeCPU`,
		description: `Here you'll find all the information you need about the ${cpu.name} processor.`,
		openGraph: {
			...openGraph,
			title: `${cpu.name} | PrimeCPU`,
			description: `Here you'll find all the information you need about the ${cpu.name} processor.`,
			type: "website",
			url: `https://prime.pkozak.org/cpu/${cpuName}`,
			images: [
				{
					url: `/cpu/${cpuName}/image`,
					width: 1200,
					height: 630,
					alt: `${cpu.name} processor description`,
				},
			],
		},
		twitter: {
			...twitter,
			title: `${cpu.name} | PrimeCPU`,
			description: `Here you'll find all the information you need about the ${cpu.name} processor.`,
			images: [
				{
					url: `/cpu/${cpuName}/image`,
					width: 1200,
					height: 630,
					alt: `${cpu.name} processor description`,
				},
			],
		},
	};
}

const Page = async ({ params }: { params: Promise<{ cpu: string }> }) => {
	const cpuName = (await params).cpu;
	let cpu = await fetchCPUServer(cpuName);

	if (cpu === null) notFound();

	return (
		<>
			<main>
				<header className="my-4 flex justify-center gap-4">
					<h1 className="text-3xl">{cpu.name}</h1>
				</header>
				<div className="border-border mx-auto w-full bg-white/20 p-4 text-lg md:mb-12 md:w-3/5 md:rounded-md md:border md:p-6">
					<RenderTable cpu={cpu} list={TableStructure} />
				</div>
			</main>
		</>
	);
};

const Cores = ({ cpu }: { cpu: CPU }) => {
	const cores = cpu.cores;

	if (cores.performance === null && cores.efficient === null) {
		return <span>{cores.total}</span>;
	} else if (cores.total === null) {
		return <span>Unknown</span>;
	}

	return (
		<>
			{cpu.cores.performance ?? 0}P / {cpu.cores.efficient ?? 0}E
		</>
	);
};

const Memory = ({ cpu }: { cpu: CPU }) => {
	if (cpu.memory.types === null) return <>N/A</>;

	return (
		<div>
			{cpu.memory.types.map((type) => (
				<Fragment key={`${type.type}-${type.speed}`}>
					<span>
						{type?.type} at {type?.speed} MHz
					</span>
					<br />
				</Fragment>
			))}
		</div>
	);
};

const TableStructure: Table<CPU> = {
	General: {
		launchDate: {
			title: "Launch Date",
			path: "launchDate",
			type: "string",
		},
		market: {
			title: "Market",
			path: "marketSegment",
			type: "string",
			capitalize: true,
		},
		lithography: {
			title: "Lithography",
			path: "lithography",
			type: "string",
		},
		msrp: {
			title: "Price",
			path: "MSRP",
			type: "number",
			unit: "$",
			tooltip: "Manufacturer's suggested retail price. For AMDs may not be as accurate.",
		},
		cache: {
			title: "Cache",
			path: "cache",
			type: "number",
			unit: "B",
			tooltip: "Amount of L3 cache. (Intel provides only L3 cache)",
		},
	},
	"CPU specifications": {
		baseFrequency: {
			hideOnUndefined: true,
			title: "Base Frequency",
			path: "baseFrequency",
			type: "number",
			unit: "Hz",
		},
		maxFrequency: {
			title: "Max Frequency",
			path: "maxFrequency",
			type: "number",
			unit: "Hz",
		},
		cores: {
			title: "Cores",
			type: "component",
			component: Cores,
			tooltip: "Displays total amount of cores. For some Intel cpus, it also displays the amount of performance and efficient cores.",
		},
		threads: {
			title: "Threads",
			path: "threads",
			type: "number",
			unit: "",
		},
		tdp: {
			title: "TDP",
			path: "tdp",
			type: "number",
			unit: "W",
		},
	},
	"Memory specifications": {
		memory: {
			title: "Memory",
			type: "component",
			component: Memory,
		},
		capacity: {
			title: "Max Capacity",
			path: "memory.maxSize",
			type: "number",
			unit: "B",
		},
	},
	"GPU specifications": {
		baseClock: {
			title: "Base Clock",
			path: "graphics.baseFrequency",
			type: "number",
			unit: "Hz",
			hideOnUndefined: true,
		},
		maxClock: {
			title: "Max Clock",
			path: "graphics.maxFrequency",
			type: "number",
			unit: "Hz",
			hideOnUndefined: true,
		},
		display: {
			title: "Displays",
			path: "graphics.displays",
			type: "number",
			unit: "",
			hideOnUndefined: true,
		},
	},
	Other: {
		scrapedAt: {
			hideOnUndefined: true,
			title: "Scraped at",
			path: "scrapedAt",
			type: "date",
		},
		source: {
			title: "Source",
			type: "component",
			component: ({ cpu }: { cpu: CPU }) => (
				<a href={cpu.source} className="underline">
					Source
				</a>
			),
		},
	},
};

export default Page;
