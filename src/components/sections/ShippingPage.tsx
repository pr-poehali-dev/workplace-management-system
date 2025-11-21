import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

interface Shipment {
  id: number;
  material_name: string;
  color_name?: string;
  quantity: number;
  unit: string;
  recipient: string;
  address: string;
  tracking?: string;
  status: string;
  created_by_name: string;
  created_at: string;
}

export default function ShippingPage({ user }: { user: User }) {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    material_id: '',
    color_id: '',
    quantity: '',
    unit: 'шт',
    recipient: '',
    address: '',
    tracking: '',
  });
  const { toast } = useToast();

  const canEdit = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    fetchShipments();
    fetchMaterials();
    fetchColors();
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch(`${API_URL}/shipments`);
      if (response.ok) {
        const data = await response.json();
        setShipments(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить отправки',
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
    if (!formData.material_id || !formData.quantity || !formData.recipient || !formData.address) {
      toast({
        title: 'Ошибка',
        description: 'Заполните обязательные поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/shipments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: parseInt(formData.material_id),
          color_id: formData.color_id ? parseInt(formData.color_id) : null,
          quantity: parseFloat(formData.quantity),
          unit: formData.unit,
          recipient: formData.recipient,
          address: formData.address,
          tracking: formData.tracking,
          created_by: parseInt(user.id),
        }),
      });

      if (response.ok) {
        await fetchShipments();
        setShowForm(false);
        setFormData({
          material_id: '',
          color_id: '',
          quantity: '',
          unit: 'шт',
          recipient: '',
          address: '',
          tracking: '',
        });
        toast({
          title: 'Создано',
          description: 'Отправка зарегистрирована. Склад обновлен.',
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
        description: 'Не удалось создать отправку',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (shipment: Shipment) => {
    setEditingId(shipment.id);
  };

  const handleUpdateField = async (id: number, field: string, value: string) => {
    try {
      const response = await fetch(`${API_URL}/shipments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      });

      if (response.ok) {
        await fetchShipments();
        toast({
          title: 'Обновлено',
          description: 'Данные отправки обновлены',
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

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить отправку? Материал вернется на склад.')) return;

    try {
      const response = await fetch(`${API_URL}/shipments?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchShipments();
        toast({
          title: 'Удалено',
          description: 'Отправка удалена. Материал возвращен на склад.',
        });
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить отправку',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: 'bg-yellow-500 text-white',
      shipped: 'bg-blue-500 text-white',
      delivered: 'bg-green-500 text-white',
      cancelled: 'bg-red-500 text-white',
    };
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      shipped: 'Отправлено',
      delivered: 'Доставлено',
      cancelled: 'Отменено',
    };
    return (
      <Badge className={variants[status] || 'bg-gray-500 text-white'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Отправки</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportToExcel(
                shipments.map((s) => ({
                  Материал: s.material_name,
                  Цвет: s.color_name || '-',
                  Количество: `${s.quantity} ${s.unit}`,
                  Получатель: s.recipient,
                  Адрес: s.address,
                  'Трек-номер': s.tracking || '-',
                  Статус:
                    s.status === 'pending'
                      ? 'Ожидает'
                      : s.status === 'shipped'
                      ? 'Отправлено'
                      : s.status === 'delivered'
                      ? 'Доставлено'
                      : 'Отменено',
                  Создал: s.created_by_name,
                  Дата: new Date(s.created_at).toLocaleDateString('ru-RU'),
                })),
                'Отправки',
                'Отправки'
              )
            }
          >
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
              Создать отправку
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новая отправка</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Материал *</Label>
                <Select
                  value={formData.material_id}
                  onValueChange={(v) => setFormData({ ...formData, material_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите материал" />
                  </SelectTrigger>
                  <SelectContent>
                    {materials.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Select
                  value={formData.color_id}
                  onValueChange={(v) => setFormData({ ...formData, color_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите цвет" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name}
                      </SelectItem>
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
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => setFormData({ ...formData, unit: v })}
                  >
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
                <Label>Получатель *</Label>
                <Input
                  placeholder="ООО Компания"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Адрес доставки *</Label>
                <Textarea
                  placeholder="г. Москва, ул. Примерная, д. 1"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Трек-номер</Label>
                <Input
                  placeholder="TRACK123456"
                  value={formData.tracking}
                  onChange={(e) => setFormData({ ...formData, tracking: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Создать</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Отмена
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {shipments.map((shipment) => (
          <Card key={shipment.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStatusBadge(shipment.status)}
                  <h3 className="text-xl font-semibold">{shipment.material_name}</h3>
                  {shipment.color_name && (
                    <Badge variant="secondary">{shipment.color_name}</Badge>
                  )}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(shipment)}
                    >
                      <Icon name="Edit" size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(shipment.id)}
                    >
                      <Icon name="Trash2" size={18} />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                <div>
                  <span className="text-muted-foreground">Количество:</span>
                  <p className="font-medium">
                    {shipment.quantity} {shipment.unit}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Получатель:</span>
                  {editingId === shipment.id ? (
                    <Input
                      defaultValue={shipment.recipient}
                      onBlur={(e) => {
                        handleUpdateField(shipment.id, 'recipient', e.target.value);
                        setEditingId(null);
                      }}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{shipment.recipient}</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Трек-номер:</span>
                  {editingId === shipment.id ? (
                    <Input
                      defaultValue={shipment.tracking || ''}
                      onBlur={(e) => {
                        handleUpdateField(shipment.id, 'tracking', e.target.value);
                        setEditingId(null);
                      }}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium">{shipment.tracking || '-'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Адрес доставки:</span>
                  {editingId === shipment.id ? (
                    <Textarea
                      defaultValue={shipment.address}
                      onBlur={(e) => {
                        handleUpdateField(shipment.id, 'address', e.target.value);
                        setEditingId(null);
                      }}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm">{shipment.address}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Создал: {shipment.created_by_name}</span>
                  <span>Дата: {new Date(shipment.created_at).toLocaleDateString('ru-RU')}</span>
                </div>
              </div>

              {canEdit && (
                <div className="flex gap-2 mt-4">
                  <Select
                    value={shipment.status}
                    onValueChange={(v) => handleUpdateField(shipment.id, 'status', v)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Ожидает</SelectItem>
                      <SelectItem value="shipped">Отправлено</SelectItem>
                      <SelectItem value="delivered">Доставлено</SelectItem>
                      <SelectItem value="cancelled">Отменено</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
