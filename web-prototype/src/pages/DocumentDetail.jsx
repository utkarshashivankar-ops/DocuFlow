import { useNavigate, useParams } from 'react-router-dom'
import { useDocument } from '@/hooks/useDocuments'
import DocumentSlideOver from '@/components/documents/DocumentSlideOver'
import Spinner from '@/components/ui/Spinner'

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: doc, isLoading } = useDocument(id)

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Spinner /></div>
  }

  return <DocumentSlideOver doc={doc} open={true} onClose={() => navigate('/documents')} />
}
