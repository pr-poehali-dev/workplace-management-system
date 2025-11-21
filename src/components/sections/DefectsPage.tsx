import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

export default function DefectsPage({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Брак</h2>
        <Button>
          <Icon name="Plus" size={20} className="mr-2" />
          Списать в брак
        </Button>
      </div>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Icon name="AlertTriangle" size={64} className="mx-auto mb-4 opacity-20" />
          <p>Раздел в разработке</p>
        </CardContent>
      </Card>
    </div>
  );
}
