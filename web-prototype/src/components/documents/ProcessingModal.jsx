import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import { cn } from '@/utils/cn'

const STEPS = [
  { key: 'preprocess', label: 'Image Preprocessing (OpenCV)', duration: 900 },
  { key: 'cnn', label: 'CNN Classification', duration: 1800 },
  { key: 'ocr', label: 'OCR Text Extraction', duration: 1500 },
  { key: 'extract', label: 'Information Extraction', duration: 1000 },
]

// Processing state machine: idle -> running steps -> done -> extracted preview
export default function ProcessingModal({ open, onClose, result, onSave }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!open) {
      setStepIndex(0)
      setProgress(0)
      setDone(false)
      return
    }
    let cancelled = false
    let overall = 0

    async function run() {
      for (let i = 0; i < STEPS.length; i++) {
        if (cancelled) return
        setStepIndex(i)
        const start = Date.now()
        const dur = STEPS[i].duration
        await new Promise((resolve) => {
          const tick = () => {
            if (cancelled) return resolve()
            const elapsed = Date.now() - start
            const stepPct = Math.min(100, (elapsed / dur) * 100)
            overall = ((i + stepPct / 100) / STEPS.length) * 100
            setProgress(overall)
            if (elapsed < dur) requestAnimationFrame(tick)
            else resolve()
          }
          tick()
        })
      }
      if (!cancelled) {
        setProgress(100)
        setDone(true)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [open])

  return (
    <Modal open={open} onClose={done ? onClose : undefined} hideClose={!done} title={done ? 'Document Processed' : 'Processing your document...'}>
      {!done ? (
        <div>
          <div className="mb-6 space-y-4">
            {STEPS.map((step, i) => {
              const state = i < stepIndex ? 'done' : i === stepIndex ? 'active' : 'pending'
              return (
                <div key={step.key} className="flex items-center gap-3">
                  {state === 'done' && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />}
                  {state === 'active' && (
                    <span className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full animate-pulseGlow">
                      <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                    </span>
                  )}
                  {state === 'pending' && <Circle className="h-5 w-5 flex-shrink-0 text-gray-300" />}
                  <span
                    className={cn(
                      'text-sm',
                      state === 'done' && 'text-textsecondary line-through decoration-gray-300',
                      state === 'active' && 'font-medium text-textprimary',
                      state === 'pending' && 'text-gray-400'
                    )}
                  >
                    {step.label}
                  </span>
                  {state === 'active' && (
                    <span className="ml-auto text-xs font-semibold text-primary-600">{Math.round(progress)}%</span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-indigo-600"
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 rounded-btn bg-gray-50 p-4">
            {Object.entries({
              'Document Type': result?.documentType,
              Name: result?.name,
              'Document Number': result?.documentNumber,
              'Issue Date': result?.issueDate,
              'Expiry Date': result?.expiryDate,
            }).map(([label, value]) => (
              <div key={label}>
                <p className="text-xs font-medium text-textsecondary">{label}</p>
                <p className="text-sm font-semibold text-textprimary">{value || '—'}</p>
              </div>
            ))}
          </div>
          <Button variant="success" className="w-full" onClick={onSave}>Save to Library</Button>
        </motion.div>
      )}
    </Modal>
  )
}
