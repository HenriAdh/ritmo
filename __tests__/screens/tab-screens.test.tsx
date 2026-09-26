import { render, screen } from '@testing-library/react-native';

import CookingScreen from '@/app/(tabs)/cooking';
import ShoppingScreen from '@/app/(tabs)/shopping';

describe('telas das abas', () => {
  it('renderiza a aba Compras', () => {
    render(<ShoppingScreen />);
    expect(screen.getByText('Compras')).toBeTruthy();
  });

  it('renderiza a aba Cozinha', () => {
    render(<CookingScreen />);
    expect(screen.getByText('Cozinha')).toBeTruthy();
  });
});