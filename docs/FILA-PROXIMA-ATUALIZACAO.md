# Fila da próxima atualização — QUEDAÇO

Levantada com o Yuri em 12/09/2026. Base: `0.4.33` publicada + commits já feitos
depois dela (monstros na aba Monstros, regulador de miniaturas, cartão/editor de NPC).
`npm test` + `npm run package` antes de dar qualquer item por pronto.

---

## Já feito nesta leva (commitado, ainda não versionado)

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
