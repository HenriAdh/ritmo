import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';

import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';

jest.mock('expo-router', () => ({
  Link: ({ children }: { children: ReactNode }) => children,
}));

describe('telas de autenticação', () => {
  it('renderiza a tela de login', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Ritmo')).toBeTruthy();
    expect(screen.getByText('Entrar')).toBeTruthy();
  });

  it('renderiza a tela de cadastro', () => {
    render(<RegisterScreen />);
    expect(screen.getByText('Criar conta')).toBeTruthy();
  });
});