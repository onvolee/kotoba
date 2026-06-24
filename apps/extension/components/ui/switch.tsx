import * as React from "react"
import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
  className,
  children,
  ...props
}: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent bg-input p-0.5 shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-checked:bg-primary data-unchecked:bg-muted",
        className
      )}
      {...props}
    >
      {children ?? <SwitchThumb />}
    </SwitchPrimitive.Root>
  )
}

function SwitchThumb({
  className,
  ...props
}: SwitchPrimitive.Thumb.Props) {
  return (
    <SwitchPrimitive.Thumb
      data-slot="switch-thumb"
      className={cn(
        "pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform data-checked:translate-x-4 data-unchecked:translate-x-0",
        className
      )}
      {...props}
    />
  )
}

export { Switch, SwitchThumb }
