import { useState } from 'react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import DragDropZone from '@/components/documents/DragDropZone'
import ProcessingModal from '@/components/documents/ProcessingModal'
import { documentService } from '@/services/documentService'

export default function Upload() {
  const navigate = useNavigate()
  const [modalOpen, setModalOpen] = useState(false)
  const [result, setResult] = useState(null)

  async function handleFile(file) {
    setModalOpen(true)
    const extracted = await documentService.upload(file)
    setResult(extracted)
  }

  function handleSave() {
    setModalOpen(false)
    toast.success('Document saved to library')
    navigate('/documents')
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-textprimary lg:text-[28px]">Upload a Document</h1>
      <p className="mb-6 text-sm text-textsecondary">We&apos;ll classify it and extract key details automatically.</p>
      <DragDropZone onFile={handleFile} />
      <ProcessingModal open={modalOpen} onClose={() => setModalOpen(false)} result={result} onSave={handleSave} />
    </div>
  )
}
