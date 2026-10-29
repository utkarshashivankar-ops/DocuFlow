import { NavLink } from 'react-router-dom'
import { LayoutDashboard, FileText, UploadCloud, RefreshCw, Search, Bell, Settings, FileStack, X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useDispatch, useSelector } from 'react-redux'
import { closeSidebar } from '@/store/uiSlice'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/upload', label: 'Upload', icon: UploadCloud },
  { to: '/renewals', label: 'Renewal Center', icon: RefreshCw },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export default function Sidebar() {
  const dispatch = useDispatch()
  const sidebarOpen = useSelector((s) => s.ui.sidebarOpen)

  const content = (
    <div className="flex h-full w-[260px] flex-col border-r border-bordergray bg-white">
      <div className="flex items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-primary-500 to-primary-700 text-white">
            <FileStack className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-textprimary">DocuFlow</span>
        </div>
        <button onClick={() => dispatch(closeSidebar())} className="rounded-full p-1 hover:bg-gray-100 lg:hidden">
          <X className="h-5 w-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => dispatch(closeSidebar())}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-btn border-l-[3px] border-transparent px-3 py-2.5 text-sm font-medium text-textsecondary transition-colors',
                'hover:bg-gray-50 hover:text-textprimary',
                isActive && 'border-primary-600 bg-primary-50 text-primary-700'
              )
            }
          >
            <Icon className="h-4.5 w-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-bordergray p-4 text-xs text-textsecondary">
        v1.0.0 · Frontend Demo
      </div>
    </div>
  )

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(closeSidebar())} />
          <div className="absolute inset-y-0 left-0">{content}</div>
        </div>
      )}
    </>
  )
}
