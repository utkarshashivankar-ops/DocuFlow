import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud } from 'lucide-react'
import { cn } from '@/utils/cn'

export default function DragDropZone({ onFile }) {
  const [bounce, setBounce] = useState(false)
  const onDrop = useCallback(
    (accepted) => {
      if (accepted[0]) {
        setBounce(true)
        setTimeout(() => setBounce(false), 400)
        onFile(accepted[0])
      }
    },
    [onFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary-300 bg-primary-50/30 px-6 py-20 text-center transition-colors',
        isDragActive && 'border-solid border-primary-600 bg-primary-100/50'
      )}
    >
      <input {...getInputProps()} />
      <UploadCloud className={cn('mb-4 h-12 w-12 text-primary-600', bounce && 'animate-bounce')} />
      <p className="text-base font-semibold text-textprimary">Drag & drop your document here</p>
      <p className="mt-1 text-sm text-textsecondary">or click to browse</p>
      <p className="mt-4 text-xs text-textsecondary">Supported formats: PDF, JPG, PNG (max 10MB)</p>
    </div>
  )
}
