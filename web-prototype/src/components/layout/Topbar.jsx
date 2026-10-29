import { Menu as MenuIcon, Moon, Sun, ChevronDown } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { toggleDarkMode, toggleSidebar } from '@/store/uiSlice'
import NotificationBell from './NotificationBell'
import Dropdown from '@/components/ui/Dropdown'
import { useAuth } from '@/hooks/useAuth'

export default function Topbar() {
  const dispatch = useDispatch()
  const darkMode = useSelector((s) => s.ui.darkMode)
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-bordergray bg-white/80 px-4 backdrop-blur lg:px-8">
      <button onClick={() => dispatch(toggleSidebar())} className="rounded-full p-2 hover:bg-gray-100 lg:hidden">
        <MenuIcon className="h-5 w-5" />
      </button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-2">
        <button onClick={() => dispatch(toggleDarkMode())} className="rounded-full p-2 hover:bg-gray-100">
          {darkMode ? <Sun className="h-5 w-5 text-textsecondary" /> : <Moon className="h-5 w-5 text-textsecondary" />}
        </button>
        <NotificationBell />
        <Dropdown
          trigger={
            <span className="flex cursor-pointer items-center gap-2 rounded-full py-1 pl-1 pr-2 hover:bg-gray-100">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                {(user?.name || 'U')[0].toUpperCase()}
              </span>
              <ChevronDown className="h-4 w-4 text-textsecondary" />
            </span>
          }
          items={[
            { label: 'Settings', onClick: () => (window.location.href = '/settings') },
            { label: 'Sign out', onClick: logout, danger: true },
          ]}
        />
      </div>
    </header>
  )
}
