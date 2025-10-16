import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"
const Tabs=TabsPrimitive.Root
const TabsList=React.forwardRef<any,any>(({className,...props},ref)=>(<TabsPrimitive.List ref={ref} className={cn("inline-flex h-10 items-center justify-center rounded-xl bg-gray-100 p-1 text-gray-600",className)} {...props}/>)); TabsList.displayName="TabsList"
const TabsTrigger=React.forwardRef<any,any>(({className,...props},ref)=>(<TabsPrimitive.Trigger ref={ref} className={cn("inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-black",className)} {...props}/>)); TabsTrigger.displayName="TabsTrigger"
export { Tabs, TabsList, TabsTrigger }
