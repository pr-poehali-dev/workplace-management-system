import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';

interface CuttingRow {
  [key: string]: string;
}

const COLUMNS = ['Литер', 'БС', 'Этаж', '1 кв', '2 кв', '3 кв', '4 кв', '5 кв', '6 кв', '7 кв', '8 кв', '9 кв', '10 кв'];

export default function CuttingPage({ user }: { user: User }) {
  const [rows, setRows] = useState<CuttingRow[]>(
    Array(20).fill(null).map(() => 
      COLUMNS.reduce((acc, col) => ({ ...acc, [col]: '' }), {})
    )
  );
  const [showReport, setShowReport] = useState(false);
  const { toast } = useToast();

  const updateCell = (rowIndex: number, column: string, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex][column] = value;
    setRows(newRows);
  };

  const detailsReport = useMemo(() => {
    const detailsColumns = COLUMNS.slice(3);
    const detailsMap = new Map<string, number>();

    rows.forEach(row => {
      detailsColumns.forEach(col => {
        const value = row[col]?.trim();
        if (value) {
          detailsMap.set(value, (detailsMap.get(value) || 0) + 1);
        }
      });
    });

    return Array.from(detailsMap.entries())
      .map(([detail, count]) => ({ detail, required: count, completed: 0, remaining: count }))
      .sort((a, b) => b.required - a.required);
  }, [rows]);

  const handleExport = () => {
    toast({
      title: 'Экспорт',
      description: 'Функция экспорта в PDF в разработке',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Раскрой листов</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowReport(!showReport)}>
            <Icon name="FileText" size={20} className="mr-2" />
            {showReport ? 'Таблица' : 'Отчет'}
          </Button>
          <Button onClick={handleExport}>
            <Icon name="Download" size={20} className="mr-2" />
            Экспорт PDF
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
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Отчет по деталям</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold">Деталь</th>
                      <th className="text-center p-3 font-semibold">Требуется</th>
                      <th className="text-center p-3 font-semibold">Сделано</th>
                      <th className="text-center p-3 font-semibold">Осталось</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsReport.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.detail}</td>
                        <td className="p-3 text-center">
                          <Badge variant="secondary">{item.required}</Badge>
                        </td>
                        <td className="p-3 text-center">
                          <Input
                            type="number"
                            className="w-20 h-8 mx-auto text-center"
                            defaultValue={0}
                            max={item.required}
                          />
                        </td>
                        <td className="p-3 text-center">
                          <Badge className="bg-blue-500">{item.remaining}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Оптимизация раскроя</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Лист 1500×3000 мм</div>
                  <div className="text-3xl font-bold text-blue-600">0</div>
                  <div className="text-sm text-muted-foreground mt-1">листов</div>
                </div>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <div className="text-sm text-muted-foreground mb-2">Лист 2000×3000 мм</div>
                  <div className="text-3xl font-bold text-green-600">0</div>
                  <div className="text-sm text-muted-foreground mt-1">листов</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Алгоритм оптимизации раскроя в разработке
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
