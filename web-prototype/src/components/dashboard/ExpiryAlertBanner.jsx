import { AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ExpiryAlertBanner({ count }) {
  if (!count) return null
  return (
    <div className="mb-6 flex items-center justify-between gap-4 rounded-card bg-gradient-to-r from-orange-500 to-red-600 px-6 py-5 text-white shadow-sm">
      <div className="flex items-center gap-4">
        <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white/20 backdrop-blur animate-pulseGlow">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold">{count} documents are expiring soon</p>
          <p className="text-sm text-white/85">Renew them before they lapse to avoid disruption.</p>
        </div>
      </div>
      <Link to="/renewals" className="flex-shrink-0 rounded-btn bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:scale-[1.02]">
        View Details
      </Link>
    </div>
  )
}
