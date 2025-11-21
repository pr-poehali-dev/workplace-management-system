import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OptimizedSheet } from '@/utils/cuttingOptimizer';

interface CuttingOptimizationReportProps {
  optimization: {
    sheets: OptimizedSheet[];
    totalWaste: number;
    efficiency: number;
  } | null;
}

export default function CuttingOptimizationReport({ optimization }: CuttingOptimizationReportProps) {
  if (!optimization) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Введите размеры деталей для расчёта оптимизации
        </CardContent>
      </Card>
    );
  }

  const getSheetsByType = (sheets: OptimizedSheet[]) => {
    const grouped = new Map<string, number>();
    sheets.forEach((s) => {
      const key = s.sheet.name;
      grouped.set(key, (grouped.get(key) || 0) + 1);
    });
    return Array.from(grouped.entries());
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Результаты оптимизации</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-muted-foreground">Всего листов</p>
              <p className="text-3xl font-bold">{optimization.sheets.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Эффективность</p>
              <p className="text-3xl font-bold text-green-600">{optimization.efficiency.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Общие отходы</p>
              <p className="text-3xl font-bold text-orange-600">{optimization.totalWaste.toFixed(2)} м²</p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="font-semibold">Используемые листы:</p>
            {getSheetsByType(optimization.sheets).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>{type}</span>
                <Badge>{count} шт</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {optimization.sheets.map((optimizedSheet, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle className="text-lg">
              Лист {idx + 1} - {optimizedSheet.sheet.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Эффективность: {optimizedSheet.efficiency.toFixed(1)}% | Отходы:{' '}
              {optimizedSheet.wasteArea.toFixed(2)} м²
            </p>
          </CardHeader>
          <CardContent>
            <div
              className="relative border-2 border-slate-300 bg-slate-50"
              style={{
                width: '100%',
                paddingBottom: `${(optimizedSheet.sheet.height / optimizedSheet.sheet.width) * 100}%`,
              }}
            >
              {optimizedSheet.details.map((detail, detailIdx) => {
                const widthPercent = (detail.width / optimizedSheet.sheet.width) * 100;
                const heightPercent = (detail.height / optimizedSheet.sheet.height) * 100;
                const leftPercent = (detail.x / optimizedSheet.sheet.width) * 100;
                const topPercent = (detail.y / optimizedSheet.sheet.height) * 100;

                return (
                  <div
                    key={detailIdx}
                    className="absolute border-2 border-blue-500 bg-blue-100 flex items-center justify-center text-xs font-semibold overflow-hidden"
                    style={{
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                    }}
                  >
                    <span className="text-center p-1">
                      {detail.name}
                      {detail.rotated && ' ↻'}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
