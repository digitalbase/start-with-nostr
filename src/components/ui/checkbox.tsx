import type * as React from "react";

import { cn } from "../../lib/utils";

type CheckboxProps = Omit<React.ComponentProps<"input">, "type">;

function Checkbox({ className, ...props }: CheckboxProps) {
	return (
		<input
			type="checkbox"
			className={cn(
				"size-5 rounded-md border border-white/20 bg-black/35 accent-fuchsia-500",
				className,
			)}
			{...props}
		/>
	);
}

export { Checkbox };
