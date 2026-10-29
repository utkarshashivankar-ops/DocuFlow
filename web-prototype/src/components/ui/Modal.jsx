import { Dialog } from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-md', hideClose = false }) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog static open={open} onClose={onClose} className="relative z-50">
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Dialog.Panel as={motion.div}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className={cn('w-full rounded-modal bg-white p-6 shadow-2xl', maxWidth)}
            >
              <div className="mb-4 flex items-center justify-between">
                {title && <Dialog.Title className="text-lg font-semibold text-textprimary">{title}</Dialog.Title>}
                {!hideClose && (
                  <button onClick={onClose} className="rounded-full p-1 text-textsecondary hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {children}
            </Dialog.Panel>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
