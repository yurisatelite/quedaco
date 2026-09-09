# T10 — Montar item modificado (calculadora de custo) + explicação de imbuir

Spec para o Codex. Yuri não entendeu as tabelas de sigilo/imbuir do livro e quer que o
QUEDAÇO calcule e explique. **Não cria Item no Foundry** — é calculadora + folha de
custo. Todos os dados já existem em `src/book-items.mjs` e `src/book-sigils.mjs`.

## Regras do livro (já conferidas — não reinterpretar)

- **Material especial** (Tab. 3-16, p. 240): 6 materiais, cada um **+T$ 300** fixo sobre
  o preço do item base. Só pode ser aplicado a item **sem** sigilo, sem fragmento
  arcano e sem outro material. No montador, o material é o **passo 1**, sobre o item
  limpo. Fonte: `MODIFICATION_GUIDES` (id `materials`) + as linhas de "Materiais
  especiais" de `book-items.mjs` (têm `priceKind:'Acréscimo ao item base'`).
- **Encantar com sigilo** (Tab. 3-18, p. 243) = `SIGIL_COSTS` em `book-items.mjs`:
  `SIGIL_COSTS[jaPresentes][grau-1]`, onde `jaPresentes` = quantos sigilos o item já tem
  (0,1,2,3) e `grau` = 1..4.
  ```
  [ [50,250,900,3500],      // 0 sigilos no item
    [75,375,1350,5250],     // 1
    [115,550,2050,7900],    // 2
    [170,850,3050,11900] ]  // 3
  ```
  Limite: 4 sigilos por item, no máximo **2 prefixos + 2 sufixos**. Escudo aceita também
  sigilos de arma.
- **Imbuir fragmentos** (Tab. 3-19, p. 243) = `IMBUE_COSTS`: `[250, 1000, 5000, null]`
  por grau. `null` no 4º = divergência do livro (impresso "T$ 1.2000"); mostrar
  "a conferir", não somar. Paga-se **uma vez por sigilo** que se queira tornar
  permanente; a ordem não importa.
- Efeitos de material que mexem em sigilo (ex.: Aço Índigo → +2 cargas por sigilo;
  Bronze Celestial → volume 0; etc.) — mostrar como **nota**, não entram no custo.

## Onde

Aba **Itens** da biblioteca (`library.mjs`). Hoje há a categoria placeholder "Itens
modificados". Adicionar ali um bloco **"Montar item modificado"** (colapsável), e mover
a tabela de custos que já existe em `modifications()` para dentro desse bloco como
referência. Segue o padrão de compartilhamento das outras abas (ou GM-only no MVP —
decidir; sugiro seguir `shared.areas.includes('items')`).

Estado do montador vive no `CampaignLibrary` (`this.modBuilder = { baseUuid, material,
sigils: [{ sigilId, imbue }] }`), não em setting — é rascunho de consulta.

## Montador — passos

1. **Item base**: busca no catálogo do módulo (só compêndio) OU escolha em
   `book-items.mjs` (armas/armaduras/escudos/vestimentas). Mostrar preço base e volume.
2. **Material especial** (opcional): select dos 6 materiais. Ao escolher: linha
   "+T$ 300" e a nota do efeito.
3. **Sigilos**: lista de `SIGILS` (`book-sigils.mjs`) filtrável por `equipment`
   (Arma/Armadura/Escudo/Vestimenta) compatível com o tipo do item base (escudo também
   lista sigilos de Arma). Adicionar sigilo → valida limite (2 prefixo / 2 sufixo / 4
   total; usar o campo `slot` = 'Prefixo'/'Sufixo'). Cada sigilo adicionado tem um
   checkbox **"tornar permanente (imbuir)"**.
4. **Resultado** — folha de custo, linha a linha, em português claro:

```
Item base: Espada longa .......................... T$ 15
Material: Nácar (armas contam como mágicas) ....... T$ 300
1º sigilo — Elemental (Fogo), grau 2
   item sem sigilo → tabela 3-18, linha 0, coluna 2 . T$ 250
2º sigilo — +1 (arma), grau 2
   item já tem 1 sigilo → linha 1, coluna 2 ........ T$ 375
Imbuir "Elemental (Fogo)" (grau 2) ................ T$ 1.000
─────────────────────────────────────────────────────────
TOTAL ............................................ T$ 1.940
```

   - Cada linha de sigilo mostra explicitamente **qual célula da tabela** foi usada
     (nº de sigilos já presentes × grau) — é isso que confunde o Yuri.
   - Somatório em Trocados; oferecer também em K$/P$/T$ via `wallet()` de `rules.mjs`.
   - Botão "Copiar folha" (texto puro) para colar em nota/chat.

## Explicação sempre visível de imbuir

Um bloco curto fixo no montador **e** repetido onde a compra/imbuir aparecer no fluxo
(passo de equipamento/loja):

> **Imbuir** = tornar o encantamento do sigilo **permanente**. Em vez de gastar cargas
> até acabar, o efeito fica sempre disponível (passivo) ou recarrega no descanso longo,
> conforme o sigilo. Custo **fixo por grau do sigilo**, pago uma vez por sigilo:
> 1º grau T$ 250 · 2º grau T$ 1.000 · 3º grau T$ 5.000 · 4º grau *a conferir* (o livro
> imprime "T$ 1.2000"). A ordem em que você imbui não altera o preço.

## Testes

`tests/item-mod.test.mjs` — função pura `modifiedItemCost({ basePrice, material, sigils })`:
- material soma 300;
- 1º/2º/3º/4º sigilo puxam a linha certa de `SIGIL_COSTS` conforme quantos já há;
- imbuir soma `IMBUE_COSTS[grau-1]`, e grau 4 não soma (retorna aviso);
- limite 2+2/4 rejeita a 5ª aplicação e o 3º prefixo.

## Fora do MVP

Criar o Item de fato no Foundry (fica para integrar com "criar item tabelado" do
`T-NPCS.md`), aplicar o item numa ficha, sinergias entre materiais.
