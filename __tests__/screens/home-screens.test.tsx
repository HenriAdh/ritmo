import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { DaySummary, DaySummaryItem } from '@/src/utils/day-summary';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
  useFocusEffect: (effect: () => void) => {
    effect();
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@/src/stores/auth-store', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({
      user: { id: 1, name: 'Ana', password_hash: 'hash', created_at: new Date() },
    }),
}));

const mockGetDaySummary = jest.fn<Promise<DaySummary>, [number, string, number]>();

jest.mock('@/src/services/day-summary', () => ({
  getDaySummary: (userId: number, date: string, weekday: number) =>
    mockGetDaySummary(userId, date, weekday),
}));

import HomeScreen from '@/app/(tabs)/index';

function item(overrides: Partial<DaySummaryItem> = {}): DaySummaryItem {
  return {
    key: 'workout-1',
    kind: 'workout',
    id: 1,
    title: 'Treino A',
    time: '19:00',
    status: 'pending',
    ...overrides,
  };
}

function summary(overrides: Partial<DaySummary> = {}): DaySummary {
  const items = overrides.items ?? [item()];
  return {
    items,
    next: items.find((entry) => entry.status === 'pending') ?? null,
    total: items.length,
    completed: items.filter((entry) => entry.status !== 'pending').length,
    ...overrides,
  };
}

beforeEach(() => {
  mockPush.mockReset();
  mockGetDaySummary.mockReset();
  mockGetDaySummary.mockResolvedValue(summary());
});

describe('tela Home', () => {
  it('mostra a data de hoje e o cabeçalho', async () => {
    render(<HomeScreen />);

    expect(await screen.findByText('Hoje')).toBeTruthy();
    expect(screen.getByText('Resumo do dia')).toBeTruthy();
  });

  it('mostra a próxima atividade com o que falta fazer', async () => {
    render(<HomeScreen />);

    expect(await screen.findByText('Próxima atividade')).toBeTruthy();
    // o título aparece no card e na linha do resumo
    expect(screen.getAllByText('Treino A')).toHaveLength(2);
    expect(screen.getByText('Ir para o treino')).toBeTruthy();
    expect(screen.getByText('0 de 1 concluído')).toBeTruthy();
  });

  it('abre a execução do treino ao tocar no card da próxima atividade', async () => {
    render(<HomeScreen />);

    fireEvent.press(await screen.findByLabelText('Ir para o treino: Treino A'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/workout/[id]/run',
      params: { id: '1' },
    });
  });

  it('abre a execução da refeição ao tocar na linha do resumo', async () => {
    mockGetDaySummary.mockResolvedValue(
      summary({
        items: [item({ key: 'meal-2', kind: 'meal', id: 2, title: 'Almoço', time: '12:00' })],
      }),
    );

    render(<HomeScreen />);

    fireEvent.press(await screen.findByLabelText('Almoço, Pendente'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/nutrition/[id]/run',
      params: { id: '2' },
    });
  });

  it('conta concluídos e pendentes no resumo do dia', async () => {
    mockGetDaySummary.mockResolvedValue(
      summary({
        items: [
          item({
            key: 'meal-1',
            kind: 'meal',
            id: 1,
            title: 'Café',
            time: '07:15',
            status: 'done',
          }),
          item({ key: 'workout-2', id: 2, title: 'Treino B', time: '19:00' }),
        ],
      }),
    );

    render(<HomeScreen />);

    expect(await screen.findByText('1 de 2 concluídos')).toBeTruthy();
    expect(screen.getAllByText('Treino B')).toHaveLength(2);
  });

  it('mostra estado de nada pendente quando o dia acabou', async () => {
    mockGetDaySummary.mockResolvedValue(
      summary({ items: [item({ status: 'done' })], next: null, total: 1, completed: 1 }),
    );

    render(<HomeScreen />);

    expect(await screen.findByText('Nada pendente')).toBeTruthy();
    expect(screen.getByText('1 de 1 concluído hoje.')).toBeTruthy();
    expect(screen.queryByText('Próxima atividade')).toBeNull();
  });

  it('oferece ir para o planejamento quando o dia está vazio', async () => {
    mockGetDaySummary.mockResolvedValue(summary({ items: [], next: null, total: 0, completed: 0 }));

    render(<HomeScreen />);

    expect(
      await screen.findByText('Nada planejado para hoje. Escolha o que fazer no dia da semana.'),
    ).toBeTruthy();
    // com o dia vazio não faz sentido mostrar o card de "nada pendente"
    expect(screen.queryByText('Nada pendente')).toBeNull();

    fireEvent.press(screen.getByText('Planejar o dia'));
    expect(mockPush).toHaveBeenCalledWith('/plan');
  });

  it('mostra o erro quando o resumo não carrega', async () => {
    mockGetDaySummary.mockRejectedValue(new Error('banco fora do ar'));

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText('banco fora do ar')).toBeTruthy();
    });
  });

  it('carrega o resumo do usuário logado', async () => {
    render(<HomeScreen />);

    await waitFor(() => {
      expect(mockGetDaySummary).toHaveBeenCalledWith(1, expect.any(String), expect.any(Number));
    });
  });
});
