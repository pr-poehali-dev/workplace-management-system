import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';

interface WarehouseItem {
  id: string;
  name: string;
  color: string;
  quantity: number;
  unit: string;
}

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

export default function WarehousePage({ user }: { user: User }) {
  const [items, setItems] = useState<WarehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouse();
  }, []);

  const fetchWarehouse = async () => {
    try {
      const response = await fetch(`${API_URL}/warehouse`);
      if (response.ok) {
        const data = await response.json();
        setItems(data.map((item: any) => ({
          id: item.id.toString(),
          name: item.material_name || 'Неизвестно',
          color: item.color_name || '-',
          quantity: parseFloat(item.quantity),
          unit: item.unit,
        })));
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить данные склада',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Склад</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            items.map(i => ({
              'Материал': i.name,
              'Цвет': i.color,
              'Количество': `${i.quantity} ${i.unit}`
            })),
            'Склад',
            'Склад'
          )}>
            <Icon name="Download" size={20} className="mr-2" />
            Excel
          </Button>
          <Button variant="outline" onClick={printTable}>
            <Icon name="Printer" size={20} className="mr-2" />
            Печать
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                  <Badge variant="secondary" className="mb-2">{item.color}</Badge>
                  <p className="text-2xl font-bold text-blue-600">{item.quantity} {item.unit}</p>
                </div>
                <Button variant="ghost" size="sm">
                  <Icon name="AlertTriangle" size={18} className="text-orange-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}