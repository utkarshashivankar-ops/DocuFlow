import { FileText, AlertTriangle, HardDrive, RefreshCw } from 'lucide-react'
import StatCard from './StatCard'

export default function StatsGrid({ stats }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard label="Total Documents" value={stats.totalDocuments} subtext="Across all categories" icon={FileText} tone="primary" />
      <StatCard label="Expiring Soon" value={stats.expiringSoon} subtext="Within 30 days" icon={AlertTriangle} tone="warning" />
      <StatCard label="Storage Used" value={`${stats.storageUsedMb} MB`} subtext={`of ${stats.storageLimitMb} MB`} icon={HardDrive} tone="info" />
      <StatCard label="Pending Renewals" value={stats.pendingRenewals} subtext="Need your attention" icon={RefreshCw} tone="danger" />
    </div>
  )
}
