# COMANDO CODEX — 8ª rodada

Documento de passagem. **Claude estrutura, Codex executa, Yuri confirma.** Este arquivo
é auto-suficiente: leia ele e o `CLAUDE.md` da raiz, e você tem tudo para trabalhar sem
reler conversa nenhuma.

**HEAD de referência:** `186b0d6` — "T18 e T17: Monstros em ordem alfabética com selo de
origem, e o regulador de Guildas". `npm test` = **170 passando**. Árvore limpa.

**Versão publicada:** 0.7.0 (release no GitHub, tag `v0.7.0`). O que está commitado
depois dela ainda **não** tem versão publicada. A próxima instalável é a **0.8.0**.

---

## 0. Antes de tocar em qualquer coisa

1. O repositório mudou de lugar: agora é **`E:\RPG\QUEDACO\modulo`**. Se alguma
   instrução antiga mandar abrir `E:\CODEX-RPG`, está desatualizada — aquela pasta está
   vazia.
2. Leia `CLAUDE.md` na raiz. As oito regras de trabalho valem para você também,
   principalmente a 1 (não inventar regra do sistema), a 3 (**não criar, editar nem
   excluir Atores do mundo oficial**) e a 6 (`npm test` + `npm run package` antes de dar
   qualquer coisa por pronta).
3. Uma tarefa por commit. Mensagem em português, dizendo **o que mudou de comportamento
   e por quê**, não só o quê.
4. Não aumente a versão em `module.json`/`package.json`. Quem fecha versão é o Yuri,
   seguindo `docs/ATUALIZACOES.md`.
5. **Registre o que você fez na seção 4 deste arquivo**, no mesmo commit da tarefa. É
   por ali que o Claude retoma quando o Yuri voltar.

### Onde as coisas estão

| O quê | Onde |
|---|---|
| Painel da Mestra (NPCs, Guildas, Mapa, Monstros, Itens, Imbuir, Quests) | `src/library.mjs` — arquivo grande; toda ação passa por `CampaignLibrary.action(op,id,data)` |
| O que o jogador pode disparar | a lista `openOps` dentro de `action()` — ação fora dela exige mestre |
| Flag do NPC, papéis, visibilidade, vínculos | `src/npcs.mjs` (`flags.quedaco.npc`) |
| Único ponto que cria/atualiza documento do Foundry | `src/adapter.mjs` |
| Regras puras (atributos, vida, dinheiro) | `src/rules.mjs` |
| Índices transcritos do livro | `src/book-*.mjs` — dado de referência, nunca regra nova |
| Estilos do painel | `styles/library.css` |
| Macros da mesa (fora do git) | `.local/*.js` |

### Duas armadilhas que já custaram caro

- **`tests/changelog.test.mjs` fixa a lista de versões** e falha de propósito quando
  uma entrada nova entra no `CHANGELOG`. Não é regressão.
- **Regra de CSS duplicada ganha da primeira.** O regulador de miniatura não funcionava
  em Guildas porque `.sy-guild-grid` aparecia duas vezes em `library.css` e a segunda
  recolocava um valor fixo. Ao mexer em grade, procure se já existe outra regra.

---

## 1. Tarefas — faça nesta ordem

A ordem é por dependência e risco: as primeiras são isoladas, as últimas mexem em muita
coisa. **Não comece a T11 antes de terminar T1/T13/T19**, porque ela reescreve os
mesmos cartões.

### T19 + T3 — Legado e Herança sempre juntos, em todo NPC

Hoje um cartão mostra "Humani", outro "Humani · Kia", outro só "Elfe" sem a Corte.
Regra: **todo NPC mostra os dois**.

- O mapa legado → heranças já existe em `src/book-heritages.mjs` (`HERITAGES`,
  `heritagesOf`, `MELANCOLIA`). Confira se cobre todos os legados que aparecem nos NPCs
  da mesa antes de assumir que está completo.
- `CampaignLibrary.npcLegacy(actor)` já devolve `{legacy,heritage,melancolia,klass}`.
  O buraco é quando `heritage` vem vazio.
- Onde não houver herança na ficha, **mostre "sem herança" de forma explícita** em vez
  de omitir — o Yuri precisa enxergar o buraco para corrigir.
