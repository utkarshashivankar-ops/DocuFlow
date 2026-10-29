import { useState } from 'react'
import { cn } from '@/utils/cn'

export default function Tooltip({ label, children, position = 'top' }) {
  const [show, setShow] = useState(false)
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            'pointer-events-none absolute z-30 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white shadow-lg',
            position === 'top' && 'bottom-full left-1/2 mb-1.5 -translate-x-1/2',
            position === 'bottom' && 'top-full left-1/2 mt-1.5 -translate-x-1/2'
          )}
        >
          {label}
        </span>
      )}
    </span>
  )
}
