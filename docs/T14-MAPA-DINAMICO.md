# T14 — Mapa dinâmico (zoom, pan, drill-down, cenas ligadas)

Design + pesquisa + spec faseada. Para o Codex, **depois de T11–T13**. Sem biblioteca
externa (regra do repo). A arte do mapa continua sendo asset da mesa, não empacotada.

---

## O que as ferramentas de fora fazem (referência)

| Ferramenta | O que copiar |
|---|---|
| **Obsidian + plugin Leaflet** | Uma imagem como camada única em espaço de coordenadas próprio (`CRS.Simple`); marcadores com popup; grupos de camadas que ligam/desligam; polígonos GeoJSON opcionais. **É o modelo mais próximo do nosso.** |
| **Legendkeeper** | Mapas aninhados: um pino leva a outro mapa; zoom infinito; painel lateral com o artigo do local. |
| **World Anvil (mapa interativo)** | Camadas de pinos com tooltip + link para artigo; sub-mapas; revelar pinos por progressão. |
| **Azgaar's Fantasy Map Generator** | SVG do continente inteiro; pan/zoom; clicar em "burg" (cidade) abre popup; marcadores de rota/rio. |
| **Owlbear Rodeo 2.0** | Pan/zoom infinito muito fluido, tudo por ponteiro; sem tiles para tamanhos razoáveis; névoa. |
| **Foundry nativo** | Scenes + barra de navegação; "map notes" (pinos de journal) que abrem entradas; Notes Layer. Módulos: *Monk's Enhanced Journal*, *JB2A Pins*. |
| **Owlbear / Roll20 deep-zoom** | Imagens gigantes fatiadas em tiles (OpenSeadragon/Leaflet) — **não precisamos**: um PNG/WebP de ~4000px roda liso com `transform: scale()`. |

**Denominador comum que dá pra fazer sem lib:**
1. Pan + zoom de **uma** imagem (`transform: translate() scale()` num wrapper com
   `overflow:hidden`).
2. Marcadores em coordenadas do mapa (%), com tooltip no hover e ação no clique.
3. Polígonos de região opcionais (SVG overlay clicável, destaca no hover).
4. Drill-down: clicar região → foca (zoom animado) + revela pinos de cidade + troca a
   imagem por uma versão "de perto" da região, se existir.
5. Camadas ligáveis: Cidades / Quedas / Rotas / Perigos.
6. Revelação progressiva para o jogador (só o conjunto `shared`).
7. Local → Cena do Foundry (abrir/ativar). Já existe (`placeScenes`).

---

## Estado atual do QUEDAÇO (reaproveitar)

- `quedaco.opathMapImage` (imagem do continente), `regionImages`, `placeImages`.
- `REGIONS[i].hotspot = [x%, y%]` (pinos de região). `mapIndexBanner()` já desenha pinos
  estáticos sobre a imagem.
- `placeScenes` (cena ligada por local), sharing (`shared.map`), `scenePicker()`.
- `this.state` no `CampaignLibrary` guarda `mapView/region/place`.

O T14 substitui `mapIndexBanner()` + a navegação por listas por **um visor único**.

---

## FASE 1 — visor com pan/zoom + drill-down (MVP)

### Estrutura

```
<div class="sy-map-viewport">                 // overflow:hidden, altura fixa (ex. 70vh), cursor:grab
  <div class="sy-map-world" style="transform: translate(Xpx,Ypx) scale(S)">
    <img class="sy-map-image" src="<imagem atual>">   // continente OU regionImages[foco]
    <button class="sy-map-marker" data-op="lib-map-focus" data-id="<regionId>" style="left:X%;top:Y%">Nome</button>
    <button class="sy-map-marker sy-map-marker-place" data-op="lib-place" data-id="<placeId>" style="left:X%;top:Y%">Nome</button>
  </div>
  <div class="sy-map-controls">  [+] [−] [reset]  |  breadcrumb: Opath › Norvak  </div>
</div>
```

### Interação (pointer events, sem lib)

- **Pan:** `pointerdown` no `.sy-map-viewport` (fora de marcador) → guarda origem →
  `pointermove` soma delta ao `translate` → `pointerup`/`pointercancel` solta.
  `touch-action:none` no viewport. Marcadores param a propagação para não arrastar.
