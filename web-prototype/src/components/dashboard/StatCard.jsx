import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Card from '@/components/ui/Card'

export default function StatCard({ label, value, subtext, icon: Icon, tone = 'primary' }) {
  const [display, setDisplay] = useState(0)
  const tones = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-amber-50 text-warning',
    info: 'bg-blue-50 text-info',
    danger: 'bg-red-50 text-danger',
  }

  useEffect(() => {
    const target = typeof value === 'number' ? value : 0
    if (!target) return setDisplay(value)
    let frame
    const start = performance.now()
    const dur = 900
    function tick(now) {
      const p = Math.min(1, (now - start) / dur)
      setDisplay(Math.round(target * p))
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return (
    <Card hover className="relative">
      <div className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-textsecondary">{label}</p>
      <motion.p className="mt-2 text-3xl font-bold text-textprimary lg:text-4xl">
        {typeof value === 'number' ? display : value}
      </motion.p>
      {subtext && <p className="mt-1 text-xs text-textsecondary">{subtext}</p>}
    </Card>
  )
}
