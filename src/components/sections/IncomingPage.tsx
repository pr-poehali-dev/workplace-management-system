import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

interface IncomingItem {
  id: number;
  material_name: string;
  color_name?: string;
  quantity: number;
  unit: string;
  created_by_name: string;
  created_at: string;
}

export default function IncomingPage({ user }: { user: User }) {
  const [items, setItems] = useState<IncomingItem[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    material_id: '',
    color_id: '',
    quantity: '',
    unit: 'шт',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchIncoming();
    fetchMaterials();
    fetchColors();
  }, []);

  const fetchIncoming = async () => {
    try {
      const response = await fetch(`${API_URL}/incoming`);
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
      const response = await fetch(`${API_URL}/incoming`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: parseInt(formData.material_id),
          color_id: formData.color_id ? parseInt(formData.color_id) : null,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          created_by: parseInt(user.id),
        }),
      });

      if (response.ok) {
        await fetchIncoming();
        setShowForm(false);
        setFormData({ material_id: '', color_id: '', quantity: '', unit: 'шт' });
        toast({
          title: 'Добавлено',
          description: 'Приход материалов зарегистрирован. Склад обновлен.',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить приход',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Приход материалов</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            items.map(i => ({
              'Материал': i.material_name,
              'Цвет': i.color_name || '-',
              'Количество': `${i.quantity} ${i.unit}`,
              'Добавил': i.created_by_name,
              'Дата': new Date(i.created_at).toLocaleDateString('ru-RU')
            })),
            'Приход_материалов',
            'Приход'
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
            Добавить приход
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новый приход</CardTitle>
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Добавить</Button>
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
                    <Icon name="PackagePlus" size={20} className="text-green-600" />
                    <h3 className="text-xl font-semibold">{item.material_name}</h3>
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
                      <p className="font-medium text-green-600">{item.quantity} {item.unit}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Добавил:</span>
                      <p className="font-medium">{item.created_by_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дата:</span>
                      <p className="font-medium">{new Date(item.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}