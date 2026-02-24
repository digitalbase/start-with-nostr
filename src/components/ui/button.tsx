import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
	{
		variants: {
			variant: {
				default:
					"bg-gradient-to-r from-fuchsia-500 via-pink-500 to-violet-500 text-white shadow-[0_0_35px_-12px_rgba(236,72,153,0.65)] hover:brightness-110",
				secondary:
					"bg-card text-card-foreground border border-border hover:bg-accent hover:text-accent-foreground",
				ghost:
					"text-muted-foreground hover:bg-accent hover:text-accent-foreground",
			},
			size: {
				default: "h-11 px-5",
				sm: "h-9 rounded-md px-3",
				lg: "h-12 rounded-lg px-8 text-base",
				icon: "size-10",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
	VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, ...props }, ref) => {
		return (
			<button
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
