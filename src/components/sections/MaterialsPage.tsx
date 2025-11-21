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

const API_URL = 'BACKEND_MATERIALS_URL';

interface Material {
  id: number;
  name: string;
  color_name?: string;
  category_name?: string;
}

export default function MaterialsPage({ user }: { user: User }) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    color_id: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    setCategories([
      { id: 1, name: 'Ламинация' },
      { id: 2, name: 'Москитки' },
      { id: 3, name: 'Жесть' },
      { id: 4, name: 'Другое' },
      { id: 5, name: 'Сендвич' },
      { id: 6, name: 'Расходники' },
    ]);
    setColors([
      { id: 1, name: 'Белый' },
      { id: 2, name: 'Черный' },
      { id: 3, name: 'Коричневый' },
    ]);
    setMaterials([]);
  }, []);



  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Введите название материала',
        variant: 'destructive',
      });
      return;
    }

    const category = categories.find(c => c.id === parseInt(formData.category_id));
    const color = colors.find(c => c.id === parseInt(formData.color_id));

    const newMaterial = {
      id: Date.now(),
      name: formData.name,
      category_name: category?.name,
      color_name: color?.name,
    };

    setMaterials([...materials, newMaterial]);
    setShowForm(false);
    setFormData({ name: '', category_id: '', color_id: '' });
    toast({
      title: 'Создано',
      description: 'Материал добавлен',
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm('Удалить материал?')) return;

    setMaterials(materials.filter(m => m.id !== id));
    toast({
      title: 'Удалено',
      description: 'Материал удален',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Материалы</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToExcel(
            materials.map(m => ({
              'Название': m.name,
              'Категория': m.category_name || '-',
              'Цвет': m.color_name || '-'
            })),
            'Материалы',
            'Материалы'
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
            Добавить материал
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новый материал</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  placeholder="Название материала"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select value={formData.category_id} onValueChange={(v) => setFormData({ ...formData, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
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
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate}>Создать</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Отмена</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {materials.map((material) => (
          <Card key={material.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{material.name}</h3>
                  <div className="space-y-1">
                    {material.category_name && (
                      <Badge variant="secondary">{material.category_name}</Badge>
                    )}
                    {material.color_name && (
                      <Badge variant="outline" className="ml-2">{material.color_name}</Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(material.id)}
                >
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