- A macro `.local/atribuir-herancas.js` sorteia herança válida para quem tem legado e
  está sem. **Não rode** — ela mexe em Atores do mundo. Se ela precisar de ajuste para
  cobrir casos novos, ajuste o arquivo e avise na seção 4.
- Se der, ícone/cor por herança além do legado.

### T1 + T13 + T23 — Papel principal e papel secundário

São três recortes do mesmo assunto; faça junto.

- **T1**: `flags.quedaco.npc.role` guarda um papel só. Precisa virar dois: **principal**
  (do mestre, oculto do jogador até liberar) e **secundário** (o jogador atribui). O
  secundário já existe como `NPC_ROLES2_FLAG` em flag de usuário — decida com o Yuri se
  migra para a flag do Actor ou fica onde está, e **registre a decisão**.
- **T13**: a tag secundária nasce sem valor ("— o que essa pessoa é? —", já está assim)
  e quem muda são os jogadores. Confira se `lib-npc-role2` está mesmo liberado para
  jogador em **todos** os pontos de render, não só no `openOps`.
- **T23 — precisa de decisão do Yuri, não codifique no escuro.** No cartão aparecem
  "🔨 Ferreiro" (papel) e "🛡 Combatente" (classe, `CLASS_STYLE`) lado a lado, e a
  mensagem dele tratou o segundo como se fosse a tag do jogador. Pergunte: (a) a badge
  de classe só precisa ficar visualmente distinta, ou (b) não devia aparecer ali?
  Anote a resposta na seção 4.

### T4 — Editor de NPC: acabamento

- Ícones/logos de região e papel também **dentro** do editor.
- Cor do cartão muda conforme a região **no editor** (hoje só na lista).
- Mapa/cena só aparece quando a região tem localidade **com mapa atribuído** — hoje
  lista tudo e não dá para achar nada. *(Parcialmente feito: o seletor já some quando
  não há cena nenhuma. Falta filtrar por "tem mapa atribuído".)*
- "Estoque de compêndio" deve virar o **inventário do NPC**: tudo que ele tem na ficha,
  inclusive dinheiro. *(Já existe `npcInventory(actor)` só-leitura; o pedido é integrar
  com o estoque da loja, não duplicar.)*
- Trilha e Antecedente com **descrição no hover** — já feito, confira e risque.
- Legado mostra a herança na frente — cai junto com a T19.

### T9 — Liberar a região não revela as localidades

Regra pedida: liberar a região só deixa o jogador **saber que a região existe**. Não
revela quantas localidades tem dentro nem os NPCs. Cada localidade continua exigindo
liberação própria.

- Comece **conferindo se algo vaza hoje**: em `npcOpenToPlayers` e `sharedPlaceIds()`,
  ver se uma localidade aparece listada só porque a região está aberta.
- Fluxo de mesa a preservar: grupo sai da cidade e entra na Fazenda Lumb → mestre liga a
  Fazenda, desliga a cidade se quiser.

### T10 — NPC "conhecido" é permanente

Dois estados separados:

- **Conhecido** (`npcKnown`, permanente): uma vez que o grupo teve acesso, fica marcado
  para sempre, mesmo que o mestre feche a localidade depois. **Não existe hoje** —
  precisa de setting novo, no mesmo padrão de `NPC_LOCALITIES_KEY`.
- **Acessível agora**: o que já existe via `npcLocalities`/compartilhamento individual.

NPC conhecido mas fora de alcance aparece **diferenciado** (cinza, sem botão de
interação) em vez de sumir. Quando religar continua 100% do mestre.

### T7 — Mais eixos de filtro

Já existem em NPCs: papel, vínculo, local, legado, herança, faixa de nível, Dragão,
Militar. Faltam: **guilda**, e os mesmos filtros na **aba de localidades** (T6 pede a
mesma coisa). Não refaça o que está lá — leia `renderNpcs` antes.

### T15 — Selo colorido nos filtros

Ícone pequeno e colorido por entrada, em vez de (ou além de) a foto do selo. Ex.:
Necários = cristal azul; Dragão Verde = ícone de dragão verde, o mesmo ícone repetido em
cor diferente para cada Corte/Dragonesa. Mesmo espírito do `CLASS_STYLE` e do
`ITEM_CATEGORY_STYLE` que já existem — siga o padrão deles.

