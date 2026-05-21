"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "@/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        /* Line-style tabs — OMARA design */
        "flex h-fit items-center gap-0 border-b border-[#c3c6d6] bg-transparent",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        /* Base */
        "relative inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-medium whitespace-nowrap",
        "text-[#737685] transition-colors duration-150",
        /* Hover */
        "hover:text-[#0052CC]",
        /* Active tab — base-ui sets data-active="" when selected */
        "data-[active]:text-[#0052CC] data-[active]:font-semibold",
        /* Active underline bar via ::after */
        "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:rounded-t-full after:bg-[#0052CC]",
        "after:opacity-0 data-[active]:after:opacity-100 after:transition-opacity",
        /* Focus */
        "focus-visible:outline-none rounded-t",
        /* Disabled */
        "disabled:pointer-events-none disabled:opacity-40",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-[14px] outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
