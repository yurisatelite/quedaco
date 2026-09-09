# T-Mapa e Imagens — spec

Para o Codex. Claude especifica → Codex coda → Yuri confirma. `npm test` +
`npm run package` antes de dar por pronta.

Regra dura: **nenhuma imagem do livro vai empacotada no módulo.** Mapa, arte de
região e arte de cidade são **assets da mesa**, apontados por configuração.

---

## M1 — Padrão único de imagem nos cartões

Hoje as imagens estão inconsistentes (miniatura pequena em uns, nada em outros, texto
quebrando ao lado). Padronizar **todos** os cartões da biblioteca (regiões, locais,
monstros, itens):

- Faixa de imagem **no topo do cartão, de canto a canto**, largura 100%, altura fixa
  (sugestão 128px em regiões/locais, 96px em monstros/itens), `object-fit:cover`,
  `object-position:center`. Nada de distorcer: imagem vertical é **cortada** em cima/
  baixo para preencher a faixa horizontal; imagem horizontal preenche naturalmente.
- Sem imagem → faixa some (não deixar buraco) **ou** ícone genérico por categoria (ver M5).
- A faixa vem **antes** do bloco de texto do cartão. Em regiões/locais: ordem =
  faixa de imagem → rótulo pequeno ("Região" / "Capital" / "Ilha" / …) → nome →
  resumo.
- CSS: classe única `.sy-card-figure` (ou reaproveitar `.sy-library-figure` ajustada).
  Aplicar em `card()`, `placeDetail()`, cartão de monstro e `itemCard()` de `library.mjs`.

## M2 — Botão "Liberar pros jogadores" pequeno, canto superior direito

Hoje é botão largo no rodapé do cartão. Trocar por um botão/ícone **pequeno, absoluto,
no canto superior direito** do cartão (e do bloco de detalhe de região/local). Estado
ligado = preenchido/verde; desligado = contorno. Mesma ação `lib-share`.
- `.sy-library-card` e `.sy-library-detail` viram `position:relative`.
- `.sy-share-toggle` no modo compacto: `position:absolute; top:6px; right:6px;
  width:auto; padding:3px 8px; font-size:11px; z-index:3`.
- Sobrepõe a faixa de imagem — dar um leve fundo (`background:#0c1c28cc`) pra ler.

## M3 — Imagem de região e de capital (asset da mesa)

Settings novos (registrar em `registerLibrarySettings`, `config:false`, `Object`,
default `{}`):

- `quedaco.regionImages` = `{ [regionId]: caminho }`.
- `quedaco.placeImages` já existe — reutilizar para locais/capitais.

No painel:

- **Índice de regiões** e **detalhe de região**: mostrar `regionImages[regionId]` na
  faixa M1. Botão do mestre "Definir imagem" / "Trocar" / "Remover" (FilePicker de
  imagem), no canto — igual ao que já existe para locais (`lib-place-img`), criar
  `lib-region-img`.
- **"Explorar região" → detalhe da capital / locais**: usar `placeImages[placeId]` na
  faixa M1, com o mesmo botão do mestre já existente.
- Nada é obrigatório; sem imagem, sem faixa.

## M4 — Mapa de Opath (asset da mesa) + hotspots

Já implementado o essencial (config `quedaco.opathMapImage`, `mapIndexBanner`, pinos por
`REGIONS[i].hotspot`). Pendências:

- Ajustar as 10 coordenadas `hotspot` com o mapa real carregado (são estimativas).
- Pino clicável abre a região (`lib-region`) — confirmar que funciona também para o
  jogador quando a região está liberada.
- Opcional: destacar no mapa as regiões já liberadas.

## M5 — Ícone genérico quando não há imagem (itens/monstros)

Vários itens não casam com documento de compêndio e ficam sem imagem (virotes de besta,
balas de funda, flechas, tenda, corrente…). Fallback por **categoria/tipo**, usando os
SVGs nativos do Foundry (`icons/…`):

- weapon → `icons/weapons/swords/sword-broad-steel.webp` (ou similar)
- armor → `icons/equipment/chest/breastplate-banded-steel.webp`
- consumable → `icons/consumables/potions/bottle-round-corked-blue.webp`
- equipment/loot → `icons/containers/bags/pack-leather-brown.webp`
- munição → `icons/weapons/ammunition/arrows-bodkin-yellow-red.webp`
- monstro sem Actor casado → `icons/creatures/…` por `creatureType` quando der, senão
  `icons/svg/mystery-man.svg`.

Ajustar a lista para caminhos que existam de fato no build 351. `thumb()` em
`library.mjs` passa a receber um fallback quando `src` vazio.

## M6 — Vincular NPCs e monstros a cada cidade

Cada local (`placeId`) passa a listar seus **NPCs** e **ameaças**:

- **NPCs**: um NPC com `flags.quedaco.npc.placeId === placeId` (ver `T-NPCS.md`) aparece
  no detalhe do local. Vendedores mostram "Abrir loja"; aliados/figurantes mostram só
  nome + imagem quando liberados.
- **Monstros**: setting `quedaco.placeMonsters = { [placeId]: [idDeMonstro] }` — o mestre
  liga ameaças do índice (`book-monsters.mjs`) a um local. Aparecem no detalhe do local
  como "ameaças da região" (consulta; não cria Actor).
- Racional (Yuri): NPC de cada cidade vende o que existe naquela região; ligar aqui
  deixa isso explícito e ajuda a montar o estoque.

## M7 — Cartão de monstro: layout quebrado

Sintoma (Yuri, print): "ND 11 · PlantaÁrvore pregoeira" grudado e quebrando letra a
letra ao lado da miniatura.

Causa: `summary` é flex com miniatura + coluna de texto + status; em cartão estreito a
coluna espreme e o texto quebra. Fix em `library.css`:

- `.sy-library-card summary{display:flex; align-items:center; gap:10px}`
- `.sy-library-thumb{flex:0 0 44px}`
- `.sy-library-card summary > span:first-child{flex:1; min-width:0; display:flex;
  flex-direction:column; gap:2px}`
- Dentro dela: `small` e `strong` como `display:block; overflow-wrap:anywhere` só se
  necessário; garantir que `small` (ND · tipo) e `strong` (nome) fiquem em linhas
  separadas, sem grudar.
- `.sy-library-status{flex:0 0 auto}`.
- Aumentar a coluna do grid: `.sy-library-grid{grid-template-columns:
  repeat(auto-fill,minmax(270px,1fr))}`.

Com a faixa de imagem M1 no topo, a miniatura ao lado do texto pode até sair — decidir:
ou faixa no topo (M1) **ou** miniatura ao lado, não os dois.
