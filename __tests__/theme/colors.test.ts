import palette from '@/src/theme/palette.json';
import { ink, shade, type ColorToken, type InkToken } from '@/src/theme/colors';

const COLOR_TOKENS: ColorToken[] = ['primary', 'danger', 'success', 'warning'];
const INK_TOKENS: InkToken[] = [
  'strong',
  'muted',
  'faint',
  'subtle',
  'inverse',
  'onAccent',
  'surface',
];
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

const HEX_6 = /^#[0-9a-f]{6}$/;

/** Luminancia relativa, conforme WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [0, 2, 4].map((i) => parseInt(hex.slice(i + 1, i + 3), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('tokens de cor', () => {
  it('primary usa o violeta de marca #7C3AED', () => {
    expect(shade('primary', 600)).toBe('#7c3aed');
  });

  it('expõe a mesma escala de tons em todos os tokens de cor', () => {
    for (const token of COLOR_TOKENS) {
      for (const level of SHADES) {
        expect(shade(token, level)).toMatch(HEX_6);
      }
    }
  });

  it('mantém o DEFAULT de cada familia dentro da propria escala', () => {
    // O DEFAULT e o que `bg-primary` usa quando a classe nao traz tom, entao
    // ele precisa ser um tom que ja exista na escala.
    for (const token of COLOR_TOKENS) {
      const scale = palette.colors[token];
      expect(scale.DEFAULT).toMatch(HEX_6);
      expect(Object.values(scale)).toContain(scale.DEFAULT);
    }
  });

  it('devolve o tom do esquema pedido em ink', () => {
    expect(ink('strong', false)).toBe('#171717');
    expect(ink('strong', true)).toBe('#fafafa');
  });

  it('tem os dois esquemas em todo token de ink', () => {
    for (const token of INK_TOKENS) {
      expect(ink(token, false)).toMatch(HEX_6);
      expect(ink(token, true)).toMatch(HEX_6);
    }
  });

  it('onAccent e branco nos dois esquemas, para texto sobre primary', () => {
    expect(ink('onAccent', false)).toBe('#ffffff');
    expect(ink('onAccent', true)).toBe('#ffffff');
  });
});

describe('contraste das cores de marca', () => {
  // O botao primario e a unica superficie que usa primary como fundo, entao
  // estes tres tons nao podem perder o AA de 4.5:1 para texto branco.
  it.each([600, 700] as const)('branco sobre primary-%i passa AA', (level) => {
    expect(contrast(shade('primary', level), '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('primary-500 nao passaria com texto branco, por isso nao e fundo de botao', () => {
    expect(contrast(shade('primary', 500), '#ffffff')).toBeLessThan(4.5);
  });

  it('texto de estado continua legivel no card claro e no card escuro', () => {
    // bg-primary-100 com text-primary-700, e o inverso no dark.
    expect(contrast(shade('primary', 700), shade('primary', 100))).toBeGreaterThanOrEqual(4.5);
    expect(contrast(shade('primary', 300), shade('primary', 900))).toBeGreaterThanOrEqual(4.5);
  });
});
