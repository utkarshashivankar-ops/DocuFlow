import { useMemo } from 'react'
import Skeleton from '@/components/ui/Skeleton'
import Card from '@/components/ui/Card'
import RenewalTimeline from '@/components/renewal/RenewalTimeline'
import { useDocuments } from '@/hooks/useDocuments'
import { expiryStatus } from '@/utils/daysLeft'

export default function RenewalCenter() {
  const { data: documents, isLoading } = useDocuments()

  const items = useMemo(() => {
    if (!documents) return []
    return documents
      .filter((d) => d.expiryDate)
      .map((doc) => ({ doc, status: expiryStatus(doc.expiryDate) }))
      .filter((i) => i.status !== 'safe' || true)
      .sort((a, b) => new Date(a.doc.expiryDate) - new Date(b.doc.expiryDate))
  }, [documents])

  const counts = useMemo(() => ({
    urgent: items.filter((i) => i.status === 'urgent' || i.status === 'expired').length,
    soon: items.filter((i) => i.status === 'soon').length,
    safe: items.filter((i) => i.status === 'safe').length,
  }), [items])

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-textprimary lg:text-[28px]">Renewal Center</h1>
      <p className="mb-6 text-sm text-textsecondary">Track and renew documents before they expire.</p>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card className="text-center"><p className="text-2xl font-bold text-danger">{counts.urgent}</p><p className="text-xs text-textsecondary">Urgent</p></Card>
        <Card className="text-center"><p className="text-2xl font-bold text-warning">{counts.soon}</p><p className="text-xs text-textsecondary">Soon</p></Card>
        <Card className="text-center"><p className="text-2xl font-bold text-success">{counts.safe}</p><p className="text-xs text-textsecondary">Safe</p></Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
      ) : (
        <RenewalTimeline items={items} />
      )}
    </div>
  )
}
