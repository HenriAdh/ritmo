import { ModulePlaceholder } from '@/src/components/ModulePlaceholder';
import { ScreenHeader } from '@/src/components/ScreenHeader';

export default function CookingScreen() {
  return (
    <ModulePlaceholder
      header={<ScreenHeader title="Cozinha" />}
      description="O que cozinhar, quando cozinhar e lembretes de preparo."
    />
  );
}
