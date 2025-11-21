import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  usage: number;
}

export default function ColorsPage({ user }: { user: User }) {
  const [colors] = useState<ColorItem[]>([
    { id: '1', name: 'Белый', hex: '#FFFFFF', usage: 150 },
    { id: '2', name: 'Черный', hex: '#000000', usage: 80 },
    { id: '3', name: 'Хром', hex: '#C0C0C0', usage: 65 },
    { id: '4', name: 'Коричневый', hex: '#8B4513', usage: 45 },
    { id: '5', name: 'Серый', hex: '#808080', usage: 30 },
  ].sort((a, b) => b.usage - a.usage));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Каталог цветов</h2>
        <Button>
          <Icon name="Plus" size={20} className="mr-2" />
          Добавить цвет
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colors.map((color) => (
          <Card key={color.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-lg border-2 border-gray-200 shadow-sm"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">{color.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{color.hex}</p>
                  <Badge variant="secondary">Использовано: {color.usage}</Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Icon name="Trash2" size={18} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
