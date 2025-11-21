import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  material: string;
  size?: string;
  color?: string;
  quantity: number;
  unit: string;
  status: 'new' | 'in_progress' | 'completed';
  completed: number;
  createdBy: string;
  createdAt: Date;
}

export default function OrdersPage({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([
    { id: '1', material: 'Профиль ПВХ', size: '6м', color: 'Белый', quantity: 100, unit: 'шт', status: 'new', completed: 0, createdBy: 'Администратор', createdAt: new Date() },
    { id: '2', material: 'Стеклопакет', size: '1500x1000', color: 'Прозрачный', quantity: 50, unit: 'шт', status: 'in_progress', completed: 30, createdBy: 'Начальник Иван', createdAt: new Date() },
    { id: '3', material: 'Фурнитура', color: 'Хром', quantity: 200, unit: 'шт', status: 'completed', completed: 200, createdBy: 'Начальник Иван', createdAt: new Date() },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  const canEdit = user.role === 'admin' || user.role === 'manager';

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'bg-red-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'new': return 'Новое';
      case 'in_progress': return 'Выполняется';
      case 'completed': return 'Готово';
    }
  };

  const handleUpdateCompleted = (orderId: string, completed: number) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const newCompleted = completed;
        let newStatus = order.status;
        
        if (newCompleted > 0 && newCompleted < order.quantity) {
          newStatus = 'in_progress';
        } else if (newCompleted >= order.quantity) {
          newStatus = 'completed';
        }
        
        return { ...order, completed: newCompleted, status: newStatus };
      }
      return order;
    }));
    
    toast({
      title: 'Обновлено',
      description: 'Количество готовой продукции обновлено',
    });
  };

  const handleDelete = (orderId: string) => {
    setOrders(orders.filter(o => o.id !== orderId));
    toast({
      title: 'Удалено',
      description: 'Заявка удалена',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Заявки</h2>
        {canEdit && (
          <Button onClick={() => setShowForm(!showForm)}>
            <Icon name="Plus" size={20} className="mr-2" />
            Создать заявку
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новая заявка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Материал</Label>
                <Input placeholder="Выберите из базы материалов" />
              </div>
              <div className="space-y-2">
                <Label>Размер (необязательно)</Label>
                <Input placeholder="Например: 1500x1000" />
              </div>
              <div className="space-y-2">
                <Label>Цвет (необязательно)</Label>
                <Input placeholder="Выберите из каталога цветов" />
              </div>
              <div className="space-y-2">
                <Label>Количество</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="0" />
                  <Select defaultValue="шт">
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="шт">шт</SelectItem>
                      <SelectItem value="м">м</SelectItem>
                      <SelectItem value="кг">кг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button>Создать</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {orders.map((order) => (
          <Card key={order.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getStatusColor(order.status)} text-white`}>
                      {getStatusLabel(order.status)}
                    </Badge>
                    <h3 className="text-xl font-semibold">{order.material}</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {order.size && (
                      <div>
                        <span className="text-muted-foreground">Размер:</span>
                        <p className="font-medium">{order.size}</p>
                      </div>
                    )}
                    {order.color && (
                      <div>
                        <span className="text-muted-foreground">Цвет:</span>
                        <p className="font-medium">{order.color}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Заказано:</span>
                      <p className="font-medium">{order.quantity} {order.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Выполнено:</span>
                      <p className="font-medium">{order.completed} {order.unit}</p>
                    </div>
                  </div>
                  
                  {order.status !== 'completed' && (
                    <div className="flex items-center gap-2 mt-4">
                      <Label className="text-sm">Готовая продукция:</Label>
                      <Input
                        type="number"
                        className="w-32"
                        value={order.completed}
                        onChange={(e) => handleUpdateCompleted(order.id, parseInt(e.target.value) || 0)}
                        max={order.quantity}
                      />
                      <span className="text-sm text-muted-foreground">{order.unit}</span>
                    </div>
                  )}
                </div>
                
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(order.id)}
                  >
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
