import type { CPU } from "@/types/cpu";
import type { JSX } from "react";
import { Fragment } from "react";
import Tooltip from "../components/tooltip";
import { capitalize, colorDiff, formatNumber } from "./formatting";
import Link from "next/link";

const DateFormat = new Intl.DateTimeFormat("en-US", {
	year: "numeric",
	month: "long",
	day: "numeric",
});

/**
 * Table for the CPU page
 * @param cpu
 * @param list
 * @constructor
 */
export const RenderTable = ({ cpu, list }: { cpu: CPU; list: Table<CPU> }) => (
	<Fragment>
		{Object.keys(list)
			// If there is no graphics, don't show the GPU specifications
			.filter((key) => !(cpu.graphics === false && key === "GPU specifications"))
			.map((key, i) => (
				<section key={key}>
					<h2
						className={`relative -left-2 font-medium md:-left-4 ${i === 0 ? "mt-2" : "mt-4"} mb-1 border-b-[1.5px] ${cpu.manufacturer === "intel" ? "border-blue-500" : "border-red-500"} px-2 pb-0.5 text-3xl font-light`}
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
											{currentRow.prefix !== false
												? formatNumber(value as number, currentRow.unit)
												: value + currentRow.unit}
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
				</section>
			))}
	</Fragment>
);

/**
 * Table for comparing two CPUs
 * @param cpus
 * @param list
 * @constructor
 */
export const RenderTwoColumnTable = ({ cpus, list }: { cpus: [CPU, CPU]; list: Table<CPU[]> }) => (
	<Fragment>
		{Object.keys(list).map((key, i) => (
			<section key={key} className="grid grid-cols-3">
				<h3
					className={`relative -left-2 md:-left-4 ${
						i === 0 ? "mt-2 grid grid-cols-3" : "mt-4"
					} col-span-3 mb-0.5 border-b px-2 text-3xl font-light`}
				>
					{key}
					{i === 0 && (
						<>
							<Link
								className="self-center text-center text-2xl font-medium underline decoration-dotted"
								href={cpus[0].ref}
								target="_blank"
							>
								{cpus[0].name}
							</Link>
							<Link
								className="self-center text-center text-2xl font-medium underline decoration-dotted"
								href={cpus[1].ref}
								target="_blank"
							>
								{cpus[1].name}
							</Link>
						</>
					)}
				</h3>
				{Object.keys(list[key]).map((row) => {
					const currentRow = list[key][row];
					const tip = currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />;

					if (currentRow.type === "component") {
						return (
							<Fragment key={row}>
								<span className="flex h-fit items-center gap-1">
									{currentRow.title}
									{tip}
								</span>
								{currentRow.component({ cpus })}
							</Fragment>
						);
					}

					const values = cpus.map((cpu) => traversePath(currentRow.path, cpu));
					if (values.every((v) => v === undefined || v === null) && currentRow.hideOnUndefined === true)
						return <Fragment key={row} />;

					switch (currentRow.type) {
						case "number": {
							const firstNum = traversePath(currentRow.path, cpus[0]) as number | null;
							const secondNum = traversePath(currentRow.path, cpus[1]) as number | null;

							return (
								<Fragment key={row}>
									<span className="flex items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									<span className={colorDiff(firstNum, secondNum, currentRow.reverse)}>
										{formatNumber(firstNum, currentRow.unit)}
									</span>
									<span className={colorDiff(secondNum, firstNum, currentRow.reverse)}>
										{formatNumber(secondNum, currentRow.unit)}
									</span>
								</Fragment>
							);
						}
						case "string": {
							const firstStr = traversePath(currentRow.path, cpus[0]) as string;
							const secondStr = traversePath(currentRow.path, cpus[1]) as string;
							console.log(currentRow.path, firstStr, secondStr);

							return (
								<Fragment key={row}>
									<span className="flex items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									<span>{currentRow.capitalize === true ? capitalize(firstStr) : firstStr}</span>
									<span>{currentRow.capitalize === true ? capitalize(secondStr) : secondStr}</span>
								</Fragment>
							);
						}
						case "date": {
							const firstDate = traversePath(currentRow.path, cpus[0]);
							const secondDate = traversePath(currentRow.path, cpus[1]);

							return (
								<Fragment key={row}>
									<span className="flex items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									<span>{DateFormat.format(new Date(firstDate))}</span>
									<span>{DateFormat.format(new Date(secondDate))}</span>
								</Fragment>
							);
						}
					}
				})}
			</section>
		))}
	</Fragment>
);

// No need to type this function
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return,@typescript-eslint/no-explicit-any
const traversePath = (path: string, obj: any): number | string => path.split(".").reduce((prev, curr) => prev?.[curr], obj);

export type Table<T extends CPU | CPU[]> = Record<string, Record<string, Row<T>>>;

type Component<T> = T extends CPU ? ({ cpu }: { cpu: CPU }) => JSX.Element : ({ cpus }: { cpus: CPU[] }) => JSX.Element;

type Row<T extends CPU | CPU[]> = {
	title: string;
	hideOnUndefined?: true;
	tooltip?: string;
	onUndefined?: string;
} & ( // Prefix is whether is to add K, M, G, etc. to the number
	| { type: "number"; unit: string; prefix?: boolean; path: string; reverse?: T extends CPU[] ? boolean : never }
	| { type: "component"; component: Component<T> }
	| { type: "string"; capitalize?: true; path: string }
	| { type: "date"; path: string }
);
