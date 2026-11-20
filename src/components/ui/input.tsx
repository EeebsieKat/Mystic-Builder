import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-[var(--ink-4)] selection:bg-[var(--aether)] selection:text-white border-[var(--line-2)] bg-[rgba(4,9,16,0.55)] text-[var(--ink)] flex h-10 w-full min-w-0 rounded-[12px] border px-3.5 py-1 text-sm shadow-xs transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-[var(--aether)] focus-visible:bg-[rgba(4,9,16,0.78)] focus-visible:shadow-[0_0_0_4px_rgba(91,163,255,0.16)]",
        "aria-invalid:border-[var(--bad)] aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
