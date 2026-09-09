# T16 — NPCs: excluir, editar direto, e inferir o local

Contexto: a aba **NPCs** hoje separa os atores em `marked` (têm o flag
`flags.quedaco.npc`) e `detected` (`isGeneratedNpc()` mas sem flag). Os cartões
`detected` só mostram o botão **"Vincular ao painel"** e existe ainda uma caixa
**"Marcar um NPC existente"** com um `<select>` "Escolha um Actor…". O Yuri não quer
escolher/rotular ator nenhum: **o NPC gerado pela macro já é o ator**. Ele quer poder
**abrir, editar e excluir** o NPC direto no cartão, e que o painel **descubra o local**
de cada NPC gerado (hoje ficam sem local, o que impede filtrar).

Arquivos: `src/library.mjs` (`renderNpcs`, `renderNpcEditor`, `action`), `src/npcs.mjs`
(novas funções puras), `styles/library.css`, `tests/npcs.test.mjs`.

**Nada de mexer em limpeza de duplicatas** — isso é comando de console
(`docs/CONSOLE-LIMPAR-NPCS-DUPLICADOS.md`), fora do módulo.

---

## 1. Botão Excluir NPC

- Novo op `lib-npc-delete` em `action()`, **GM only** (`assertGM()`).
  ```js
  if (op === 'lib-npc-delete') {
    const actor = this.actorById(id);
    if (!actor) throw Error('NPC não encontrado.');
    const ok = await foundry.applications.api.DialogV2.confirm({
      window: { title: 'Excluir NPC' },
      content: `<p>Excluir <strong>${actor.name}</strong>? Isto apaga o Actor do mundo e não pode ser desfeito.</p>`,
    });
    if (!ok) return;
    if (this.state.npcActor === actor.id) this.state.npcActor = null;
    await actor.delete();
  }
  ```
- Botão em **todos** os cartões de NPC (detected e marked), na linha de ações:
  `${button('npc-delete', actor.id, 'Excluir')}`. Dar a ele classe `.sy-danger`.
- Nunca oferecer excluir para atores com `actor.hasPlayerOwner` — esconder o botão
  nesse caso (proteção contra apagar PC por engano).
- Readonly (jogador) nunca vê excluir/editar.

## 2. Cartão do NPC gerado já é utilizável (sem "marcar")

- Nos cartões `detected`, trocar o único botão "Vincular ao painel" pela **mesma linha
  de ações dos marcados**: `Ativar/Desativar` (quando fizer sentido) · `Editar` ·
  `Abrir ficha` · `Excluir`.
- **"Editar" num NPC detectado adota automaticamente**: se `!npcFlag(actor)`, gravar
  `flags.quedaco.npc = initialNpcFlag(actor)` (que já chama `placeIdFromFolderPath`) e
  então abrir o editor. Ou seja, `lib-npc-edit` passa a fazer:
  ```js
  if (op === 'lib-npc-edit') {
    const actor = this.actorById(id);
    if (actor && !npcFlag(actor)) await actor.update({ [`flags.${MODULE_ID}.npc`]: adoptNpcFlag(actor) });
    this.state.npcActor = id || null;
  }
  ```
- Botão **"Adotar todos os detectados"** acima da grade de detectados (GM):
  op `lib-npc-adopt-all` → para cada `detected`, `actor.update({flags.quedaco.npc: adoptNpcFlag(actor)})` em lote (`Actor.updateDocuments`), com `ui.notifications.info`.
- **Remover** da vista padrão a seção `add` ("Marcar um NPC existente" + `<select
  name="npcActor">`). Se quiser manter o caminho para adotar um ator **não** gerado
  pela macra, colocar num `<details>` recolhido "Adotar outro ator como NPC" no fim da
  aba — fora do fluxo principal.
- Ajustar textos: nada de "ainda não marcado", "Vincular ao painel". O cartão detectado
  diz só `<small>Gerado pela macro · ${placeName}</small>` e traz as ações.

## 3. Inferir o local do NPC (`src/npcs.mjs`)

