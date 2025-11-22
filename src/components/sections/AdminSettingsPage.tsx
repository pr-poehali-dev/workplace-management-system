import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CredentialsTab from './admin/CredentialsTab';
import VpsSettingsTab from './admin/VpsSettingsTab';
import DeploymentTab from './admin/DeploymentTab';
import ExportImportTab from './admin/ExportImportTab';

export default function AdminSettingsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="Shield" size={24} />
            Администрирование
          </CardTitle>
          <CardDescription>
            Управление учетными данными, настройками VPS и экспорт/импорт
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="credentials" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="credentials">Учетные данные</TabsTrigger>
              <TabsTrigger value="vps">Настройки VPS</TabsTrigger>
              <TabsTrigger value="deploy">Развертывание</TabsTrigger>
              <TabsTrigger value="export">Экспорт/Импорт</TabsTrigger>
            </TabsList>

            <TabsContent value="credentials" className="space-y-4 mt-6">
              <CredentialsTab />
            </TabsContent>

            <TabsContent value="vps" className="space-y-4 mt-6">
              <VpsSettingsTab />
            </TabsContent>

            <TabsContent value="deploy" className="space-y-4 mt-6">
              <DeploymentTab />
            </TabsContent>

            <TabsContent value="export" className="space-y-4 mt-6">
              <ExportImportTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
