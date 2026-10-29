import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { cn } from '@/utils/cn'

export default function Dropdown({ trigger, items, align = 'right' }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button as={Fragment}>{trigger}</Menu.Button>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items
          className={cn(
            'absolute z-20 mt-2 w-44 origin-top-right rounded-btn border border-bordergray bg-white p-1 shadow-xl focus:outline-none',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item, i) => (
            <Menu.Item key={i}>
              {({ active }) => (
                <button
                  onClick={item.onClick}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm',
                    item.danger ? 'text-danger' : 'text-textprimary',
                    active && (item.danger ? 'bg-red-50' : 'bg-gray-50')
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  )
}
