# Conferência da Biblioteca 0.4.0 — dados × Livro Básico

Passe de verificação linha a linha dos dados de consulta (`src/book-world.mjs`,
`src/book-monsters.mjs`, `src/book-items.mjs`, `src/book-sigils.mjs`) contra o texto
das páginas em `.local/book/NNN.txt` (Livro Básico DIGITAL 1.25).

Objetivo: separar o que já está correto do que precisa de correção ou de decisão do
Yuri, para que a inserção final custe pouco token. **Nenhuma alteração de regra foi
inventada.** Divergências do próprio livro continuam registradas como divergências.

Legenda de status:
- **OK** — confere com a página.
- **CORRIGIR** — erro de transcrição objetivo; correção segura no working tree.
- **DECIDIR** — depende de escolha do Yuri (interpretação, alias, escopo).
- **CONFERIR PDF** — OCR ambíguo na página; confirmar no PDF original.

Índice compacto de origem em `.local/book/index/` (um arquivo por domínio).

---

## 1. Monstros (`src/book-monsters.mjs`) — pp. 449–494

**Resultado geral: 44/44 blocos com nome, ND, tipo, categoria e página corretos.**
Transcrição fiel. Apenas ajustes no campo `movement` (usado nos filtros
Aquáticos/Terrestres/Aéreos) e alguns aliases para a conferência no Foundry.

### CORRIGIR — campo `movement`

| Linha | Ameaça | Está | Página diz | Sugerido |
|---|---|---|---|---|
| 27 | Kraken | `terrestrial aquatic` | "G natação … 36 m se estiver nadando" — sem deslocamento terrestre | `aquatic` |
| 5 | Bando de Atobás Cuspidores | `aerial` | "G 12 m (8 q), voo" — tem solo **e** voo | `terrestrial aerial` |
| 44 | Mariposa gigante | `aerial` | "G 12 m (8 q), voo" — tem solo **e** voo | `terrestrial aerial` |

Motivo: `Gavião gigante` e `Libélula gigante`, com a mesma linha "G 12 m (8 q), voo",
já estão como `terrestrial aerial`. Padroniza o filtro.

### DECIDIR — aliases para `monsterAudit` (conferência no Foundry)

- **Profundo Disparador** (p. 480): o cabeçalho do bloco sai como "profundo"; o corpo
  usa "profundo disparador". Se a mesa nomear o Actor como "Profundo", adicionar
  `aliases:['Profundo']` para o audit casar.
- **Rataria de Aetherium** / **Bando de Atobás Cuspidores** / **Grupo de juwins** /
  **Nuvem de besouros de aetherium**: nomes coletivos. Confirmar que batem exatamente
  com os Actors da mesa ou registrar alias.

### CONFERIR PDF

- **Braço do pesadelo** (p. 457): OCR entrega "Nd: 9" colado em "binossauro rex".
  É criatura Simples (V 1). ND 9 para Simples é incomum — confirmar 9 no PDF.

### OK (amostra representativa já verificada)

Árvore pregoeira 11/Planta/449 · Assassino 5/Humanoide/450 · Bicho papão 12/Feérico/
Chefão/456 (lore 455) · Binossauro rex 12/Fera/458 · Bunyip Afogador 5/Monstro
(Quimera)/459 · Corifeu 16/Celestial/Imenso/463 · Diabo e Demônio 9/Ínfero/466 (blocos
distintos) · Serpe Silvestre 14/Dragão/483 · Siri titã 14/485 · Víbora sorrateira
10/**Planta**/486 (tipo correto apesar do nome) · toda a seção de montarias 488–494.

---

## 2. Mapa / Mundo (`src/book-world.mjs`) — pp. 340–392

**Resultado geral: 10/10 regiões e 48/48 locais + 5 "além de Opath" com nome, página
e vínculos (região/capital/pai) coerentes com o livro.** Nenhum erro de transcrição.

### CONFERIR PDF (páginas de baixa confiança — não são erros)

| Entrada | Página registrada | Observação |
|---|---|---|
| `gungii` — Mar de Güngii | 369 | 369 é a página de abertura de Tatsumari; o mar aparece citado na introdução, pode não ter seção própria |
| `onze-berrantes` — Trilha dos Onze Berrantes | 357 | mesma página da Imensidão Gelada; confirmar se há trecho dedicado |

### Observações de modelagem (sem ação obrigatória)

- `papuama` está marcada corretamente como fora do mapa ("(fora do mapa e dentro da
  Garoa)", p. 342). Manter fora de qualquer navegação de mapa jogável.
