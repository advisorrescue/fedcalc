import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
const Dialog=DialogPrimitive.Root, DialogTrigger=DialogPrimitive.Trigger, DialogPortal=DialogPrimitive.Portal, DialogClose=DialogPrimitive.Close
const DialogOverlay=React.forwardRef<any,any>(({className,...props},ref)=>(<DialogPrimitive.Overlay ref={ref} className={cn("fixed inset-0 z-50 bg-black/30",className)} {...props}/>)); DialogOverlay.displayName="DialogOverlay"
const DialogContent=React.forwardRef<any,any>(({className,children,...props},ref)=>(
  <DialogPortal><DialogOverlay/><DialogPrimitive.Content ref={ref} className={cn("fixed left-1/2 top-1/2 z-50 grid w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-white p-6 shadow-lg sm:rounded-lg",className)} {...props}>{children}</DialogPrimitive.Content></DialogPortal>
)); DialogContent.displayName="DialogContent"
const DialogHeader=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=>(<div className={cn("flex flex-col space-y-1.5 text-center sm:text-left",className)} {...props}/>)
const DialogFooter=({className,...props}:React.HTMLAttributes<HTMLDivElement>)=>(<div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",className)} {...props}/>)
const DialogTitle=React.forwardRef<any,any>(({className,...props},ref)=>(<DialogPrimitive.Title ref={ref} className={cn("text-lg font-semibold",className)} {...props}/>)); DialogTitle.displayName="DialogTitle"
const DialogDescription=React.forwardRef<any,any>(({className,...props},ref)=>(<DialogPrimitive.Description ref={ref} className={cn("text-sm text-gray-600",className)} {...props}/>)); DialogDescription.displayName="DialogDescription"
export { Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription }
