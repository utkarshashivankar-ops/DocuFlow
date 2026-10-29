import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import { formatDate } from '@/utils/formatDate'
import { expiryStatus } from '@/utils/daysLeft'

export default function DocumentList({ documents }) {
  return (
    <div className="overflow-x-auto rounded-card border border-bordergray bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-bordergray text-xs font-medium uppercase tracking-wide text-textsecondary">
            <th className="px-5 py-3">Name</th>
            <th className="px-5 py-3">Category</th>
            <th className="px-5 py-3">Issued</th>
            <th className="px-5 py-3">Expiry</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc, i) => {
            const status = expiryStatus(doc.expiryDate)
            return (
              <motion.tr
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-b border-bordergray last:border-0 hover:bg-gray-50"
              >
                <td className="px-5 py-3.5">
                  <Link to={`/documents/${doc.id}`} className="font-medium text-textprimary hover:text-primary-600">{doc.title}</Link>
                </td>
                <td className="px-5 py-3.5"><Badge tone="primary">{doc.category}</Badge></td>
                <td className="px-5 py-3.5 text-textsecondary">{formatDate(doc.issueDate)}</td>
                <td className={`px-5 py-3.5 font-medium ${status === 'expired' ? 'text-danger' : status === 'urgent' ? 'text-warning' : 'text-textsecondary'}`}>
                  {doc.expiryDate ? formatDate(doc.expiryDate) : '—'}
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
