import { motion } from 'framer-motion'
import { FileText, MoreVertical, Eye, Share2, Download, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Dropdown from '@/components/ui/Dropdown'
import { CATEGORY_COLORS } from '@/utils/constants'
import { formatDate } from '@/utils/formatDate'
import { expiryStatus } from '@/utils/daysLeft'
import { Link } from 'react-router-dom'

export default function DocumentCard({ doc, onDelete }) {
  const colors = CATEGORY_COLORS[doc.category] || CATEGORY_COLORS.Identity
  const status = expiryStatus(doc.expiryDate)

  return (
    <Card hover className="group relative">
      <div className="mb-4 flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${colors.icon}`}>
          <FileText className={`h-5 w-5 ${colors.text}`} />
        </div>
        <Dropdown
          trigger={
            <button className="rounded-full p-1.5 text-textsecondary opacity-0 transition-opacity hover:bg-gray-100 group-hover:opacity-100">
              <MoreVertical className="h-4 w-4" />
            </button>
          }
          items={[
            { label: 'View', icon: Eye, onClick: () => (window.location.href = `/documents/${doc.id}`) },
            { label: 'Share', icon: Share2, onClick: () => {} },
            { label: 'Download', icon: Download, onClick: () => {} },
            { label: 'Delete', icon: Trash2, danger: true, onClick: () => onDelete?.(doc.id) },
          ]}
        />
      </div>
      <Link to={`/documents/${doc.id}`}>
        <h3 className="mb-1.5 truncate text-base font-semibold text-textprimary">{doc.title}</h3>
      </Link>
      <Badge tone="primary" className={`${colors.bg} ${colors.text}`}>{doc.category}</Badge>
      <p className={`mt-3 text-xs font-medium ${status === 'expired' ? 'text-danger' : status === 'urgent' ? 'text-warning' : 'text-textsecondary'}`}>
        {doc.expiryDate ? `${status === 'expired' ? 'Expired' : 'Expires'} ${formatDate(doc.expiryDate)}` : 'No expiry'}
      </p>
    </Card>
  )
}
