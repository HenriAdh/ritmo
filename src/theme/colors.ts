import paletteJson from './palette.json';

export type ColorToken = 'primary' | 'danger' | 'success' | 'warning';

export type Shade = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

export type InkToken =
  | 'strong'
  | 'muted'
  | 'faint'
  | 'subtle'
  | 'inverse'
  | 'onAccent'
  | 'surface';

type Scale = Record<`${Shade}`, string> & { DEFAULT: string };

type Mode = {
  light: string;
  dark: string;
};

const palette: {
  colors: Record<ColorToken, Scale>;
  ink: Record<InkToken, Mode>;
} = paletteJson;

/**
 * Tom cru de um token semantico, para as posicoes que nao aceitam className:
 * `tabBarActiveTintColor`, `placeholderTextColor`, props de svg e o `color` do
 * ActivityIndicator. Para cor de fundo, borda ou texto use a classe
 * (`bg-primary-600`, `text-danger-500`) em vez desta funcao.
 */
export function shade(token: ColorToken, level: Shade): string {
  return palette.colors[token][level];
}

/**
 * Neutro de esquema duplo, usado onde o codigo precisa do hex. Os tons sao os
 * que o app usava antes deste arquivo, entao nada muda na tela.
 */
export function ink(token: InkToken, isDark: boolean): string {
  return palette.ink[token][isDark ? 'dark' : 'light'];
}
