"use client";
import { Fragment, useState } from "react";
import useSWRInfinite from "swr/infinite";
import type { CPU, Manufacturer } from "@/types/cpu";
import useSWR from "swr";
import Link from "next/link";
import { capitalize } from "@/util/formatting";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const Search = ({ initialQuery }: { initialQuery: string }) => {
	const [query, setQuery] = useState(initialQuery);

	const { data, size, setSize, isLoading } = useSWRInfinite<{
		results: { _id: string; name: string; model: string; manufacturer: Manufacturer }[];
		hasMore: boolean;
	}>((index) => `/api/search?q=${query}&p=${index + 1}`, fetcher);

	const hasMore = data?.[data.length - 1]?.hasMore;

	return (
		<div className="mb-8 mt-6 flex w-full flex-col items-center gap-6">
			<h1 className="text-4xl">Search for CPUs</h1>
			<input
				type="search"
				value={query}
				onChange={(e) => {
					const params = new URLSearchParams(window.location.search);
					params.set("q", e.target.value);
					window.history.replaceState({}, "", `${window.location.pathname}?${params.toString()}`);
					setQuery(e.target.value);
				}}
				className="h-14 w-[90%] rounded-md border border-gray-400 bg-slate-700 p-2 text-xl text-white shadow-lg md:w-1/2"
				placeholder="Search for a CPU"
			/>
			<div className="bg-elevate border-border flex w-fit border-collapse flex-col items-center rounded border">
				{data?.map(({ results }, i) => {
					return (
						<Fragment key={i}>
							{results.map((cpu) => (
								<CPUItem key={cpu.model} name={cpu.name} model={cpu.model} manufacturer={cpu.manufacturer} />
							))}
						</Fragment>
					);
				})}
				{isLoading &&
					Array.from({ length: 5 })
						.fill(1)
						.map((_, i) => <div key={i} className="h-16 w-1/2 animate-pulse rounded-md bg-gray-800" />)}
				{!hasMore && <span className="text-xl font-medium">No more CPUs to show</span>}
			</div>
			<button
				onClick={() => setSize(size + 1)}
				disabled={isLoading || !hasMore}
				className="mb-8 rounded-md border border-slate-200/20 bg-slate-50/5 px-6 py-2 text-slate-100 transition-colors hover:bg-slate-100/10 disabled:pointer-events-none disabled:opacity-50"
			>
				Load more
			</button>
		</div>
	);
};

const CPUItem = ({ name, model, manufacturer }: { name: string; model: string; manufacturer: Manufacturer }) => {
	const { data, error, isLoading } = useSWR<CPU>(`/api/${manufacturer}?model=${model}`, fetcher);

	return (
		<div
			key={model}
			className="border-border grid min-h-[4rem] w-fit grid-cols-6 grid-rows-1 items-center gap-6 border px-4 py-2 transition-colors hover:border-white/50"
		>
			<h1 className="col-span-3 text-lg font-medium md:text-2xl">
				<Link href={data?.ref ?? `/cpu/${model.toLowerCase().replaceAll(" ", "-")}`}>{name}</Link>
			</h1>

			<span
				className={
					isLoading || error ? "flex h-6 w-24 animate-pulse items-center rounded-md bg-gray-800 text-transparent" : "text-center"
				}
			>
				{capitalize(data?.marketSegment ?? "Unknown market")}
			</span>
			<span
				className={
					isLoading || error ? "flex h-6 w-24 animate-pulse items-center rounded-md bg-gray-800 text-transparent" : "text-center"
				}
			>
				{data?.launchQuarter ?? "Date unknown"}
			</span>
			{/*<span*/}
			{/*	className={*/}
			{/*		isLoading || error ? "flex h-6 animate-pulse items-center rounded-md bg-gray-800 text-transparent" : "text-center"*/}
			{/*	}*/}
			{/*>*/}
			{/*	{data?.MSRP ? `${data.MSRP}$` : "Price unavailable"}*/}
			{/*</span>*/}
			<button className="border-button group relative top-[2px] inline-block w-auto rounded-[8px] border-[1.5px] bg-primary text-center text-text disabled:cursor-not-allowed disabled:opacity-50">
				<span className="dark:text-primary-dark dark:hover:text-primary-dark border-button dark:border-orange dark:bg-dark relative mx-[-1.5px] block w-auto -translate-y-1 select-none rounded-[8px] border-[1.5px] bg-white px-5 py-2 text-center text-[15px] font-bold text-primary hover:-translate-y-1.5 hover:text-primary active:-translate-y-0.5 active:transition-all active:duration-100 group-disabled:hover:!-translate-y-1">
					Add to comparison
				</span>
			</button>
		</div>
	);
};

const getManufacturerColor = (manufacturer: Manufacturer) => {
	switch (manufacturer) {
		case "amd":
			return "shadow-red-500 hover:bg-red-600/20";
		case "intel":
			return "shadow-blue-500 hover:bg-blue-600/20";
	}
};
export default Search;
