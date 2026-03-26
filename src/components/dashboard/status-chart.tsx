'use client'

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface StatusChartProps {
  data: Array<{ name: string; value: number; color: string }>
}

export function StatusChart({ data }: StatusChartProps) {
  const hasData = data.some((d) => d.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status dos Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponivel
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.filter((d) => d.value > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                }
                labelLine={true}
              >
                {data
                  .filter((d) => d.value > 0)
                  .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
              </Pie>
              <Tooltip formatter={(value) => [String(value), 'Participantes']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
