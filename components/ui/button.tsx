import * as React from "react"
import { cn } from "@/lib/utils"
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> { variant?: "default"|"secondary"|"outline"|"ghost"|"link"; size?: "default"|"sm"|"lg"|"icon" }
const base="inline-flex items-center justify-center whitespace-nowrap rounded-2xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black disabled:opacity-50 disabled:pointer-events-none"
const variants={default:"bg-black text-white hover:bg-black/90",secondary:"bg-gray-100 text-gray-900 hover:bg-gray-200",outline:"border border-gray-300 bg-white hover:bg-gray-50",ghost:"hover:bg-gray-100",link:"text-black underline-offset-4 hover:underline"}
const sizes={default:"h-10 px-4 py-2",sm:"h-9 px-3",lg:"h-11 px-8",icon:"h-10 w-10"}
export const Button=React.forwardRef<HTMLButtonElement,ButtonProps>(({className,variant="default",size="default",...props},ref)=>(
  <button ref={ref} className={cn(base,variants[variant],sizes[size],className)} {...props} />
)); Button.displayName="Button"
