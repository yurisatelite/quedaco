# Prompts das moedas de Opath — 33 imagens

Complemento do `docs/T17-VENDINHAS-FASE2.md` §3. A **Tabela 3-2 "Dinheiro de Opath"**
(Livro Básico 1.25, p. 219–220) já está no código como texto (`COIN_FACES` em
`src/book-world.mjs`) e aparece no cartão da loja. Aqui ficam os prompts para gerar as
imagens correspondentes.

São **31 faces regionais** (11 regiões × 3 moedas, menos as duas que o livro não traz
para Mirmir) mais **2 versos comuns** = **33 imagens**, como você imaginou.

> **Importante:** a tabela do livro é por **região**, não por legado. Cada região tem
> uma face própria para Trocado, Pila e Kurmac. O valor da moeda é o mesmo em toda
> Opath — só o desenho muda.

## Onde salvar

Convenção de pasta e nome que o resolvedor de imagens do módulo já entende
(`src/images.mjs`), dentro da sua pasta de assets:

```
<assetRoot>/moedas/<regiao>-<moeda>.webp
```

Exemplo: `assets/moedas/thurthur-trocado.webp`, `assets/moedas/thurthur-pila.webp`,
`assets/moedas/thurthur-kurmac.webp`. Os ids de região são os do `REGIONS`:
`thurthur, norvak, huma, mirmir, wammawina, blurghta, limsa, forah, tatsumari,
tormund, walsh`. Os versos comuns: `verso-pila.webp` e `verso-kurmac.webp`.

Para o módulo *mostrar* essas imagens ainda falta um passo de código (acrescentar
`coin:'moedas'` ao `IMAGE_KINDS` e trocar o texto do `coinNote` por miniaturas). Não
fiz agora porque as imagens ainda não existem — é uma mudança de dez minutos quando
você tiver o lote pronto.

## Bloco de estilo (cole antes de cada assunto)

O que mantém as 33 parecendo **um conjunto** é este bloco constante. Só a última frase
muda de imagem para imagem.

```
Ancient fantasy coin, single coin centered and perfectly circular, struck metal with
shallow relief engraving, crisp raised edges with gentle wear on the high points,
photographed straight from above with no perspective, even soft studio light, subtle
raised rim around the border, no text, no lettering, no numerals, no watermark,
transparent background, highly detailed, square 1:1, 1024x1024.
Relief subject: <ASSUNTO>
```

E o acabamento por denominação — troque a linha de metal conforme a moeda:

| Moeda | Linha de metal a acrescentar |
|---|---|
| **Trocado (T$)** | `Metal: worn copper with warm brown patina, plain smooth rim, smallest and roughest coin of the set.` |
| **Pila (P$)** | `Metal: tarnished silver, cool grey tone, beaded rim of small dots.` |
| **Kurmac (K$)** | `Metal: deep yellow gold, polished, laurel-wreath rim, thickest and most refined coin of the set.` |

> O esquema de metais (cobre / prata / ouro) e os três tipos de borda **não vêm do
> livro** — é uma convenção que escolhi para o lote ficar coeso e a moeda se
> reconhecer de longe. Se preferir outro, é só trocar essas três linhas: os 33
> assuntos abaixo continuam valendo.

## Os 31 assuntos regionais

### Thur Thur — capital Alberich

| Arquivo | Assunto (`<ASSUNTO>`) |
|---|---|
| `thurthur-trocado` | `a single gauntlet glove, palm facing the viewer, fingers slightly spread` |
| `thurthur-pila` | `an eagle head in profile facing left, beak sharp, feathers detailed` |
| `thurthur-kurmac` | `a bear head in profile facing left, jaw closed, fur detailed` |

### Norvak — capital At'Ui

| Arquivo | Assunto |
|---|---|
| `norvak-trocado` | `a wolf head in profile facing left, ears up` |
| `norvak-pila` | `a single teardrop-shaped drop of blood, falling point downward` |
| `norvak-kurmac` | `a crouching stone gargoyle seen from the front, wings folded over its back` |

### Arquipélago de Huma — capital Foice

