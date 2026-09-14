# Fila da próxima atualização — QUEDAÇO

Levantada com o Yuri em 12/09/2026. Base: `0.4.33` publicada + commits já feitos
depois dela (monstros na aba Monstros, regulador de miniaturas, cartão/editor de NPC).
`npm test` + `npm run package` antes de dar qualquer item por pronto.

---

## Já feito nesta leva (commitado, ainda não versionado)

- Corrigido: regulador de tamanho de miniatura só atualizava a primeira grade da
  tela (`app.mjs` usava `querySelector`, agora usa `querySelectorAll` — afeta toda
  tela com mais de uma seção de cartões, como a aba de NPC do jogador agrupada por
  local).
- Corrigido: encolher o cartão de NPC só estreitava (o retrato tinha largura fixa
  `--sy-face:96px`, independente do controle de tamanho `--sy-card`) — texto
  quebrava letra por letra. Agora o retrato acompanha o tamanho do cartão.
- Corrigido: filtro "Deslocamento" de Monstros usava rótulos inventados
  ("Terrestre/Aquático/Aéreo") em vez dos nomes reais do sistema (Terrestre,
  Natação, Escalada, Escavação, Voo — schema `MOVEMENTS` do Skyfall). Escalada e
  Escavação nem apareciam como opção. Não exige mexer em fichas — o dado sempre
  esteve certo, só a tradução pra rótulo do filtro estava errada.
- Corrigido: o filtro rotulado "Porte" na verdade mostrava a Hierarquia
  (Simples/Complexo/Chefão) — renomeado pro nome certo. "Gosma" (ooze) caía em
  "Monstro" no rótulo de tipo; corrigido.
- Nota pendente: a conversão de D&D 5e (`monster-convert.mjs`) nunca lê o campo
  "climb" do bloco de status de origem — monstro convertido com deslocamento de
  escalada no D&D fica sem essa marca no Skyfall. Pequeno, mas não corrigido ainda.
- Corrigido: liberar um NPC individualmente pelo olho do cartão (`lib-share`,
  balde `npcs`) nunca soltava a permissão de leitura no Ator — só a liberação por
  região/localidade fazia isso. Jogador não recebia a ficha mesmo com o módulo
  dizendo "liberado". Corrigido: agora concede `ownership.default=1` também aqui.
- Corrigido (crítico): como "Militar" não tinha mais campo visível no editor, a
  leitura do formulário (`chk()`) devolvia `false` em vez de "campo ausente" —
  isso **apagava o Militar de qualquer NPC toda vez que alguém clicava "Salvar
  NPC"**, silenciosamente. Removida também a caixa "Dragão" do editor (preservado
  o valor já salvo) e a caixa redundante "Jogadores podem ver o token" (o olho do
  cartão já é o controle único e agora funciona de verdade).

- Monstros importados (D&D/homebrew) aparecem na aba Monstros e aceitam tag de
  região/local; entram no dossiê regional e no "Adicionar ameaça".
- Regulador de tamanho das miniaturas em Monstros, Itens, Guildas e NPCs.
- Cartão de NPC: selo de local não fica mais sob o botão de liberar; contorno do
  errante deixa de ser serrilhado; altura fixa de 158px removida; excluir entra na
  linha do Editar; loja/forja só expandem o cartão na visão do jogador.
- Editor de NPC abre logo abaixo do cartão editado (antes ia pro fim de 400 NPCs).
- Campo Nome do editor volta a funcionar (mesmo bug de re-render no blur da caixa de
  importar) e propaga pro `prototypeToken`.
- Local lista só os locais da região escolhida, agrupado em "Cidades principais" /
  "Outros locais".
- Militar sai do editor; Dragão vira marca discreta.
- Gavetas do editor: Estoque → Criar item → Vínculos (Vínculos por último).
- Retrato ancorado em 30% da altura pra não cortar o rosto.
- Aba NPCs do jogador por região, liberação por localidade, anotação individual e
  coletiva, banner da guilda e "Ver como jogador" pro mestre.
