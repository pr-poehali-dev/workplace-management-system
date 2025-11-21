import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

interface CuttingProject {
  id: number;
  name: string;
  description?: string;
  sheets_data: CuttingRow[];
  optimization_data?: any;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

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
  const [projects, setProjects] = useState<CuttingProject[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const [saveFormData, setSaveFormData] = useState({ name: '', description: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${API_URL}/cutting-projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects');
    }
  };

  const handleSaveProject = async () => {
    if (!saveFormData.name) {
      toast({
        title: 'Ошибка',
        description: 'Введите название проекта',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = currentProjectId
        ? `${API_URL}/cutting-projects`
        : `${API_URL}/cutting-projects`;
      const method = currentProjectId ? 'PUT' : 'POST';

      const body: any = {
        name: saveFormData.name,
        description: saveFormData.description,
        sheets_data: rows,
        optimization_data: optimization,
        created_by: parseInt(user.id),
      };

      if (currentProjectId) {
        body.id = currentProjectId;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const result = await response.json();
        if (!currentProjectId) {
          setCurrentProjectId(result.id);
        }
        await fetchProjects();
        setShowSaveDialog(false);
        setSaveFormData({ name: '', description: '' });
        toast({
          title: 'Сохранено',
          description: 'Проект успешно сохранен',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить проект',
        variant: 'destructive',
      });
    }
  };

  const handleLoadProject = (project: CuttingProject) => {
    setRows(project.sheets_data);
    setCurrentProjectId(project.id);
    setSaveFormData({ name: project.name, description: project.description || '' });
    setShowLoadDialog(false);
    toast({
      title: 'Загружено',
      description: `Проект "${project.name}" загружен`,
    });
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm('Удалить проект?')) return;

    try {
      const response = await fetch(`${API_URL}/cutting-projects?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchProjects();
        if (currentProjectId === id) {
          setCurrentProjectId(null);
        }
        toast({
          title: 'Удалено',
          description: 'Проект удален',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить проект',
        variant: 'destructive',
      });
    }
  };

  const handleNewProject = () => {
    setRows(
      Array(100).fill(null).map(() =>
        COLUMNS.reduce((acc, col) => ({ ...acc, [col]: '' }), {})
      )
    );
    setCurrentProjectId(null);
    setSaveFormData({ name: '', description: '' });
    toast({
      title: 'Новый проект',
      description: 'Создан новый проект раскроя',
    });
  };

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
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Раскрой листов</h2>
          {currentProjectId && (
            <Badge className="bg-blue-500 text-white">
              {saveFormData.name || `Проект #${currentProjectId}`}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleNewProject}>
            <Icon name="FilePlus" size={20} className="mr-2" />
            Новый
          </Button>
          <Button variant="outline" onClick={() => setShowLoadDialog(true)}>
            <Icon name="FolderOpen" size={20} className="mr-2" />
            Загрузить
          </Button>
          <Button variant="outline" onClick={() => setShowSaveDialog(true)}>
            <Icon name="Save" size={20} className="mr-2" />
            Сохранить
          </Button>
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

      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{currentProjectId ? 'Обновить проект' : 'Сохранить проект'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Название проекта *</Label>
              <Input
                placeholder="Раскрой для объекта А"
                value={saveFormData.name}
                onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                placeholder="Дополнительная информация о проекте"
                value={saveFormData.description}
                onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveProject}>
              {currentProjectId ? 'Обновить' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Загрузить проект</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {projects.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Icon name="FolderOpen" size={48} className="mx-auto mb-2 opacity-20" />
                <p>Нет сохраненных проектов</p>
              </div>
            ) : (
              projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{project.name}</h4>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-2">{project.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>Создал: {project.created_by_name}</span>
                          <span>Обновлено: {new Date(project.updated_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLoadProject(project)}
                        >
                          <Icon name="Download" size={16} className="mr-1" />
                          Загрузить
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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