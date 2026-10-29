import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { cn } from '@/utils/cn'
import { useEffect, useState } from 'react'

export default function NotificationBell() {
  const unreadCount = useSelector((s) => s.notifications.unreadCount)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (unreadCount > 0) {
      setShake(true)
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [unreadCount])

  return (
    <Link to="/notifications" className="relative rounded-full p-2 hover:bg-gray-100">
      <Bell className={cn('h-5 w-5 text-textsecondary', shake && 'animate-shake')} />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger ring-2 ring-white" />
      )}
    </Link>
  )
}
