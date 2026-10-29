import { useMemo, useState } from 'react'
import { FileX2 } from 'lucide-react'
import Skeleton from '@/components/ui/Skeleton'
import DocumentFilters from '@/components/documents/DocumentFilters'
import DocumentGrid from '@/components/documents/DocumentGrid'
import DocumentList from '@/components/documents/DocumentList'
import { useDocuments } from '@/hooks/useDocuments'
import { useDebounce } from '@/hooks/useDebounce'
import { daysLeft } from '@/utils/daysLeft'
import toast from 'react-hot-toast'

export default function Documents() {
  const { data: documents, isLoading } = useDocuments()
  const [category, setCategory] = useState('All')
  const [view, setView] = useState('grid')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const debouncedSearch = useDebounce(search, 250)

  const filtered = useMemo(() => {
    if (!documents) return []
    let list = documents.filter((d) => category === 'All' || d.category === category)
    if (debouncedSearch) {
      list = list.filter((d) => d.title.toLowerCase().includes(debouncedSearch.toLowerCase()))
    }
    list = [...list].sort((a, b) => {
      if (sort === 'newest') return new Date(b.issueDate) - new Date(a.issueDate)
      if (sort === 'oldest') return new Date(a.issueDate) - new Date(b.issueDate)
      if (sort === 'az') return a.title.localeCompare(b.title)
      if (sort === 'expiring') return (daysLeft(a.expiryDate) ?? 9999) - (daysLeft(b.expiryDate) ?? 9999)
      return 0
    })
    return list
  }, [documents, category, debouncedSearch, sort])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-textprimary lg:text-[28px]">Documents</h1>
      <DocumentFilters
        active={category} onChange={setCategory}
        view={view} onViewChange={setView}
        search={search} onSearchChange={setSearch}
        sort={sort} onSortChange={setSort}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-bordergray bg-white py-20 text-center">
          <FileX2 className="mb-4 h-12 w-12 text-gray-300" />
          <p className="font-medium text-textprimary">No documents yet — upload your first one!</p>
        </div>
      ) : view === 'grid' ? (
        <DocumentGrid documents={filtered} onDelete={() => toast.success('Document deleted')} />
      ) : (
        <DocumentList documents={filtered} />
      )}
    </div>
  )
}
