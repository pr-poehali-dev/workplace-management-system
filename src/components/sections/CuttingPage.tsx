import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';
import {
  parseDetailSize,
  optimizeCutting,
  Detail,
  Sheet,
  OptimizedSheet
} from '@/utils/cuttingOptimizer';

interface CuttingRow {
  [key: string]: string;
}

const COLUMNS = ['Литер', 'БС', 'Этаж', '1 кв', '2 кв', '3 кв', '4 кв', '5 кв', '6 кв', '7 кв', '8 кв', '9 кв', '10 кв'];

const DEFAULT_SHEETS: Sheet[] = [
  { width: 1500, height: 3000, name: 'Лист 1500×3000' },
  { width: 2000, height: 3000, name: 'Лист 2000×3000' },
  { width: 1250, height: 2500, name: 'Лист 1250×2500' },
];

export default function CuttingPage({ user }: { user: User }) {
  const [rows, setRows] = useState<CuttingRow[]>(
    Array(100).fill(null).map(() =>
      COLUMNS.reduce((acc, col) => ({ ...acc, [col]: '' }), {})
    )
  );
  const [showReport, setShowReport] = useState(false);
  const [sheets, setSheets] = useState<Sheet[]>(DEFAULT_SHEETS);
  const [newSheet, setNewSheet] = useState({ width: '', height: '', name: '' });
  const { toast } = useToast();

  const updateCell = (rowIndex: number, column: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][column] = value;
    setRows(newRows);
  };

  const detailsData = useMemo(() => {
    const detailsColumns = COLUMNS.slice(3);
    const detailsMap = new Map<string, number>();

    rows.forEach((row) => {
      detailsColumns.forEach((col) => {
        const value = row[col]?.trim();
        if (value) {
          detailsMap.set(value, (detailsMap.get(value) || 0) + 1);
        }
      });
    });

    return Array.from(detailsMap.entries()).map(([detail, count]) => ({
      name: detail,
      quantity: count,
    }));
  }, [rows]);

  const parsedDetails: Detail[] = useMemo(() => {
    return detailsData
      .map((item) => {
        const size = parseDetailSize(item.name);
        if (size) {
          return {
            name: item.name,
            width: size.width,
            height: size.height,
            quantity: item.quantity,
          };
        }
        return null;
      })
      .filter((d): d is Detail => d !== null);
  }, [detailsData]);

  const optimization = useMemo(() => {
    if (parsedDetails.length === 0) {
      return null;
    }
    return optimizeCutting(parsedDetails, sheets);
  }, [parsedDetails, sheets]);

  const addSheet = () => {
    if (!newSheet.width || !newSheet.height || !newSheet.name) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    setSheets([
      ...sheets,
      {
        width: parseInt(newSheet.width),
        height: parseInt(newSheet.height),
        name: newSheet.name,
      },
    ]);
    setNewSheet({ width: '', height: '', name: '' });
    toast({
      title: 'Добавлено',
      description: 'Размер листа добавлен',
    });
  };

  const removeSheet = (index: number) => {
    setSheets(sheets.filter((_, i) => i !== index));
  };

  const handleExport = () => {
    const data = rows
      .filter((row) => Object.values(row).some((v) => v.trim()))
      .map((row, idx) => ({
        '№': idx + 1,
        ...row,
      }));

    exportToExcel(data, 'Раскрой_листов', 'Раскрой');
  };

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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Раскрой листов</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReport(!showReport)}>
            <Icon name="FileText" size={20} className="mr-2" />
            {showReport ? 'Таблица' : 'Оптимизация'}
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
          <Button onClick={handleExport}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {!showReport ? (
        <Card>
          <CardContent className="p-4 overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border p-2 sticky left-0 bg-blue-50 z-10 w-12">#</th>
                    {COLUMNS.map((col) => (
                      <th key={col} className="border p-2 font-semibold text-sm whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50">
                      <td className="border p-1 text-center text-xs text-muted-foreground sticky left-0 bg-white">
                        {rowIndex + 1}
                      </td>
                      {COLUMNS.map((col) => (
                        <td key={col} className="border p-1">
                          <Input
                            value={row[col]}
                            onChange={(e) => updateCell(rowIndex, col, e.target.value)}
                            className="h-8 text-sm"
                            placeholder="-"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройка размеров листов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <Input
                  placeholder="Ширина (мм)"
                  type="number"
                  value={newSheet.width}
                  onChange={(e) => setNewSheet({ ...newSheet, width: e.target.value })}
                />
                <Input
                  placeholder="Высота (мм)"
                  type="number"
                  value={newSheet.height}
                  onChange={(e) => setNewSheet({ ...newSheet, height: e.target.value })}
                />
                <Input
                  placeholder="Название"
                  value={newSheet.name}
                  onChange={(e) => setNewSheet({ ...newSheet, name: e.target.value })}
                />
                <Button onClick={addSheet}>
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sheets.map((sheet, idx) => (
                  <Badge key={idx} variant="secondary" className="px-3 py-2">
                    {sheet.name} ({sheet.width}×{sheet.height} мм)
                    <button
                      onClick={() => removeSheet(idx)}
                      className="ml-2 hover:text-red-600"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {optimization && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Результаты оптимизации</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="border-2 border-blue-500 rounded-lg p-6 text-center">
                      <div className="text-sm text-muted-foreground mb-2">Всего листов</div>
                      <div className="text-4xl font-bold text-blue-600">
                        {optimization.totalSheets}
                      </div>
                    </div>
                    <div className="border-2 border-green-500 rounded-lg p-6 text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        Средняя эффективность
                      </div>
                      <div className="text-4xl font-bold text-green-600">
                        {optimization.totalEfficiency.toFixed(1)}%
                      </div>
                    </div>
                    <div className="border-2 border-orange-500 rounded-lg p-6 text-center">
                      <div className="text-sm text-muted-foreground mb-2">
                        Не размещено деталей
                      </div>
                      <div className="text-4xl font-bold text-orange-600">
                        {optimization.unplacedDetails.length}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-semibold mb-3">Требуемые листы по типам:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {getSheetsByType(optimization.sheets).map(([name, count]) => (
                        <div key={name} className="border rounded-lg p-4 flex justify-between items-center">
                          <span className="font-medium">{name}</span>
                          <Badge className="bg-blue-500 text-white">{count} шт</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {optimization.unplacedDetails.length > 0 && (
                    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                        <Icon name="AlertTriangle" size={20} />
                        Детали не помещаются ни на один лист:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {optimization.unplacedDetails.map((d, idx) => (
                          <Badge key={idx} variant="secondary">
                            {d.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Карты раскроя листов</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {optimization.sheets.map((sheet, idx) => (
                      <div key={idx} className="border-2 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-semibold">
                            Лист #{idx + 1} - {sheet.sheet.name}
                          </h4>
                          <Badge
                            className={
                              sheet.efficiency >= 80
                                ? 'bg-green-500'
                                : sheet.efficiency >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }
                          >
                            {sheet.efficiency.toFixed(1)}%
                          </Badge>
                        </div>

                        <div className="relative bg-gray-50 border-2 border-gray-300 rounded mb-3"
                             style={{
                               height: '300px',
                               width: '100%'
                             }}>
                          <div className="absolute inset-0 p-2">
                            {sheet.placedDetails.map((pd, pdIdx) => {
                              const detailWidth = pd.rotated ? pd.detail.height : pd.detail.width;
                              const detailHeight = pd.rotated ? pd.detail.width : pd.detail.height;
                              
                              const scaleX = (280 / sheet.sheet.width);
                              const scaleY = (280 / sheet.sheet.height);
                              const scale = Math.min(scaleX, scaleY);

                              return (
                                <div
                                  key={pdIdx}
                                  className="absolute border-2 border-blue-500 bg-blue-100 flex items-center justify-center text-xs font-medium overflow-hidden"
                                  style={{
                                    left: `${pd.x * scale}px`,
                                    top: `${pd.y * scale}px`,
                                    width: `${detailWidth * scale}px`,
                                    height: `${detailHeight * scale}px`,
                                  }}
                                  title={`${pd.detail.name}${pd.rotated ? ' (повернуто)' : ''}`}
                                >
                                  <span className="truncate px-1">
                                    {pd.detail.name}
                                    {pd.rotated && ' ↻'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Деталей на листе:</span>
                            <span className="font-medium">{sheet.placedDetails.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Отходы:</span>
                            <span className="font-medium">
                              {(sheet.wasteArea / 1000000).toFixed(2)} м²
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Список деталей</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-3 font-semibold">Деталь</th>
                          <th className="text-center p-3 font-semibold">Размер</th>
                          <th className="text-center p-3 font-semibold">Количество</th>
                          <th className="text-center p-3 font-semibold">Площадь</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedDetails.map((detail, index) => (
                          <tr key={index} className="border-b hover:bg-gray-50">
                            <td className="p-3 font-medium">{detail.name}</td>
                            <td className="p-3 text-center">
                              {detail.width}×{detail.height} мм
                            </td>
                            <td className="p-3 text-center">
                              <Badge variant="secondary">{detail.quantity}</Badge>
                            </td>
                            <td className="p-3 text-center">
                              {((detail.width * detail.height * detail.quantity) / 1000000).toFixed(2)} м²
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {!optimization && parsedDetails.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Icon name="Scissors" size={64} className="mx-auto mb-4 opacity-20" />
                <p className="mb-2">Заполните таблицу деталями в формате:</p>
                <p className="font-mono text-sm">
                  1500x3000, 2000×1250, 800x600 и т.д.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