**Incluir o Dragão Prateado**, que é selo exclusivo desta mesa. Deixe explícito no
código e na interface que é homebrew, para ninguém confundir com conteúdo do livro.

### T6 — Mapa e localidades

- Imagem da região/cidade **grande** — hoje sobra espaço na tela.
- **Tabela de rumores**: rola 1d4, mas precisa de pelo menos **10 entradas diferentes**,
  de preferência envolvendo os NPCs daquela localidade; ganchos de missão bem-vindos.
  *(`rumorSeeds()` já monta ganchos com nomes e lugares reais e `rollRegionRumors()`
  sorteia. Confira quantos moldes existem de fato e complete até 10+.)*
- A aba de localidades precisa dos mesmos filtros da aba NPCs (ver T7).

### T11 — Um cartão de NPC só, em todo lugar — **tarefa grande**

Hoje são três renderizações separadas: `npcCard` (mestre), `playerNpcCard` (jogador) e
o que a aba Mapas desenha por conta própria (`regionNpcCard`/`npcsForLocation`).
Tamanhos diferentes, informação diferente, e mexer em um vira mexer em três.

Unifique em **uma função de render** onde o que muda é só quais seções aparecem:

- Jogador vê: nome, retrato, tag secundária (editável por ele) e a loja/venda, esta
  última só se o mestre liberou aquele NPC.
- Mestre vê tudo: papel primário, anotações, edição, estoque completo.

Faça **depois** de T1/T13/T19, senão você unifica e reescreve em seguida.

---

## 2. Tarefas que exigem decisão do Yuri — **não codifique sem resposta**

| Item | A pergunta |
|---|---|
| **T23** | A badge de classe no cartão: deixar distinta, ou tirar dali? |
| **T8b** | Ficha de profissão do NPC. Protótipo vivo em `flags.quedaco.oficio` do Actor "Vendedor" (macro `.local/criar-vendedor-prototipo.js`). O combinado era editar à mão, ver o que falta e o que sobra, e **só então** virar interface. Brainstorm ainda pendente. |
| **T21** | Trocar legado de um NPC direto no editor, reconstruindo a ficha no nível atual. Reaproveita `addResolvedPlan`/`finalizeClassProgression` de `adapter.mjs`, mesmo princípio de `.local/nivelar-npcs-aleatorio.js`. **Escopo grande, merece conversa de design própria.** |
| **T1** | O papel secundário migra para a flag do Actor ou continua em flag de usuário? |

Anote as perguntas na seção 4 e siga para outra tarefa. Não adivinhe.

---

## 3. Tarefas que são macro, não módulo — **você escreve, o Yuri roda**

Estas mexem em Atores do mundo oficial. A regra 3 do `CLAUDE.md` te proíbe de executar.
Escreva a macro em `.local/`, no padrão das que já existem (**prévia primeiro, aplicar
depois de confirmar**), e avise na seção 4 que está pronta para ele rodar.

- **T14 — Distribuir NPCs em guildas.** 60% recebem guilda existente; 20% recebem uma
  **hansa** (no máximo 4 hansas diferentes no total); 20% ficam sem guilda. Guilda que
  sobrar sem nenhum NPC fica **arquivada** (`GUILD_ARCHIVED_KEY` já existe). Depois
  disso, guilda passa a ter **nível** — a fórmula (média dos membros? maior nível? mão
  do mestre?) **precisa ser decidida com o Yuri antes**.
- **T20 — Redistribuir NPCs por importância do lugar.** Capital e cidade principal
  sempre com mais gente que localidade externa. Ex.: Alberich deve ter mais NPCs que
  qualquer outra localidade de Thur Thur isoladamente. Parecida em espírito com
  `.local/aplicar-local-sugerido.js`.
- **T22 — Distribuir item e dinheiro por papel principal.** Nobre e Mercador sempre com
  mais dinheiro que a média. **Mapeie papel → perfil de posses e mostre o mapa ao Yuri
  antes** de escrever a macro.
- **T8 — Casamento de tokens dos NPCs.** Fluxo já existe: botão "Exportar fichas para
  casar tokens" na aba NPCs → `node tools/pick-tokens.mjs` (lê
  `.local/fichas-para-casar.json`) → `.local/subir-tokens.js` → macro de aplicar. Os
  níveis já estão adequados, então é refazer o casamento com o pacote local.

