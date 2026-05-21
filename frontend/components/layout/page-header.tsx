import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[18px] sm:text-[22px] font-semibold leading-tight tracking-tight text-[#091E42]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-[12px] sm:text-[13px] text-[#434654]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