| Arquivo | Assunto |
|---|---|
| `huma-trocado` | `a broken shackle, one chain link snapped open` |
| `huma-pila` | `a sailing ship in side view, sails full` |
| `huma-kurmac` | `a lightning bolt striking water, concentric ripples spreading below the impact` |

### Deserto de Mirmir — capital Kravokia

| Arquivo | Assunto |
|---|---|
| `mirmir-trocado` | `two alchemical flasks crossed like sabres` |
| ~~`mirmir-pila`~~ | **O livro não registra a face.** Não gerar sem decidir você mesmo. |
| ~~`mirmir-kurmac`~~ | **O livro não registra a face.** Idem. |

### República de Wam'Mawina — capital Nambowa

| Arquivo | Assunto |
|---|---|
| `wammawina-trocado` | `a single open rose seen face on, two leaves on the stem below` |
| `wammawina-pila` | `a jaguar in full body, walking in side view facing left` |
| `wammawina-kurmac` | `two hands clasped in a handshake, seen from the side` |

### Reino de Blurgh'ta — capital Maruma

| Arquivo | Assunto |
|---|---|
| `blurghta-trocado` | `a single tadpole, round head and curling tail` |
| `blurghta-pila` | `a dragonfly with both wings spread, seen from directly above` |
| `blurghta-kurmac` | `a floating log half submerged in water, ripples spreading around it` |

### Confederação de Lim'Sa — capital Salim

| Arquivo | Assunto |
|---|---|
| `limsa-trocado` | `the two moons of Opath side by side as two discs of different size, Varmah the larger and Lapis the smaller` |
| `limsa-pila` | `an open treasure chest overflowing with coins and gems` |
| `limsa-kurmac` | `a night sky scene: the two moons of Opath above a low horizon line, scattered stars around them` |

### Protetorado de Forah — capital Sarfo

| Arquivo | Assunto |
|---|---|
| `forah-trocado` | `a single fallen leaf lying flat on the ground` |
| `forah-pila` | `one tree split into four vertical quarters, each quarter showing a different season: blossom, full leaf, falling leaves, bare branches` |
| `forah-kurmac` | `a crown woven from spring blossoms, summer leaves, autumn leaves and bare winter branches, one season per quarter of the circlet` |

### Tatsumari — capital Sodori

| Arquivo | Assunto |
|---|---|
| `tatsumari-trocado` | `a single five-petal cherry blossom seen face on` |
| `tatsumari-pila` | `the profile bust of an emperor facing right, wearing a crown` |
| `tatsumari-kurmac` | `a guardian lion facing the viewer, mane flared, front paws planted` |

### Tormund — sem capital ativa

| Arquivo | Assunto |
|---|---|
| `tormund-trocado` | `a small heap of rough gold nuggets` |
| `tormund-pila` | `a miner pickaxe seen in side view, wooden haft and iron head` |
| `tormund-kurmac` | `two interlocking rings, one passing through the other` |

### Walsh — Pequeno Planeta Verde

| Arquivo | Assunto |
|---|---|
| `walsh-trocado` | `one alpaca standing in side view facing left` |
| `walsh-pila` | `two alpacas standing side by side in side view` |
| `walsh-kurmac` | `three alpacas standing in a row in side view` |

## Os 2 versos comuns

Estes valem para **toda** Pila e **todo** Kurmac de Opath, não importa a região. Aqui a
regra do "no text" do bloco de estilo cai por terra — o "P" é o desenho.

| Arquivo | Assunto |
|---|---|
| `verso-pila` | `a single engraved serif capital letter P, centered, filling most of the coin face` (remova `no text, no lettering` do bloco de estilo nesta) |
| `verso-kurmac` | `the profile bust of Kurmac facing left, a dignified crowned figure` |

O Trocado não tem verso comum registrado na tabela.

## Ordem sugerida de geração

Gere primeiro **as três de Thur Thur** e olhe as três juntas no fundo escuro da
interface (`#19212c`). É ali que você decide se o relevo está fundo o bastante e se dá
para distinguir cobre / prata / ouro em miniatura. Só depois rode as outras 28 — assim
você não refaz 33 imagens por causa de um ajuste de estilo.
