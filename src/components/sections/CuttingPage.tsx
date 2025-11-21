import { useState, useMemo, useEffect } from 'react';
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
} from '@/utils/cuttingOptimizer';
import CuttingTable from './cutting/CuttingTable';
import CuttingOptimizationReport from './cutting/CuttingOptimizationReport';
import CuttingProjectManager from './cutting/CuttingProjectManager';

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

  const currentProject = projects.find((p) => p.id === currentProjectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-bold">Раскрой листов</h2>
          {currentProject && (
            <Badge variant="outline" className="text-sm">
              <Icon name="FileCheck" size={14} className="mr-1" />
              {currentProject.name}
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
          <Button variant="outline" onClick={handleExport}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
          <Button onClick={() => setShowReport(!showReport)}>
            <Icon name="Calculator" size={20} className="mr-2" />
            {showReport ? 'Скрыть' : 'Показать'} расчёт
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Настройка размеров листов</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {sheets.map((sheet, idx) => (
                <Badge key={idx} variant="secondary" className="text-sm">
                  {sheet.name}
                  <button
                    onClick={() => removeSheet(idx)}
                    className="ml-2 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Название</Label>
                <Input
                  placeholder="Лист 1500x3000"
                  value={newSheet.name}
                  onChange={(e) => setNewSheet({ ...newSheet, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Ширина (мм)</Label>
                <Input
                  type="number"
                  placeholder="1500"
                  value={newSheet.width}
                  onChange={(e) => setNewSheet({ ...newSheet, width: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Высота (мм)</Label>
                <Input
                  type="number"
                  placeholder="3000"
                  value={newSheet.height}
                  onChange={(e) => setNewSheet({ ...newSheet, height: e.target.value })}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={addSheet} className="w-full">
                  <Icon name="Plus" size={18} className="mr-2" />
                  Добавить
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <CuttingTable rows={rows} columns={COLUMNS} onUpdateCell={updateCell} />

      {detailsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Уникальные детали</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {detailsData.map((item, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded text-sm">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-muted-foreground">Кол-во: {item.quantity}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {showReport && <CuttingOptimizationReport optimization={optimization} />}

      <CuttingProjectManager
        showSaveDialog={showSaveDialog}
        showLoadDialog={showLoadDialog}
        projects={projects}
        saveFormData={saveFormData}
        onSaveFormChange={setSaveFormData}
        onSave={handleSaveProject}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
        onCloseSave={() => setShowSaveDialog(false)}
        onCloseLoad={() => setShowLoadDialog(false)}
      />
    </div>
  );
}
