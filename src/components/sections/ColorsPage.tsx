import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';
import { getApiUrl } from '@/utils/updateApiUrls';

interface ColorItem {
  id: string;
  name: string;
  hex: string;
  usage: number;
}

export default function ColorsPage({ user }: { user: User }) {
  const [colors, setColors] = useState<ColorItem[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const savedData = localStorage.getItem('colors_data');
    if (savedData) {
      try {
        setColors(JSON.parse(savedData));
      } catch (e) {
        console.error('Ошибка загрузки цветов');
        setColors([
          { id: '1', name: 'Белый', hex: '#FFFFFF', usage: 15 },
          { id: '2', name: 'Черный', hex: '#000000', usage: 12 },
          { id: '3', name: 'Коричневый', hex: '#8B4513', usage: 8 },
          { id: '4', name: 'Серый', hex: '#808080', usage: 5 },
        ]);
      }
    } else {
      setColors([
        { id: '1', name: 'Белый', hex: '#FFFFFF', usage: 15 },
        { id: '2', name: 'Черный', hex: '#000000', usage: 12 },
        { id: '3', name: 'Коричневый', hex: '#8B4513', usage: 8 },
        { id: '4', name: 'Серый', hex: '#808080', usage: 5 },
      ]);
    }
  }, []);

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('colors_data', JSON.stringify(colors));
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [colors]);



  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', hex_code: '#808080' });

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Введите название цвета',
        variant: 'destructive',
      });
      return;
    }

    const newColor = {
      id: Date.now().toString(),
      name: formData.name,
      hex: formData.hex_code,
      usage: 0,
    };

    setColors([...colors, newColor]);
    setShowForm(false);
    setFormData({ name: '', hex_code: '#808080' });
    toast({
      title: 'Создано',
      description: 'Цвет добавлен',
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('Удалить цвет?')) return;
    setColors(colors.filter(c => c.id !== id));
    toast({
      title: 'Удалено',
      description: 'Цвет удален',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Каталог цветов</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            colors.map(c => ({
              'Название': c.name,
              'HEX': c.hex,
              'Использований': c.usage
            })),
            'Цвета',
            'Цвета'
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
            Добавить цвет
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новый цвет</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  placeholder="Например: Белый"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>HEX код</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={formData.hex_code}
                    onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                    className="w-16 h-10"
                  />
                  <Input
                    value={formData.hex_code}
                    onChange={(e) => setFormData({ ...formData, hex_code: e.target.value })}
                    placeholder="#808080"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Создать</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <Button variant="ghost" size="sm" onClick={() => handleDelete(color.id)}>
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