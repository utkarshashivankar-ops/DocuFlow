import { cn } from '@/utils/cn'

const styles = {
  gray: 'bg-gray-100 text-gray-600',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-emerald-50 text-success',
  warning: 'bg-amber-50 text-warning',
  danger: 'bg-red-50 text-danger',
  info: 'bg-blue-50 text-info',
}

export default function Badge({ children, tone = 'gray', className }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', styles[tone], className)}>
      {children}
    </span>
  )
}
