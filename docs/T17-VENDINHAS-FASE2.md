# T17 — Vendinhas fase 2: itens de vitrine, carrinho, venda e atitude ao vivo

Continuação de `docs/T-NEGOCIACAO.md` (atitude, condições de desconto, pechincha e
estoque, já implementados na leva anterior).

**Estado: implementado.** Este documento nasceu como planejamento; ficou como registro
do que foi codado, com a decisão de mesa que faltava e o que continua em aberto.
`npm test` (169 testes) e `npm run package` passando.

## 0. Já resolvido antes desta leva

- **Retrato de NPC sumindo**: `resolveImage` (`src/images.mjs`) tratava o placeholder
  padrão do Foundry (`icons/svg/mystery-man.svg`) como "imagem real" e nunca chegava a
  tentar o arquivo da pasta `npcs/`. Corrigido — ver `src/images.mjs:16`.
- **405 tokens de NPC** casados e aplicados (macro `subir-tokens.js`), confirmado
  funcionando pelo Yuri.

## 1. Preço em três moedas (Trocado / Pila / Kurmac) — ✔ feito

**Fonte**: Livro Básico 1.25, Cap. 3 (Equipamento), em torno da pág. 219. Regra literal:
10 Trocado = 1 Pila; 1.000 Trocado (100 Pila) = 1 Kurmac.

`precoFormatado(totalEmTrocado)` em `src/rules.mjs`, apoiada no `wallet()` que já
existia. Mostra só as moedas diferentes de zero, da maior para a menor
(`K$ 5 · P$ 30 · T$ 4`); abaixo de 10 Trocados continua em `T$` puro, porque não vale a
pena quebrar o preço de uma vela.

`currency()` em `src/library.mjs` passou a chamá-la, então a conversão vale de uma vez
em todo lugar que já usava: cartão de item, estoque de loja, cotação de compra e venda,
bancada de forja, calculadora de imbuir, inventário do NPC e as tabelas de custo de
sigilo. Não é regra nova — é exibição.

## 2. Cartão de item "profissional" — ✔ feito

- **Cor por categoria**: `ITEM_CATEGORY_STYLE` em `src/library.mjs`, no mesmo espírito
  do `CLASS_STYLE`. Cada uma das 15 categorias do catálogo tem cor e ícone próprios; a
  cor vira uma faixa na lateral do cartão e tinge o ícone do cabeçalho. Um teste
  garante que nenhuma categoria do catálogo caia no cinza de reserva.
- **Grade de propriedades** (`itemProperties`) no lugar da fileira de chips: uma
  mini-tabela com Dano / RD / Alcance / Volume / Cargas / Fragmentos / Grau / Encaixe /
  Raridade, **só com as linhas que o item realmente tem**. Volume 0 (a Funda) conta
  como valor de verdade, não como campo ausente.
- **Descritores em selo** (`itemDescriptors`): QUEBRADIÇO em vermelho, pesada e
  barulhenta em âmbar, o resto neutro. Só ênfase visual — a regra é do sistema.
- O preço aparece agora no cabeçalho do cartão, já nas três moedas.

Nada disso inventa dado: tudo vem do `book-items.mjs` que já existia.

## 3. Moeda com a cara da região — ✔ feito (texto)

**Fonte**: Livro Básico 1.25, Tabela 3-2 "Dinheiro de Opath", pág. ~219–220. Confirmado
lendo o texto extraído do livro: **o valor da moeda é igual em toda Opath** — o que muda
de região para região é só o desenho de uma das faces. Reforço de imersão, não uma
segunda economia.

A tabela virou `COIN_FACES` + `coinFaces(regionId)` em `src/book-world.mjs`, ligada pelo
id da região (o campo `capital` de `REGIONS` já apontava para a capital certa). No
cartão da loja aparece uma linha discreta com tooltip: *"Moeda de Thur Thur: T$ Uma luva
· P$ Perfil de águia · K$ Perfil de um urso"*. Kravokia só tem o Trocado na tabela do
livro, e as faces que faltam continuam faltando — não foram inventadas.

