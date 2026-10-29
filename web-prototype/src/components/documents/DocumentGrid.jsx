import { motion } from 'framer-motion'
import DocumentCard from './DocumentCard'

export default function DocumentGrid({ documents, onDelete }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc, i) => (
        <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
          <DocumentCard doc={doc} onDelete={onDelete} />
        </motion.div>
      ))}
    </div>
  )
}
