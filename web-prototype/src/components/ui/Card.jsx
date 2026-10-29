import { cn } from '@/utils/cn'

export default function Card({ children, className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-card border border-bordergray bg-surface p-6 shadow-sm',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
