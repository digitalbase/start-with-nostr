import type * as React from "react";

import { cn } from "../../lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border border-fuchsia-400/40 bg-fuchsia-500/20 px-2.5 py-1 text-xs font-medium text-fuchsia-200",
				className,
			)}
			{...props}
		/>
	);
}

export { Badge };
