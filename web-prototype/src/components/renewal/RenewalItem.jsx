import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ExternalLink, CheckSquare } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { daysLeft } from '@/utils/daysLeft'
import { cn } from '@/utils/cn'

const urgencyBorder = { urgent: 'border-l-danger', soon: 'border-l-warning', safe: 'border-l-success', expired: 'border-l-danger' }

export default function RenewalItem({ doc, status }) {
  const [open, setOpen] = useState(false)
  const days = daysLeft(doc.expiryDate)

  return (
    <Card className={cn('border-l-4', urgencyBorder[status])}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-textprimary">{doc.title}</p>
          <Badge tone="primary" className="mt-1">{doc.category}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={status === 'safe' ? 'success' : status === 'soon' ? 'warning' : 'danger'}>
            {days < 0 ? `Expired ${Math.abs(days)}d ago` : `${days} days left`}
          </Badge>
          <Button onClick={() => setOpen((o) => !o)}>Renew Now</Button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5 space-y-4 border-t border-bordergray pt-5 text-sm">
              <div>
                <p className="mb-2 font-medium text-textprimary">Required documents</p>
                <ul className="space-y-1.5 text-textsecondary">
                  {['Identity proof', 'Previous document copy', 'Passport photo'].map((item) => (
                    <li key={item} className="flex items-center gap-2"><CheckSquare className="h-4 w-4 text-success" />{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-2 font-medium text-textprimary">Step-by-step guidance</p>
                <ol className="list-decimal space-y-1 pl-5 text-textsecondary">
                  <li>Gather the required documents above</li>
                  <li>Visit the official renewal portal</li>
                  <li>Submit your application and pay the fee</li>
                  <li>Upload the renewed document to DocuFlow</li>
                </ol>
              </div>
              <a href="#" className="inline-flex items-center gap-1.5 font-medium text-primary-600 hover:text-primary-700">
                Official portal <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
