import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { MonthlyPoint } from '@/services/analyticsApi';

export function RevenueChart({ data }: { data: MonthlyPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-paper-line)" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--color-slate)' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: 'var(--color-slate)' }} axisLine={false} tickLine={false} width={56} />
          <Tooltip
            cursor={{ fill: 'rgba(11,15,20,0.04)' }}
            contentStyle={{
              borderRadius: 12,
              border: '1px solid var(--color-paper-line)',
              fontSize: 12,
            }}
            formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
          />
          <Bar dataKey="revenue" fill="var(--color-route)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
