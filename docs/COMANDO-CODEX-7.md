# COMANDO CODEX — 7ª rodada (continuação a partir da v0.4.22)

Continuação de `docs/COMANDO-CODEX.md`. Feito pela sessão do Claude; o Codex segue daqui.

**HEAD de referência:** commit `c5f0ba6` — "0.4.22 (WIP)". `npm test` = 130 passando.
Uma tarefa por commit, versão cumulativa. Próxima instalável = **0.4.22** (se já publicou,
sobe pra 0.4.23). Nada pendente sem commit — tudo abaixo é a fazer.

---

## Já entrou (0.4.19 → 0.4.22) — NÃO refazer

- **0.4.19** retrato de NPC pela pasta (fallback de extensão); `assetRoot` default `'assets'`.
- **0.4.20 / 0.4.21** cartão de NPC **mínimo**: só tipo, local, `NV x`, botão **Editar** e o
  **ícone de olho** no canto superior (= liberar/ocultar p/ jogadores). Lixeira no canto
  inferior direito. PV / PE / Sombra e as fichas (Legado, Herança, Classe, Trilha, Maldição,
  Antecedente) + guilda ficam **dentro de Editar**, numa faixa de resumo.
  **Regra fixa do Yuri: não voltar a poluir o cartão.**
- Papéis novos: Diplomata, Guarda, Clero, Erudito, Nobre, Espião, Curandeiro, Artesão,
  Autoridade, Agiota, Mercenário, Informante. Selects de papel / região / local em ordem
  alfabética (`sortByName` em `src/library.mjs`).
- Editor: "Abrir ficha" no cabeçalho; Vínculos / Estoque / Criar item recolhidos em
  `<details>`; campos de loja só p/ Mercador, de forja só p/ Ferreiro
  (`state.npcEditRole` transitório + `handleChange` de `npcRole` re-renderiza).
- **T35** sobrecarga arcana automática: `src/arcane-overload.mjs`, hook `updateItem`,
  setting `arcaneOverloadAuto`. Rola `Nd6` Energético ao equipar item que passa do limite
  de Fragmentos Arcanos e aplica na ficha (o sistema base só avisava).
- **T39** "Liberar tudo deste local" / "Liberar tudo da região": `CampaignLibrary.shareLocality`.
- **B16** lápis sobre a figura de região/local: `cardFigure(...,edit)` + `.sy-figure-edit`.
- **B15** `accent-color` ciano forçado nos checkboxes (creator.css + `.sy-monster-facets`).
- **T40 (parcial)** várias cenas por região: `REGION_SCENES_KEY='regionScenes'`,
  `toggleRegionScene`, `regionScenePicker`, op `lib-region-scene`. Jogador vê "Abrir <cena>".
- **T34 / T8** importar criatura de D&D 5e: `src/monster-convert.mjs`, `importMonster`,
  caixa na aba Monstros, op `lib-monster-import`. CR→ND (teto 12). Cria Actor `npc` direto;
  ataques entram como texto na biografia. Ver `memory` / doc para os limites.
- **0.4.22:** `thumb()` agora emite `data-fallback-srcs` (miniatura de item não quebra
  mais); `resolveImage` mostra `documentImg` antes da pasta p/ `monster` / `item` (NPC
  mantém pasta na frente por causa do upload de tokens do Yuri); retrato grande no editor
  (`.sy-npc-editor-portrait`); filtro de Local alfabético; `state.npcEditPlace` +
  `handleChange` de `npcPlace` → região deriva do local (falta só desabilitar o select).

---

## T-LVL — sortear nível dos NPCs "em escala" (prints: todos "NV 0")

Os NPCs da macro entram com `system.level.value` 0/1. Yuri quer um botão que **sorteie um
nível** pra eles, aleatório, dentro de uma faixa.

- `src/npc-level.mjs` (puro, com teste): `rollLevel(min, max, rng = Math.random)` →
  inteiro em `[clamp(min,1,12), clamp(max,min,12)]`.
- `CampaignLibrary.rollNpcLevels(min, max)`:
  - `this.assertGM()`.
  - alvos = `this.npcActors().filter(a => !a.hasPlayerOwner && (Number(a.system?.level?.value)||0) < 1)`.
    **Nunca** tocar Actor com dono jogador; só quem está sem nível (não regravar quem já
    tem). Isso responde o "fechei nas fichas dos PCs?" — sim, ficam de fora.
  - para cada alvo: `await actor.update({ 'system.level.value': rollLevel(min, max) })`.
  - `ui.notifications.info(...)` com a contagem.
