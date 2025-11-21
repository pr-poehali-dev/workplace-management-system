import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { getApiUrl } from '@/utils/updateApiUrls';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const savedCreds = localStorage.getItem('admin_credentials');
      const adminCreds = savedCreds ? JSON.parse(savedCreds) : { username: 'admin', password: 'admin123' };

      if (username === adminCreds.username && password === adminCreds.password) {
        onLogin({
          id: '0',
          username: adminCreds.username,
          fullName: 'Администратор',
          role: 'admin',
        });
        toast({
          title: 'Вход выполнен',
          description: 'Добро пожаловать, Администратор!',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`${getApiUrl('AUTH')}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const user = await response.json();
        
        if (user.username === 'admin' || user.role === 'admin') {
          toast({
            title: 'Доступ запрещен',
            description: 'Используйте локальные учетные данные администратора',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        onLogin({
          id: user.id.toString(),
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        });
        toast({
          title: 'Вход выполнен',
          description: `Добро пожаловать, ${user.full_name}!`,
        });
      } else {
        toast({
          title: 'Ошибка входа',
          description: 'Неверный логин или пароль',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось подключиться к серверу',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl animate-fade-in">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Icon name="Factory" size={32} className="text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Система управления производством</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Логин</Label>
              <Input
                id="username"
                type="text"
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              <Icon name="LogIn" size={20} className="mr-2" />
              {loading ? 'Вход...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}