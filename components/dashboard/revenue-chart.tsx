'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'

const data = [
  { month: 'Jan', revenue: 4500, expenses: 2400 },
  { month: 'Feb', revenue: 3800, expenses: 1398 },
  { month: 'Mar', revenue: 5200, expenses: 2800 },
  { month: 'Apr', revenue: 4700, expenses: 3908 },
  { month: 'May', revenue: 6800, expenses: 4800 },
  { month: 'Jun', revenue: 7500, expenses: 3800 },
  { month: 'Jul', revenue: 8200, expenses: 4300 },
  { month: 'Aug', revenue: 7800, expenses: 4100 },
  { month: 'Sep', revenue: 9100, expenses: 5200 },
  { month: 'Oct', revenue: 8600, expenses: 4900 },
  { month: 'Nov', revenue: 9500, expenses: 5100 },
  { month: 'Dec', revenue: 10200, expenses: 5800 },
]

export function RevenueChart() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
          <XAxis 
            dataKey="month" 
            className="text-xs text-muted-foreground"
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            className="text-xs text-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
          />
          <Bar 
            dataKey="revenue" 
            name="Revenue"
            fill="var(--chart-1)" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            dataKey="expenses" 
            name="Expenses"
            fill="var(--chart-3)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
