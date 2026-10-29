import { useState } from 'react'
import { Tab } from '@headlessui/react'
import { useSelector, useDispatch } from 'react-redux'
import { Moon, Sun } from 'lucide-react'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'
import { toggleDarkMode } from '@/store/uiSlice'
import toast from 'react-hot-toast'

const TABS = ['Profile', 'Security', 'Notifications', 'Appearance']

export default function Settings() {
  const dispatch = useDispatch()
  const { user } = useSelector((s) => s.auth)
  const darkMode = useSelector((s) => s.ui.darkMode)
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(false)
  const [twoFA, setTwoFA] = useState(false)

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-textprimary lg:text-[28px]">Settings</h1>
      <Tab.Group>
        <Tab.List className="mb-6 flex gap-2 border-b border-bordergray">
          {TABS.map((t) => (
            <Tab key={t} className={({ selected }) =>
              cn('border-b-2 px-3 py-2 text-sm font-medium outline-none', selected ? 'border-primary-600 text-primary-700' : 'border-transparent text-textsecondary hover:text-textprimary')
            }>
              {t}
            </Tab>
          ))}
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <Card className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-semibold text-primary-700">
                  {(user?.name || 'U')[0].toUpperCase()}
                </span>
                <Button variant="secondary">Upload photo</Button>
              </div>
              <Input label="Full Name" defaultValue={user?.name} />
              <Input label="Email" defaultValue={user?.email} />
              <Button onClick={() => toast.success('Profile updated')}>Save Changes</Button>
            </Card>
          </Tab.Panel>
          <Tab.Panel>
            <Card className="space-y-4">
              <Input label="Current Password" type="password" />
              <Input label="New Password" type="password" />
              <div className="flex items-center justify-between rounded-btn border border-bordergray p-4">
                <div>
                  <p className="font-medium text-textprimary">Two-Factor Authentication</p>
                  <p className="text-xs text-textsecondary">Add an extra layer of security</p>
                </div>
                <button onClick={() => setTwoFA((v) => !v)} className={cn('h-6 w-11 rounded-full transition-colors', twoFA ? 'bg-primary-600' : 'bg-gray-300')}>
                  <span className={cn('block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform', twoFA && 'translate-x-[22px]')} />
                </button>
              </div>
              <Button onClick={() => toast.success('Security settings updated')}>Update Password</Button>
            </Card>
          </Tab.Panel>
          <Tab.Panel>
            <Card className="space-y-4">
              {[
                { label: 'Email notifications', value: emailNotif, set: setEmailNotif },
                { label: 'Push notifications', value: pushNotif, set: setPushNotif },
              ].map(({ label, value, set }) => (
                <div key={label} className="flex items-center justify-between rounded-btn border border-bordergray p-4">
                  <p className="font-medium text-textprimary">{label}</p>
                  <button onClick={() => set((v) => !v)} className={cn('h-6 w-11 rounded-full transition-colors', value ? 'bg-primary-600' : 'bg-gray-300')}>
                    <span className={cn('block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform', value && 'translate-x-[22px]')} />
                  </button>
                </div>
              ))}
            </Card>
          </Tab.Panel>
          <Tab.Panel>
            <Card className="space-y-4">
              <div className="flex items-center justify-between rounded-btn border border-bordergray p-4">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5 text-textsecondary" /> : <Sun className="h-5 w-5 text-textsecondary" />}
                  <p className="font-medium text-textprimary">Dark mode</p>
                </div>
                <button onClick={() => dispatch(toggleDarkMode())} className={cn('h-6 w-11 rounded-full transition-colors', darkMode ? 'bg-primary-600' : 'bg-gray-300')}>
                  <span className={cn('block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform', darkMode && 'translate-x-[22px]')} />
                </button>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-textprimary">Language</label>
                <select className="w-full rounded-btn border border-bordergray bg-white px-3.5 py-2.5 text-sm">
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Marathi</option>
                </select>
              </div>
            </Card>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}
