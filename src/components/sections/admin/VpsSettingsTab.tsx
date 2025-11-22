import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function VpsSettingsTab() {
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [testingConnection, setTestingConnection] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedConfig = localStorage.getItem('vps_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setApiBaseUrl(config.apiBaseUrl || '');
      setDatabaseUrl(config.databaseUrl || '');
    }
    setCurrentApiUrl(window.location.origin);
  }, []);

  const handleSaveVpsConfig = () => {
    const config = {
      apiBaseUrl: apiBaseUrl || currentApiUrl,
      databaseUrl: databaseUrl,
    };

    localStorage.setItem('vps_config', JSON.stringify(config));

    window.dispatchEvent(new CustomEvent('vps-config-updated', { 
      detail: config 
    }));

    toast({
      title: 'Успешно',
      description: 'Настройки VPS сохранены и применены',
    });
  };

  const handleAutoDetect = () => {
    const detectedUrl = window.location.origin;
    setApiBaseUrl(detectedUrl);
    
    toast({
      title: 'Автоопределение',
      description: `Обнаружен адрес: ${detectedUrl}`,
    });
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    const testUrl = apiBaseUrl || currentApiUrl;
    
    try {
      const response = await fetch(`${testUrl}/api/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        toast({
          title: 'Соединение успешно',
          description: `Сервер ${testUrl} отвечает`,
        });
      } else {
        toast({
          title: 'Сервер недоступен',
          description: `HTTP ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка подключения',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="api-url">API Base URL</Label>
        <div className="flex gap-2">
          <Input
            id="api-url"
            type="text"
            value={apiBaseUrl}
            onChange={(e) => setApiBaseUrl(e.target.value)}
            placeholder={currentApiUrl}
          />
          <Button variant="outline" onClick={handleAutoDetect}>
            <Icon name="Scan" size={18} className="mr-2" />
            Авто
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Текущий адрес: {currentApiUrl}
        </p>
      </div>

      <div>
        <Label htmlFor="db-url">Database URL (опционально)</Label>
        <Input
          id="db-url"
          type="text"
          value={databaseUrl}
          onChange={(e) => setDatabaseUrl(e.target.value)}
          placeholder="postgresql://user:pass@host:5432/db"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={handleTestConnection} variant="outline" disabled={testingConnection}>
          <Icon name={testingConnection ? 'Loader2' : 'Wifi'} size={18} className={`mr-2 ${testingConnection ? 'animate-spin' : ''}`} />
          {testingConnection ? 'Проверка...' : 'Проверить соединение'}
        </Button>
        <Button onClick={handleSaveVpsConfig}>
          <Icon name="Save" size={18} className="mr-2" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  );
}
