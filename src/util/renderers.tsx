import type { CPU } from "../../CPU";
import type { JSX } from "react";
import { Fragment } from "react";
import Tooltip from "../components/tooltip";
import { capitalize, colorDiff, formatNumber } from "./formatting";

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

/**
 * Table for comparing two CPUs
 * @param cpus
 * @param list
 * @constructor
 */
export const RenderTwoColumnTable = ({ cpus, list }: { cpus: [CPU, CPU]; list: Table<CPU[]> }) => (
	<Fragment>
		{Object.keys(list).map((key, i) => (
			<div key={key}>
				<h2 className={`relative -left-2 md:-left-4 ${i === 0 ? "mt-2" : "mt-4"} mb-0.5 border-b px-2 text-3xl font-light`}>
					{key}
				</h2>
				{Object.keys(list[key]).map((row) => {
					const currentRow = list[key][row];
					const tip = currentRow.tooltip !== undefined && <Tooltip tip={currentRow.tooltip} />;

					switch (currentRow.type) {
						case "component": {
							return (
								<div key={row} className="grid grid-cols-3 pb-1 text-left">
									<span className="flex h-fit items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									{currentRow.component({ cpu: cpus })}
								</div>
							);
						}
						case "number": {
							const firstNum = traversePath(currentRow.path, cpus[0]);
							const secondNum = traversePath(currentRow.path, cpus[1]);
							return (
								<div key={row} className="grid grid-cols-3 pb-1 text-left">
									<span className="flex items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									<span className={colorDiff(firstNum, secondNum)}>{formatNumber(firstNum, currentRow.unit)}</span>
									<span className={colorDiff(secondNum, firstNum)}>{formatNumber(secondNum, currentRow.unit)}</span>
								</div>
							);
						}
						case "string": {
							const firstStr = traversePath(currentRow.path, cpus[0]);
							const secondStr = traversePath(currentRow.path, cpus[1]);

							return (
								<div key={row} className="grid grid-cols-3 text-left">
									<span className="flex items-center gap-1">
										{currentRow.title}
										{tip}
									</span>
									<span>{currentRow.capitalize === true ? capitalize(firstStr) : firstStr}</span>
									<span>{currentRow.capitalize === true ? capitalize(secondStr) : secondStr}</span>
								</div>
							);
						}
					}
				})}
			</div>
		))}
	</Fragment>
);

const traversePath = (path: string, obj: any) => path.split(".").reduce((prev, curr) => prev && prev[curr], obj);

export type Table<T extends CPU | CPU[]> = {
	[key: string]: Record<string, Row<T>>;
};

type Row<T extends CPU | CPU[]> = {
	title: string;
	hideOnUndefined?: true;
	tooltip?: string;
} & ( // Prefix is whether is to add K, M, G, etc. to the number
	| { type: "number"; unit: string; prefix?: boolean; path: path }
	| { type: "component"; component: ({ cpu }: { cpu: T }) => JSX.Element }
	| { type: "string"; capitalize?: true; path: path }
	| { type: "date"; path: path }
);

type path = string | keyof CPU;