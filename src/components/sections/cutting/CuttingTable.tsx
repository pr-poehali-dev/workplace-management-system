import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface CuttingRow {
  [key: string]: string;
}

interface CuttingTableProps {
  rows: CuttingRow[];
  columns: string[];
  onUpdateCell: (rowIndex: number, column: string, value: string) => void;
}

export default function CuttingTable({ rows, columns, onUpdateCell }: CuttingTableProps) {
  const visibleRows = rows.filter((row) => 
    Object.values(row).some((val) => val && val.trim() !== '')
  );

  const rowsToShow = visibleRows.length > 0 
    ? [...visibleRows, ...Array(5).fill(null).map(() => 
        columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {})
      )]
    : rows.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Таблица раскроя деталей</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="p-2 text-left font-semibold bg-slate-50 sticky left-0 z-10 w-12">№</th>
                {columns.map((col) => (
                  <th key={col} className="p-2 text-left font-semibold bg-slate-50 min-w-[120px]">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rowsToShow.map((row, displayIndex) => {
                const actualRowIndex = visibleRows.length > 0 && displayIndex < visibleRows.length 
                  ? rows.indexOf(visibleRows[displayIndex])
                  : rows.findIndex((r, idx) => idx >= visibleRows.length && 
                      Object.values(r).every((v) => !v || v.trim() === ''));
                
                const rowIndex = actualRowIndex >= 0 ? actualRowIndex : displayIndex;
                
                return (
                  <tr key={rowIndex} className="border-b hover:bg-slate-50">
                    <td className="p-2 text-sm text-muted-foreground sticky left-0 bg-white z-10">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="p-1">
                        <Input
                          value={row[col] || ''}
                          onChange={(e) => onUpdateCell(rowIndex, col, e.target.value)}
                          className="h-8 text-sm"
                          placeholder={col === 'Литер' ? 'A' : col === 'БС' ? '1' : col === 'Этаж' ? '1' : '1500x3000'}
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}