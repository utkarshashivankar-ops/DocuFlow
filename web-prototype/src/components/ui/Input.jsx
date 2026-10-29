import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

const Input = forwardRef(function Input({ label, error, icon: Icon, className, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-textprimary">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textsecondary" />}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-btn border border-bordergray bg-white px-3.5 py-2.5 text-sm text-textprimary placeholder:text-textsecondary',
            'transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            Icon && 'pl-9',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})

export default Input
