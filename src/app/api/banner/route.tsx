import { ImageResponse } from "@vercel/og";
import { LogoIconBlack } from "@/components/icons";

export function GET(req: Request) {
	const url = new URL(req.url);
	const [f, s] = [url.searchParams.get("f") ?? "", url.searchParams.get("s") ?? ""];

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					backgroundColor: "#fff",
					color: "#333",
				}}
			>
				<LogoIconBlack style={{ width: "1026px", height: "250px" }} />
				<h1 tw="text-center text-5xl">
					{f} vs {s}
				</h1>
			</div>
		),
		{
			width: 1200,
			height: 630,
		}
	);
}
