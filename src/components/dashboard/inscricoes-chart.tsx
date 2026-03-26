'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface InscricoesChartProps {
  data: Array<{ date: string; count: number }>
}

export function InscricoesChart({ data }: InscricoesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscricoes ao Longo do Tempo</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Nenhum dado disponivel
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value: string) => {
                  const parts = value.split('-')
                  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : value
                }}
              />
              <YAxis allowDecimals={false} />
              <Tooltip
                labelFormatter={(value) => {
                  const str = String(value)
                  const parts = str.split('-')
                  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
                  return str
                }}
                formatter={(value) => [String(value), 'Inscricoes']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1a2332"
                strokeWidth={2}
                dot={{ fill: '#1a2332', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
