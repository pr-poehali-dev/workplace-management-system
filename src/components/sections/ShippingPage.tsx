import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

export default function ShippingPage({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Отправка</h2>
      
      <Tabs defaultValue="ready" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ready">Готово к отправке</TabsTrigger>
          <TabsTrigger value="sent">Отправлено</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ready" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Icon name="PackageCheck" size={64} className="mx-auto mb-4 opacity-20" />
              <p>Нет заявок готовых к отправке</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sent" className="mt-4">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Icon name="Truck" size={64} className="mx-auto mb-4 opacity-20" />
              <p>Нет отправленных заявок</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
