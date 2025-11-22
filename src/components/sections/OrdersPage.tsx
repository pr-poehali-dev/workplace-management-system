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
import { exportToExcel, printTable } from '@/utils/exportUtils';

interface OrderItem {
  material: string;
  size?: string;
  color?: string;
  quantity: number;
  unit: string;
  completed: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  status: 'new' | 'in_progress' | 'completed';
  createdBy: string;
  createdAt: Date;
}

interface MaterialFormItem {
  material_id: string;
  size: string;
  color_id: string;
  quantity: string;
  unit: string;
}

import { getApiUrl } from '@/utils/updateApiUrls';

export default function OrdersPage({ user }: { user: User }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [formItems, setFormItems] = useState<MaterialFormItem[]>([{
    material_id: '',
    size: '',
    color_id: '',
    quantity: '',
    unit: 'шт'
  }]);
  const { toast } = useToast();

  const canEdit = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    const savedMaterials = localStorage.getItem('materials_data');
    const savedColors = localStorage.getItem('colors_data');
    
    if (savedMaterials) {
      setMaterials(JSON.parse(savedMaterials));
    } else {
      setMaterials([
        { id: 1, name: 'Панель 3000х600' },
        { id: 2, name: 'Профиль алюминиевый' },
      ]);
    }
    
    if (savedColors) {
      setColors(JSON.parse(savedColors));
    } else {
      setColors([
        { id: 1, name: 'Белый' },
        { id: 2, name: 'Черный' },
      ]);
    }
    
    const savedOrders = localStorage.getItem('orders_data');
    if (savedOrders) {
      const parsed = JSON.parse(savedOrders);
      setOrders(parsed.map((o: any) => ({
        ...o,
        createdAt: new Date(o.createdAt)
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      const saveTimeout = setTimeout(() => {
        localStorage.setItem('orders_data', JSON.stringify(orders));
      }, 1500);
      return () => clearTimeout(saveTimeout);
    }
  }, [orders]);

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

  const addMaterialItem = () => {
    setFormItems([...formItems, {
      material_id: '',
      size: '',
      color_id: '',
      quantity: '',
      unit: 'шт'
    }]);
  };

  const removeMaterialItem = (index: number) => {
    if (formItems.length > 1) {
      setFormItems(formItems.filter((_, i) => i !== index));
    }
  };

  const updateFormItem = (index: number, field: keyof MaterialFormItem, value: string) => {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    setFormItems(updated);
  };

  const handleUpdateCompleted = (orderId: string, itemIndex: number, completed: number) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedItems = [...order.items];
        updatedItems[itemIndex] = { ...updatedItems[itemIndex], completed };
        
        const allCompleted = updatedItems.every(item => item.completed >= item.quantity);
        const someCompleted = updatedItems.some(item => item.completed > 0);
        
        return {
          ...order,
          items: updatedItems,
          status: allCompleted ? 'completed' : (someCompleted ? 'in_progress' : 'new')
        };
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

  const handleCreateOrder = () => {
    const validItems = formItems.filter(item => 
      item.material_id && item.quantity && parseFloat(item.quantity) > 0
    );

    if (validItems.length === 0) {
      toast({
        title: 'Ошибка',
        description: 'Добавьте хотя бы один материал с количеством',
        variant: 'destructive',
      });
      return;
    }

    const orderItems: OrderItem[] = validItems.map(item => {
      const material = materials.find(m => m.id.toString() === item.material_id);
      const color = item.color_id ? colors.find(c => c.id.toString() === item.color_id) : null;
      
      return {
        material: material?.name || 'Неизвестно',
        size: item.size || undefined,
        color: color?.name || undefined,
        quantity: parseFloat(item.quantity),
        unit: item.unit,
        completed: 0
      };
    });

    const newOrder: Order = {
      id: Date.now().toString(),
      items: orderItems,
      status: 'new',
      createdBy: user.fullName,
      createdAt: new Date()
    };

    setOrders([newOrder, ...orders]);
    setShowForm(false);
    setFormItems([{
      material_id: '',
      size: '',
      color_id: '',
      quantity: '',
      unit: 'шт'
    }]);
    
    toast({
      title: 'Создано',
      description: 'Заявка успешно создана',
    });
  };

  const exportData = orders.flatMap(order => 
    order.items.map(item => ({
      'ID Заявки': order.id,
      'Материал': item.material,
      'Размер': item.size || '-',
      'Цвет': item.color || '-',
      'Количество': `${item.quantity} ${item.unit}`,
      'Выполнено': `${item.completed} ${item.unit}`,
      'Статус': getStatusLabel(order.status),
      'Создал': order.createdBy,
      'Дата': order.createdAt.toLocaleDateString('ru-RU')
    }))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Заявки</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(exportData, 'Заявки', 'Заявки')}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
          {canEdit && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Icon name="Plus" size={20} className="mr-2" />
              Создать заявку
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Новая заявка</span>
              <Button onClick={addMaterialItem} size="sm" variant="outline">
                <Icon name="Plus" size={16} className="mr-2" />
                Добавить материал
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {formItems.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-4 relative">
                {formItems.length > 1 && (
                  <Button
                    onClick={() => removeMaterialItem(index)}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    <Icon name="X" size={16} />
                  </Button>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Материал *</Label>
                    <Select 
                      value={item.material_id} 
                      onValueChange={(v) => updateFormItem(index, 'material_id', v)}
                    >
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
                    <Input
                      value={item.size}
                      onChange={(e) => updateFormItem(index, 'size', e.target.value)}
                      placeholder="Например: 3000x600"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Цвет</Label>
                    <Select 
                      value={item.color_id} 
                      onValueChange={(v) => updateFormItem(index, 'color_id', v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите цвет" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Без цвета</SelectItem>
                        {colors.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Количество *</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateFormItem(index, 'quantity', e.target.value)}
                        placeholder="0"
                        className="flex-1"
                      />
                      <Select 
                        value={item.unit} 
                        onValueChange={(v) => updateFormItem(index, 'unit', v)}
                      >
                        <SelectTrigger className="w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="шт">шт</SelectItem>
                          <SelectItem value="м">м</SelectItem>
                          <SelectItem value="м²">м²</SelectItem>
                          <SelectItem value="кг">кг</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateOrder} className="flex-1">
                <Icon name="Check" size={20} className="mr-2" />
                Создать заявку
              </Button>
              <Button onClick={() => setShowForm(false)} variant="outline">
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Icon name="Loader2" size={32} className="animate-spin mx-auto mb-2" />
              <p className="text-muted-foreground">Загрузка...</p>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Icon name="ClipboardList" size={48} className="mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Заявки отсутствуют</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card key={order.id} className="hover-scale">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span>Заявка #{order.id}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Создал: {order.createdBy} • {order.createdAt.toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      onClick={() => handleDelete(order.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Icon name="Trash2" size={18} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">Материал</p>
                          <p className="font-medium">{item.material}</p>
                        </div>
                        {item.size && (
                          <div>
                            <p className="text-sm text-muted-foreground">Размер</p>
                            <p className="font-medium">{item.size}</p>
                          </div>
                        )}
                        {item.color && (
                          <div>
                            <p className="text-sm text-muted-foreground">Цвет</p>
                            <p className="font-medium">{item.color}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-muted-foreground">Количество</p>
                          <p className="font-medium">{item.quantity} {item.unit}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Выполнено</Label>
                          <div className="flex gap-2 items-center mt-1">
                            <Input
                              type="number"
                              value={item.completed}
                              onChange={(e) => handleUpdateCompleted(order.id, itemIndex, parseFloat(e.target.value) || 0)}
                              disabled={!canEdit}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground">
                              / {item.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
