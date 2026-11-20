import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-[13.5px] font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-[var(--aether)] focus-visible:outline-offset-2 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-[#67adff] to-[#2f7bef] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.32),inset_0_0_0_1px_rgba(170,210,255,0.25),0_10px_26px_-12px_rgba(47,123,239,0.85)] hover:brightness-108 active:brightness-95",
        destructive:
          "border border-[var(--bad-line)] bg-[var(--bad-a)] text-[#ffd3da] hover:bg-[var(--bad-a)]/80 shadow-xs",
        outline:
          "border border-[var(--line-2)] bg-white/[0.045] text-[var(--ink)] shadow-xs backdrop-blur-sm transition-all hover:border-[var(--line-3)] hover:bg-white/[0.08] hover:text-white",
        secondary:
          "border border-[var(--line-2)] bg-white/[0.045] text-[var(--ink)] shadow-xs hover:border-[var(--line-3)] hover:bg-white/[0.08]",
        ghost:
          "text-[var(--ink-2)] hover:bg-white/[0.05] hover:text-[var(--ink)]",
        link: "text-[var(--aether)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-[10px] gap-1.5 px-3 text-[12.5px] has-[>svg]:px-2.5",
        lg: "h-12 rounded-[14px] px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