---

## 4. Diário de bordo do Codex — **preencha aqui**

Escreva no mesmo commit da tarefa. Formato por entrada:

```
### <data> — <tarefa>
**Fiz:** o que mudou de comportamento, e em quais arquivos.
**Funcionou:** o que você verificou, e como (teste novo? render conferido?).
**Não funcionou / deixei de fora:** e o motivo.
**Precisa de decisão:** a pergunta exata para o Yuri, se houver.
```

<!-- A partir daqui é só do Codex. Não apague entradas antigas; acrescente embaixo. -->

### 15/09/2026 — T19 + T3
**Fiz:** os cartões de NPC do mestre, do jogador e o resumo do editor agora mostram Legado e Herança em selos separados. Quando a ficha não tem um dos itens, o selo diz “sem legado” ou “sem herança”, para indicar a lacuna sem inventar uma opção. `src/library.mjs`.
**Funcionou:** `npm test` (170 testes), `npm run package` e `git diff --check` passaram. O mapa `HERITAGES` cobre os 16 legados da lista local de alocação; a macro `.local/atribuir-herancas.js` já usa esse mapa e mantém prévia antes da aplicação.
**Não funcionou / deixei de fora:** não executei a macro nem alterei Atores do mundo. Ainda falta conferir visualmente no Foundry e comparar os legados efetivos de todos os NPCs da mesa, que não estão exportados no repositório.

---

## 5. Estado herdado — o que o Claude já entregou

Para você não refazer nada. Tudo isto está commitado e testado:

**Na 0.7.0 publicada:**

- Preço nas três moedas (`precoFormatado` em `rules.mjs`), ligado em todo lugar que
  usava `currency()`.
- Cartão de item: cor e ícone por categoria (`ITEM_CATEGORY_STYLE`), grade de
  propriedades (`itemProperties`), selos de descritor (`itemDescriptors`).
- Faces da moeda por região (`COIN_FACES`/`coinFaces` em `book-world.mjs`), Tabela 3-2.
- Carrinho de compras com fechamento tudo-ou-nada (`purchaseCart` em `adapter.mjs`).
- "Vender pra ele" em qualquer NPC (`npcSellCard`, `sellItem`). **A revenda fica nos 50%
  do livro** — decisão de mesa de 14/09; os "20%" do pedido original não entraram.
- Atitude editável ao vivo + bio do mestre na visão do jogador (`npcGmStrip`) — fecha a
  **T12**.
- Correções: loja liberada por localidade recusava compra (`openShop`); regulador só
  mexia na primeira grade; cartão de NPC encolhia errado; filtros de Monstros com nomes
  inventados de deslocamento; "Porte" que era Hierarquia; liberar NPC não soltava a
  permissão de leitura; **Militar apagado em silêncio a cada Salvar**.

**Commitado depois da 0.7.0, ainda sem versão publicada:**

- **T16**: caixa `<details>` fechada encolhe até o título em vez de esticar; abas
  Monstros e Itens com botões e importador na mesma linha.
- **T17**: regulador sem o "270px" cru, compacto e à direita; e o bug das Guildas, que
  era regra de CSS duplicada, não `querySelector`.
- **T18**: Monstros em ordem alfabética única com selo "Oficial"/"Adaptado".
- "Abrir no Foundry" duplicado (Mundo + Ameaças) virou um botão só, no principal.
- `docs/T-VENDEDOR.md` trazido para o repositório; `docs/T17-PROMPTS-MOEDAS.md` com os
  33 prompts das moedas.

**Itens da fila já resolvidos antes, que a fila ainda listava como pendentes:**

- **T5** (busca de guildas): existe desde a 0.6.0.
- **T2** (aba NPCs do jogador por região, liberação por localidade, anotação individual
  e coletiva, banner da guilda): entregue na 0.5.0. Confira antes de mexer.

---

## 6. Quando terminar

Não publique release nem envie arquivo ao servidor. Deixe a árvore limpa, `npm test` e
`npm run package` passando, a seção 4 preenchida, e avise o Yuri. O Claude retoma daqui:
lê o seu diário de bordo, revisa os commits, e fecha a versão com ele.
