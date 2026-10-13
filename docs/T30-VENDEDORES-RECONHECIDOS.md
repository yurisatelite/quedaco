# T30 — O vendedor virou módulo independente; o QUEDAÇO só reconhece

> Pedido do Yuri, 13/10/2026: ele criou o módulo **`quedaco-npcs-de-venda`**
> (`E:\RPG\QUEDACO\quedaco-npcs-de-venda`, v0.1.0, repositório e release próprios). Quis
> primeiro que o cadastro (o painel do QUEDAÇO) também editasse o vendedor, e desistiu no meio:
> "acho melhor deixar independente mesmo e **o cadastro só reconhecer tudo**".
>
> **Decisão: independente. O QUEDAÇO lê, nunca escreve.**
> **Estado: reconhecimento pronto (código, testes, prévia). Não visto no Foundry.**

## O módulo novo, em uma tela

- **Não requer o QUEDAÇO.** Funciona em qualquer ficha Skyfall: o ícone de loja aparece na
  barra da ficha; a Mestra liga o "modo comerciante", escolhe multiplicadores e libera a loja.
- **Dados** (em `flags['quedaco-npcs-de-venda'].shop`, ficam no Actor mesmo com o módulo
  desligado):
  `{enabled:false, public:false, markup:1, buyRate:.5, stock:[{id,origin,source,price,qty}], note:''}`.
  `stock[].qty === null` = ilimitado; `price` em Trocados.
- **Compra e venda** pelo socket do módulo, com **a Mestra aprovando cada pedido** (ela precisa
  estar conectada). O jogador precisa de **observador** na ficha do vendedor e de uma ficha
  própria com moedas.
- **Sem** barganha, atitude, restock, serviços nem migração do estoque do QUEDAÇO.
- **API:** `game.modules.get('quedaco-npcs-de-venda').api.open(actor)`.

## O que o QUEDAÇO passou a fazer (só leitura)

Na aba **NPCs** do painel da Mestra:

1. **Selo "Vendedor"** no cartão de quem está com o modo comerciante ligado. Fica "Vendedor ·
   fechada" quando a loja não é pública. A dica mostra "aberta aos jogadores · N itens".
2. **Filtro "Vendedor"** junto das tags de papel (Dragão, Militar…): lista só vendedores.
3. **Quadro "Vendedores por local"**, que abre com o filtro ligado: total, quantos abertos,
   quantos fechados, quantos sem local, e **cada local da campanha com a sua contagem —
   inclusive os com 0**, que é o que mostra onde falta vendedor. Clicar num local filtra por
   ele (de novo desfaz). É o que o Yuri queria para "distribuir bem os vendedores pelas
   regiões".

**Nada disso grava** em Actor, flag ou setting (há um teste só pra garantir). Se o módulo de
vendas estiver desativado ou desinstalado, o reconhecimento continua funcionando — a flag está
no Actor — e qualquer dado fora do formato esperado vira "não é vendedor", nunca erro.

Código: `src/vendors.mjs` (função pura: `vendorShop`, `isVendor`, `vendorDistribution`,
`vendorLabel`, `vendorModuleActive`), `src/panels/vendedores.mjs` (selo e quadro),
`src/library.mjs` (filtro `lib-npc-vendor-filter`, `lib-npc-place-filter`), `styles/library.css`
(`.sy-vendor-*`), `tests/vendedores.test.mjs` (6 testes).

## O que isso muda na Conversa (T28)

O fim do diálogo de venda **abre a loja do módulo de vendas** (`api.open(actor)`) — o QUEDAÇO
não constrói janela de loja. "Vendedor" no T28 é o que `isVendor` reconhece. Especificação e
handoff atualizados (`docs/T28-DIALOGO-DE-VENDA.md`, `docs/COMANDO-CODEX-12.md`).

## Pendente — decisão do Yuri

**A loja antiga dentro do QUEDAÇO** (estoque e atitude no editor do NPC, carrinho, pechincha
e regras do livro em `negotiation.mjs`, forja de Imbuir no NPC) **agora duplica o módulo
novo.** Três caminhos:

1. **Tirar** do QUEDAÇO depois que o módulo novo for testado na mesa. Fica mais simples;
   perde-se atitude e pechincha, que o módulo novo não tem (e que o texto padrão do diálogo
   da T28 ainda lê de `flags.quedaco.npc.shop.attitude`).
2. **Deixar** como está, sem uso — risco de dois jeitos de configurar o mesmo vendedor.
3. **Migrar o estoque** antigo para o módulo novo com uma macro (o módulo novo avisa que não
   migra sozinho). Dá pra fazer: o estoque antigo guarda só o UUID do item e o preço; o novo
   guarda o item inteiro em `source`, então a macro tem de resolver cada UUID.

Enquanto isso não for decidido, **não apagar** nada da loja antiga.

## Fora do escopo (de propósito)

Editar o vendedor pelo painel; sincronizar estoque; mudar o módulo novo (é outro repositório,
e o Yuri disse que ele fica independente).
