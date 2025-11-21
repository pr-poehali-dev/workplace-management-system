import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/App';
import OrdersPage from '@/components/sections/OrdersPage';
import IncomingPage from '@/components/sections/IncomingPage';
import WarehousePage from '@/components/sections/WarehousePage';
import ShippingPage from '@/components/sections/ShippingPage';
import PersonnelPage from '@/components/sections/PersonnelPage';
import DefectsPage from '@/components/sections/DefectsPage';
import MaterialsPage from '@/components/sections/MaterialsPage';
import CategoriesPage from '@/components/sections/CategoriesPage';
import ColorsPage from '@/components/sections/ColorsPage';
import SandwichPage from '@/components/sections/SandwichPage';
import CuttingPage from '@/components/sections/CuttingPage';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

type Section = 'dashboard' | 'orders' | 'incoming' | 'warehouse' | 'shipping' | 'personnel' | 'defects' | 'materials' | 'categories' | 'colors' | 'sandwich' | 'cutting';

const MENU_ITEMS = [
  { id: 'orders', label: 'Заявки', icon: 'ClipboardList', color: 'bg-red-500' },
  { id: 'incoming', label: 'Приход', icon: 'PackagePlus', color: 'bg-green-500' },
  { id: 'warehouse', label: 'Склад', icon: 'Warehouse', color: 'bg-blue-500' },
  { id: 'shipping', label: 'Отправка', icon: 'Truck', color: 'bg-purple-500' },
  { id: 'personnel', label: 'Персонал', icon: 'Users', color: 'bg-indigo-500' },
  { id: 'defects', label: 'Брак', icon: 'AlertTriangle', color: 'bg-orange-500' },
  { id: 'materials', label: 'Материалы', icon: 'Layers', color: 'bg-teal-500' },
  { id: 'categories', label: 'Разделы', icon: 'FolderTree', color: 'bg-cyan-500' },
  { id: 'colors', label: 'Цвет', icon: 'Palette', color: 'bg-pink-500' },
  { id: 'sandwich', label: 'Сендвич', icon: 'Box', color: 'bg-amber-500' },
  { id: 'cutting', label: 'Раскрой', icon: 'Scissors', color: 'bg-rose-500' },
];

export default function DashboardPage({ user, onLogout }: DashboardPageProps) {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const renderContent = () => {
    switch (activeSection) {
      case 'orders':
        return <OrdersPage user={user} />;
      case 'incoming':
        return <IncomingPage user={user} />;
      case 'warehouse':
        return <WarehousePage user={user} />;
      case 'shipping':
        return <ShippingPage user={user} />;
      case 'personnel':
        return <PersonnelPage user={user} />;
      case 'defects':
        return <DefectsPage user={user} />;
      case 'materials':
        return <MaterialsPage user={user} />;
      case 'categories':
        return <CategoriesPage user={user} />;
      case 'colors':
        return <ColorsPage user={user} />;
      case 'sandwich':
        return <SandwichPage user={user} />;
      case 'cutting':
        return <CuttingPage user={user} />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MENU_ITEMS.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover-scale transition-all hover:shadow-lg"
                onClick={() => setActiveSection(item.id as Section)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center`}>
                    <Icon name={item.icon as any} size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.label}</h3>
                </CardContent>
              </Card>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen">
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant={activeSection === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveSection('dashboard')}
              size="sm"
            >
              <Icon name="Home" size={20} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Производство</h1>
              <p className="text-sm text-muted-foreground">{user.fullName} • {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Начальник' : 'Сотрудник'}</p>
            </div>
          </div>
          <Button variant="outline" onClick={onLogout}>
            <Icon name="LogOut" size={20} className="mr-2" />
            Выйти
          </Button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 animate-fade-in">
        {renderContent()}
      </main>
    </div>
  );
}
