import RenewalItem from './RenewalItem'

export default function RenewalTimeline({ items }) {
  return (
    <div className="space-y-4">
      {items.map(({ doc, status }) => (
        <RenewalItem key={doc.id} doc={doc} status={status} />
      ))}
    </div>
  )
}
