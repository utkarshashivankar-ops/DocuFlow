import { FileText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatDate } from '@/utils/formatDate'

function highlight(text, query) {
  if (!query) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 text-inherit">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export default function SearchResults({ results, query }) {
  if (!results.length) {
    return <p className="mt-10 text-center text-textsecondary">No results for &quot;{query}&quot;</p>
  }
  return (
    <ul className="mt-6 space-y-3">
      {results.map((doc) => (
        <li key={doc.id}>
          <Link to={`/documents/${doc.id}`} className="flex items-center gap-4 rounded-card border border-bordergray bg-white p-4 hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600"><FileText className="h-5 w-5" /></span>
            <div>
              <p className="font-medium text-textprimary">{highlight(doc.title, query)}</p>
              <p className="text-xs text-textsecondary">{doc.category} · Issued {formatDate(doc.issueDate)}</p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
