import { ModulePlaceholder } from '@/src/components/ModulePlaceholder';
import { ScreenHeader } from '@/src/components/ScreenHeader';

export default function ShoppingScreen() {
  return (
    <ModulePlaceholder
      header={<ScreenHeader title="Compras" />}
      description="Sua lista de mercado, com itens sugeridos pelas refeições."
    />
  );
}