- Legado e herança no cartão + filtros; melancolia (M'bo / Kia) no lugar da herança
  crua do Humani; ícone e cor por classe.
- Cartão de NPC redesenhado: retrato 3:4 à esquerda ocupando a altura toda.
- Ocultar NPC específico da visão do jogador sem fechar a localidade.
- Botões de exportar voltaram a funcionar (Foundry 13 tinha removido `saveDataToFile`).

---

## T1 — Papel principal + papel secundário no NPC

Hoje `flags.quedaco.npc.role` guarda um papel só. Precisa virar dois:

- **Papel principal** — do mestre. Oculto dos jogadores até ser liberado.
- **Papel secundário** — os **jogadores** podem atribuir. É a tag que eles enxergam e
  editam quando conhecem o NPC.

Afeta: `npcs.mjs` (schema da flag, `npcRoleChip`), editor de NPC, filtros da aba NPCs,
cartão, e a aba de jogador (T2).

## T2 — Aba NPCs do jogador separada da do mestre

O mestre precisa acessar as duas visões. A do jogador:

- Abre **por região**, não em lista corrida.
- Só mostra NPC de região liberada — o grupo está em Thur Thur, vê os NPCs liberados de
  Thur Thur (mercadores, curandeiros, ferreiros…).
- Liberação é **por localidade**, não NPC a NPC.
- Usa as mesmas imagens dos mapas / abas de localidade.
- Cada jogador tem um espaço de **anotação individual** (mestre vê todas) mais uma
  **anotação coletiva**.
- Acesso fácil à ficha da **guilda** deles: clicou, abriu. Logo da guilda no topo.
  (Hoje o grupo está na P.I.P.I.)

## T3 — Heranças: particularidade de cada legado

Legado tem sub-tipos. Ex.: elfo → Cortes das Estações (Inverno, Verão, Outono,
Primavera) + sem corte. Precisa:

- Aparecer na aba NPCs (ao lado do legado).
- Virar **filtro** ("quero achar elfos de outono").
- Levantar o apanhado completo de heranças por legado — macro
  `.local/dump-legados-herancas.js` extrai o mapa do compêndio; embutir o resultado
  no módulo depois de conferir.
- Onde faltar herança no NPC, macro pra atribuir.

## T4 — Editor de NPC: acabamento

- Ícones/logos (os mesmos bonitinhos de região e papel) também dentro do editor.
- Cor do card muda conforme a região **no editor** também (hoje só na lista).
- Mapa/cena só aparece quando a região tem cidade/localidade **com mapa atribuído** —
  hoje lista tudo e não dá pra achar nada.
- "Estoque de compêndio" deve virar o **inventário do NPC**: todos os itens que ele
  tem na ficha, inclusive dinheiro, refletidos ali.
- Trilha e Antecedente: **descrição no hover**, sem precisar clicar.
- Legado mostra a herança na frente.

## T5 — Guildas

- Barra de pesquisa (hoje é inviável achar uma guilda na lista).

## T6 — Mapa / localidades

- Imagem da região ou cidade **grande** — hoje sobra muito espaço na tela.
- Tabela de rumores não está funcionando. Precisa rolar 1d4 mas com pelo menos
  **10 entradas diferentes**, de preferência envolvendo os NPCs daquela localidade;
  ganchos de missão são bem-vindos.
- A aba de localidades precisa das mesmas informações e filtros da aba NPCs (achar por
  função, por legado etc.). Hoje só dá pra filtrar NPCs.

## T7 — Filtros (geral)

"Bota pra quebrar": mais eixos de filtro em NPCs e localidades — função/papel, legado,
herança, nível, região, local, guilda.

## T8b — Ficha de profissão do NPC (imersão)

Cada NPC devia carregar o que a profissão dele implica: o que vende e de onde vem o
estoque, o que faz baixar o preço, o que ele não vende e pra quem, o boato que repete
de graça, o segredo que só sai com confiança, quem ele teme, quem lhe deve, tique de
fala e um detalhe sensorial da banca. Protótipo vivo em `flags.quedaco.oficio` do
Actor "Vendedor" (macro `criar-vendedor-prototipo.js`) — editar à mão, ver o que falta
e o que sobra, e só então virar interface. **Brainstorm pendente com o Yuri.**

## T9 — Visibilidade por localidade é independente de liberar a região

Hoje liberar a região deixa os locais dela aparecerem agrupados na aba do jogador.
Regra pedida: **liberar a região só deixa os jogadores saberem que a região existe**
(mapa/lista) — não revela quantas localidades tem dentro dela nem os NPCs. Cada
localidade dentro da região continua exigindo liberação própria, como já é (T2), mas
precisa conferir se hoje algo "vaza" (localidade aparecer listada só por a região
estar aberta, mesmo sem ter sido liberada individualmente). Fluxo de mesa: grupo sai
da cidade e entra na Fazenda Lumb → mestre liga a visibilidade da Fazenda Lumb, desliga
a da cidade se quiser.

## T10 — NPC "descoberto" fica permanente, mesmo fora de alcance

Separar dois estados:
- **Conhecido** (`npcKnown`, permanente) — uma vez que o grupo teve acesso a um NPC
  liberado, ele fica marcado como conhecido pra sempre, mesmo que o mestre feche a
  localidade depois.
- **Acessível agora** (o que já existe via `npcLocalities`/compartilhamento
  individual) — controla se dá pra interagir/comprar *neste momento*.
Um NPC conhecido mas fora de alcance deveria aparecer pro jogador de forma
diferenciada (ex.: cinza, sem os botões de interação) em vez de sumir — o controle de
quando religar continua 100% do mestre.

## T11 — Cartão de NPC: um componente só, em todo lugar

Cartão do mestre, cartão do jogador e o que aparece na aba Mapas (e o que aparece
dentro do modal de detalhe de qualquer um desses) têm que ser **a mesma função de
render**, não três implementações. O que muda entre mestre/jogador é só quais
seções aparecem dentro do mesmo cartão:
- Jogador vê: nome, retrato, a tag secundária (editável por ele, e pelo mestre se
  quiser) e a loja/venda — só se o mestre liberou aquele NPC pra vender.
- Mestre vê tudo: papel primário, anotações, edição, estoque completo etc.
Hoje a aba Mapas e a aba de jogador não usam `npcCard`/`npcPortrait` — são
renderizações separadas, cartões de tamanhos diferentes, com menos informação. Editar
um vira editar três lugares. Precisa unificar antes de continuar polindo visual.

## T12 — Barra de atitude: tamanho e função

A barra "Indiferente/Hostil/..." que aparece na visão do jogador está ocupando a
largura toda e não é clicável — precisa virar um controle de verdade pro mestre mudar
a atitude ali mesmo (ver T17 §6), do tamanho de um badge, não uma barra inteira.

## T13 — Tag secundária: estado inicial e permissão de clique

A tag secundária (a que o jogador atribui) deve nascer **sem valor definido**
("— o que essa pessoa é? —", como já está) e só quem pode mudar são os jogadores (e o
mestre, se quiser) — mas hoje o controle não está clicável pro jogador na prática
(mesmo bug de permissão/CSS da T12, a confirmar qual). Conferir se `lib-npc-role2`
está mesmo liberado pra jogador em todos os pontos de render, não só no `openOps`.

## T14 — Distribuir NPCs em guildas + níveis de guilda

Com os NPCs já nivelados, falta distribuir guildas:
- **60%** dos NPCs recebem uma guilda existente.
- **20%** recebem uma **hansa** (usar no máximo 4 hansas diferentes no total).
- **20%** ficam sem guilda.
- Guildas que sobrarem sem nenhum NPC atribuído ficam **arquivadas**
  (`GUILD_ARCHIVED_KEY` já existe pra isso).
Depois, guildas passam a ter **nível** próprio agora que os personagens (e NPCs) tem
nível — precisa decidir a fórmula (média dos membros? maior nível? fixo por mão do
mestre?) antes de implementar.

## T15 — Filtros com selo colorido em vez de foto

As seções de filtro (facções/selos, e outras) ficam mais bonitas com um ícone
pequeno e colorido por entrada em vez de/além da foto do selo — ex.: Necários =
cristal azul, Dragão Verde = ícone de dragão verde, repetindo o mesmo ícone de dragão
com cor diferente pra cada Corte/Dragonesa. Adicionar também o **Dragão Prateado**
(selo exclusivo desta mesa, não existe no livro — deixar claro que é homebrew, não
confundir com conteúdo oficial).

## T16 — Layout: parar de esticar caixa até a borda

Padrão geral pra revisar em toda a interface: botões, filtros e controles devem ter
**só o tamanho do próprio conteúdo**, não esticar até a borda direita da tela. Ex.:
"Conferir Foundry novamente" / "Exportar conferência" / "Exportar fichas para casar
tokens" deveriam ficar na mesma linha do "Importar criatura de D&D 5e", não uma caixa
inteira por botão. Os chips de filtro (Tipo/Papel/Hierarquia/Deslocamento/ND, e os
selos de facção) também estão como caixas grandes com texto pequeno — redesenhar pra
compactos.

## T17 — Regulador de miniatura: redesenho e correção em Guildas

- Reposicionar à direita, menor, sem o número em px aparecendo cru — pensar em
  "quantos cartões por linha" em vez de tamanho em pixels.
- **Bug**: o regulador na aba Guildas não funciona (conferir se `guildCardSize` está
  de fato ligado à grade — pode ser variação do mesmo bug do `querySelector` já
  corrigido, ou a grade de Guildas nem tem a classe/CSS var esperada).

## T18 — Ordenar Monstros por nome, sinalizar origem no cartão

Hoje a lista mistura ordem (Skyfall primeiro, depois convertidos). Trocar por
**ordem alfabética única**, com um selo pequeno no cartão indicando "Oficial
(Skyfall)" vs "Adaptado/Convertido" — a origem já existe como dado
(`sourceLabel`/sistema de conversão), só falta virar selo visual.

## T19 — Legado + Herança sempre juntos, em todo NPC

Hoje alguns cartões mostram só "Humani", outros "Humani · Kia" ou "Humani · M'bo",
outros só "Elfe" sem dizer a Corte (ou "sem corte"). Regra: **todo NPC mostra os
dois** — legado e herança/particularidade — de forma consistente. Depende de T3
(mapa completo legado→heranças) estar aplicado a todos os NPCs, não só a alguns.
Se der, ícone/cor por herança também (não só por legado).

## T20 — Redistribuir NPCs: capital e cidade sempre com mais gente

Hoje a distribuição por localidade não pesa importância do lugar. Regra pedida:
lugares centrais (capital, cidade principal) sempre têm mais NPCs que localidades
externas/menores da mesma região — ex.: **Alberich** (capital de Thur Thur) deve
ter mais NPCs que qualquer outra localidade de Thur Thur isoladamente. Vira macro
de redistribuição nova (mover NPCs entre localidades da mesma região respeitando
essa hierarquia), parecida em espírito com `aplicar-local-sugerido.js`.

## T21 — Trocar legado de um NPC direto no editor (reconstrução da ficha)

Muitos NPCs estão com legado errado (ou imagem errada — essa parte o Yuri ajusta
manualmente jogando). Precisa de uma ação "Trocar legado" no editor:
- Mantém o **nível atual** do NPC.
- Deixa escolher o novo legado/herança num campo de verdade (dropdown), não texto.
- Reconstrói a ficha (classe, treinamentos, progressão) pra esse legado **no nível
  em que o NPC já está** — reaproveita o motor de criação de personagem
  (`addResolvedPlan`/`finalizeClassProgression`/etc. de `adapter.mjs`, mesmo
  princípio da macro `nivelar-npcs-aleatorio.js`, mas por um único NPC e disparado
  pela UI). Escopo grande — merece uma conversa de design própria antes de codar.

## T22 — Distribuir item/dinheiro por papel principal

Cada NPC deveria ter posse (item e dinheiro) coerente com seu papel principal —
ex.: Nobres e Mercadores sempre com mais dinheiro que a média. Precisa mapear
papel → perfil de posses (quanto dinheiro, que tipo de item) antes de virar macro.

## T23 — Confirmar leitura do cartão com 2 badges (Ferreiro + Combatente)

No print mandado, o cartão mostra "🔨 Ferreiro" (papel) e "🛡 Combatente" (classe,
`CLASS_STYLE`) lado a lado — mas a mensagem tratou o segundo como se fosse a tag
que os jogadores atribuem (que hoje é um campo à parte, `npcRoleSecondary`, e só
deveria aparecer quando um jogador realmente escolher algo). **A confirmar com o
Yuri**: o problema é (a) a badge de classe ser confundida visualmente com a tag de
jogador (aí é só deixar mais distinta), ou (b) a badge de classe não devia
aparecer ali de jeito nenhum nesse espaço? Não mudei nada até esclarecer, pra não
arriscar quebrar a exibição de classe que já está correta.

## Próximo marco combinado com o Yuri

Depois dessas correções, o plano é montar **uma região inteira, alinhada de
ponta a ponta** (NPCs, localidades, guildas, itens) pra servir de **espelho/modelo**
das próximas regiões — não avançar pras outras regiões até essa referência estar
redonda.

## T8 — Casamento de tokens dos NPCs

Agora que os níveis estão adequados, refazer o casamento com o pacote local.
Fluxo já existente: botão "Exportar fichas para casar tokens" na aba NPCs →
`node tools/pick-tokens.mjs <fichas-para-casar.json>` → `.local/subir-tokens.js` →
macro de aplicar.

---

## Macros de apoio (fora do repositório, em `.local/`)

| Macro | Para quê |
| --- | --- |
| `aplicar-local-sugerido.js` | Grava o "local sugerido" em todo NPC sem local. Roda em prévia primeiro. |
| `dump-legados-herancas.js` | Extrai o mapa legado → heranças do compêndio (base do T3). |
| `nivelar-npcs-aleatorio.js` | Investe progressão de classe de verdade nos NPCs em nível 0/1. |
| `diagnostico-niveis-npcs.js` | Distribuição de nível + checagem de valor estranho no campo. |
| `diagnostico-npcs-nivel0.js` | Lacunas reais de ficha (Legado/Classe/Antecedente/Trilha). |
| `diagnostico-npcs-duplicados.js` | Nomes repetidos, separando cópia acidental de coincidência. |
| `atribuir-herancas.js` | Sorteia herança válida pra quem tem legado e está sem. Prévia primeiro. |
| `arrumar-nomes-npcs.js` | Limpa marcações NV2/NV3 (apaga o menor, renomeia o maior) e dá sobrenome a quem só tem um nome. Prévia primeiro. |
| `criar-vendedor-prototipo.js` | Cria o NPC "Vendedor" com o rascunho de campos de profissão (T8b). |
