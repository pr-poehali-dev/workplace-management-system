import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import { useToast } from '@/hooks/use-toast';
import { exportToExcel, printTable } from '@/utils/exportUtils';
import { getApiUrl } from '@/utils/updateApiUrls';

interface Category {
  id: number;
  name: string;
  description?: string;
  material_count: number;
}

export default function CategoriesPage({ user }: { user: User }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const { toast } = useToast();

  const canEdit = user.role === 'admin' || user.role === 'manager';

  useEffect(() => {
    const savedData = localStorage.getItem('categories_data');
    if (savedData) {
      try {
        setCategories(JSON.parse(savedData));
      } catch (e) {
        console.error('Ошибка загрузки разделов');
        setCategories([
          { id: 1, name: 'Ламинация', description: '', material_count: 0 },
          { id: 2, name: 'Москитки', description: '', material_count: 0 },
          { id: 3, name: 'Жесть', description: '', material_count: 0 },
          { id: 4, name: 'Другое', description: '', material_count: 0 },
          { id: 5, name: 'Сендвич', description: '', material_count: 0 },
          { id: 6, name: 'Расходники', description: '', material_count: 0 },
        ]);
      }
    } else {
      setCategories([
        { id: 1, name: 'Ламинация', description: '', material_count: 0 },
        { id: 2, name: 'Москитки', description: '', material_count: 0 },
        { id: 3, name: 'Жесть', description: '', material_count: 0 },
        { id: 4, name: 'Другое', description: '', material_count: 0 },
        { id: 5, name: 'Сендвич', description: '', material_count: 0 },
        { id: 6, name: 'Расходники', description: '', material_count: 0 },
      ]);
    }
  }, []);

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      localStorage.setItem('categories_data', JSON.stringify(categories));
    }, 1500);
    return () => clearTimeout(saveTimeout);
  }, [categories]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${getApiUrl('SECTIONS')}/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить категории',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: 'Ошибка',
        description: 'Заполните название раздела',
        variant: 'destructive',
      });
      return;
    }

    const newCategory = {
      id: Date.now(),
      name: formData.name,
      description: formData.description,
      material_count: 0,
    };

    setCategories([...categories, newCategory]);
    setShowForm(false);
    setFormData({ name: '', description: '' });
    toast({
      title: 'Создано',
      description: 'Раздел успешно создан',
    });
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
  };

  const handleUpdateField = (id: number, field: string, value: string) => {
    setCategories(categories.map(cat => 
      cat.id === id ? { ...cat, [field]: value } : cat
    ));
    setEditingId(null);
    toast({
      title: 'Обновлено',
      description: 'Раздел обновлен',
    });
  };

  const handleDelete = (id: number, materialCount: number) => {
    if (materialCount > 0) {
      toast({
        title: 'Ошибка',
        description: 'Нельзя удалить раздел с материалами',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm('Удалить раздел?')) return;

    setCategories(categories.filter(cat => cat.id !== id));
    toast({
      title: 'Удалено',
      description: 'Раздел удален',
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Разделы</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              exportToExcel(
                categories.map((c) => ({
                  Название: c.name,
                  Описание: c.description || '-',
                  'Материалов': c.material_count,
                })),
                'Разделы',
                'Разделы'
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
Добавить раздел
            </Button>
          )}
        </div>
      </div>

      {showForm && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Новый раздел</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Название *</Label>
                <Input
                  placeholder="Панели"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Описание</Label>
                <Textarea
                  placeholder="Описание раздела"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card
            key={category.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  {editingId === category.id ? (
                    <Input
                      defaultValue={category.name}
                      onBlur={(e) => {
                        handleUpdateField(category.id, 'name', e.target.value);
                      }}
                      className="text-lg font-semibold"
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                  )}
                  <Badge variant="secondary" className="mt-2">
                    {category.material_count} материалов
                  </Badge>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Icon name="Edit" size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(category.id, category.material_count)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {editingId === category.id ? (
                  <Textarea
                    defaultValue={category.description || ''}
                    onBlur={(e) => {
                      handleUpdateField(category.id, 'description', e.target.value);
                    }}
                    placeholder="Описание категории"
                    className="text-sm"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {category.description || 'Без описания'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categories.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Icon name="FolderTree" size={64} className="mx-auto mb-4 opacity-20" />
            <p>Нет категорий. Создайте первую категорию!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}