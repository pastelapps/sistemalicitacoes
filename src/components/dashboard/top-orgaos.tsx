'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface TopOrgaosProps {
  data: Array<{ nome: string; count: number }>
}

export function TopOrgaos({ data }: TopOrgaosProps) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Orgaos por Inscricoes</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            Nenhum dado disponivel
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-6 text-right">
                  {index + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{item.nome}</span>
                    <span className="text-sm font-bold ml-2">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{
                        width: maxCount > 0 ? `${(item.count / maxCount) * 100}%` : '0%',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
