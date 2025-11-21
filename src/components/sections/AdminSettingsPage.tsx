import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [apiBaseUrl, setApiBaseUrl] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [currentApiUrl, setCurrentApiUrl] = useState('');
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

  const handleChangeCredentials = () => {
    if (!currentPassword) {
      toast({
        title: 'Ошибка',
        description: 'Введите текущий пароль',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: 'Ошибка',
        description: 'Пароли не совпадают',
        variant: 'destructive',
      });
      return;
    }

    const savedCreds = localStorage.getItem('admin_credentials');
    const currentCreds = savedCreds ? JSON.parse(savedCreds) : { username: 'admin', password: 'admin123' };

    if (currentPassword !== currentCreds.password) {
      toast({
        title: 'Ошибка',
        description: 'Неверный текущий пароль',
        variant: 'destructive',
      });
      return;
    }

    const updatedCreds = {
      username: newUsername || currentCreds.username,
      password: newPassword || currentCreds.password,
    };

    localStorage.setItem('admin_credentials', JSON.stringify(updatedCreds));

    setCurrentPassword('');
    setNewUsername('');
    setNewPassword('');
    setConfirmPassword('');

    toast({
      title: 'Успешно',
      description: 'Данные администратора обновлены',
    });
  };

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Shield" size={24} />
            Администрирование
          </CardTitle>
          <CardDescription>
            Управление учетными данными, настройками VPS и экспорт/импорт
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="credentials">Учетные данные</TabsTrigger>
              <TabsTrigger value="vps">Настройки VPS</TabsTrigger>
              <TabsTrigger value="export">Экспорт/Импорт</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Смена учетных данных</h3>
            
            <div>
              <Label htmlFor="current-password">Текущий пароль</Label>
              <Input
                id="current-password"
                type={showPasswords ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Введите текущий пароль"
              />
            </div>

            <div>
              <Label htmlFor="new-username">Новый логин (опционально)</Label>
              <Input
                id="new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>

            <div>
              <Label htmlFor="new-password">Новый пароль (опционально)</Label>
              <Input
                id="new-password"
                type={showPasswords ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Оставьте пустым, чтобы не менять"
              />
            </div>

            <div>
              <Label htmlFor="confirm-password">Подтвердите новый пароль</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Повторите новый пароль"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="show-passwords"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="show-passwords" className="cursor-pointer">
                Показать пароли
              </Label>
            </div>

            <Button onClick={handleChangeCredentials} className="w-full">
              <Icon name="Key" size={16} className="mr-2" />
              Изменить данные
            </Button>
          </div>
            </TabsContent>

            <TabsContent value="vps" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Настройки для VPS</h3>
                <p className="text-sm text-muted-foreground">
                  Настройте подключение к серверу при развертывании на VPS. Система автоматически применит изменения ко всем компонентам.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="Info" size={20} className="text-blue-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900">Текущий адрес сайта:</p>
                      <p className="text-blue-700 font-mono">{currentApiUrl}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="api-url">Адрес API сервера</Label>
                  <div className="flex gap-2">
                    <Input
                      id="api-url"
                      type="text"
                      value={apiBaseUrl}
                      onChange={(e) => setApiBaseUrl(e.target.value)}
                      placeholder="http://your-server.com:3000"
                    />
                    <Button onClick={handleAutoDetect} variant="outline">
                      <Icon name="Radar" size={16} className="mr-2" />
                      Авто
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Укажите полный URL вашего API сервера (с протоколом и портом)
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Строка подключения к PostgreSQL базе данных
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Icon name="AlertCircle" size={20} className="text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">Что произойдет после сохранения:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Все API запросы будут перенаправлены на новый адрес</li>
                        <li>Изменения применятся автоматически без перезагрузки</li>
                        <li>Настройки сохранятся в localStorage браузера</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveVpsConfig} className="w-full">
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить и применить настройки
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Экспорт / Импорт настроек</h3>
                
                <div className="flex gap-2">
                  <Button onClick={handleExportSettings} variant="outline" className="flex-1">
                    <Icon name="Download" size={16} className="mr-2" />
                    Экспортировать
                  </Button>
                  
                  <Button variant="outline" className="flex-1" asChild>
                    <label className="cursor-pointer">
                      <Icon name="Upload" size={16} className="mr-2" />
                      Импортировать
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportSettings}
                        className="hidden"
                      />
                    </label>
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}