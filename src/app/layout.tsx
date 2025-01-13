import "../styles/globals.css";
import "react-toastify/dist/ReactToastify.css";
import { Analytics } from "@vercel/analytics/react";
import Navbar from "../components/navbar";
import Footer from "../components/footer";

export const metadata = {
	icons: {
		icon: "/icon.svg",
	},
	metadataBase: new URL("https://prime.pkozak.org"),
	creator: "Piotr Kozak",
	applicationName: "PrimeCPU",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="grid min-h-svh grid-rows-[64px,1fr,112px] bg-background text-text md:grid-rows-[64px,1fr,10vh] [&>div]:min-h-screen">
				<Navbar />
				{children}
				<Footer />
				<Analytics />
			</body>
		</html>
	);
}
