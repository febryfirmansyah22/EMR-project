import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0052CC] active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Primary — filled blue */
        default:
          "bg-[#0052CC] text-white border-transparent hover:bg-[#003d9b] active:bg-[#003080]",
        /* Secondary — outlined blue */
        outline:
          "border-[#0052CC] bg-transparent text-[#0052CC] hover:bg-[#dae2ff] active:bg-[#b2c5ff]",
        /* Ghost — text only */
        ghost:
          "border-transparent bg-transparent text-[#091E42] hover:bg-[#f1f3ff] active:bg-[#e8edff]",
        /* Destructive */
        destructive:
          "bg-[#FF5630]/10 text-[#FF5630] border-transparent hover:bg-[#FF5630]/20 active:bg-[#FF5630]/30",
        /* Secondary filled */
        secondary:
          "bg-[#f1f3ff] text-[#0052CC] border-transparent hover:bg-[#dae2ff]",
        link: "border-transparent bg-transparent text-[#0052CC] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 gap-1.5 px-4",
        xs:      "h-6 gap-1 rounded px-2 text-xs",
        sm:      "h-8 gap-1 px-3 text-[0.8rem]",
        lg:      "h-10 gap-2 px-5",
        icon:    "size-9",
        "icon-xs": "size-6 rounded",
        "icon-sm": "size-8 rounded",
        "icon-lg": "size-10",
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
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
