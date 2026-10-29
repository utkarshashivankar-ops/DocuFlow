import DocumentGrid from '@/components/documents/DocumentGrid'
import { Link } from 'react-router-dom'

export default function RecentDocuments({ documents }) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-textprimary">Recent Documents</h2>
        <Link to="/documents" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
      </div>
      <DocumentGrid documents={documents.slice(0, 6)} />
    </section>
  )
}
