// Reusable checklist block used inside the expanded renewal accordion
export default function RenewalChecklist({ items }) {
  return (
    <ul className="space-y-1.5 text-sm text-textsecondary">
      {items.map((item) => <li key={item}>• {item}</li>)}
    </ul>
  )
}