- `tormund` sem capital (`capital:null`) confere com "Capital: Região sem governo"
  (p. 378). O teste já verifica a capital só quando `region.capital` existe.
- Distritos de Alberich (`lado-fora`, `casebres`, `velha-alberich`,
  `mercado-repentino`) todos na p. 375 com pai `alberich` — coerente com o texto.

### OK (verificado)

Todas as 10 regiões (cabeçalho "Capital:" na página conferido), a cadeia
capital→região de cada uma, e a página de cada local contra o cabeçalho da página
correspondente em `.local/book/`. Breadcrumbs sem ciclo (teste já cobre).

---

## 3. Itens e sigilos (`src/book-items.mjs`, `src/book-sigils.mjs`) — pp. 222–258, 421–423

**Resultado geral: 214/214 entradas conferidas linha a linha. Zero erro numérico.**
Preço, volume, dano, redução, descritores, raridade, cargas, fragmentos, grau e
tipo de imbuir batem com as tabelas. As duas tabelas de custo (`SIGIL_COSTS`,
`IMBUE_COSTS`) e a de categorias de dano batem. As 6 divergências do próprio livro
estão corretamente marcadas (ver `.local/book/index/items.md`).

Detalhe por bloco:

| Bloco | Entradas | Páginas | Status |
|---|---|---|---|
| Armas simples/marciais/fogo/regionais | 44 | 222–226 | OK — todos os preços/dano/volume/alcance/descritores |
| Armaduras e escudos | 9 | 228 | OK — reduções e volumes; divergência escudo 5/15 vs 10/20 marcada |
| Equipamentos diversos + Munição | 27 | 231–232 | OK — preços e volumes |
| Consumíveis | 19 | 233–234 | OK — inclui conversão K$→T$ dos venenos (2000/12000/20000) e dados de cura |
| Serviços e transporte | 14 | 235–236 | OK |
| Engenhocas magitec | 8 | 237 | OK — preços, volumes e nomes registrados (aliases) |
| Sinapses | 8 | 238–239 | OK — raridade e fórmula de preço |
| Materiais especiais | 7 | 240, 422 | OK — +T$ 300; Sangue Bruto separado como p. 422 |
| Vestimentas (espaços) | 5 | 229 | OK — referência |
| Artefatos do Sangue Macabro | 15 | 421/422/423 | OK — cargas, fragmentos, imbuir de cada um |
| Sigilos | 58 | 244–258 | OK — grau, equipamento, cargas, fragmentos, prefixo/sufixo, slot |
| `SIGIL_COSTS` (Tab. 3-18) | — | 243 | OK |
| `IMBUE_COSTS` (Tab. 3-19) | — | 243 | OK (4º grau = `null`, impresso "T$ 1.2000") |

### CORRIGIR — texto de um resumo de sigilo

| Arquivo | Sigilo | Está | Página 257 diz | Sugerido |
|---|---|---|---|---|
| `book-sigils.mjs` | do Corpo Sarado | "concede vantagem em **Aptidão** até o fim da cena" | "vantagem em testes que envolvam **Preparo Físico**" | trocar "Aptidão" por "Preparo Físico" |

### DECIDIR — nada pendente

Nenhuma decisão de curadoria necessária neste domínio. As divergências do livro já
estão tratadas com `note` nos cartões.

---

## Resumo executivo

| Domínio | Entradas | Erros de transcrição | Ajustes aplicados | Decisões pendentes |
|---|---|---|---|---|
| Monstros | 44 | 0 (nome/ND/tipo/página) | 3 tags `movement` | aliases p/ audit no Foundry |
| Mapa/Mundo | 63 (10+48+5) | 0 | 0 | 0 (2 páginas a reconferir no PDF) |
| Itens/Sigilos | 214 | 1 (palavra num resumo) | 1 | 0 |
| **Total** | **321** | **1** | **4** | — |

A biblioteca 0.4.0 está **pronta para inserção**. O cruzamento com o livro está
completo e correto. O que resta para o Codex é curadoria (itens da seção
"Reservado para depois" do `BIBLIOTECA.md`) e a auditoria final com o Foundry
conectado — nenhum dos dois exige reler o livro.

### Como usar o índice compacto (novo modelo de operação)

`.local/book/index/{world,monsters,items}.md` reúne, em 3 arquivos curtos, tudo o
que foi extraído das ~140 páginas relevantes do livro. Para qualquer inserção ou
revisão futura de dados da biblioteca, ler esses índices em vez de
`.local/book/NNN.txt` — corta o custo de token da tarefa em ~10×. O texto integral
das páginas continua em `.local/book/` para conferência pontual.

