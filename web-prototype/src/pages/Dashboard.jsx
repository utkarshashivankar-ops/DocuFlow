import { useSelector } from 'react-redux'
import Skeleton from '@/components/ui/Skeleton'
import StatsGrid from '@/components/dashboard/StatsGrid'
import ExpiryAlertBanner from '@/components/dashboard/ExpiryAlertBanner'
import RecentDocuments from '@/components/dashboard/RecentDocuments'
import ExpiryChart from '@/components/dashboard/ExpiryChart'
import { useDashboardStats, useExpiryChart, useDocuments } from '@/hooks/useDocuments'

export default function Dashboard() {
  const { user } = useSelector((s) => s.auth)
  const { data: stats, isLoading: statsLoading } = useDashboardStats()
  const { data: chartData, isLoading: chartLoading } = useExpiryChart()
  const { data: documents, isLoading: docsLoading } = useDocuments()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-textprimary lg:text-[28px]">Good morning, {user?.name || 'there'}</h1>
        <p className="mt-1 text-sm text-textsecondary">Here&apos;s what&apos;s happening with your documents today.</p>
      </div>

      {statsLoading ? (
        <Skeleton className="mb-6 h-20 w-full" />
      ) : (
        <ExpiryAlertBanner count={stats.expiringSoon} />
      )}

      {statsLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
      ) : (
        <StatsGrid stats={stats} />
      )}

      {docsLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : (
        <RecentDocuments documents={documents} />
      )}

      {chartLoading ? <Skeleton className="mt-8 h-72" /> : <ExpiryChart data={chartData} />}
    </div>
  )
}
