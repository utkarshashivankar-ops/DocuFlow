import { cn } from '@/utils/cn'
import { CATEGORIES } from '@/utils/constants'
import { LayoutGrid, List, Search } from 'lucide-react'

export default function DocumentFilters({ active, onChange, view, onViewChange, search, onSearchChange, sort, onSortChange }) {
  return (
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
              active === cat ? 'border-primary-600 bg-primary-600 text-white' : 'border-bordergray bg-white text-textsecondary hover:bg-gray-50'
            )}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-textsecondary" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-btn border border-bordergray bg-white py-2.5 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-btn border border-bordergray bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="expiring">Expiring Soon</option>
            <option value="az">A-Z</option>
          </select>
          <div className="flex rounded-btn border border-bordergray bg-white p-1">
            <button onClick={() => onViewChange('grid')} className={cn('rounded-[6px] p-1.5', view === 'grid' && 'bg-primary-50 text-primary-600')}>
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button onClick={() => onViewChange('list')} className={cn('rounded-[6px] p-1.5', view === 'list' && 'bg-primary-50 text-primary-600')}>
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
