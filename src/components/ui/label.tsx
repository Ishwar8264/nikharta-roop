"use client"

import * as React from "react"
import { cn } from "cn"

function Label({ className, children, required, ...props }: React.ComponentProps<"label"> & { required?: boolean }) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      {required && <><span aria-hidden="true" className="text-destructive">*</span><span className="sr-only">(required)</span></>}
    </label>
  )
}

export { Label }
