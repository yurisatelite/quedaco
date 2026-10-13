# T29 — O painel do QUEDAÇO é só da Mestra

> Pedido do Yuri, 13/10/2026, olhando a aba NPCs: "isso aqui vai ser uma ferramenta para
> mim"; "os jogadores não vão ter acesso a isso"; "se não tiver no mapa liberado para eles,
> eles não vão ver"; e, em seguida, "a mesma coisa vale para guildas e etc." e "tira a Cena
> Atual também, que não faz mais sentido".
>
> **Estado: feito (código, testes e prévia). Não visto no Foundry ainda.**

## O que mudou

**O jogador não abre mais o painel.** O botão do QUEDAÇO na barra de ferramentas só
aparece para a Mestra, e `module.api.open` avisa "é uma ferramenta da Mestra" se um
jogador chamar. O jogador só chega a um vendedor **pelo token no mapa** (T28).
Quests: ele já tem o Forien's Quest Log.

**Saiu da tela (todas as abas):**

| Saiu | Onde estava |
|---|---|
| Rótulo "CONSULTA DA CAMPANHA" (e "QUESTS DA CAMPANHA") | topo de toda aba |
| Faixa "Foco da campanha… Mostrar tudo temporariamente" | NPCs, Guildas, Mapa |
| Botão "Reindexar imagens" | topo de toda aba |
| Parágrafo "NPCs ligados a cidades, lojas…" | NPCs |
| "Exportar fichas para casar tokens" | NPCs |
| "Liberar a aba … aos jogadores" | NPCs, Guildas, Mapa, Monstros, Itens, Imbuir |
| "Ver como jogador" | NPCs |
| "Liberar NPCs por localidade" | NPCs |
| Olho/ponto de liberar de cada cartão | NPC, Guilda, Monstro, Item, Região/Local |
| "Liberar região", "Liberar tudo deste local", "Liberar regiões / tudo / Recolher", olhos do mapa | Mapa de Opath |
| Filtro "Liberada aos jogadores" | Guildas |
| **Aba Cena Atual** (mini-diagrama, NPCs por local, rumor, "liberar localidade") | barra de abas |
| Pergunta "O grupo chegou em… Liberar aos jogadores?" ao ativar cena (T7) | hook `updateScene` + configuração `askReleaseOnActivate` |

A tela de NPCs agora é: **título → tags de papel → pesquisa → filtros → cartões.**

**Guardado, não apagado:**

- **Imbuir** sai da barra. Um botão **⋯** no fim da barra (preferência só deste computador)
  traz a aba de volta — o Yuri quer poder religá-la quando sair conteúdo novo do livro de
  extensão.
- O mesmo ⋯ abre uma faixa "Guardado" com **Reindexar imagens** e o **liga/desliga do foco da
  campanha** (que não tinham outro botão). "Exportar fichas para casar tokens" saiu de vez
  da tela (a operação `lib-export-tokens` continua no código).

**Novo:** na aba **Itens**, um interruptor **"Detalhes dos itens"** abre/fecha os detalhes
de todos os cartões de uma vez (preferência só deste computador, `itemDetails`).

## O que isso muda para o resto

- **Visibilidade = token no mapa.** Não existe mais "localidade liberada". O T28
  (vendedor) usa `dialogue.enabled` + token visível — ver `docs/T28-DIALOGO-DE-VENDA.md`
  seção 2, item 5, e `docs/COMANDO-CODEX-12.md`.
- **`openShop` ainda checa a regra antiga** (`npcOpenToPlayers`/localidade) e **precisa ser
  trocado** na Tarefa 2 do Codex. Sem isso o jogador não consegue comprar.

## Código morto que sobrou (limpeza futura — **depois da T28**)

Não apaguei porque (a) a T28 reaproveita o cartão da loja (`npcSellCard`, `cartBlock`,
`openShop`, `purchaseItem`…), (b) ~20 testes dependem do caminho de jogador, e (c) o Codex
está começando a T28 nos mesmos arquivos. Quando a T28 fechar, uma tarefa de limpeza
remove:

- o caminho `readonly` de `library.mjs` (≈60 referências): `renderNpcsPlayer`,
  `playerGuildBanner`, `npcRoleSecondaryPicker`, `npcNoteBlock`, `renderMap(true)`,
  `render(area,true)`, `shared*`, `npcKnown`/`npcHidden`/`npcLocalities`, `openOps`;
- as operações sem botão: `lib-share`, `lib-share-locality`, `lib-map-share-all`,
  `lib-npc-locality`, `lib-npc-hide`;
- o código de `sharedAreas` em `app.mjs`;
- helpers puros sem uso: `scene-atlas.mjs: sceneNeighborhood, regionLocalityTree`,
  `shouldAskReleaseOnActivate`;
- CSS sem uso: `.sy-active-scene*`, `.sy-npc-tree*`, `.sy-puzzle-board.is-mini`,
  `.sy-atlas-mass`, `.sy-locality-*`.

## Arquivos

`src/library.mjs` (render, NPCs, Itens, `storedToolsStrip`, `navAreaEntries`),
`src/app.mjs` (barra: ⋯ e faixa), `src/main.mjs` (botão só da Mestra; hooks de cena
removidos), `src/panels/mapa-imersivo.mjs` (Cena Atual removida; corrigido um
`globallib` que sobrou de uma troca automática na T17), `styles/library.css`,
`tests/painel-da-mestra.test.mjs` (novo, 4 testes).
