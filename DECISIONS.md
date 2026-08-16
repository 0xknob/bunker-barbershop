# Histórico de decisões técnicas — Barbearia Retro

## Stack escolhida
- **Vite + React 19 + TS**: stack moderna, build rápido, type-safety em tempo de build.
- **Tailwind v3 (não v4)**: ecossistema maduro, plugins estáveis, sem `shadcn/ui` por decisão de identidade.
- **Zustand 5 + persist**: estado mínimo (1.4 KB) e sincronização automática com `localStorage`.
- **date-fns 4**: `pt-BR` para o painel do dono sem carregar o bundle inteiro.

## Identidade visual
- BIOS boot: linhas de POST geradas a partir de uma tupla `[texto, delay]`. Total ~3,4 s.
- Janelas XP: gradiente azul na titlebar (`xp.sky` → `xp.skyDark`), sombra dupla `shadow-xpRaised`.
- Cursor `cursor-blink` 1 Hz (CSS puro) sem libs externas.

## O que NÃO entrou (e por quê)
- **Backend**: focar no fluxo visual + lógica de negócio. Persistência via `localStorage` é o suficiente pra demo.
- **Drag-and-drop de janelas**: proposital. Mantém escopo enxuto; quando virar PWA pode entrar uma lib.
- **shadcn/ui**: a identidade XP é o diferencial — componentes genéricos a diluiriam.
- **i18n**: o app é PT-BR por design. i18n no MVP só atrapalha.

## Próximas decisões a tomar
- Banco de dados: Postgres direto vs Supabase. Trade-off: Supabase acelera auth/storage; Postgres puro dá controle total.
- Integração WhatsApp: reusar Cliqbot ou criar serviço dedicado? Avaliar isolamento.
