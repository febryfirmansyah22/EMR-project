import { cn } from "@/lib/utils"

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default:     "bg-[#dae2ff] text-[#0052CC]",
    secondary:   "bg-[#f1f3ff] text-[#434654]",
    destructive: "bg-[#FFEBE6] text-[#BF2600]",
    outline:     "border border-[#c3c6d6] text-[#434654] bg-transparent",
    success:     "bg-[#E3FCEF] text-[#006644]",
    warning:     "bg-[#FFF0B3] text-[#FF8B00]",
  }

  return (
    <span
      className={cn(
        "inline-flex h-5 w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
