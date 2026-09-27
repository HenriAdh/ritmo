const colors = require('./src/theme/palette.json').colors;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // Tokens semanticos. A fonte da verdade e src/theme/palette.json, o
      // mesmo arquivo que o modulo src/theme/colors.ts le para as posicoes
      // que nao aceitam className (tab bar, placeholder, svg, spinner).
      // primary = violeta #7C3AED, o tom DEFAULT de cada familia.
      colors,
    },
  },
  plugins: [],
};
