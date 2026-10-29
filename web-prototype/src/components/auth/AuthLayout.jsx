import { FileStack } from 'lucide-react'

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15">
            <FileStack className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">DocuFlow</span>
        </div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Every document.<br />One organized place.</h1>
          <p className="mt-3 max-w-sm text-white/80">
            DocuFlow scans, classifies, and tracks expiry dates automatically — so nothing important ever slips past you.
          </p>
        </div>
        <p className="text-xs text-white/60">© 2026 DocuFlow. All rights reserved.</p>
      </div>
      <div className="flex w-full items-center justify-center bg-background p-6 lg:w-1/2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
