import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  role: 'admin' | 'manager' | 'employee';
}

export default function PersonnelPage({ user }: { user: User }) {
  const [employees] = useState<Employee[]>([
    { id: '2', fullName: 'Начальник Иван', username: 'manager1', role: 'manager' },
    { id: '3', fullName: 'Сотрудник Петр', username: 'employee1', role: 'employee' },
  ]);

  const canManage = user.role === 'admin' || user.role === 'manager';

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: 'bg-red-500 text-white',
      manager: 'bg-blue-500 text-white',
      employee: 'bg-green-500 text-white',
    };
    const labels = {
      admin: 'Руководитель',
      manager: 'Начальник',
      employee: 'Сотрудник',
    };
    return <Badge className={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Персонал</h2>
        {canManage && (
          <Button>
            <Icon name="Plus" size={20} className="mr-2" />
            Добавить сотрудника
          </Button>
        )}
      </div>

      <div className="grid gap-4">
        {user.role === 'admin' && (
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Icon name="Shield" size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Администратор</h3>
                  <p className="text-sm text-muted-foreground">admin</p>
                </div>
              </div>
              {getRoleBadge('admin')}
            </CardContent>
          </Card>
        )}
        
        {employees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Icon name="User" size={24} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{employee.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{employee.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getRoleBadge(employee.role)}
                {canManage && (
                  <Button variant="ghost" size="sm">
                    <Icon name="Trash2" size={18} />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
