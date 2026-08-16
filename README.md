# 🪒 Barbearia Retro — SaaS de agendamento com UI Windows XP / BIOS

> Uma barbearia com cara dos anos 2000, feita pra agendar em menos de 1 minuto.
> Cliente escolhe serviço, barbeiro e horário. Dono vê a agenda do dia numa "janela XP".

![Status](https://img.shields.io/badge/status-MVP-blue)
![Stack](https://img.shields.io/badge/stack-React%2019%20%2B%20TS%20%2B%20Vite-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Proposta

Pequenas barbearias ainda usam caderno, WhatsApp solto ou sistemas genéricos.
Esse projeto entrega um SaaS com:

- **Identidade visual retrô marcante** (boot estilo BIOS, janelas e botões Windows XP)
- **Fluxo de agendamento em 4 passos** com confirmação instantânea
- **Painel do dono** com agenda agrupada por dia e total de faturamento
- **Estado persistido em `localStorage`** (sem backend no MVP — sobrevive ao refresh)

É um projeto de portfólio focado em **decisões técnicas defensáveis** e em uma
história visualmente forte pra conversar em entrevista.

---

## 🎬 Preview

```
[B I O S   P O S T]  →  [Área de Trabalho XP]  →  [Janela de Agendamento]
   (animado, ~3s)          (verde-azulado)           (4 passos)
```

> GIF demo em breve — abra um PR se quiser contribuir com um.

---

## 🧱 Stack

| Camada            | Escolha                  | Por quê                                                          |
|-------------------|--------------------------|------------------------------------------------------------------|
| Build             | **Vite 8**               | HMR rápido, build enxuto (82 KB gzip).                            |
| UI                | **React 19 + TypeScript**| Tipagem evita bugs de prop drilling; 19 traz concurrent rendering.|
| Estilo            | **Tailwind CSS 3**       | Tokens XP customizados em `tailwind.config.js`. Sem `shadcn/ui`. |
| Estado            | **Zustand 5**            | 1.4 KB. Com persist middleware → `localStorage` automático.      |
| Datas             | **date-fns 4**           | Locale `pt-BR` pro painel do dono.                                |
| Identidade visual | **CSS puro**             | Componentes `TitleBar`, `Window`, `Button`, `OptionCard` feitos à mão.|

> **Decisão consciente:** nada de `shadcn/ui`. O tema XP é tão específico que
> componentes genéricos só atrapalhariam. Tudo é construído em `src/components/ui/*`.

---

## 🗂 Estrutura

```
src/
├── App.tsx                       # Máquina de estados: boot → desktop
├── components/
│   ├── screens/
│   │   ├── BIOSBootScreen.tsx    # Tela de boot estilo Award/Phoenix
│   │   ├── Desktop.tsx           # Área de trabalho + taskbar
│   │   ├── Welcome.tsx           # Janela inicial
│   │   ├── BookingFlow.tsx       # Wizard de 4 passos
│   │   └── AdminPanel.tsx        # Agenda do dono
│   └── ui/
│       ├── Window.tsx            # Moldura XP
│       ├── TitleBar.tsx          # Faixa azul
│       ├── Button.tsx            # Botão elevado / pressionado
│       ├── Field.tsx             # Input estilo sunken
│       ├── OptionCard.tsx        # Tile selecionável
│       └── TaskbarButton.tsx     # Botão da barra inferior
├── data/services.ts              # Mock de serviços, barbeiros e slots
├── store/booking.ts              # Zustand + persist
└── lib/
    ├── cn.ts                     # clsx + tailwind-merge
    └── format.ts                 # formatBRL, formatDuration
```

---

## 🚀 Rodar local

```bash
# Pré-requisitos: Node 18+
git clone <url>
cd barbearia-retro
npm install
npm run dev
```

Abre em <http://localhost:5173>.

---

## 🧪 Scripts

```bash
npm run dev      # dev server
npm run build    # build de produção (gera ./dist)
npm run preview  # serve ./dist localmente
npm run lint     # oxlint
```

---

## 🗺 Roadmap

| Versão | Entrega |
|--------|---------|
| **v0.1 (atual)** | Boot BIOS + Desktop XP + booking wizard + admin panel. 100% client-side.|
| v0.2    | Backend Node + Express + Postgres (Prisma). Autenticação do dono.        |
| v0.3    | Integração WhatsApp (lembrete 1h antes — encaixa com Cliqbot).            |
| v0.4    | Multi-tenant (uma instância, várias barbearias).                          |
| v0.5    | PWA — instalar no celular do dono + funcionar offline.                    |
| v1.0    | Relatórios de faturamento + exportação CSV.                               |

---

## 🔐 Segurança (já aplicada no MVP)

- Sem secrets no código (`.env.example` no roadmap v0.2).
- Sem dependências com vulnerabilidades conhecidas (`npm audit` limpo).
- Validação de tipos em **tempo de build** via TypeScript estrito.
- Persistência isolada por `name` no `localStorage` — não polui storage alheio.

---

## 🤝 Por que esse projeto conta uma história boa em entrevista?

1. **Decisão de design assumida** — escolhi **não usar** `shadcn/ui` por motivo.
2. **Identidade própria** — quem vê o GIF lembra, isso vira conversa.
3. **Código limpo, separado em camadas** — `ui/`, `screens/`, `data/`, `store/`, `lib/`.
4. **Sem mágica** — todos os efeitos (boot, sombras XP, blinking cursor) são CSS puro + `setTimeout`/`setInterval` básico.
5. **Roadmap real** — backend, auth e multi-tenant são próximos passos naturais.

---

## 📝 Licença

MIT — use, modifique, distribua.
