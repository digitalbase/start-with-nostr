/* eslint-disable react/display-name */

import { Check } from "lucide-react";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

import { cn } from "../../lib/utils";

type InteractiveStepperState = "active" | "completed" | "inactive";
type InteractiveStepperOrientation = "horizontal" | "vertical";

export interface IStepperContextValue {
	currentStep: number;
	totalSteps: number;
	orientation: InteractiveStepperOrientation;
	goToStep: (step: number) => void;
}

export interface IStepperItemContextValue {
	stepIndex: number;
	state: InteractiveStepperState;
	disabled: boolean;
}

export interface IStepperRootProps {
	children: React.ReactNode;
	defaultValue?: number;
	value?: number;
	onStepChange?: (step: number) => void;
	orientation?: InteractiveStepperOrientation;
	className?: string;
}

export interface IStepperItemProps {
	children: React.ReactNode;
	completed?: boolean;
	disabled?: boolean;
	className?: string;
	"data-step-index"?: number;
}

const InteractiveStepperContext = createContext<IStepperContextValue | null>(
	null,
);
const InteractiveStepperItemContext =
	createContext<IStepperItemContextValue | null>(null);

const useStepper = () => {
	const context = useContext(InteractiveStepperContext);
	if (!context) {
		throw new Error("useStepper must be used within InteractiveStepper");
	}
	return context;
};

const useStepperItem = () => {
	const context = useContext(InteractiveStepperItemContext);
	if (!context) {
		throw new Error(
			"useStepperItem must be used within InteractiveStepperItem",
		);
	}
	return context;
};

export const InteractiveStepper = React.forwardRef<
	HTMLDivElement,
	IStepperRootProps
>(
	(
		{
			children,
			defaultValue = 1,
			value,
			onStepChange,
			orientation = "horizontal",
			className,
			...props
		},
		ref,
	) => {
		const [currentStep, setCurrentStep] = useState(defaultValue);

		const stepItems = React.Children.toArray(children).filter((child) =>
			React.isValidElement(child),
		);
		const totalSteps = stepItems.length;

		useEffect(() => {
			if (typeof value === "number") {
				setCurrentStep(value);
			}
		}, [value]);

		const goToStep = useCallback(
			(step: number) => {
				if (step >= 1 && step <= totalSteps) {
					setCurrentStep(step);
					onStepChange?.(step);
				}
			},
			[onStepChange, totalSteps],
		);

		const contextValue = useMemo(
			() => ({ currentStep, totalSteps, orientation, goToStep }),
			[currentStep, totalSteps, orientation, goToStep],
		);

		const indexedItems = stepItems.map((child, index) => {
			if (!React.isValidElement(child)) {
				return null;
			}

			return React.cloneElement(
				child as React.ReactElement<IStepperItemProps>,
				{
					...(child.props as IStepperItemProps),
					"data-step-index": index + 1,
				},
			);
		});

		return (
			<InteractiveStepperContext.Provider value={contextValue}>
				<div
					ref={ref}
					className={cn(
						orientation === "horizontal"
							? "flex w-full items-start"
							: "flex w-full flex-col",
						className,
					)}
					{...props}
				>
					{indexedItems}
				</div>
			</InteractiveStepperContext.Provider>
		);
	},
);

export const InteractiveStepperItem = React.forwardRef<
	HTMLDivElement,
	IStepperItemProps
>(
	(
		{ children, completed = false, disabled = false, className, ...props },
		ref,
	) => {
		const { currentStep, orientation } = useStepper();
		const stepIndex = Number(props["data-step-index"] || 1);

		const state: InteractiveStepperState = useMemo(() => {
			if (completed || stepIndex < currentStep) return "completed";
			if (stepIndex === currentStep) return "active";
			return "inactive";
		}, [completed, stepIndex, currentStep]);

		return (
			<InteractiveStepperItemContext.Provider
				value={{ stepIndex, state, disabled }}
			>
				<div
					ref={ref}
					className={cn(
						orientation === "horizontal" ? "flex flex-1 items-center" : "flex",
						disabled ? "opacity-60" : "",
						className,
					)}
					{...props}
				>
					{children}
				</div>
			</InteractiveStepperItemContext.Provider>
		);
	},
);

export const InteractiveStepperTrigger = React.forwardRef<
	HTMLButtonElement,
	{
		children: React.ReactNode;
		className?: string;
		onClick?: () => void;
	}
>(({ children, className, onClick, ...props }, ref) => {
	const { goToStep } = useStepper();
	const { stepIndex, disabled } = useStepperItem();

	return (
		<button
			ref={ref}
			type="button"
			disabled={disabled}
			onClick={() => {
				if (!disabled) {
					goToStep(stepIndex);
					onClick?.();
				}
			}}
			className={cn("flex items-start text-left", className)}
			{...props}
		>
			{children}
		</button>
	);
});

export const InteractiveStepperIndicator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const { state, stepIndex } = useStepperItem();

	return (
		<div
			ref={ref}
			className={cn(
				"flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
				state === "completed"
					? "border-fuchsia-400 bg-fuchsia-500 text-white"
					: state === "active"
						? "border-fuchsia-300 bg-fuchsia-400/20 text-fuchsia-100"
						: "border-white/20 bg-black/25 text-muted-foreground",
				className,
			)}
			{...props}
		>
			{state === "completed" ? <Check className="h-4 w-4" /> : stepIndex}
		</div>
	);
});

export const InteractiveStepperTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	return (
		<p
			ref={ref}
			className={cn("text-sm font-medium text-foreground", className)}
			{...props}
		/>
	);
});

export const InteractiveStepperDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
	return (
		<p
			ref={ref}
			className={cn("text-xs text-muted-foreground", className)}
			{...props}
		/>
	);
});

export const InteractiveStepperSeparator = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
	const { currentStep, totalSteps } = useStepper();
	const { stepIndex } = useStepperItem();

	if (stepIndex === totalSteps) {
		return null;
	}

	const isComplete = stepIndex < currentStep;

	return (
		<div
			ref={ref}
			className={cn(
				"mx-3 mt-4 h-px flex-1",
				isComplete
					? "bg-gradient-to-r from-fuchsia-400 to-violet-400"
					: "bg-white/10",
				className,
			)}
			{...props}
		/>
	);
});
