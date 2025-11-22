import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { exportToExcel, printTable } from '@/utils/exportUtils';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: string;
  fullName: string;
  username: string;
  password?: string;
  role: 'admin' | 'manager' | 'employee';
}

export default function PersonnelPage({ user }: { user: User }) {
  const [employees, setEmployees] = useState<Employee[]>([
    { id: '2', fullName: 'Начальник Иван', username: 'manager1', password: 'manager123', role: 'manager' },
    { id: '3', fullName: 'Сотрудник Петр', username: 'employee1', password: 'employee123', role: 'employee' },
  ]);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('employees_data', JSON.stringify(employees));
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [employees]);

  useEffect(() => {
    const savedData = localStorage.getItem('employees_data');
    if (savedData) {
      try {
        setEmployees(JSON.parse(savedData));
      } catch (e) {
        console.error('Ошибка загрузки данных персонала');
      }
    }
  }, []);
  const [showDialog, setShowDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    password: '',
    role: 'employee' as 'admin' | 'manager' | 'employee',
  });
  const { toast } = useToast();

  const canManage = user.role === 'admin' || user.role === 'manager';

  const getRoleBadge = (role: string) => {
    const variants = {
      manager: 'bg-blue-500 text-white',
      employee: 'bg-green-500 text-white',
    };
    const labels = {
      manager: 'Начальник',
      employee: 'Сотрудник',
    };
    return <Badge className={variants[role as keyof typeof variants]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  const allEmployees = employees.filter(e => e.role !== 'admin');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Персонал</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            allEmployees.map(e => ({
              'ФИО': e.fullName,
              'Логин': e.username,
              'Роль': e.role === 'admin' ? 'Руководитель' : e.role === 'manager' ? 'Начальник' : 'Сотрудник'
            })),
            'Персонал',
            'Персонал'
          )}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
          {canManage && (
            <Button onClick={() => {
              setEditingEmployee(null);
              setFormData({ fullName: '', username: '', password: '', role: 'employee' });
              setShowDialog(true);
            }}>
              <Icon name="Plus" size={20} className="mr-2" />
              Добавить сотрудника
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {allEmployees.map((employee) => (
          <Card key={employee.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
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
                    <>
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingEmployee(employee);
                        setFormData({
                          fullName: employee.fullName,
                          username: employee.username,
                          password: '',
                          role: employee.role,
                        });
                        setShowDialog(true);
                      }}>
                        <Icon name="Edit" size={16} className="mr-1" />
                        Изменить
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                        if (confirm(`Удалить сотрудника ${employee.fullName}?`)) {
                          setEmployees(employees.filter(e => e.id !== employee.id));
                          toast({
                            title: 'Успешно',
                            description: 'Сотрудник удален',
                          });
                        }
                      }}>
                        <Icon name="Trash2" size={18} />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              {user.role === 'admin' && employee.password && (
                <div className="flex items-center gap-2 mt-2 pt-3 border-t">
                  <Label className="text-sm text-muted-foreground min-w-[60px]">Пароль:</Label>
                  <div className="relative flex-1">
                    <Input
                      type={showPasswords[employee.id] ? 'text' : 'password'}
                      value={employee.password}
                      readOnly
                      className="pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [employee.id]: !prev[employee.id] }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Icon name={showPasswords[employee.id] ? 'EyeOff' : 'Eye'} size={16} />
                    </button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingEmployee ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="space-y-2">
              <Label>Логин</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="ivanov"
              />
            </div>
            <div className="space-y-2">
              <Label>Пароль {editingEmployee && '(оставьте пустым, чтобы не менять)'}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={editingEmployee ? 'Оставьте пустым' : 'Введите пароль'}
              />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'admin' | 'manager' | 'employee') => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Сотрудник</SelectItem>
                  <SelectItem value="manager">Начальник</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
            <Button onClick={() => {
              if (!formData.fullName || !formData.username) {
                toast({
                  title: 'Ошибка',
                  description: 'Заполните все обязательные поля',
                  variant: 'destructive',
                });
                return;
              }
              if (!editingEmployee && !formData.password) {
                toast({
                  title: 'Ошибка',
                  description: 'Укажите пароль для нового сотрудника',
                  variant: 'destructive',
                });
                return;
              }

              if (editingEmployee) {
                const updatedData = {
                  ...editingEmployee,
                  fullName: formData.fullName,
                  username: formData.username,
                  role: formData.role,
                };
                if (formData.password) {
                  updatedData.password = formData.password;
                }
                setEmployees(employees.map(e => 
                  e.id === editingEmployee.id ? updatedData : e
                ));
                toast({
                  title: 'Успешно',
                  description: 'Сотрудник обновлен',
                });
              } else {
                setEmployees([...employees, {
                  id: Date.now().toString(),
                  fullName: formData.fullName,
                  username: formData.username,
                  password: formData.password,
                  role: formData.role,
                }]);
                toast({
                  title: 'Успешно',
                  description: 'Сотрудник создан',
                });
              }
              setShowDialog(false);
            }}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}