- **Zoom:** `wheel` → `scale *= e.deltaY<0 ? 1.15 : 1/1.15`, clamp `[minS, 6]`. Zoom
  **em direção ao cursor**: ajustar `translate` para manter o ponto sob o mouse fixo
  (fórmula: `t = mouse - (mouse - t) * (novoS/velhoS)`).
- **Clamp de pan:** não deixar a imagem sair de vista (borda da imagem nunca passa do
  centro do viewport). Recalcular no zoom e no pan.
- **Estado:** `this.state.map = { scale, tx, ty, focus: regionId|null }` — persiste
  entre re-renders (não resetar ao escolher algo).

### Drill-down

- Pino de **região** (`lib-map-focus`): anima (`transition: transform .35s ease`) o
  `translate`+`scale` para centralizar/encaixar a `hotspot` da região; seta
  `state.map.focus = regionId`; **troca** `.sy-map-image` para `regionImages[regionId]`
  se existir (crossfade: duas `<img>`, opacidade), senão continua no continente só com
  zoom; passa a mostrar os pinos de **cidade** daquela região (novo campo
  `PLACES[i].hotspot` ou, na falta, distribuídos em leque perto da capital).
- Pino de **cidade** (`lib-place`): abre o **painel de detalhe do local** (já existe:
  `placeDetail`) num drawer lateral ou embaixo do visor — imagem, resumo, destaques,
  botão "Abrir cena vinculada" / "Ativar para jogadores", NPCs ligados (T7/M6),
  ameaças ligadas.
- **Breadcrumb / voltar:** "Opath" volta `focus=null`, anima o zoom out para o
  continente inteiro. "‹ Norvak" volta ao nível de região.
- Botões **+ / − / reset** nos controles.

### Jogador

- Só regiões/locais em `shared.map` (mesmo filtro do readonly de hoje). Pinos de região
  não liberada não aparecem. Sem controles de mestre (definir imagem, liberar, cena).

### Sem imagem configurada

- Se `opathMapImage` vazio: mostrar o aviso atual + a lista de regiões como fallback
  (não quebrar). O visor só liga quando há imagem.

### Testes

`tests/` — funções puras:
- `clampPan({tx,ty,scale}, imgW, imgH, viewW, viewH)` → dentro dos limites.
- `zoomToPoint(state, point, factor)` → mantém o ponto fixo.
- `focusRegion(regionId, REGIONS, viewW, viewH)` → retorna `{scale,tx,ty}` que encaixa
  a `hotspot` no centro.

---

## FASE 2 — imersão (quando o Yuri pedir)

- **Camadas ligáveis** (checkboxes no canto do visor): Cidades · Capitais · Quedas ·
  Rotas · Perigos ligados. Cada pino tem `data-layer`; toggle mostra/esconde o grupo.
- **Polígonos de região**: SVG overlay com um `<path>` por região (o Yuri fornece os
  contornos, ou o Codex traça a partir do mapa). Hover destaca; clique = mesmo
  `lib-map-focus`. Regiões liberadas ganham leve brilho; não liberadas ficam esmaecidas
  para o mestre e invisíveis para o jogador.
- **Imagem "de perto" por região** de verdade (não só zoom): `regionImages[id]` em alta,
  com seus próprios pinos de cidade posicionados nessa arte (campo
  `placeImageHotspots` ou por região). Crossfade suave na entrada/saída.
- **Rotas** entre cidades: linhas SVG `<path>` (o Yuri define pares origem→destino);
  animação de tracejado opcional.
- **Névoa/descoberta**: em vez de esconder o pino, mostrar um marcador "?" nos locais
  não descobertos que o jogador pode ver que existem mas não sabe o quê (opcional —
  decidir com o Yuri).
- **Marcar posição do grupo**: um pino móvel "grupo está aqui" que o mestre arrasta;
  guardado em setting; visível ao jogador quando a região está liberada.
- **Transições cinematográficas**: ao focar uma região, um leve fade + zoom com
  `cubic-bezier`; ao abrir uma cidade, opção de "entrar" (a imagem da cidade preenche a
  tela por 1s antes de abrir a cena).
- **Minimapa** no canto (o continente inteiro com um retângulo do que está visível).

---

## Fora de escopo

Tiles/deep-zoom (OpenSeadragon), edição de mapa dentro do QUEDAÇO, geração procedural,
multiplayer de cursor. Se a arte passar de ~8000px, aí sim considerar tiles — não antes.
