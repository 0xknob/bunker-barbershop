/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      // Paleta XP clássica + tons de BIOS (azul escuro / ciano)
      colors: {
        xp: {
          sky: '#245edb',       // Azul-título clássico do XP
          skyDark: '#0831d9',   // Gradiente inferior da titlebar
          taskbar: '#1f5cda',   // Barra de tarefas
          taskbarLight: '#3b8cf3',
          paper: '#ece9d8',     // Fundo de janela
          paperDark: '#d6d2c2',
          chrome: '#ffffff',    // Borda clara
          chromeShadow: '#7a7a7a', // Borda escura
          text: '#1f1f1f',
          green: '#3b8c3b',
          red: '#b22222',
        },
        bios: {
          bg: '#000000',
          fg: '#aaaaaa',        // Cinza clássico do boot
          bright: '#ffffff',
          accent: '#00ff00',
        },
      },
      fontFamily: {
        mono: ['"Lucida Console"', '"Courier New"', 'monospace'],
        sans: ['"Trebuchet MS"', 'Tahoma', 'Verdana', 'sans-serif'],
      },
      boxShadow: {
        // Janela XP: borda branca em cima/esquerda, cinza embaixo/direita
        // Tailwind v3: usamos array de strings separadas pra cada sombra
        xpRaised: [
          'inset 1px 1px 0 #ffffff',
          'inset -1px -1px 0 #7a7a7a',
          '1px 1px 0 #ffffff',
          '-1px -1px 0 #7a7a7a',
        ].join(', '),
        xpPressed: [
          'inset 1px 1px 0 #7a7a7a',
          'inset -1px -1px 0 #ffffff',
        ].join(', '),
        // Single-shadow fallback pra casos simples
        'xp-card': '2px 2px 0 #7a7a7a',
      },
    },
  },
  plugins: [],
};
