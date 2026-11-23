# Design system — Barber SaaS

Fonte de verdade visual: **Figma** → https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy

| Página do Figma | Conteúdo |
|---|---|
| [Capa](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=21-1375) | Apresentação do protótipo |
| [🎨 Foundations](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=15-2) | Paleta, tokens Dark/Light, tipografia, espaçamento, raio, elevação |
| [🧩 Componentes](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-2) | 38 ícones + 23 componentes com variantes |
| 📱 Telas — Protótipo | 23 telas mobile + demo tema claro, com navegação clicável |

Documentos relacionados:
- [`design/tokens.json`](design/tokens.json) — todos os tokens no formato DTCG (primitivas, cores Dark/Light, espaço, raio, tipografia, sombras)
- [`design/components.md`](design/components.md) — catálogo de componentes, variantes e propriedades
- [`design/screens.md`](design/screens.md) — telas, fluxos e interações do protótipo

---

## 1. Direção visual

**Barbearia premium, escura e quente.** Pesquisada no Dribbble:

| Referência | Autor | O que aproveitamos |
|---|---|---|
| [Luxury Barber Shop Mobile App UI/UX Design](https://dribbble.com/shots/27793389-Luxury-Barber-Shop-Mobile-App-UI-UX-Design) | Sk Raju Hossin | Preto quente `#0B0907`, oxblood `#592316`, cobre `#A9543C`, foto ambiente com degradê |
| [StyleConnect – Find Your Perfect Barber App](https://dribbble.com/shots/26739633-StyleConnect-Find-Your-Perfect-Barber-App) | Tajkim Masum | Dourado âmbar `#FFAD01` como ação, cobre `#BE8F6C`, botões e navegação em pílula |

Princípios:
1. **Fundo escuro, ação dourada.** O dourado aparece só no que o usuário deve tocar (CTA, horário selecionado, aba ativa).
2. **Serifa para identidade, sans para trabalho.** Playfair Display em títulos de destaque; Manrope em toda a interface.
3. **Pílulas e cantos generosos.** Botões, chips e navegação em `radius/full`; cards em `radius/xl`.
4. **Mobile-first, 390 × 844.** Áreas de toque ≥ 44 px; rodapé fixo com a ação principal.
5. **Tema claro disponível.** Mesmos componentes, só troca o modo da coleção de cores.

## 2. Arquitetura de tokens

```
Primitives (1 modo, ocultos)  →  Color (Dark | Light)  →  componentes / telas
                                   Spacing · Radius (1 modo)
```
- **Primitives**: valores brutos (`neutral/950`, `gold/500`…). Nunca usados direto em tela.
- **Color**: tokens semânticos que apontam (alias) para primitivas, com modo Dark (padrão) e Light.
- **Spacing / Radius**: escalas numéricas ligadas a padding, gap e cantos.
- Cada variável tem *code syntax* WEB = nome da CSS var usada no código.

### 2.1 Paleta primitiva

| Família | Tons |
|---|---|
| neutral | 950 `#0B0907` · 900 `#15120F` · 850 `#1D1915` · 800 `#26211C` · 700 `#37302A` · 600 `#4A433B` · 500 `#8E8579` · 400 `#B5AC9F` · 300 `#CFC9C0` · 200 `#E2DDD5` · 100 `#EFECE7` · 50 `#F8F6F2` · 0 `#FFFFFF` |
| gold | 950 `#2B210C` · 700 `#8A5A00` · 600 `#D18E00` · 500 `#FFAD01` · 400 `#FFC23D` · 200 `#FFE3A3` · 100 `#FFF4DA` |
| copper | 600 `#8F4430` · 500 `#A9543C` · 400 `#BE8F6C` · 200 `#E8D3C2` |
| oxblood | 700 `#592316` · 500 `#8A3A26` |
| red | 950 `#34130F` · 600 `#C2362F` · 400 `#F2675F` · 100 `#FBE4E1` |
| green | 950 `#10271B` · 600 `#1E7F4E` · 400 `#47D18C` · 100 `#E1F4E9` |

### 2.2 Cores semânticas

| Token (Figma) | CSS var | Tailwind | Dark | Light | Uso |
|---|---|---|---|---|---|
| bg/canvas | `--color-bg-canvas` | `bg-canvas` | `#0B0907` | `#F8F6F2` | Fundo da tela |
| bg/surface | `--color-bg-surface` | `bg-surface` | `#15120F` | `#FFFFFF` | Cards, campos |
| bg/surface-raised | `--color-bg-surface-raised` | `bg-raised` | `#1D1915` | `#FFFFFF` | Navegação, sheets, plano em destaque |
| bg/muted | `--color-bg-muted` | `bg-muted` | `#26211C` | `#EFECE7` | Botão secundário, trilhos |
| bg/inverse | `--color-bg-inverse` | `bg-inverse` | `#F8F6F2` | `#0B0907` | Elementos invertidos |
| border/default | `--color-border-default` | `border-line` | `#37302A` | `#E2DDD5` | Bordas de cards |
| border/strong | `--color-border-strong` | `border-line-strong` | `#4A433B` | `#CFC9C0` | Botão outline, controles vazios |
| border/focus | `--color-border-focus` | `border-focus` | `#FFAD01` | `#D18E00` | Foco de campo |
| text/primary | `--color-text-primary` | `text-fg` | `#F8F6F2` | `#0B0907` | Texto principal |
| text/secondary | `--color-text-secondary` | `text-fg-muted` | `#B5AC9F` | `#4A433B` | Metadados, apoio |
| text/disabled | `--color-text-disabled` | `text-fg-disabled` | `#4A433B` | `#CFC9C0` | Horários indisponíveis |
| text/on-accent | `--color-text-on-accent` | `text-on-accent` | `#0B0907` | `#0B0907` | Texto sobre dourado |
| text/inverse | `--color-text-inverse` | — | `#0B0907` | `#F8F6F2` | Texto sobre bg/inverse |
| text/accent | `--color-text-accent` | `text-fg-accent` | `#FFC23D` | `#8A5A00` | Links, overlines, preço selecionado |
| accent/default | `--color-accent-default` | `bg-accent` | `#FFAD01` | `#FFAD01` | CTA, seleção |
| accent/pressed | `--color-accent-pressed` | `bg-accent-pressed` | `#D18E00` | `#D18E00` | Hover/pressionado |
| accent/subtle | `--color-accent-subtle` | `bg-accent-subtle` | `#2B210C` | `#FFF4DA` | Fundo de item selecionado, notas |
| brand/copper | `--color-brand-copper` | `bg-copper` | `#BE8F6C` | `#A9543C` | Avatares |
| brand/oxblood | `--color-brand-oxblood` | `bg-oxblood` | `#592316` | `#592316` | Hero, degradês |
| success/fg | `--color-success-fg` | `text-success` | `#47D18C` | `#1E7F4E` | Concluído, Ativa |
| success/subtle | `--color-success-subtle` | `bg-success-subtle` | `#10271B` | `#E1F4E9` | Fundo de badge |
| danger/fg | `--color-danger-fg` | `text-danger` | `#F2675F` | `#C2362F` | Cancelar, erros |
| danger/subtle | `--color-danger-subtle` | `bg-danger-subtle` | `#34130F` | `#FBE4E1` | Botão Danger, alertas |

**Contraste:** dourado `#FFAD01` com texto `#0B0907` ≈ 11:1. `text/secondary` sobre `bg/canvas` (dark) ≈ 8:1. `text/disabled` é intencionalmente baixo (só para estados indisponíveis, sempre acompanhado de tachado).

## 3. Tipografia

Fontes Google: **Playfair Display** (600, 700) e **Manrope** (400–800), carregadas via `next/font/google`.

| Estilo (Figma) | Classe | Fonte | Tamanho / altura | Uso |
|---|---|---|---|---|
| Display/Large | `text-display-lg` | Playfair Bold | 36 / 42, −0.5 | Nome da barbearia, título de login |
| Display/Medium | `text-display-md` | Playfair Bold | 28 / 34, −0.3 | Títulos de confirmação |
| Display/Small | `text-display-sm` | Playfair SemiBold | 22 / 28 | Títulos de seção e de página do painel |
| Title/Large | `text-title-lg` | Manrope ExtraBold | 20 / 26 | Cabeçalhos de lista |
| Title/Medium | `text-title-md` | Manrope Bold | 17 / 22 | AppBar |
| Title/Small | `text-title-sm` | Manrope Bold | 15 / 20 | Nome em cards |
| Body/Large | `text-body-lg` | Manrope Regular | 16 / 24 | Valor de campo, parágrafos |
| Body/Medium | `text-body-md` | Manrope Regular | 14 / 20 | Texto padrão |
| Body/Medium Strong | — | Manrope SemiBold | 14 / 20 | Rótulos de campo |
| Body/Small | `text-body-sm` | Manrope Medium | 12 / 16 | Metadados, ajuda |
| Label/Large | `text-label-lg` | Manrope Bold | 16 / 20 | Botão Large |
| Label/Medium | `text-label-md` | Manrope Bold | 14 / 18 | Botão Medium, chips |
| Label/Small | — | Manrope SemiBold | 11 / 14, +0.2 | Badges |
| Overline | `text-overline` | Manrope Bold, MAIÚSCULAS | 11 / 14, +1.6 | "PASSO 2 DE 4", rótulos de seção |
| Numeric/Large | — | Manrope ExtraBold | 32 / 36 | Preço do plano |
| Numeric/Medium | `text-numeric-md` | Manrope ExtraBold, tabular | 17 / 22 | Horário na agenda |

## 4. Espaçamento, raio e elevação

**Espaçamento (base 4):** `0` 0 · `2xs` 2 · `xs` 4 · `sm` 8 · `md` 12 · `lg` 16 · `xl` 20 · `2xl` 24 · `3xl` 32 · `4xl` 40 · `5xl` 48.
Margem lateral das telas: 24 px. Gap entre cards: 12–16 px.

**Raio:** `sm` 8 (checkbox, pílulas de horário) · `md` 12 (campos, ícones) · `lg` 16 (notas, stat cards) · `xl` 20 (cards) · `2xl` 28 (plano, painéis) · `full` 999 (botões, chips, nav).

**Elevação:**
| Estilo | Valor | Uso |
|---|---|---|
| Elevation/Card | 0 6 18 rgba(0,0,0,.28) | Notificação push |
| Elevation/Floating | 0 16 40 rgba(0,0,0,.5) | BottomNav flutuante |
| Glow/Accent | 0 10 28 −4 rgba(255,173,1,.35) | Horário selecionado, FAB, plano em destaque |

## 5. Iconografia

Base **Lucide**, traço 2 px, grade 24 px. No Figma são componentes `Icon/<nome>` trocáveis por *instance swap*; no código use `lucide-react`.
Ícones disponíveis: chevron-left/right/down, calendar, clock, scissors, user, users, menu, bell, check, plus, x, map-pin, share, copy, phone, message, credit-card, lock, eye, info, alert, trash, logout, store, history, tag, globe, refresh, upload, smartphone, star, search, home, chart, more, settings.

## 6. Temas

- Padrão: **Dark** (`<html data-theme="dark">`).
- **Light**: `data-theme="light"` em qualquer elemento troca todos os tokens (no Figma, mudar o modo da coleção Color no frame). Demonstração: tela "P1 · Agenda (tema Light)".

## 7. Do Figma para o código

| Figma | Código |
|---|---|
| Variáveis Color/Spacing/Radius | `src/app/globals.css` (`:root`, `[data-theme]`, `@theme`) |
| Text styles | utilitários `@utility text-*` em `globals.css` |
| Effect styles | `shadow-card`, `shadow-floating`, `shadow-glow` |
| Button / Badge / Input | `src/components/ui/*` |
| BottomNav | `src/components/painel/bottom-nav.tsx` |

Regras: não usar hex solto em componentes; não criar cor nova sem criar o token no Figma e em `globals.css`; manter os nomes iguais nos dois lados.
