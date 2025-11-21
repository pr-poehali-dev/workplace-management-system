import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

interface WarehouseItem {
  id: string;
  name: string;
  color: string;
  quantity: number;
  unit: string;
}

export default function WarehousePage({ user }: { user: User }) {
  const [items, setItems] = useState<WarehouseItem[]>([
    { id: '1', name: 'Профиль ПВХ', color: 'Белый', quantity: 500, unit: 'шт' },
    { id: '2', name: 'Стеклопакет', color: 'Прозрачный', quantity: 150, unit: 'шт' },
    { id: '3', name: 'Фурнитура', color: 'Хром', quantity: 800, unit: 'шт' },
    { id: '4', name: 'Уплотнитель', color: 'Черный', quantity: 200, unit: 'м' },
  ]);

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Склад</h2>
      
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
