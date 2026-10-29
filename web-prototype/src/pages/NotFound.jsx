import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <FileQuestion className="mb-6 h-20 w-20 text-primary-300" />
      <h1 className="text-2xl font-bold text-textprimary">Page not found</h1>
      <p className="mt-2 text-sm text-textsecondary">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link to="/"><Button className="mt-6">Back to Dashboard</Button></Link>
    </div>
  )
}
