import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function ExportImportTab() {
  const { toast } = useToast();

  const handleExportSettings = () => {
    const addresses = localStorage.getItem('server_addresses');
    if (!addresses) {
      toast({
        title: 'Нет данных',
        description: 'Нет настроек для экспорта',
        variant: 'destructive',
      });
      return;
    }

    const blob = new Blob([addresses], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `server-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Экспорт выполнен',
      description: 'Настройки сохранены в файл',
    });
  };

  const handleImportSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid format');
        }

        localStorage.setItem('server_addresses', content);
        window.dispatchEvent(new CustomEvent('server-config-updated', { 
          detail: { addresses: data } 
        }));

        toast({
          title: 'Импорт выполнен',
          description: 'Настройки успешно загружены',
        });
      } catch {
        toast({
          title: 'Ошибка',
          description: 'Неверный формат файла',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Экспорт настроек</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Сохраните текущие настройки сервера в файл для резервного копирования или переноса
        </p>
        <Button onClick={handleExportSettings} variant="outline">
          <Icon name="Download" size={18} className="mr-2" />
          Экспортировать настройки
        </Button>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-2">Импорт настроек</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Загрузите ранее сохраненный файл настроек
        </p>
        <div>
          <Label htmlFor="import-file" className="cursor-pointer">
            <Button variant="outline" asChild>
              <span>
                <Icon name="Upload" size={18} className="mr-2" />
                Выбрать файл
              </span>
            </Button>
          </Label>
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={handleImportSettings}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}
