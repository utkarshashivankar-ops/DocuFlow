import { useEffect, useRef, useState } from 'react'
import SearchBar from '@/components/search/SearchBar'
import SearchResults from '@/components/search/SearchResults'
import { useDocuments } from '@/hooks/useDocuments'
import { useDebounce } from '@/hooks/useDebounce'

export default function Search() {
  const { data: documents = [] } = useDocuments()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 200)
  const inputRef = useRef(null)

  useEffect(() => {
    function onKey(e) {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = debounced
    ? documents.filter((d) => d.title.toLowerCase().includes(debounced.toLowerCase()) || d.category.toLowerCase().includes(debounced.toLowerCase()))
    : documents

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-textprimary lg:text-[28px]">Search</h1>
      <SearchBar ref={inputRef} value={query} onChange={setQuery} />
      <p className="mt-2 text-xs text-textsecondary">Press <kbd className="rounded border border-bordergray bg-gray-50 px-1.5 py-0.5">/</kbd> to focus search</p>
      <SearchResults results={results} query={debounced} />
    </div>
  )
}
