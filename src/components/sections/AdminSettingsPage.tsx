import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function AdminSettingsPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
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
    const currentCreds = savedCreds ? JSON.parse(savedCreds) : { username: 'adminik', password: 'admin' };

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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Shield" size={24} />
            Администрирование
          </CardTitle>
          <CardDescription>
            Управление учетными данными и экспорт/импорт настроек
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="border-t pt-6 space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
