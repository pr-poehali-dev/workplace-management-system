import { useState, useEffect } from 'react';
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

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

export default function OrdersPage({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    material_id: '',
    size: '',
    color_id: '',
    quantity: '',
    unit: 'шт'
  });
  const { toast } = useToast();

  const canEdit = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchOrders();
    fetchMaterials();
    fetchColors();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/materials`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Failed to fetch materials');
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch(`${API_URL}/colors`);
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      }
    } catch (error) {
      console.error('Failed to fetch colors');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.map((o: any) => ({
          id: o.id.toString(),
          material: o.material_name || 'Неизвестно',
          size: o.size,
          color: o.color_name,
          quantity: parseFloat(o.quantity),
          unit: o.unit,
          status: o.status,
          completed: parseFloat(o.completed || 0),
          createdBy: o.created_by_name || 'Система',
          createdAt: new Date(o.created_at),
        })));
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заявки',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateCompleted = async (orderId: string, completed: number) => {
    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, completed }),
      });
      
      if (response.ok) {
        await fetchOrders();
        toast({
          title: 'Обновлено',
          description: 'Количество готовой продукции обновлено',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      const response = await fetch(`${API_URL}/orders?id=${orderId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchOrders();
        toast({
          title: 'Удалено',
          description: 'Заявка удалена',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить заявку',
        variant: 'destructive',
      });
    }
  };

  const handleCreateOrder = async () => {
    if (!formData.material_id || !formData.quantity) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          material_id: parseInt(formData.material_id),
          color_id: formData.color_id ? parseInt(formData.color_id) : null,
          quantity: parseFloat(formData.quantity),
          created_by: parseInt(user.id),
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setShowForm(false);
        setFormData({
          material_id: '',
          size: '',
          color_id: '',
          quantity: '',
          unit: 'шт',
        });
        toast({
          title: 'Создано',
          description: 'Заявка успешно создана',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать заявку',
        variant: 'destructive',
      });
    }
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
                <Label>Материал *</Label>
                <Select value={formData.material_id} onValueChange={(v) => setFormData({...formData, material_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите материал" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Размер</Label>
                <Input placeholder="1500x1000" value={formData.size} onChange={(e) => setFormData({...formData, size: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Select value={formData.color_id} onValueChange={(v) => setFormData({...formData, color_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Количество *</Label>
                <div className="flex gap-2">
                  <Input type="number" placeholder="0" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
                  <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
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
              <Button onClick={handleCreateOrder}>Создать</Button>
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