"use client";

// v2's button: shadcn with the Motion press state built in, token radii and
// control heights, and a `soft` variant (raised neutral).

import { cva, type VariantProps } from "class-variance-authority";
import { m } from "motion/react";
import { Slot } from "radix-ui";
import type { ComponentProps, CSSProperties } from "react";

import { cn } from "@/lib/cn";
import { hoverLift, press } from "@/styles/motion";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-control border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-[color,background-color,box-shadow] outline-none select-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-imagine-primary text-imagine-primary-foreground shadow-control inset-shadow-highlight hover:bg-imagine-primary/90 hover:shadow-raised",
        soft: "bg-imagine-border text-imagine-foreground shadow-none hover:bg-imagine-foreground/12 aria-expanded:bg-imagine-foreground/12 dark:bg-imagine-surface-raised dark:hover:bg-imagine-foreground/16",
        ghost:
          "text-imagine-foreground-muted hover:bg-imagine-surface-raised hover:text-imagine-foreground aria-expanded:bg-imagine-surface-raised aria-expanded:text-imagine-foreground",
        outline:
          "border-imagine-border bg-transparent text-imagine-foreground hover:bg-imagine-surface-raised aria-expanded:bg-imagine-surface-raised",
        link: "text-imagine-foreground underline-offset-4 hover:underline",
      },
      size: {
        default: "h-control-base gap-1.5 px-3",
        xs: "h-control-xs gap-1 px-2 text-xs",
        sm: "h-control-sm gap-1 px-2.5 text-xs",
        lg: "h-control-lg gap-1.5 px-3.5",
        icon: "size-control-base",
        "icon-xs": "size-control-xs",
        "icon-sm": "size-control-sm",
        "icon-lg": "size-control-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

/**
 * Button props that spread onto both `m.button` and a Slot: Motion redefines
 * the drag/animation handlers and `style`, so React's versions are removed.
 */
type MotionCompatibleButtonProps = Omit<
  ComponentProps<"button">,
  "onAnimationStart" | "onDragStart" | "onDragEnd" | "onDrag" | "style"
> & { style?: CSSProperties };

type ButtonProps = MotionCompatibleButtonProps &
  VariantProps<typeof buttonVariants> & {
    /** Render the child element as the button (e.g. a link). No press motion. */
    asChild?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size }), className);
  // Raised buttons lift on hover; flat ones (ghost, link) only press.
  const raised = variant !== "ghost" && variant !== "link";

  if (asChild) {
    return (
      <Slot.Root
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={classes}
        {...props}
      />
    );
  }

  return (
    <m.button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={classes}
      whileHover={props.disabled || !raised ? undefined : hoverLift.whileHover}
      whileTap={props.disabled ? undefined : { ...press.whileTap, y: 0 }}
      transition={press.transition}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
