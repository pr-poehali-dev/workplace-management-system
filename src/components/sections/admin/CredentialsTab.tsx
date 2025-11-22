import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

export default function CredentialsTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const { toast } = useToast();

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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Смена учетных данных</h3>
      
      <div>
        <Label htmlFor="current-password">Текущий пароль</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showCurrentPassword ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Введите текущий пароль"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Icon name={showCurrentPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>
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
        <div className="relative">
          <Input
            id="new-password"
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Оставьте пустым, чтобы не менять"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Icon name={showNewPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>
      </div>

      <div>
        <Label htmlFor="confirm-password">Подтвердите новый пароль</Label>
        <div className="relative">
          <Input
            id="confirm-password"
            type={showNewPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Повторите новый пароль"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <Icon name={showNewPassword ? 'EyeOff' : 'Eye'} size={18} />
          </button>
        </div>
      </div>

      <Button onClick={handleChangeCredentials} className="w-full">
        <Icon name="Save" size={18} className="mr-2" />
        Сохранить изменения
      </Button>
    </div>
  );
}
