import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';

const INSETS = { top: 47, bottom: 0, left: 0, right: 0 };

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => INSETS,
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

describe('ScreenHeader', () => {
  it('mostra título e subtítulo', () => {
    render(<ScreenHeader title="Treinos" subtitle="3 cadastrados" />);

    expect(screen.getByText('Treinos')).toBeTruthy();
    expect(screen.getByText('3 cadastrados')).toBeTruthy();
  });

  it('omite o subtítulo quando não informado', () => {
    render(<ScreenHeader title="Planejar" />);

    expect(screen.getByText('Planejar')).toBeTruthy();
    expect(screen.queryByText('3 cadastrados')).toBeNull();
  });

  it('não desenha o botão de voltar sem onBack', () => {
    render(<ScreenHeader title="Hoje" />);

    expect(screen.queryByLabelText('Voltar')).toBeNull();
  });

  it('chama onBack ao pressionar voltar', () => {
    const onBack = jest.fn();
    render(<ScreenHeader title="Treino A" onBack={onBack} />);

    fireEvent.press(screen.getByLabelText('Voltar'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('desenha todas as ações e dispara o onPress de cada uma', () => {
    const onEdit = jest.fn();
    const onSave = jest.fn();

    render(
      <ScreenHeader
        title="Arroz com feijão"
        onBack={jest.fn()}
        actions={[
          { label: 'Editar', onPress: onEdit },
          { label: 'Salvar', onPress: onSave },
        ]}
      />,
    );

    expect(screen.getByText('Editar')).toBeTruthy();
    expect(screen.getByText('Salvar')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Editar'));
    fireEvent.press(screen.getByLabelText('Salvar'));

    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('não dispara ação desabilitada', () => {
    const onPress = jest.fn();
    render(<ScreenHeader title="Treinos" actions={[{ label: 'Novo', onPress, disabled: true }]} />);

    fireEvent.press(screen.getByLabelText('Novo'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('não dispara ação enquanto está carregando', () => {
    const onPress = jest.fn();
    render(<ScreenHeader title="Treinos" actions={[{ label: 'Salvar', onPress, loading: true }]} />);

    fireEvent.press(screen.getByLabelText('Salvar'));

    expect(onPress).not.toHaveBeenCalled();
    expect(screen.queryByText('Salvar')).toBeNull();
  });

  it('renderiza conteúdo solto no slot direito', () => {
    render(<ScreenHeader title="Supino reto" right={<Text>2/5</Text>} />);

    expect(screen.getByText('2/5')).toBeTruthy();
  });

  it('soma o respiro do título ao inset da safe area', () => {
    render(<ScreenHeader title="Treinos" />);

    const header = screen.getByTestId('screen-header');
    const style = header.props.style as { paddingTop: number };

    expect(style.paddingTop).toBe(INSETS.top + 12);
  });
});
