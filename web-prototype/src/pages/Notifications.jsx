import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDispatch, useSelector } from 'react-redux'
import { useNotifications } from '@/hooks/useNotifications'
import { setNotifications, markAllRead, clearAll } from '@/store/notificationSlice'
import Button from '@/components/ui/Button'
import Skeleton from '@/components/ui/Skeleton'

const TABS = ['All', 'Unread', 'Expiry', 'System']

export default function Notifications() {
  const dispatch = useDispatch()
  const { data, isLoading } = useNotifications()
  const items = useSelector((s) => s.notifications.items)
  const [tab, setTab] = useState('All')

  useEffect(() => {
    if (data) dispatch(setNotifications(data))
  }, [data, dispatch])

  const filtered = items.filter((n) => {
    if (tab === 'All') return true
    if (tab === 'Unread') return !n.read
    if (tab === 'Expiry') return n.type === 'expiry'
    if (tab === 'System') return n.type === 'system'
    return true
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-textprimary lg:text-[28px]">Notifications</h1>
        <div className="flex gap-2">
          <Button variant="secondary" icon={CheckCheck} onClick={() => dispatch(markAllRead())}>Mark all as read</Button>
          <Button variant="secondary" icon={Trash2} onClick={() => dispatch(clearAll())}>Clear all</Button>
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-bordergray">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('border-b-2 px-3 py-2 text-sm font-medium text-textsecondary', tab === t ? 'border-primary-600 text-primary-700' : 'border-transparent hover:text-textprimary')}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : filtered.length === 0 ? (
        <p className="py-16 text-center text-textsecondary">You&apos;re all caught up.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-card border border-bordergray bg-white p-4">
              <span className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-600"><Bell className="h-4 w-4" /></span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-textprimary">{n.title}</p>
                  {!n.read && <span className="h-2 w-2 rounded-full bg-primary-600" />}
                </div>
                <p className="text-sm text-textsecondary">{n.message}</p>
              </div>
              <span className="flex-shrink-0 text-xs text-textsecondary">{n.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
