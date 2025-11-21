import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface ServerAddress {
  id: number;
  name: string;
  address: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function ServerConfigPage() {
  const [addresses, setAddresses] = useState<ServerAddress[]>([]);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAddresses();
    const interval = setInterval(fetchAddresses, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAddresses = async () => {
    const stored = localStorage.getItem('server_addresses');
    if (stored) {
      setAddresses(JSON.parse(stored));
    }
  };

  const saveToStorage = (data: ServerAddress[]) => {
    localStorage.setItem('server_addresses', JSON.stringify(data));
    setAddresses(data);
    
    window.dispatchEvent(new CustomEvent('server-config-updated', { 
      detail: { addresses: data } 
    }));
  };

  const addAddress = () => {
    if (!newName || !newAddress) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    const newAddr: ServerAddress = {
      id: Date.now(),
      name: newName,
      address: newAddress,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [...addresses, newAddr];
    saveToStorage(updated);
    
    setNewName('');
    setNewAddress('');
    
    toast({
      title: 'Успешно',
      description: 'Адрес сервера добавлен',
    });
  };

  const updateAddress = (id: number, updates: Partial<ServerAddress>) => {
    const updated = addresses.map(addr => 
      addr.id === id 
        ? { ...addr, ...updates, updated_at: new Date().toISOString() }
        : addr
    );
    saveToStorage(updated);
    setEditingId(null);
    
    toast({
      title: 'Успешно',
      description: 'Адрес обновлен',
    });
  };

  const deleteAddress = (id: number) => {
    const updated = addresses.filter(addr => addr.id !== id);
    saveToStorage(updated);
    
    toast({
      title: 'Успешно',
      description: 'Адрес удален',
    });
  };

  const toggleActive = (id: number, is_active: boolean) => {
    updateAddress(id, { is_active });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Settings" size={24} />
            Настройка адресов сервера
          </CardTitle>
          <CardDescription>
            Управление адресами серверов. Изменения автоматически применяются на всех клиентах.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Название сервера</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Основной сервер"
              />
            </div>
            <div>
              <Label htmlFor="address">Адрес</Label>
              <Input
                id="address"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="http://192.168.1.100:3000"
              />
            </div>
            <Button onClick={addAddress} className="w-full">
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить сервер
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {addresses.map((addr) => (
          <Card key={addr.id}>
            <CardContent className="pt-6">
              {editingId === addr.id ? (
                <div className="space-y-4">
                  <Input
                    value={addr.name}
                    onChange={(e) => {
                      const updated = addresses.map(a => 
                        a.id === addr.id ? { ...a, name: e.target.value } : a
                      );
                      setAddresses(updated);
                    }}
                  />
                  <Input
                    value={addr.address}
                    onChange={(e) => {
                      const updated = addresses.map(a => 
                        a.id === addr.id ? { ...a, address: e.target.value } : a
                      );
                      setAddresses(updated);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => updateAddress(addr.id, addr)}>
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Отмена
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-semibold">{addr.name}</div>
                    <div className="text-sm text-muted-foreground">{addr.address}</div>
                    {addr.updated_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Обновлено: {new Date(addr.updated_at).toLocaleString('ru-RU')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`active-${addr.id}`}>Активен</Label>
                      <Switch
                        id={`active-${addr.id}`}
                        checked={addr.is_active}
                        onCheckedChange={(checked) => toggleActive(addr.id, checked)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setEditingId(addr.id)}
                    >
                      <Icon name="Pencil" size={16} />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteAddress(addr.id)}
                    >
                      <Icon name="Trash2" size={16} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {addresses.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <Icon name="Server" size={48} className="mx-auto mb-4 opacity-20" />
            <p>Нет настроенных серверов</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
