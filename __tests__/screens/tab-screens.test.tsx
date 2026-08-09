import { render, screen } from '@testing-library/react-native';

import CookingScreen from '@/app/(tabs)/cooking';
import HomeScreen from '@/app/(tabs)/index';
import NutritionScreen from '@/app/(tabs)/nutrition';
import ShoppingScreen from '@/app/(tabs)/shopping';
import WorkoutScreen from '@/app/(tabs)/workout';

describe('telas das abas', () => {
  it('renderiza a Home', () => {
    render(<HomeScreen />);
    expect(screen.getByText('Ritmo')).toBeTruthy();
  });

  it('renderiza a aba Treino', () => {
    render(<WorkoutScreen />);
    expect(screen.getByText('Treino')).toBeTruthy();
  });

  it('renderiza a aba Alimentação', () => {
    render(<NutritionScreen />);
    expect(screen.getByText('Alimentação')).toBeTruthy();
  });

  it('renderiza a aba Compras', () => {
    render(<ShoppingScreen />);
    expect(screen.getByText('Compras')).toBeTruthy();
  });

  it('renderiza a aba Cozinha', () => {
    render(<CookingScreen />);
    expect(screen.getByText('Cozinha')).toBeTruthy();
  });
});