- Op `lib-npc-roll-levels`; `data = { min, max }` lido de dois `<input type="number"
  min="1" max="12">` (`name="npcLevelMin"` / `npcLevelMax`) no toolbar de NPCs, perto do
  `<details>` de cobertura regional. Gather em `app.mjs` `handleClick`.
- Opcional (2ª opção "Sortear por papel"): peso por papel — Figurante / Informante baixo,
  Autoridade / Nobre / Clero alto. A versão uniforme é o mínimo aceitável.

---

## T37 — Guildas / Hansas (ainda faltando; Yuri cobrou 2×)

Dados prontos: `.local/guildas-foundry.json` (Actors `type:"guild"` com
`flags.quedaco.appendix`, gerados por `tools/parse-guilds.mjs`). O sistema Skyfall já tem
o tipo de Actor `guild` (abilities cunning / knowledge / crafting / reputation, `level`,
`motto` HTML, `blueprints`, `members[]`). **Não** subir o texto do apêndice para o repo.

1. **Área "Guildas"** (nova aba ao lado de NPCs / Mapa / Monstros / Itens / Imbuir):
   lista os Actors `type:'guild'` da mesa. Cartão: nome, `motto`, `level`, as 4 abilities,
   nº de membros, "Abrir ficha" e toggle "Liberar aos jogadores".
   Bucket novo em `SHARED_KEY`: adicionar `guilds:[]` em `emptyShare()` e no
   `setShare` allow-list.
2. **Importar**: botão "Importar guildas do apêndice" → lê `.local/guildas-foundry.json`
   (o Yuri coloca o arquivo), `DialogV2.confirm` com a quantidade, `Actor.create` em lote
   numa pasta "Guildas · Apêndice B". Pular as que já existem por nome.
3. **Tag no NPC**: o campo texto `flag.guild` já existe no editor. Adicionar, opcional,
   `<select name="npcGuildUuid">` com as guildas da mesa → `flag.guildUuid`; o texto
   continua valendo para guilda "de fora". Mostrar o chip só na faixa de resumo do editor
   (o cartão continua mínimo).
4. **Dossiê da região**: seção "Guildas presentes" = guildas cujos NPCs (por `guildUuid`
   ou `guild` texto) têm `placeId` / `regionId` naquela região.

---

## MAP-1 — a camada "Quedas" não mostra as quedas (print 2)

Com a camada **Quedas** selecionada no mapa, nenhum pino aparece — mas o Atlas lista
"Queda da Maré Vermelha" certinho. Causa: `defaultHiddenPlaces` coloca todos os `queda`
em `mapHidden`, e `placeVisible` (em `renderDynamicMap`) barra quem está em `mapHidden`
**mesmo quando a camada escolhida é a de Quedas**.

Correção em `renderDynamicMap`: `mapHidden` só vale para as vistas `auto` / `all`. Quando
o usuário escolhe explicitamente `cities` / `marks` / `falls`, os pinos daquela camada
aparecem mesmo estando em `mapHidden`.

```js
const respectHidden = (layer === 'auto' || layer === 'all');
const placeVisible = entry =>
  layerLets(entry.kind)
  && (!respectHidden || !hidden.has(entry.id))
  && (!readonly || placeIds.has(entry.id));
```

---

## MAP-2 — os 2 botõezinhos de cada local no Atlas estão confusos (print 1)

Cada linha de local em `renderAtlas` tem `⊘` (toggle `shareButton('map', id, …)`) e um
alfinete (`map-hide`). Yuri: "estão errados, pra que servem esses 2?". Deixar óbvio:

- **1º botão** = liberar no mapa p/ jogadores: usar o **mesmo ícone de olho** do cartão de
  NPC (`fa-eye` / `fa-eye-slash`), verde quando liberado,
  `title="Liberar no mapa"` / `"Liberado — clique para ocultar"`.
- **2º botão** = mostrar / ocultar o pino: `fa-location-dot` vs `fa-location-dot` com risco
  (ou `fa-map-pin` / `fa-ban`), `title="Ocultar do mapa"` / `"Mostrar no mapa"`.
- Padronizar a mesma dupla no cabeçalho da região (hoje "✓ Liberado / Liberar" em texto).

---

## IMG-1 — imagem de monstro "pisca" antes de carregar (print 3)

Mesmo com o `resolveImage` já preferindo `documentImg`, quando NÃO há `img` no doc (ou é
NPC) a cadeia de fallback tenta 4–8 URLs e cada 404 pisca.

