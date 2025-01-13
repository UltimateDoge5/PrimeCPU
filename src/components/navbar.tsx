import Link from "next/link";
import { LogoIcon } from "./icons";

const Navbar = () => (
	<nav className="h-16 w-full border-y bg-[#252525] backdrop-blur-sm">
		<div className="mx-auto flex h-full w-full items-center justify-between px-4 text-white">
			<div className="flex items-center">
				<Link href="/" title="PrimeCPU logo">
					<LogoIcon className="h-5/6 w-48" />
				</Link>
			</div>
			<div className="flex items-center gap-2">
				<Link href="/" className="rounded-md px-1 py-2 text-lg font-semibold transition-all hover:bg-gray-300/20 md:px-4">
					Comparison
				</Link>
				<Link href="/list" className="rounded-md px-1 py-2 text-lg font-semibold transition-all hover:bg-gray-300/20 md:px-4">
					List
				</Link>
			</div>
		</div>
	</nav>
);

export default Navbar;
