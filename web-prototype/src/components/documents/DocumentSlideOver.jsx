import { AnimatePresence, motion } from 'framer-motion'
import { X, Download, Trash2, RefreshCw, FileText, Copy } from 'lucide-react'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { formatDate } from '@/utils/formatDate'
import { shareService } from '@/services/shareService'
import toast from 'react-hot-toast'

export default function DocumentSlideOver({ doc, open, onClose }) {
  const [shareUrl, setShareUrl] = useState('')
  const [generating, setGenerating] = useState(false)

  async function handleGenerateLink() {
    setGenerating(true)
    const { url } = await shareService.generateLink(doc.id)
    setShareUrl(url)
    setGenerating(false)
  }

  function copyLink() {
    navigator.clipboard.writeText(shareUrl)
    toast.success('Link copied to clipboard')
  }

  if (!doc) return null

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            className="absolute inset-0 bg-black/40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative flex h-full w-full max-w-[480px] flex-col overflow-y-auto rounded-l-2xl bg-white shadow-2xl"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.28 }}
          >
            <div className="flex items-center justify-between border-b border-bordergray px-6 py-5">
              <h2 className="text-lg font-semibold text-textprimary">{doc.title}</h2>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex flex-1 flex-col gap-6 p-6">
              <div className="flex h-48 items-center justify-center rounded-card bg-gray-100">
                <FileText className="h-12 w-12 text-gray-400" />
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-textprimary">Extracted Fields</h3>
                <div className="grid grid-cols-2 gap-y-3 rounded-btn bg-gray-50 p-4 text-sm">
                  {Object.entries({
                    Type: doc.category,
                    Name: doc.name,
                    DOB: doc.dob ? formatDate(doc.dob) : '—',
                    'Doc Number': doc.docNumber,
                    'Issue Date': formatDate(doc.issueDate),
                    'Expiry Date': doc.expiryDate ? formatDate(doc.expiryDate) : '—',
                    'Issuing Authority': doc.issuingAuthority,
                  }).map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-textsecondary">{label}</p>
                      <p className="font-medium text-textprimary">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-textprimary">Version History</h3>
                <ul className="space-y-2 text-sm text-textsecondary">
                  <li className="flex justify-between rounded-btn border border-bordergray px-3 py-2">
                    <span>v1 — Original upload</span><span>{formatDate(doc.issueDate)}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-textprimary">Share this document</h3>
                {shareUrl ? (
                  <div className="flex items-center gap-2">
                    <input readOnly value={shareUrl} className="flex-1 truncate rounded-btn border border-bordergray bg-gray-50 px-3 py-2.5 text-xs" />
                    <Button variant="secondary" icon={Copy} onClick={copyLink}>Copy</Button>
                  </div>
                ) : (
                  <Button variant="secondary" loading={generating} onClick={handleGenerateLink} className="w-full">
                    Generate Secure Link
                  </Button>
                )}
              </div>
            </div>

            <div className="flex gap-3 border-t border-bordergray p-6">
              <Button variant="secondary" icon={Download} className="flex-1">Download</Button>
              <Button variant="secondary" icon={RefreshCw} className="flex-1">Renew</Button>
              <Button variant="danger" icon={Trash2} className="flex-1">Delete</Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
