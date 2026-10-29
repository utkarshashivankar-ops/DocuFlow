import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm',
  secondary: 'bg-white hover:bg-gray-50 text-textprimary border border-bordergray',
  danger: 'bg-danger hover:bg-red-600 text-white',
  ghost: 'bg-transparent hover:bg-gray-100 text-textprimary',
  success: 'bg-success hover:bg-emerald-600 text-white',
}

export default function Button({
  children, variant = 'primary', className, loading, disabled, icon: Icon, type = 'button', ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-btn px-4 py-2.5 text-sm font-medium',
        'transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-primary-500/40',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  )
}