- `src/images.mjs` `imageCandidates`: tirar `.jpg` e `.svg` especulativos da pasta —
  deixar só `['webp', 'png']`. O `fallback` / `documentImg` reais continuam na lista.
- Handler de `img[data-fallback-srcs]` no `_onRender` (`src/app.mjs`): manter
  `this._brokenImg ??= new Set()` de URLs que já falharam nesta sessão; ao montar a
  `queue`, pular as que estão no Set; no `error`, além de trocar o `src`,
  `this._brokenImg.add(urlQuebrada)`. Assim o 2º cartão do mesmo tipo já vai direto pro
  ícone.
- Opcional: pré-carregar com `new Image()` e só trocar o `src` visível no `onload`.

---

## IMBUE-1 — botão "Imbuir" na própria aba Imbuir (não só via NPC Ferreiro)

Hoje `renderImbue` é só calculadora ("não cria nem altera Item"). Adicionar um caminho de
**ação para o próprio personagem do jogador**, espelhando a forja do Ferreiro:

- `buyer = game.user?.character || game.canvas?.tokens?.controlled?.[0]?.actor`.
- Com `buyer`: listar os equipamentos dele (`['weapon','armor','clothing']`, sem "Ataque
  desarmado" / naturais) como em `renderForge` (`.sy-forge-inventory`), escolher o base,
  prefixos / sufixos, e um botão **"Imbuir por T$ N"** que chama
  `purchaseForgedItem({ buyer, base, sigils, markup: 1, consumeOriginal: false })`
  (ou uma `purchaseImbuedItem` nova, mesma matemática de `forgeQuote`, se não quiser
  chamar de "forja").
- Sem `buyer`: mantém só a calculadora + aviso "Associe um personagem para imbuir".
- Ops novas: `lib-imbue-base`, `lib-imbue-pay` (análogas às `lib-forge-*`); estado
  `this.imbueBuilder` igual `forgeBuilder`.

---

## IMBUE-2 — deixar claro que o custo é POR SIGILO (dúvida do Yuri)

Yuri achou que era "um pagamento só". **Não é.** Regras Skyfall (ver `SIGIL_COSTS` e
`IMBUE_COSTS` em `src/book-items.mjs`, aplicadas em `modifiedItemCost` / `forgeQuote`):

- Cada **sigilo** colocado no item é pago; o preço escala com **quantos sigilos já estão
  no item** (1º sigilo = coluna "1º", 2º = coluna "2º", …), e **prefixo + sufixo contam
  juntos** nessa contagem.
- **Imbuir** cada sigilo tem custo próprio por grau (`IMBUE_COSTS`: 1º T$ 250, 2º 1.000,
  3º 5.000, 4º a conferir).
- Material especial (+T$ 300) é uma vez só.

Ajuste na UI (forja e aba Imbuir): no breakdown, numerar cada linha —
`Sigilo 1 (Nº grau): T$ …` / `Sigilo 2 (Nº grau): T$ …` / `Imbuir sigilo 2: T$ …` — com
um **subtotal** antes da linha de margem do ferreiro. Um `<p class="sy-note">` curto:
"Paga-se por sigilo; cada sigilo a mais no mesmo item custa mais caro."

---

## EDITOR — terminar o "região segue o local"

Base já feita (`state.npcEditPlace` + `handleChange` de `npcPlace` re-renderiza; o editor
deriva `regionId` do `placeId`). Falta: quando há `placeId`, **desabilitar** o
`<select name="npcRegion">` e trocar o `<small class="sy-hint-inline">` por
"Região definida por &lt;nome da cidade&gt;". Sem local, o select de região volta a
funcionar. `saveNpc` já deriva a região do local no salvamento.

---

## Publicação (regra — o Yuri travou nisso 2×)

- **Sempre** subir a versão a cada release: `module.json`, `package.json`, entrada nova em
  `src/changelog.mjs`, `download` URL para `vX.Y.Z`, e as **duas** listas de versão em
  `tests/changelog.test.mjs`. **Nunca** republicar na mesma tag — o Foundry não atualiza.
- Tag no GitHub = `vX.Y.Z` com o `v` **colado** no número, **sem ponto** (`v0.4.22`, não
  `v.0.4.22`). Anexar `dist/quedaco.zip` **e** `dist/module.json`, marcar "latest".
- Build: `npm run release` (`powershell tools/release.ps1 -Public`) — já gera o zip com
  separador `/` (exigência do Foundry em Linux).
