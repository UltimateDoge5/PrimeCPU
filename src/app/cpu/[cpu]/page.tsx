import { Fragment } from "react";
import type { CPU } from "../../../../CPU";
import Tooltip from "../../../components/tooltip";
import { capitalize, formatNumber } from "../../../util/formatting";
import type { Metadata } from "next";
import { fetchCPUEdge } from "../../../util/fetchCPU";
import { Redis } from "@upstash/redis";
import { openGraph, twitter } from "../../shared-metadata";
import Refetch from "../../../components/refetch";

const redis = Redis.fromEnv();
export const runtime = "edge";

const DateFormat = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

export async function generateMetadata({ searchParams }: { searchParams: { cpu: string } }): Promise<Metadata> {
	const cpu = await fetchCPUEdge(redis, searchParams.cpu, false);

	return {
		title: `${cpu.name} | PrimeCPU`,
		description: `Here you'll find all the information you need about the ${cpu.name} processor.`,
		openGraph: {
			...openGraph,
			title: `${cpu.name} | PrimeCPU`,
			description: `Here you'll find all the information you need about the ${cpu.name} processor.`,
			type: "website",
			url: `https://prime.pkozak.org/cpu/${searchParams.cpu}`,
			images: [
				{
					url: `/cpu/${searchParams.cpu}/image`,
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
					url: `/cpu/${searchParams.cpu}/image`,
					width: 1200,
					height: 630,
					alt: `${cpu.name} processor description`,
				},
			],
		},
	};
}

const Page = async ({ searchParams }: { searchParams: { cpu: string; refetch: string } }) => {
	const cpu = await fetchCPUEdge(redis, searchParams.cpu, searchParams.refetch == "true");
	return (
		<>
			<main className="text-white">
				<div className="my-4 flex justify-center gap-4">
					<h1 className="text-3xl">{cpu.name}</h1>
					<Refetch modelPath={searchParams.cpu} />
				</div>
				<div className="mx-auto w-full border-0 border-gray-200/50 bg-white/20 p-4 text-lg md:mb-12 md:w-3/5 md:rounded-md md:border md:p-6">
					<RenderTable cpu={cpu} list={TableStructure} />
				</div>
			</main>
		</>
	);
};

const RenderTable = ({ cpu, list }: { cpu: CPU; list: Table }) => (
	<Fragment>
		{Object.keys(list)
			// If there is no graphics, don't show the GPU specifications
			.filter((key) => !(cpu.graphics === false && key === "GPU specifications"))
			.map((key, i) => (
				<div key={key}>
					<h2
						className={`relative -left-2 md:-left-4 ${i === 0 ? "mt-2" : "mt-4"} mb-1 border-b
						${cpu.manufacturer === "intel" ? "border-blue-500" : "border-red-500"}
						px-2 pb-0.5 text-3xl font-light`}
					>
						{key}
					</h2>
					{Object.keys(list[key]).map((row) => {
						const currentRow = list[key][row];

						if (currentRow.type === "component") {
							return (
								<div key={row} className="grid grid-cols-2 pb-1 text-left">
									<span className="flex h-fit items-center gap-1">
										{currentRow.title}
										{currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />}
									</span>
									{currentRow.component({ cpu })}
								</div>
							);
						}

						//Get the value from the path
						const value = traversePath(currentRow.path, cpu);

						//If there is no value, and we want to hide the row, return an empty fragment the categories that are empty
						if ((value === null || value === undefined) && currentRow.hideOnUndefined === true) return <Fragment key={row} />;

						switch (currentRow.type) {
							case "number":
								return (
									<div key={row} className="grid grid-cols-2 pb-1 text-left">
										<span className="flex items-center gap-1">
											{currentRow.title}
											{currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />}
										</span>
										<span>
											{currentRow.prefix !== false ? formatNumber(value, currentRow.unit) : value + currentRow.unit}
										</span>
									</div>
								);
							case "string":
								return (
									<div key={row} className="grid grid-cols-2 text-left">
										<span className="flex items-center gap-1">
											{currentRow.title}
											{currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />}
										</span>
										<span>{currentRow.capitalize === true ? capitalize(value) : value}</span>
									</div>
								);

							case "date":
								return (
									<div key={row} className="grid grid-cols-2 text-left">
										<span>
											{currentRow.title}
											{currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />}
										</span>
										<span>{DateFormat.format(new Date(value))}</span>
									</div>
								);
						}
					})}
				</div>
			))}
	</Fragment>
);

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
				<Fragment key={type?.type}>
					<span>
						{type?.type} at {type?.speed} MHz
					</span>
					<br />
				</Fragment>
			))}
		</div>
	);
};

const TableStructure: Table = {
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
		}
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

type Table = {
	[key: string]: Record<string, Row>;
};

type Row = { title: string; hideOnUndefined?: true; tooltip?: string } & ( // Prefix is whether is to add K, M, G, etc. to the number
	| { type: "number"; unit: string; prefix?: boolean; path: string }
	| { type: "component"; component: ({ cpu }: { cpu: CPU }) => JSX.Element }
	| { type: "string"; capitalize?: true; path: string }
	| { type: "date"; path: string }
);

const traversePath = (path: string, obj: any) => path.split(".").reduce((prev, curr) => prev && prev[curr], obj);

export default Page;
