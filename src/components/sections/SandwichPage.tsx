import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import { User } from '@/App';

export default function SandwichPage({ user }: { user: User }) {
  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Сендвич</h2>
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Icon name="Box" size={64} className="mx-auto mb-4 opacity-20" />
          <p>Раздел в разработке</p>
        </CardContent>
      </Card>
    </div>
  );
}
