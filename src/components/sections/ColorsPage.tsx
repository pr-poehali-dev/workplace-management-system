import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  usage: number;
}

const API_URL = 'https://functions.poehali.dev/39ca8b8c-d1d9-44d3-ad59-89c619b3b821';

export default function ColorsPage({ user }: { user: User }) {
  const [colors, setColors] = useState<ColorItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      const response = await fetch(`${API_URL}/colors`);
      if (response.ok) {
        const data = await response.json();
        setColors(data.map((c: any) => ({
          id: c.id.toString(),
          name: c.name,
          hex: c.hex_code || '#808080',
          usage: c.usage_count || 0,
        })));
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить цвета',
        variant: 'destructive',
      });
    }
  };

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