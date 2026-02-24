import { cn } from "../../lib/utils";

type ProgressProps = {
	value: number;
	className?: string;
};

function Progress({ value, className }: ProgressProps) {
	const normalized = Math.min(100, Math.max(0, value));

	return (
		<div
			className={cn(
				"h-2 w-full overflow-hidden rounded-full bg-white/10",
				className,
			)}
		>
			<div
				className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-500 transition-all duration-500"
				style={{ width: `${normalized}%` }}
			/>
		</div>
	);
}

export { Progress };
