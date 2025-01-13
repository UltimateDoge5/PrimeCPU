"use client";
import { Fragment, useEffect, useState } from "react";
import type { CPU, Graphics } from "@/types/cpu";
import type { Selection } from "./selector";
import Selector from "./selector";
import { Transition } from "@headlessui/react";
import { ToastContainer } from "react-toastify";
import type { Table } from "@/util/renderers";
import { RenderTwoColumnTable } from "@/util/renderers";
import { colorDiff, formatNumber } from "@/util/formatting";

const Comparison = ({ models }: { models: Selection[] }) => {
	const [cpus, setCpus] = useState<(CPU | null)[]>([null, null]);

	// State only for tracking the model names and updating the url
	const [modelNames, setModelNames] = useState<string[]>(
		models.filter((m) => m.model !== "").map((m) => `${m.manufacturer}-${m.model.toLowerCase()}`)
	);
	const cpusFulfilled = cpus.every((cpu) => cpu !== null);

	useEffect(() => {
		if (modelNames.length === 0) return;

		const url = new URL(window.location.href);
		url.pathname = modelNames.join("&");
		window.history.pushState({}, "", url.href);
	}, [modelNames]);

	return (
		<main className="flex flex-col items-center gap-4 pt-4 transition-all md:pt-12">
			<h1 className="text-center text-4xl font-semibold text-white md:text-6xl">Compare CPUs</h1>
			<h2 className="mb-4 px-2 text-center text-xl text-white md:text-2xl">Search for a CPU and compare it to another one</h2>

			<section className="grid grid-cols-1 gap-4 p-2 md:grid-cols-2 md:gap-8">
				<Selector
					setCPU={(cpu) => setCpus((prev) => [cpu, ...prev.slice(1)])}
					initialSelection={models[0]}
					setModelName={(name) => setModelNames((prev) => [name, ...prev.slice(1)])}
				/>
				<span className="block text-center text-xl font-semibold text-white md:hidden">VS</span>
				<Selector
					setCPU={(cpu) => setCpus((prev) => [...prev.slice(0, 1), cpu])}
					initialSelection={models[1]}
					setModelName={(name) => setModelNames((prev) => [...prev.slice(0, 1), name])}
				/>
			</section>
			<hr className="h-1 w-2/5 border-gray-500" />
			<section className="mb-12 flex w-full flex-col items-center p-4 pt-0 md:w-5/6 lg:w-3/5">
				<Transition
					show={cpusFulfilled}
					enter="transition-opacity duration-500"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="transition-opacity duration-500"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<h3 className="hidden pb-2 text-center text-2xl text-white sm:block">Table colors</h3>
					<div className="mb-8 hidden w-fit justify-center gap-6 rounded-lg p-2 text-white sm:flex">
						<div className="flex gap-2">
							<div className="h-6 w-12 rounded bg-green-500" /> Better
						</div>
						<div className="flex gap-2">
							<div className="h-6 w-12 rounded bg-red-500" /> Worse
						</div>
						<div className="flex gap-2">
							<div className="h-6 w-12 rounded bg-yellow-500" /> Unable to compare
						</div>
					</div>
				</Transition>

				{cpusFulfilled ? (
					<div className="mx-auto w-full border-0 border-gray-200/50 bg-white/20 p-4 text-lg text-white md:mb-12 md:w-full md:rounded-md md:border md:p-6">
						<RenderTwoColumnTable cpus={cpus as [CPU, CPU]} list={TableStructure} />
					</div>
				) : (
					<h3 className="flex items-center gap-2 text-center text-2xl text-white">Select two CPUs to compare them</h3>
				)}
			</section>
			<ToastContainer autoClose={2500} position="bottom-left" theme="dark" draggable={false} />
		</main>
	);
};

const Memory = ({ cpus }: { cpus: CPU[] }) => {
	const matchingTypes = cpus[0].memory.types
		.filter((type) => cpus[1].memory.types.some((type2) => type2?.type === type?.type))
		.map((type) => type?.type);

	const memorySpeeds = matchingTypes.map((type) => {
		const a = cpus[0].memory.types.find((type2) => type2?.type === type)?.speed;
		const b = cpus[1].memory.types.find((type2) => type2?.type === type)?.speed;
		return { type, a, b };
	});

	return (
		<>
			{cpus.map((cpu, i) => (
				<div key={cpu.name}>
					{memorySpeeds.map(({ type, a, b }) => (
						<Fragment key={type}>
							<span className={i % 2 ? colorDiff(b, a) : colorDiff(a, b)}>
								{type} at {cpu.name === cpus[0].name ? a : b} MHz
							</span>
							<br />
						</Fragment>
					))}
					{cpu.memory.types
						.filter((type) => !matchingTypes.includes(type?.type))
						.map((type) => (
							<Fragment key={type?.type}>
								<span>
									{type?.type} at {type?.speed} MHz
								</span>
								<br />
							</Fragment>
						))}
				</div>
			))}
		</>
	);
};

const Cores = ({ cpus }: { cpus: CPU[] }) => (
	<>
		{cpus.map((cpu, i) => (
			<span key={cpu.name} className={colorDiff(cpu.cores.total, cpus[1 - i].cores.total)}>
				{cpu.cores.performance !== null && cpu.cores.efficient !== null ? (
					<>
						{cpu.cores.performance ?? 0}P / {cpu.cores.efficient ?? 0}E
					</>
				) : (
					(cpu.cores.total ?? "Unknown")
				)}
			</span>
		))}
	</>
);

const TableStructure: Table<CPU[]> = {
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
			tooltip: "Manufacturer's suggested retail price. For AMDs may not be as accurate, if even available.",
			reverse: true,
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
			reverse: true,
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
	"Graphics specifications": {
		baseFrequency: {
			title: "Base Frequency",
			type: "component",
			component: ({ cpus }) => {
				return (
					<>
						{cpus.map((cpu, i) => {
							if (cpu.graphics === false)
								return (
									<span className="row-span-3 self-center text-xl" key={cpu.name}>
										No graphics included
									</span>
								);
							const otherGraphics = cpus[1 - i].graphics as Graphics;

							return (
								<span key={cpu.name} className={colorDiff(cpu.graphics.baseFrequency, otherGraphics.baseFrequency)}>
									{formatNumber(cpu.graphics.baseFrequency, "Hz")}
								</span>
							);
						})}
					</>
				);
			},
		},
		maxFrequency: {
			title: "Max Frequency",
			type: "component",
			component: ({ cpus }) => (
				<>
					{cpus.map((cpu, i) => {
						if (cpu.graphics === false) return <></>;
						const otherGraphics = cpus[1 - i].graphics as Graphics;

						return (
							<span key={cpu.name} className={colorDiff(cpu.graphics.maxFrequency, otherGraphics.maxFrequency)}>
								{formatNumber(cpu.graphics.maxFrequency, "Hz")}
							</span>
						);
					})}
				</>
			),
		},
		displays: {
			title: "Displays",
			type: "component",
			component: ({ cpus }) => (
				<>
					{cpus.map((cpu, i) => {
						if (cpu.graphics === false) return <></>;
						const otherGraphics = cpus[1 - i].graphics as Graphics;

						return (
							<span key={cpu.name} className={colorDiff(cpu.graphics.displays, otherGraphics.displays)}>
								{cpu.graphics.displays}
							</span>
						);
					})}
				</>
			),
		},
	},
	Other: {
		scrapedAt: {
			title: "Data from",
			path: "scrapedAt",
			type: "date",
		},
	},
};

export default Comparison;
