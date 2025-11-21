import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface CuttingProject {
  id: number;
  name: string;
  description?: string;
  sheets_data: any[];
  optimization_data?: any;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

interface CuttingProjectManagerProps {
  showSaveDialog: boolean;
  showLoadDialog: boolean;
  projects: CuttingProject[];
  saveFormData: { name: string; description: string };
  onSaveFormChange: (data: { name: string; description: string }) => void;
  onSave: () => void;
  onLoad: (project: CuttingProject) => void;
  onDelete: (id: number) => void;
  onCloseSave: () => void;
  onCloseLoad: () => void;
}

export default function CuttingProjectManager({
  showSaveDialog,
  showLoadDialog,
  projects,
  saveFormData,
  onSaveFormChange,
  onSave,
  onLoad,
  onDelete,
  onCloseSave,
  onCloseLoad,
}: CuttingProjectManagerProps) {
  return (
    <>
      <Dialog open={showSaveDialog} onOpenChange={onCloseSave}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Сохранить проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Название проекта *</Label>
              <Input
                value={saveFormData.name}
                onChange={(e) => onSaveFormChange({ ...saveFormData, name: e.target.value })}
                placeholder="Например: Жилой комплекс А1"
              />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Textarea
                value={saveFormData.description}
                onChange={(e) => onSaveFormChange({ ...saveFormData, description: e.target.value })}
                placeholder="Дополнительная информация о проекте"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseSave}>
              Отмена
            </Button>
            <Button onClick={onSave}>
              <Icon name="Save" size={18} className="mr-2" />
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showLoadDialog} onOpenChange={onCloseLoad}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Загрузить проект</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto py-4">
            {projects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Нет сохраненных проектов</p>
            ) : (
              projects.map((project) => (
                <div
                  key={project.id}
                  className="flex items-start justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1 cursor-pointer" onClick={() => onLoad(project)}>
                    <h4 className="font-semibold">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Автор: {project.created_by_name}</span>
                      <span>Изменен: {new Date(project.updated_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(project.id);
                    }}
                  >
                    <Icon name="Trash2" size={18} />
                  </Button>
                </div>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseLoad}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
