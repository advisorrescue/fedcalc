import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"
export const Switch=React.forwardRef<any,any>(({className,...props},ref)=>(
  <SwitchPrimitives.Root ref={ref} className={cn("peer inline-flex h-6 w-11 items-center rounded-full bg-gray-300 data-[state=checked]:bg-black",className)} {...props}>
    <SwitchPrimitives.Thumb className="block h-5 w-5 translate-x-0 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5"/>
  </SwitchPrimitives.Root>
)); Switch.displayName="Switch"