| Região (capital) | T$ | P$ | K$ |
|---|---|---|---|
| Thur Thur (Alberich) | Uma luva | Perfil de águia | Perfil de um urso |
| Norvak (At'Ui) | Perfil de lobo | Uma gota de sangue | Uma gárgula |
| Huma (Foice) | Um grilhão quebrado | Um navio | Um trovão caindo na água |
| Mirmir (Kravokia) | Dois frascos cruzados | — | — |
| Wam'Mawina (Nambowa) | Uma rosa | Um jaguar | Duas mãos se cumprimentando |
| Blurgh'ta (Maruma) | Um girino | Uma libélula | Um tronco na água |
| Lim'Sa (Salim) | Varmah e Lápis | Um baú aberto com riquezas | Representação da noite em Opath |
| Forah (Sarfo) | Uma folha caída no chão | Uma árvore nas quatro estações | A coroa das estações |
| Tatsumari (Sodori) | Flor de cerejeira | O perfil do imperador | O leão Kuma Ryu |
| Tormund | Pepitas de ouro | Uma picareta | Dois anéis entrelaçados |
| Walsh | Uma alpaca | Duas alpacas | Três alpacas |
| (toda moeda, verso comum) | — | Um "P" | O perfil de Kurmac |

> ⚠️ **Ainda em aberto — imagens.** Seu pedido dizia "são 3 [imagens] pra cada legado",
> mas a tabela do livro é por **região**, não por legado (Elfo, Kishin etc.). O texto já
> está no ar por região; se você quiser as **imagens** das moedas, confirme se é 3
> desenhos por região (T$/P$/K$, 11 regiões = até 33 imagens) antes de eu montar os
> prompts de geração.

## 4. Carrinho de compras — ✔ feito

- Estado `this.state.cart={actorId,lines:[{uuid,qty}]}` em `src/library.mjs`, por sessão
  de loja aberta. Trocar de mercador zera o carrinho: a cotação (atitude, condição,
  pechincha) é de **uma visita só**.
- Cada linha do estoque tem **"Adicionar"** no lugar de "Comprar", e mostra o preço já
  cotado (o preço de tabela riscado ao lado, quando a atitude ou a condição mudaram).
  Adicionar a mesma linha duas vezes soma a quantidade em vez de duplicar.
- Um resumo no topo da loja mostra as linhas, o total já cotado e a bolsa do
  personagem. "Fechar compra" fica desabilitado se o dinheiro não cobre.
- O mesmo teste de pechincha (1 por visita, já implementado) vale para o carrinho
  inteiro — é a mesma visita, o carrinho só empacota várias linhas da mesma cotação.
- `purchaseCart` (`src/adapter.mjs`) fecha tudo passando linha a linha pelo mesmo
  `purchaseItem`, então a conta continua num lugar só. **É tudo ou nada**: se uma linha
  falha no meio, devolve a moeda ao saldo de antes, recolhe os itens já entregues e
  repõe o estoque do mercador como estava.

## 5. Área de vendas (o jogador vende pro NPC) — ✔ feito

**Decisão de mesa (14/09/2026):** ficam os **50% do livro**. `sellQuote` não mudou —
metade do preço, porque o equipamento conta como usado (Cap. 3), com Crime que Compensa
pagando o preço cheio. Os "20% mais baratos" do pedido original ficaram anotados como
outra coisa (preço de reposição de fornecedor), fora do que o jogador vê, e não estão
implementados.

**"Todo NPC pode comprar os itens"** — feito. `npcSellCard` põe um botão **"Vender pra
ele"** em **qualquer** NPC liberado, tenha ou não estoque montado: a lógica de "o NPC
vende X" ficou separada da de "o NPC compra o que você oferecer". Aberto o painel, ele
lista os itens da ficha com preço de tabela, o que o NPC paga por unidade e quanto você
tem. `sellItem` (`src/adapter.mjs`) credita a bolsa e baixa a quantidade (some da ficha
quando vende tudo), devolvendo a moeda se a baixa falhar.

## 6. Atitude editável ao vivo, e a biografia como motivo — ✔ feito

- Um seletor de atitude do tamanho de um badge aparece direto na visão "Ver como
  jogador" (`npcGmStrip`), **só para o mestre**: 1 clique muda e a tela re-renderiza já
  com o preço novo, sem abrir o editor completo do NPC. Resolve também a T12 (a barra de
  atitude deixou de ocupar a largura toda).
- A **biografia** do NPC aparece ao lado, num `<details>` marcado "só o mestre" — para
  lembrar o porquê da hostilidade na hora, sem abrir a ficha inteira.
- Não inventa campo: usa o `shop.attitude` e a bio que já existiam.

## Correção que apareceu no caminho

`lib-npc-buy` checava só a liberação **individual** (`shared.npcs`) para decidir se a
loja estava aberta, mas o cartão da loja chega ao jogador também por **localidade**.
Resultado: o botão de comprar aparecia e a compra era recusada com "Esta loja não está
disponível". Compra e carrinho passaram a usar a mesma checagem (`openShop`, que
consulta `npcOpenToPlayers`).

## Cobertura

`npm test` — 169 testes, incluindo os novos:

- `tests/rules.test.mjs`: conversão nas três moedas, ida e volta pela carteira.
- `tests/library.test.mjs`: cor por categoria em todas as categorias do catálogo, grade
  sem linha vazia, selos de descritor, faces da moeda batendo com as regiões do índice,
  carrinho (somar linha, trocar de loja, esvaziar), loja liberada por localidade,
  atitude ao vivo (e recusada para jogador), venda abrindo em NPC sem loja.
- `tests/shop.test.mjs`: carrinho cobrando a visita e baixando estoque, rollback
  completo quando uma linha falha, venda pela metade, venda parcial, Crime que Compensa
  pagando cheio, recusas e devolução de moeda.
