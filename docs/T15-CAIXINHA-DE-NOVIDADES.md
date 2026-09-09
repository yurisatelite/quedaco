# T15 — Caixinha "O que mudou" ao atualizar o QUEDAÇO

Quando o mestre (ou jogador) abre o Foundry depois de uma atualização do módulo,
mostrar uma vez um painel com as novidades daquela versão. "Todos os módulos fazem
isso menos o nosso."

---

## Como os outros fazem

- **DnD5e, PF2e, Lancer, Monk's...**: no `ready`, comparam a versão atual com a última
  versão que o usuário viu (guardada em `client` setting ou world flag). Se subiu,
  abrem um `Dialog`/`Application` com o changelog daquela faixa de versões. Fecha =
  grava a versão vista. Botão "não mostrar de novo" opcional.
- Conteúdo: HTML curto, lista do que mudou, link para a release no GitHub.
- Escopo por usuário (`scope:'client'`) — cada pessoa vê uma vez no seu navegador,
  não uma vez por mundo.

---

## Spec

### Setting

`game.settings.register(MODULE_ID, 'lastSeenVersion', {scope:'client', config:false,
type:String, default:''})`.

### Dados do changelog

Arquivo novo **`src/changelog.mjs`**:

```js
export const CHANGELOG = [
  {
    version: '0.4.9',
    date: '2026-09-09',
    title: 'Painel de campanha, filtros e macro',
    notes: [
      'Filtros de monstro por tipo, papel, porte, deslocamento e ND (combináveis).',
      'Botão "Gerar um monstro assim" quando nenhum do livro combina.',
      'Painel de NPCs lê as pastas criadas pela macro de geração.',
      'Vínculos entre NPCs e montador de item modificado.',
    ],
  },
  // entradas mais novas vão NO TOPO
];
```

Regra: **toda release nova ganha uma entrada no topo** deste array, com as mesmas
`notes` que vão na descrição da release do GitHub. Uma versão = uma entrada.

### Gatilho (em `src/main.mjs`, no hook `ready`)

```js
const current = game.modules.get(MODULE_ID).version;
const seen = game.settings.get(MODULE_ID, 'lastSeenVersion');
if (seen !== current && isNewer(current, seen)) {
  const fresh = CHANGELOG.filter(e => isNewer(e.version, seen)); // tudo que saiu desde a última vista
  new ChangelogDialog(fresh, current).render(true);
}
```

- `isNewer(a, b)` — comparação semver pura (split por `.`, compara numérico).
  `b === ''` (primeira instalação / nunca viu) → mostrar só a entrada mais recente,
  **não** o histórico todo.
- Grava `lastSeenVersion = current` **ao fechar** o diálogo (`close()`), não ao abrir —
  se o Foundry cair antes, mostra de novo.

### Diálogo

`ApplicationV2` simples (ou `foundry.applications.api.DialogV2`) — reaproveitar o visual
Noka/azul do módulo (classe `.sy-changelog`):

```
┌─ QUEDAÇO — Novidades ────────────────┐
│  Versão 0.4.9 · 09/09/2026           │
│  Painel de campanha, filtros e macro │
│   • Filtros de monstro...            │
│   • Botão "Gerar um monstro assim"...│
│   • ...                              │
│                                      │
│  [Ver no GitHub]          [ Fechar ] │
└──────────────────────────────────────┘
```

- Se `fresh` tem mais de uma versão, listar cada uma com seu cabeçalho, mais nova em
  cima.
- "Ver no GitHub" → `https://github.com/yurisatelite/quedaco/releases` (link novo,
  `rel="noopener"`).
- Sem "não mostrar de novo": já só aparece uma vez por versão.
- Não bloquear o carregamento do mundo (render depois do `ready`, sem `await`).

### Estilos

`styles/creator.css` (ou `library.css`): `.sy-changelog` com a cara do módulo; `ul`
com marcadores discretos; largura ~480px; rolagem se passar da altura.

### Testes

`tests/changelog.test.mjs` — funções puras exportadas de `src/changelog.mjs`:
- `isNewer('0.4.9','0.4.8') === true`; `isNewer('0.4.10','0.4.9') === true`;
  `isNewer('0.4.9','0.4.9') === false`; `isNewer('0.5.0','0.4.9') === true`.
- `entriesSince(CHANGELOG, '0.4.8')` → só as entradas com `version` maior que 0.4.8.
- `entriesSince(CHANGELOG, '')` → só a entrada mais recente (comprimento 1).
- Cada entrada de `CHANGELOG` tem `version`, `date` (YYYY-MM-DD), `title`, `notes[]`
  não vazio.

### Processo daqui pra frente

No checklist de release (junto de "subir versão em `module.json`/`package.json`,
`git tag vX`"): **adicionar a entrada nova no topo de `CHANGELOG`** com as mesmas notas
da descrição da release. Anotar isso em `docs/ATUALIZACOES.md` / `CLAUDE.md` (seção
"Entrega de uma mudança").
