import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

const USERS = [
  { id: '1', username: 'admin', password: 'adminik', fullName: 'Администратор', role: 'admin' as const },
  { id: '2', username: 'manager1', password: 'manager', fullName: 'Начальник Иван', role: 'manager' as const },
  { id: '3', username: 'employee1', password: 'employee', fullName: 'Сотрудник Петр', role: 'employee' as const },
];

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = USERS.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
      toast({
        title: 'Вход выполнен',
        description: `Добро пожаловать, ${user.fullName}!`,
      });
    } else {
      toast({
        title: 'Ошибка входа',
        description: 'Неверный логин или пароль',
        variant: 'destructive',
      });
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
          <p className="text-muted-foreground">Введите данные для входа</p>
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
            <Button type="submit" className="w-full" size="lg">
              <Icon name="LogIn" size={20} className="mr-2" />
              Войти
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
