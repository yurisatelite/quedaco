# T24 — Monstros de outros jogos chegando completos

> Pedido do Yuri, 17/09/2026: os monstros de D&D importados viraram "monstros padrão com ND
> mais alto". A conversão tem que trazer **tudo o que a criatura faz**: capacidades, magias,
> sentidos, comportamento e uma biografia que diga onde ela vive em Opath. A história do
> universo de origem (deuses, reinos de Faerûn) não importa; **atitude e comportamento importam**.
>
> Caso de estudo: **Gigante das Nuvens** (Cloud Giant, SRD 5.1).

> **Atualização 17/09/2026 (Claude/Sonnet):** o Yuri rodou `.local/exportar-comparacao-monstro.js`
> e mandou o JSON de comparação. Com a ficha real de 4 monstros nativos, os itens abaixo já
> foram corrigidos e testados em `src/monster-convert.mjs` (`npm test`, 211 testes):
> arquétipo (um arremesso não faz mais de ninguém "Atirador"), alcance de corpo a corpo
> (o "reach" nunca era lido — bug de regex, corrigido, afetava melee **e** à distância),
> tamanho (`system.size`; o token o próprio Skyfall ajusta sozinho ao criar o Actor, não
> precisa setar `prototypeToken`), testes de resistência explícitos (mandam sobre "os dois
> atributos mais altos" quando a ficha lista), perícias, idiomas com equivalente, e
> resistência/imunidade/vulnerabilidade a dano e a condição. **Confirmado pela ficha real:**
> não existe campo de sentidos nem de "temperamento/tendência" no Skyfall — sentidos e
> tendência continuam só na biografia, como já estava. **Ainda falta** (fica pra quem pegar
> esta tarefa a seguir): traços e magia inata como Itens (hoje só texto), Ataque Múltiplo
> como Item, e copiar os Itens `hierarchy`/`archetype` do compêndio `skyfall-core.npc-creation`
> pelo `identifier` (a ficha do Golem Mecânico mostra o molde: um Item `hierarchy` e um ou
> mais `archetype`, cada um com seus próprios Itens `ability` de passiva). A seção 6 tem a
> tabela de mapeamento perícia/idioma usada — é uma aproximação nossa, não vem de nenhum guia.

---

## 1. O que a ficha oficial tem × o que chegou

| Bloco do D&D | Gigante das Nuvens | Chegou no Skyfall? |
|---|---|---|
| Tamanho | Enorme | **Corrigido 17/09.** `system.size` agora vira `huge`. O token, confirmado pela ficha nativa, o próprio Skyfall ajusta sozinho ao criar o Actor (`_preCreate`) — o conversor não precisa tocar em `prototypeToken`. |
| Tipo | gigante | Sim (`giant`). |
| Tendência | neutro bom (50%) ou neutro mau (50%) | **Não.** Ninguém guarda isso, e é a pista de comportamento mais forte da ficha. |
| CA | 14 (armadura natural) | Só anotada na biografia. |
| PV | 200 (16d12+96) | Sim: 288 pela regra do guia (máximo dos dados). |
| Deslocamento | 40 pés | Sim: 12 m. |
| Atributos | FOR 27 · DES 10 · CON 22 · INT 12 · SAB 16 · CAR 16 | Sim, como modificadores. |
| Testes de resistência | CON +10, SAB +7, CAR +7 | **Corrigido 17/09.** Quando a ficha lista testes, eles mandam: CON, SAB e CAR treinados. Os dois atributos mais altos só entram quando não há lista. |
| Perícias | Intuição +7, Percepção +7 | **Corrigido 17/09.** `system.skills.insi.value=1` e `system.skills.perc.value=1`. |
| Sentidos | Percepção passiva 17 | **Não.** |
| Idiomas | Comum, Gigante | **Corrigido 17/09.** `system.languages=['common']`; Gigante, sem equivalente, continua só na biografia. |
| ND | 9 | Sim: ND 7 pela tabela do guia. |
| Traço: Olfato Aguçado | vantagem em Percepção por olfato | **Só como texto** colado no fim da biografia. |
| Traço: Magia Inata | 3 à vontade, 4 × 3/dia, 2 × 1/dia, CD 15 | **Só como texto.** Nenhum item e nenhum limite de uso. |
| Ação: Ataque múltiplo | 2 × Estrela da Manhã | **Não virou item.** |
| Ação: Estrela da Manhã | +12, **alcance 3 m**, 3d8+8 perfurante | **Corrigido 17/09.** Era um bug de regex — o "reach"/"range" nunca era capturado, no corpo a corpo nem à distância (a Rocha também passou a ter alcance real: 18 m em vez de 6 m fixos). Vira item com 3 m. |
| Ação: Rocha | +12, 18/72 m, 4d10+8 impacto | Virou item. |
| Arquétipo | um gigante que bate e arremessa pedra | **Corrigido 17/09.** "Atirador" só entra sem ataque corpo a corpo, ou com maioria à distância. O Gigante tem um de cada → Bruto. |
| Hierarquia e arquétipo como itens | — | **Não.** O Skyfall monta a linha "ND 7, Complexo (Bruto)" e decide se é chefão lendo **itens** do tipo `hierarchy` e `archetype`; o conversor só grava o texto em `system.hierarchy`. Conferido no código do sistema (`NPC.directoryData`, `NPC.isBoss`). É por isso que a ficha parece vazia. |

**Resumo:** chegaram o esqueleto numérico e dois ataques. Ficaram de fora o tamanho, as
proteções certas, as perícias, os sentidos, os idiomas, os traços, as magias e o ataque
múltiplo. Também não entraram os itens de hierarquia e arquétipo nem nada de comportamento.

---

## 2. O modelo de conversão

Para cada bloco, onde ele entra no Skyfall. **Onde a coluna "Destino" diz *confirmar*, o
campo ainda não foi visto numa ficha nativa. Não codifique antes de conferir** (regra 1 do
`CLAUDE.md`). A macro `.local/exportar-comparacao-monstro.js` baixa o Gigante e quatro
nativos lado a lado. O Yuri roda a macro e o arquivo baixado fica em `.local/`.

| D&D | Destino no Skyfall | Regra |
|---|---|---|
| Tamanho | `system.size` | **Feito 17/09.** Miúdo `tiny`, Pequeno `sm`, Médio `med`, Grande `lg`, Enorme `huge`, Colossal `grg`. Confirmado pela ficha nativa: **não precisa setar `prototypeToken`** — o próprio Skyfall ajusta o token pelo tamanho ao criar o Actor (`_preCreate`/`_preUpdate` do sistema). |
| Tendência | biografia → **Temperamento** | Não existe campo. Vira uma frase de comportamento (seção 3). |
| Testes de resistência | `abilities.<x>.proficient` | Se a ficha lista testes, **eles mandam**. Os dois atributos mais altos só valem quando não houver lista. |
| Perícias | `system.skills.<chave>.value = 1` | **Feito 17/09.** Formato confirmado pela ficha nativa (`value` de 0 a 2 = rank; treinado = 1). Tabela (aproximação nossa, não vem de guia nenhum): Acrobacia/Atletismo → `fitn`, Lidar com Animais/Natureza/Sobrevivência → `natu`, Arcanismo → `arca`, Enganação → `rogu`, História → `cult`, Intuição → `insi`, Intimidação → `inti`, Investigação/Percepção → `perc`, Medicina → `medi`, Atuação → `pres`, Persuasão → `dipl`, Religião → `doct`, Prestidigitação → `mani`, Furtividade → `stea`. |
| Sentidos | biografia (já feito) | **Confirmado 17/09: não existe campo.** Nenhum dos 4 nativos guarda sentido nenhum. Fica só a linha "Sentidos" na biografia, como já estava — sem inventar habilidade passiva pra isso. |
| Idiomas | `system.languages` | **Feito 17/09.** Só os que existem: Comum → `common`, Abissal → `abyssal`, Celestial → `celestial`, Dracônico → `draconic`, Élfico → `elvish`. O resto (Gigante, Infernal, Anão...) fica listado na biografia. |
| Resistências, imunidades, vulnerabilidades | `system.modifiers.damage.taken.<tipo>` | **Feito 17/09.** Confirmado pela ficha nativa (`'resistance'`/`'imunity'`/`'vulnerability'`/`'normal'`). Por tipo de dano, com `force` → `energy` (já existia o mapa). |
| Imunidade a condição | `system.modifiers.condition.imune` (array) | **Feito 17/09.** Confirmado pela ficha nativa — ids em inglês, iguais aos status do D&D (`frightened`, `charmed`, `poisoned`, `paralyzed`, `petrified`, `prone`...). |
| **Cada traço** (Olfato Aguçado, Anfíbio...) | Item `ability`, passivo | Nome traduzido, descrição curta, sem copiar texto longo. |
| **Magia inata / conjuração** | Um item `ability` por grupo de uso: "Magia Inata (à vontade)", "(3/dia)", "(1/dia)" | `uses.max` e `uses.per` para os limitados. Cada magia leva o **nome do Skyfall quando existe equivalente** no compêndio de magias; senão, o nome do D&D com um efeito de uma linha. CD → proteção contra atributo de conjuração. |
| **Ataque múltiplo** | Item `ability` de ação: "Ataque Múltiplo" | Mesmo molde da Víbora sorrateira do livro, com a redução de 1 ataque do guia (chefão mantém). |
| Ataques | Item `ability` (já existe) | **Alcance corpo a corpo também**: 10 pés → 3 m. Guarda os dados de dano na descrição mesmo usando dano fixo. |
| Ações lendárias / de covil / reações | Itens `ability` | Regras de chefão do guia (já descritas na biografia hoje; viram itens). |
| Hierarquia e arquétipo | **Itens** `hierarchy` e `archetype` copiados do compêndio do sistema | Não crie item novo: copie o nativo pelo `identifier`. |
| Arquétipo | `guessArchetype` | **Corrigir:** ranged só se **não houver ataque corpo a corpo** ou se os ataques à distância forem maioria. Um arremesso não faz de ninguém um atirador. Gigante = Bruto. |

---

## 3. A biografia — "ficha de campo"

A biografia deixa de ser um despejo do texto original e vira isto, em blocos curtos. A
última seção guarda o original para consulta.

```
Habitat em Opath   Espinha de Vorax · Tatsumari. Cidades e ruínas dos últimos gigantes.
Aparência          Uma linha: tamanho, silhueta, traço marcante.
Temperamento       De onde vem a tendência. "Metade é generosa e brincalhona, metade
                   é mesquinha e cruel. Na mesa, role 1d2 antes do encontro."
Comportamento      Como age quando encontra o grupo: foge, negocia, cobra pedágio, ataca.
Táticas            Como luta: abre com Rocha a distância, voa com Magia Inata se ficar
                   em desvantagem, usa névoa para fugir.
O que quer         Motivação que gera cena: tesouro, status, território, fome.
Ganchos            2 ou 3 frases prontas para usar numa sessão.
Notas de conversão O que o guia mandou fazer (PV, RD, proteções) — o texto de hoje.
Original (D&D 5e)  Recolhido em <details>, só para consulta.
```

**O que fica de fora:** deuses, planos, reinos e nomes próprios do cenário de origem. Se um
traço de cultura serve de comportamento, ele entra *traduzido para comportamento*, sem nome
próprio. Exemplo: "a hierarquia deles é por riqueza" vira "mede o outro pelo que ele ostenta".

**De onde vem o texto:** o conversor preenche *Habitat* (tabela da macro de regiões),
*Temperamento* (tendência), *Táticas* (montado a partir dos itens gerados) e *Notas*.
*Aparência*, *Comportamento*, *O que quer* e *Ganchos* vêm de um **arquivo de fichas de
campo** (`.local/fichas-de-campo.json`, uma entrada por monstro). Esse arquivo é escrito à
parte, fora do conversor, com base no livro de origem **resumido com palavras próprias**,
sem copiar parágrafo. Sem entrada no arquivo, esses quatro blocos saem como título + "—"
para o mestre preencher.

### Exemplo pronto — Gigante das Nuvens

> **Habitat em Opath:** Espinha de Vorax · Tatsumari. Vivem nos picos mais altos da
> cordilheira, acima das ruínas dos antigos gigantes, e descem pouco.
>
> **Aparência:** mais de sete metros, pele clara de tom azulado, cabelo prateado ou azul;
> roupas finas e joias à mostra.
>
> **Temperamento:** metade é generosa e gosta de jogos de azar; a outra metade é
> arrogante e cruel com quem é menor. Role 1d2 antes do encontro.
>
> **Comportamento:** mede o outro pelo que ele ostenta. Trata visitante como diversão ou
> como oferenda. Aceita aposta mais fácil que ameaça. Não ataca primeiro quem traz presente.
>
> **Táticas:** abre com Rocha de longe. Em corpo a corpo, duas Estrelas da Manhã. Ferido ou
> cercado, usa Magia Inata para voar ou virar névoa e sair. Nunca luta até a morte por
> pouca coisa.
>
> **O que quer:** tesouro raro e prestígio entre os seus; quem tem mais ostenta mais.
>
> **Ganchos:** um gigante das nuvens aposta a própria fortaleza num jogo contra o grupo ·
> um jovem expulso dos picos está roubando caravanas para "comprar" a volta ·
> a névoa que cobre uma vila da Espinha há dias não é natural.

---

## 4. Os 326 já importados

A ficha deles perdeu dados na importação. Testes de resistência, perícias, idiomas e
tamanho **não ficaram guardados em lugar nenhum**, nem na biografia. Reconverter só com o
que está no mundo não recupera isso. Caminho:

1. Buscar de novo a fonte **SRD 5.1** (licença CC-BY 4.0) pela API pública do Open5e, com
   uma ferramenta em `tools/` que salva em `.local/srd-monstros.json`. É a mesma fonte que
   o conversor já sabe ler (`normalizeOpen5e`).
2. `normalizeOpen5e` passa a ler também `saving_throws`/`strength_save`..., `skills`,
   `languages`, `size`, `alignment`, `condition_immunities` e `damage_vulnerabilities`.
3. **Reconverter é atualizar, não recriar:** uma macro casa o Actor pelo
   `flags.quedaco.sourceName`, troca sistema e itens, e **preserva** nome, retrato, token,
   pasta, `flags.quedaco.monster` (região) e o parágrafo "Habitat em Opath". Prévia antes,
   com `APLICAR=false`, como as outras.

---

## 5. Ordem de execução

1. ~~**Yuri:** roda `.local/exportar-comparacao-monstro.js` e guarda o JSON em `.local/`.~~
   **Feito 17/09** — `.local/quedaco-comparacao-monstro.json` (não vai pro git; é ficha do
   mundo do Yuri).
2. ~~Corrigir `guessArchetype` e o alcance corpo a corpo.~~ **Feito 17/09.** O alcance também
   arrumou um bug que afetava ataques à distância (a Rocha ganhou alcance real).
3. ~~Com o JSON: tamanho/token, proteções pelos testes, perícias, idiomas, resistências.~~
   **Feito 17/09.** 9 testes novos em `tests/monster-convert.test.mjs`, `npm test` com 211.
4. **Falta:** traços, magia inata e ataque múltiplo como itens.
5. **Falta:** itens de hierarquia e arquétipo copiados do compêndio.
6. **Falta:** biografia em ficha de campo (sem o arquivo de fichas, os blocos saem vazios).
7. **Falta:** ferramenta SRD + macro de reconversão para os 326 já importados.

**Pronto quando:** o Gigante das Nuvens reconvertido mostra, na ficha do Skyfall,
"Complexo (Bruto)", CON/SAB/CAR treinadas, Intuição e Percepção, Comum nos idiomas, Olfato
Aguçado, três itens de Magia Inata com usos, Ataque Múltiplo, Estrela da Manhã a 3 m e
Rocha a 18 m — os últimos três (passos 4, 5) ainda faltam. O tamanho, as proteções, as
perícias, os idiomas e o alcance **já estão corretos e testados**.
