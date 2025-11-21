import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

interface DefectItem {
  id: number;
  material_name: string;
  color_name?: string;
  quantity: number;
  unit: string;
  reason?: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

export default function DefectsPage({ user }: { user: User }) {
  const [items, setItems] = useState<DefectItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [warehouse, setWarehouse] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    material_id: '',
    color_id: '',
    quantity: '',
    unit: 'шт',
    reason: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDefects();
    fetchMaterials();
    fetchColors();
    fetchWarehouse();
  }, []);

  const fetchDefects = async () => {
    try {
      const response = await fetch(`${API_URL}/defects`);
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные',
        variant: 'destructive',
      });
    }
  };

  const fetchMaterials = async () => {
    try {
      const response = await fetch(`${API_URL}/materials`);
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      // Error fetching materials
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

  const fetchWarehouse = async () => {
    try {
      const response = await fetch(`${API_URL}/warehouse`);
      if (response.ok) {
        const data = await response.json();
        setWarehouse(data);
      }
    } catch (error) {
      console.error('Failed to fetch warehouse');
    }
  };

  const handleCreate = async () => {
    if (!formData.material_id || !formData.quantity) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/defects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: parseInt(formData.material_id),
          color_id: formData.color_id ? parseInt(formData.color_id) : null,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          reason: formData.reason,
          created_by: parseInt(user.id),
        }),
      });

      if (response.ok) {
        await fetchDefects();
        await fetchWarehouse();
        setShowForm(false);
        setFormData({ material_id: '', color_id: '', quantity: '', unit: 'шт', reason: '' });
        toast({
          title: 'Списано',
          description: 'Материал списан в брак. Склад обновлен.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Недостаточно материала на складе',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось списать в брак',
        variant: 'destructive',
      });
    }
  };

  const handleDispose = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/defects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        await fetchDefects();
        toast({
          title: 'Утилизировано',
          description: 'Брак утилизирован',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось утилизировать',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Брак</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            items.map(i => ({
              'Материал': i.material_name,
              'Цвет': i.color_name || '-',
              'Количество': `${i.quantity} ${i.unit}`,
              'Причина': i.reason || '-',
              'Статус': i.status === 'registered' ? 'Зарегистрировано' : 'Утилизировано',
              'Списал': i.created_by_name,
              'Дата': new Date(i.created_at).toLocaleDateString('ru-RU')
            })),
            'Брак',
            'Брак'
          )}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Icon name="Plus" size={20} className="mr-2" />
            Списать в брак
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Списание в брак</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Материал *</Label>
                <Select value={formData.material_id} onValueChange={(v) => setFormData({ ...formData, material_id: v })}>
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
                <Label>Цвет</Label>
                <Select value={formData.color_id} onValueChange={(v) => setFormData({ ...formData, color_id: v })}>
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
                  <Input
                    type="number"
                    placeholder="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  />
                  <Select value={formData.unit} onValueChange={(v) => setFormData({ ...formData, unit: v })}>
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
              <div className="space-y-2">
                <Label>Причина</Label>
                <Textarea
                  placeholder="Опишите причину брака"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Списать</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon name="AlertTriangle" size={20} className="text-orange-600" />
                    <h3 className="text-xl font-semibold">{item.material_name}</h3>
                    <Badge variant={item.status === 'disposed' ? 'secondary' : 'destructive'}>
                      {item.status === 'disposed' ? 'Утилизировано' : 'Зарегистрировано'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {item.color_name && (
                      <div>
                        <span className="text-muted-foreground">Цвет:</span>
                        <p className="font-medium">{item.color_name}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Количество:</span>
                      <p className="font-medium text-orange-600">{item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Списал:</span>
                      <p className="font-medium">{item.created_by_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата:</span>
                      <p className="font-medium">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {item.reason && (
                    <div className="mt-2">
                      <span className="text-muted-foreground text-sm">Причина: </span>
                      <span className="text-sm">{item.reason}</span>
                    </div>
                  )}
                </div>
                {item.status === 'registered' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDispose(item.id)}
                  >
                    <Icon name="Trash" size={18} className="mr-2" />
                    Утилизировать
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