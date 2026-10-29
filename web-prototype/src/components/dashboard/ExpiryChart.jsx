import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import Card from '@/components/ui/Card'

export default function ExpiryChart({ data }) {
  return (
    <Card className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-textprimary">Documents Expiring by Month</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: 10, borderColor: '#E5E7EB', fontSize: 13 }} />
          <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
