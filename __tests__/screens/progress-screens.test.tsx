import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import type { WeighIn } from '@/src/types';

const mockSave = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn() }),
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

let mockWeighIns: WeighIn[] = [];

jest.mock('@/src/services/weigh-ins', () => ({
  listWeighIns: async () => mockWeighIns,
  saveWeighIn: async () => {
    mockSave();
  },
  deleteWeighIn: async () => undefined,
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: async () => ({ canceled: true, assets: null }),
}));

import ProgressScreen from '@/app/progress';

function weighIn(overrides: Partial<WeighIn> = {}): WeighIn {
  return {
    id: 1,
    user_id: 1,
    date: '2026-01-05',
    weight: 80,
    photo_uri: null,
    measurements: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockWeighIns = [];
  mockSave.mockClear();
});

describe('ProgressScreen', () => {
  it('convida a registrar o peso quando não há histórico', async () => {
    render(<ProgressScreen />);

    expect(await screen.findByText('Registre o peso para ver a evolução.')).toBeTruthy();
  });

  it('mostra o peso atual e o total acumulado', async () => {
    mockWeighIns = [weighIn(), weighIn({ id: 2, date: '2026-01-20', weight: 78.4 })];

    render(<ProgressScreen />);

    expect(await screen.findByText('78,4 kg')).toBeTruthy();
    expect(screen.getByText('−1,6 kg')).toBeTruthy();
  });

  it('aceita peso com vírgula decimal', async () => {
    render(<ProgressScreen />);

    fireEvent.changeText(await screen.findByLabelText('Peso de hoje em quilogramas'), '82,4');
    fireEvent.press(screen.getByText('Salvar peso'));

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  });

  it('recusa peso inválido sem chamar o service', async () => {
    render(<ProgressScreen />);

    fireEvent.changeText(await screen.findByLabelText('Peso de hoje em quilogramas'), 'abc');
    fireEvent.press(screen.getByText('Salvar peso'));

    expect(await screen.findByText('Informe um peso válido, como 82,4.')).toBeTruthy();
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('esconde a seção de fotos quando nenhuma pesagem tem imagem', async () => {
    mockWeighIns = [weighIn()];

    render(<ProgressScreen />);

    expect(await screen.findByText('Evolução')).toBeTruthy();
    expect(screen.queryByText('Fotos')).toBeNull();
  });

  it('mostra a timeline quando existe pesagem com foto', async () => {
    mockWeighIns = [weighIn({ photo_uri: 'file:///foto.jpg' })];

    render(<ProgressScreen />);

    expect(await screen.findByText('Fotos')).toBeTruthy();
    expect(screen.getByText('5 jan')).toBeTruthy();
  });

  it('avisa quando a foto guardada não abre mais', async () => {
    mockWeighIns = [weighIn({ photo_uri: 'file:///apagada.jpg' })];

    render(<ProgressScreen />);

    const images = await screen.findAllByTestId('photo-image');
    fireEvent(images[0], 'error', { nativeEvent: { error: 'not found' } });

    expect(await screen.findByText('Foto indisponível')).toBeTruthy();
  });
});