Hoje `initialNpcFlag` só usa `placeIdFromFolderPath`. Muitos NPCs da macro estão soltos
em `🤖 Criados pela IA/NPCs` sem subpasta de região → ficam sem local. Adicionar
inferência por texto.

```js
export function inferPlaceId(actor, places = PLACES) {
  // 1. pasta (já cobre 🤖 NPCs por Região/<Região>/<Capital>)
  const byFolder = placeIdFromFolderPath(folderPath(actor), places);
  if (byFolder) return byFolder;
  // 2. texto livre da ficha + nome do ator
  const html = actor?.system?.details?.description   // atores type:"character" (macro faz NPC assim)
            ?? actor?.system?.biography              // atores type:"npc"
            ?? '';
  const haystack = normalize(`${stripTags(html)} ${actor?.name ?? ''}`);
  // procura o nome de um local como palavra inteira; capital ganha da região se as duas baterem
  const hits = places.filter(p => hasWord(haystack, normalize(p.name)));
  if (hits.length) return (hits.find(p => p.regionId) ?? hits[0]).id;
  return null;
}
export function adoptNpcFlag(actor) {
  return { ...initialNpcFlag(actor), placeId: inferPlaceId(actor) ?? '' };
}
```

- `stripTags(html)` = remover `<...>` e decodificar `&amp;`/`&nbsp;` básicos (função
  pura simples; não usar DOM).
- `hasWord(hay, needle)` = casar `needle` com borda não-alfanumérica dos dois lados
  (evita "Ur" casar dentro de "Murmúrio"). Nomes de local com espaço casam literais.
- `normalize` já existe em `rules.mjs`.
- **Não** sobrescrever local definido à mão: `adoptNpcFlag` só roda na adoção (quando
  ainda não há flag). Se já há flag, respeitar `flag.placeId` como está.

### No editor (`renderNpcEditor`)

- Acima do `<select name="npcPlace">`, quando o NPC não tem `placeId` mas
  `inferPlaceId(actor)` retorna algo: uma linha
  `<p class="sy-hint">Local sugerido pela ficha: <strong>${placeName(sugestao)}</strong>
  ${button('npc-place-accept', `${actor.id}:${sugestao}`, 'Usar este local')}</p>`.
  Op `lib-npc-place-accept` → `saveNpc` com `{placeId: sugestao}`.
- O `<select name="npcPlace">` continua sendo o override manual e a fonte da verdade.

### Filtro por local na aba (novo, pequeno)

- Junto do filtro de papel e de vínculo, um `<select name="npcPlaceFilter">` com
  "Todos os locais" + os locais **que têm ao menos um NPC**. Estado
  `this.state.npcPlace` (cuidado pra não colidir com `state.place` do mapa — usar
  `npcPlaceFilter`). Op `lib-npc-place-filter`. Cartão entra se
  `state.npcPlaceFilter==='all' || npcFlag(actor)?.placeId===state.npcPlaceFilter`.

## 4. Testes (`tests/npcs.test.mjs`)

- `inferPlaceId`: por pasta `🤖 NPCs por Região/Norvak/Kravokia` → `kravokia`;
  por descrição "mora em **Kravokia** desde criança" → `kravokia`;
  por nome "Talia de **Mirmir**" → local de Mirmir;
  sem pista → `null`;
  "Ur" no meio de "Murmúrio" **não** casa.
- `adoptNpcFlag`: mantém `role:'extra'`, `active:false`, e traz `placeId` da inferência;
  com flag já existente, `placeId` não muda.
- `stripTags('<p>Vive em <em>Kravokia</em>.</p>')` → `Vive em Kravokia.`.

## 5. Entrega

`npm test` → bump `0.4.10` (`module.json` + `package.json`) → nova entrada no topo de
`CHANGELOG` (se T15 já entrou) → `git commit` → `git tag v0.4.10` → `npm run release`
→ entregar `dist/quedaco.zip` + `dist/module.json` + notas 0.4.9→0.4.10.
Regras de sempre: sem chave de API, macro do Yuri ou imagens do livro no repositório;
um commit = uma versão = uma tag; não publicar de árvore suja.
