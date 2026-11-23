# Componentes

Biblioteca no Figma: [🧩 Componentes](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-2).
Todos usam variáveis de cor (Dark/Light), espaçamento, raio, text styles e effect styles.
Coluna **Código** indica o componente React correspondente (✅ pronto · ⏳ a fazer).

| Componente | Figma | Variantes | Propriedades | Código |
|---|---|---|---|---|
| **Button** | [10:47](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=10-47) | Variant: Primary · Secondary · Outline · Ghost · Danger — Size: Large (56) · Medium (44) | Label (texto), Icon (swap), Show icon (bool) | ✅ `components/ui/button.tsx` |
| **IconButton** | [10:60](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=10-60) | Variant: Surface · Accent · Ghost (44 px, circular) | Icon (swap) | ⏳ |
| **Badge** | [9:245](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-245) | Tone: Accent · Success · Danger · Neutral | Label | ✅ `components/ui/badge.tsx` |
| **Chip** | [10:68](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=10-68) | Selected: Yes · No | Label | ⏳ |
| **Input** | [10:90](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=10-90) | State: Default · Focused · Error | Label, Value, Prefix, Helper, Show prefix, Show helper | ✅ `components/ui/input.tsx` |
| **Note** | [10:108](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=10-108) | Tone: Info · Success · Danger | Text | ⏳ |
| **Toggle** | [9:253](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-253) | State: On · Off | — | ⏳ |
| **Checkbox** | [9:265](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-265) | Checked: Yes · No | — | ⏳ |
| **Radio** | [9:266](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-266) | Selected: Yes · No | — | ⏳ |
| **Avatar** | [9:276](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-276) | Size: S (32) · M (48) · L (64) | Initials | ⏳ |
| **StatusBar** | [9:277](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=9-277) | — | — | (só protótipo) |
| **AppBar** | [12:12](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-12) | — | Title, Show action | ⏳ |
| **BottomNav** | [12:110](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-110) | Active: Agenda · Serviços · Equipe · Mais | — | ✅ `components/painel/bottom-nav.tsx` |
| **Stepper** | [12:142](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-142) | Step: 1 · 2 · 3 · 4 | Label | ⏳ |
| **Segmented** | [12:156](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-156) | Active: First · Second | First, Second | ⏳ |
| **SlotChip** | [12:166](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-166) | State: Available · Selected · Unavailable | Time | ⏳ |
| **DateChip** | [12:179](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=12-179) | State: Default · Selected · Closed | Weekday, Day | ⏳ |
| **ServiceCard** | [14:85](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-85) | Selected: Yes · No | Name, Duration, Price | ⏳ |
| **ProfessionalCard** | [14:105](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-105) | Selected: Yes · No | Name, Meta, Avatar (instância exposta) | ⏳ |
| **AgendaItem** | [14:153](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-153) | Status: Confirmado · Concluído · Cancelado · Não compareceu ("Faltou") | Hora, Duração, Cliente, Serviço | ✅ inline em `painel/agenda/page.tsx` |
| **ListItem** | [14:154](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-154) | — | Title, Subtitle, Icon, Show badge, Badge (exposta) | ⏳ |
| **DetailRow** | [14:170](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-170) | — | Label, Value, Icon | ⏳ |
| **PushNotification** | [14:181](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-181) | — | Title, Body, Time, App | (só protótipo; o real é do SO) |
| **StatCard** | [14:196](https://www.figma.com/design/ipC7Fq18HYOpvrg1RSvBKy?node-id=14-196) | — | Value, Label | ⏳ |

## Especificações rápidas

- **Button** — pílula; Large `h-14 px-6 text-label-lg`, Medium `h-11 px-4 text-label-md`. Primary `bg-accent text-on-accent`; Secondary `bg-muted`; Outline `border-line-strong`; Ghost `text-fg-accent`; Danger `bg-danger-subtle text-danger`. Em rodapés, largura total.
- **Input** — rótulo `Body/Medium Strong` secundário; campo 54 px, `radius/md`, `bg-surface`, borda `border-line` → `border-focus` (1.5) no foco → `danger` no erro; prefixo (ex.: `+55`, `R$`, `barbersaas.app/`) em secundário.
- **SlotChip** — 76 × 48, `radius/md`. Selecionado: dourado + `Glow/Accent`. Indisponível: borda tracejada, texto `text/disabled` tachado. Grade de 4 por linha com gap 12.
- **DateChip** — 50 × 78, cápsula; dia da semana em `Label/Small`, número em `Numeric/Medium`. Fechado: tracejado e tachado.
- **BottomNav** — container 390 × 100, pílula `bg-raised` com `Elevation/Floating`; aba ativa expande em dourado com rótulo; inativas só ícone (52 × 52).
- **AgendaItem** — coluna de horário (52 px), barra vertical de 3 px na cor do status, cliente + serviço·profissional, badge à direita. Cancelado/Faltou: nome tachado.
- **ServiceCard / ProfessionalCard** — card `radius/xl`, selecionado com `accent/subtle` + borda dourada 1.5 + Radio marcado.
