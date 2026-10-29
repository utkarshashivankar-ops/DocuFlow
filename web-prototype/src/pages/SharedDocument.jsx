import { useParams, Link } from 'react-router-dom'
import { FileText, Lock } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

export default function SharedDocument() {
  const { token } = useParams()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <FileText className="h-6 w-6" />
        </span>
        <h1 className="text-lg font-semibold text-textprimary">Shared Document</h1>
        <p className="mt-1 break-all text-xs text-textsecondary">Token: {token}</p>
        <div className="mt-5 rounded-btn bg-gray-50 p-4 text-left text-sm">
          <p className="text-xs text-textsecondary">Document Type</p>
          <p className="mb-3 font-medium text-textprimary">Insurance Policy</p>
          <p className="text-xs text-textsecondary">Shared by</p>
          <p className="font-medium text-textprimary">Aarav Sharma</p>
        </div>
        <p className="mt-4 text-xs font-medium text-warning">This link expires in 6 days</p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-textsecondary">
          <Lock className="h-4 w-4" />
          <span>Sign in to view the full document</span>
        </div>
        <Link to="/login"><Button className="mt-4 w-full">Sign In</Button></Link>
      </Card>
    </div>
  )
}
