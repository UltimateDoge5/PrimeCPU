"use client";
import type { CPU, Manufacturer } from "../../CPU";
import { Fragment, useEffect, useReducer, useRef, useState } from "react";
import { Transition } from "@headlessui/react";
import { fetchCPU } from "../util/fetchCPU";
import { ReloadIcon } from "./icons";
import { domAnimation, LazyMotion, m, useTime, useTransform } from "framer-motion";
import { toast } from "react-toastify";

const Selector = ({ setCPU, setModelName, initialSelection }: SelectorProps) => {
	const [selection, setSelection] = useReducer((prev: Selection, next: Partial<Selection>) => ({ ...prev, ...next }), initialSelection);

	const [tempModel, setTempModel] = useState(initialSelection.model);
	const [countdownBarPercent, setCountdownBarPercent] = useState(100);
	const [refetch, setRefetch] = useState(false);

	const [searchResults, setSearchResults] = useState<string[]>([]);
	const [showResults, setShowResults] = useState(false);

	const searchRef = useRef(0);
	const intervalRef = useRef(0);
	const barVisible = tempModel !== selection.model && tempModel.length > 3 && selection.state !== "loading";

	// const omittedSearch = searchResults.filter((r) => r !== tempModel);
	const searchTipVisible = showResults && searchResults.length > 0 && tempModel.length > 3 && selection.state !== "loading";

	// Handle the countdown bar
	useEffect(() => {
		if (selection.state === "loading") return () => clearInterval(intervalRef.current);

		if (barVisible) {
			// The additional 30 is for the delay before the bar starts to decrease for the user
			let percent = 130;
			intervalRef.current = window.setInterval(() => {
				percent -= 1;
				if (percent <= 0) {
					clearInterval(intervalRef.current);
					// No need to await this
					setSelection({ model: tempModel, state: "loading" });
				}
				// Clamp the value to max 100, so the bar doesn't overflow
				setCountdownBarPercent(Math.min(percent, 100));
			}, 35);
		}

		return () => window.clearInterval(intervalRef.current);
	}, [barVisible, selection.state, tempModel]);

	// Fetch the CPU
	useEffect(() => {
		if (selection.model.length > 3) {
			setSelection({ state: "loading" });
			fetchCPU(selection.manufacturer, selection.model)
				.then((cpu) => {
					if (cpu.error) {
						setSelection({ state: "error" });
						toast.error(cpu.error.text);
						return;
					}

					// Update the URL after successful fetch
					setModelName(`${selection.manufacturer}-${selection.model.toLowerCase()}`);
					setSelection({ state: "success" });
					setCPU(cpu.data);
				})
				.catch(() => {
					setSelection({ state: "error" });
					toast.error("An error occurred while fetching the CPU. Try again later.");
				});
		}
	}, [selection.manufacturer, selection.model]);

	// Manage the search tip results
	useEffect(() => {
		if (selection.state !== "loading" && tempModel.length > 3) {
			// Cancel the previous search
			clearTimeout(searchRef.current);

			// Start a new search
			// eslint-disable-next-line @typescript-eslint/no-misused-promises
			searchRef.current = window.setTimeout(async () => {
				const res = await fetch(`/api/tip?manufacturer=${selection.manufacturer}&model=${tempModel}`);

				if (!res.ok) return setSearchResults([]);
				const tips = (await res.json()) as string[];
				// Sort the results by length. Make sure the exact match is first
				// Check for the exact match first
				const exactMatch = tips.findIndex((r) => r.toLowerCase() === tempModel.toLowerCase());
				if (exactMatch !== -1) {
					const sorted = [...tips.splice(exactMatch, 1), ...tips.sort((a, b) => a.length - b.length)];
					setSearchResults(sorted);
				} else {
					setSearchResults(tips.sort((a, b) => a.length - b.length));
				}
			}, 350);
		}
	}, [selection, tempModel]);

	const RefetchButton = () => {
		const time = useTime();
		const rotate = useTransform(time, [0, 2000], [0, 360], { clamp: false });

		return (
			<button
				onClick={() => {
					setRefetch(true);
					fetchCPU(selection.manufacturer, selection.model, true)
						.then((cpu) => {
							setRefetch(false);
							if (cpu.error) {
								toast.error(
									cpu.error.code === 504 ? "The server is taking too long to respond. Try again later." : cpu.error.text
								);
								return;
							}
							toast.success("Successfully re-fetched the CPU!");
							setCPU(cpu.data);
						})
						.catch(() => {
							setRefetch(false);
							toast.error("An error occurred while fetching the CPU. Try again later.");
						});
				}}
				title="Reload data without cache"
				disabled={selection.state !== "success" || refetch}
				className="hidden rounded-md border border-gray-400/20 bg-gray-400/20 p-2 transition-all
			 enabled:cursor-pointer enabled:hover:bg-gray-200/50 disabled:cursor-not-allowed disabled:opacity-50 md:block"
			>
				<LazyMotion features={domAnimation}>
					<m.div style={{ rotate: refetch ? rotate : 0 }}>
						<ReloadIcon className="h-5 w-5 text-white/60" />
					</m.div>
				</LazyMotion>
			</button>
		);
	};

	return (
		<div className={`relative flex items-center gap-3 rounded-md border p-4 transition-colors ${getMarkings(selection.state)}`}>
			<select
				value={selection.manufacturer}
				disabled={selection.state === "loading" || refetch}
				className="rounded-md bg-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-75"
				onChange={(e) => {
					setSelection({ model: "", manufacturer: e.target.value as Manufacturer });
					setTempModel("");
				}}
			>
				<option value="intel">Intel</option>
				<option value="amd">AMD</option>
			</select>
			<div className="relative">
				<input
					value={tempModel}
					disabled={selection.state === "loading" || refetch}
					onFocus={() => searchResults.length > 0 && setShowResults(true)}
					onKeyDown={(e) => {
						if (tempModel !== selection.model && !showResults) setShowResults(true);

						if (e.key === "Enter") {
							if (tempModel === selection.model) return;
							setShowResults(false);
							setSelection({ model: tempModel, state: "loading" });
						}
					}}
					onBlur={() => setShowResults(false)}
					onChange={(e) => setTempModel(e.target.value.trimStart())}
					placeholder={selection.manufacturer === "intel" ? "Core i5-7400" : "Ryzen 7 5800H"}
					className="w-48 rounded-md bg-gray-200 p-2 disabled:cursor-not-allowed disabled:opacity-75 sm:w-52"
				/>

				<Transition
					as={Fragment}
					show={searchTipVisible}
					enter="transition-opacity duration-300"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="transition-opacity duration-300"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div
						className={`absolute left-5 top-full z-20 flex w-max flex-col rounded-lg bg-white p-2 shadow-md transition-all md:left-0 md:flex-row ${
							previewPositions[searchResults.length - 1]
						}`}
					>
						{searchResults.map((result) => (
							<button
								key={result}
								className="cursor-pointer rounded-md p-2 hover:bg-gray-300 focus:bg-gray-200"
								onClick={() => {
									setTempModel(result);
									setSelection({ model: result, state: "loading" });
									setShowResults(false);
								}}
							>
								{result}
							</button>
						))}
					</div>
				</Transition>
			</div>
			<RefetchButton />
			<Transition
				as={Fragment}
				show={barVisible}
				enter="transition-opacity duration-300"
				enterFrom="opacity-0"
				enterTo="opacity-100"
				leave="transition-opacity duration-200"
				leaveFrom="opacity-100"
				leaveTo="opacity-0"
			>
				<div
					style={{ width: countdownBarPercent + "%" }}
					className={`absolute ${
						searchTipVisible ? "top-0" : "bottom-0"
					} left-[2px] -z-10 h-0.5 rounded-full bg-blue-400 transition-all duration-[10ms]`}
				/>
			</Transition>
		</div>
	);
};

const previewPositions = ["", "-left-1/4", "-left-1/2"];

// Get the border color based on the state
const getMarkings = (state: Selection["state"]) => {
	switch (state) {
		case "loading":
			return "bg-yellow-400/10 border-yellow-500 hover:border-yellow-400 pulse";
		case "error":
			return "bg-red-400/10 border-red-500 hover:border-red-400";
		case "success":
			return "bg-green-400/10 border-green-500 hover:border-green-400";
		default:
			return "bg-white/10 border-gray-500 hover:border-gray-400";
	}
};

interface SelectorProps {
	setCPU: (cpu: CPU | null) => void;
	setModelName: (name: string) => void;
	initialSelection: Selection;
}

export interface Selection {
	manufacturer: Manufacturer;
	state: "idle" | "loading" | "error" | "success";
	model: string;
}

export default Selector;
