import { Search } from 'lucide-react'
import { forwardRef } from 'react'

const SearchBar = forwardRef(function SearchBar({ value, onChange, placeholder = 'Search documents, categories, notes...' }, ref) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-textsecondary" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-btn border border-bordergray bg-white py-3.5 pl-12 pr-4 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
      />
    </div>
  )
})

export default SearchBar
