# T24 — Monstros de outros jogos chegando completos

> Pedido do Yuri, 17/09/2026: os monstros de D&D importados viraram "monstros padrão com ND
> mais alto". A conversão tem que trazer **tudo o que a criatura faz**: capacidades, magias,
> sentidos, comportamento e uma biografia que diga onde ela vive em Opath. A história do
> universo de origem (deuses, reinos de Faerûn) não importa; **atitude e comportamento importam**.
>
> Caso de estudo: **Gigante das Nuvens** (Cloud Giant, SRD 5.1).

> **Atualização 17/09/2026 (Claude/Sonnet) — T24 concluída.** Os 5 passos da seção 5 estão
> feitos e testados (`npm test`, 221 testes): tamanho, testes de resistência explícitos,
> perícias, idiomas, resistências/imunidades/vulnerabilidades e condição imune (todos
> confirmados contra 4 fichas nativas — `.local/exportar-comparacao-monstro.js`); o
> arquétipo (um arremesso não faz mais de ninguém "Atirador") e o alcance corpo a corpo
> (bug de regex que zerava o "reach"/"range", afetava melee e à distância); e agora também
> traços, magia inata (com `uses.max`/`uses.per`) e Ataque Múltiplo como Itens, mais os
> Itens de hierarquia/arquétipo copiados do compêndio `skyfall-core.npc-creation` com os
> benefícios que eles concedem (`adapter.mjs: attachCreatureRoleItems`, ligado em
> `library.mjs: importMonster`). **O que falta não é mais código desta tarefa:** reconverter
> os 326 já importados (a primeira importação não guardou teste de resistência/perícia/
> idioma/tamanho em lugar nenhum — precisa buscar de novo no SRD) e **verificar no Foundry**
> — os Itens de hierarquia/arquétipo só foram testados com compêndio falso, nunca contra o
> `skyfall-core.npc-creation` de verdade.

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
| Traço: Olfato Aguçado | vantagem em Percepção por olfato | **Feito 17/09.** Vira Item `ability` passivo ("Keen Smell" — nome traduzido fica pro mestre revisar; a tradução automática de nome de traço não entrou nesta rodada). |
| Traço: Magia Inata | 3 à vontade, 4 × 3/dia, 2 × 1/dia, CD 15 | **Feito 17/09.** Um Item por frequência ("Magia Inata (à vontade)", "(3/dia)"...) com `uses.max`/`uses.per`. Magias ficam com o nome de D&D — trocar pelo equivalente do compêndio ainda é manual, não entrou nesta rodada. |
| Ação: Ataque múltiplo | 2 × Estrela da Manhã | **Feito 17/09.** Item "Ataque Múltiplo", com a frase original do D&D quando existe. |
| Ação: Estrela da Manhã | +12, **alcance 3 m**, 3d8+8 perfurante | **Corrigido 17/09.** Era um bug de regex — o "reach"/"range" nunca era capturado, no corpo a corpo nem à distância (a Rocha também passou a ter alcance real: 18 m em vez de 6 m fixos). Vira item com 3 m. |
| Ação: Rocha | +12, 18/72 m, 4d10+8 impacto | Virou item. |
| Arquétipo | um gigante que bate e arremessa pedra | **Corrigido 17/09.** "Atirador" só entra sem ataque corpo a corpo, ou com maioria à distância. O Gigante tem um de cada → Bruto. |
| Hierarquia e arquétipo como itens | — | **Feito 17/09** (`adapter.mjs: attachCreatureRoleItems`), mas **não verificado no Foundry** — só testado com compêndio falso. Copia o Item `hierarchy`/`archetype` do compêndio pelo `identifier`, e os Itens de passiva que ele concede (`system.benefits`). Sem o compêndio instalado ou sem correspondência, segue sem travar — fica como estava (só o texto). |

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
| **Cada traço** (Olfato Aguçado, Anfíbio...) | Item `ability`, passivo | **Feito 17/09.** Um bloco "Nome. Descrição" por parágrafo em branco no texto (funciona bem quando a fonte já separa por \n\n, como o Open5e; formatos que colam tudo numa linha só continuam sem separar — nada se perde, o texto original segue na biografia). Nome **não traduzido** ainda — fica em inglês. |
| **Magia inata / conjuração** | Um item `ability` por grupo de uso: "Magia Inata (à vontade)", "(3/dia)", "(1/dia)" | **Feito 17/09**, com `uses.max`/`uses.per`. As magias ficam listadas pelo **nome de D&D** — trocar pelo equivalente do compêndio de magias do Skyfall não entrou nesta rodada (fica pra quem for revisar a ficha antes de usar em mesa).
| **Ataque múltiplo** | Item `ability` de ação: "Ataque Múltiplo" | **Feito 17/09**, com a frase original do D&D quando existe. **A redução de 1 ataque continua só na biografia** — decidir qual ataque tirar é uma escolha de mesa, não algo pra automatizar. |
| Ataques | Item `ability` (já existe) | **Alcance corpo a corpo também**: 10 pés → 3 m. Guarda os dados de dano na descrição mesmo usando dano fixo. |
| Ações lendárias / de covil / reações | Itens `ability` | **Parcial.** Cada ação lendária que estiver separada por parágrafo em branco já vira um Item genérico, pelo mesmo mecanismo dos traços — mas sem a conversão de custo do guia (1–2 ações → normal, 3 → recarga). Isso continua manual, descrito na biografia. |
| Hierarquia e arquétipo | **Itens** `hierarchy` e `archetype` copiados do compêndio do sistema | **Feito 17/09** — `adapter.mjs: attachCreatureRoleItems`, testado com compêndio falso (3 testes). **Não verificado contra o compêndio de verdade.** |
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
4. ~~Traços, magia inata e ataque múltiplo como itens.~~ **Feito 17/09.** 10 testes novos.
5. ~~Itens de hierarquia e arquétipo copiados do compêndio.~~ **Feito 17/09**
   (`adapter.mjs: attachCreatureRoleItems`, 3 testes com compêndio falso) — **mas não
   verificado contra o compêndio de verdade dentro do Foundry.**
6. **Falta:** biografia em ficha de campo (sem o arquivo de fichas, os blocos saem vazios).
7. **Falta:** ferramenta SRD + macro de reconversão para os 326 já importados.

**Pronto quando:** o Gigante das Nuvens reconvertido mostra, na ficha do Skyfall,
"Complexo (Bruto)", CON/SAB/CAR treinadas, Intuição e Percepção, Comum nos idiomas, Olfato
Aguçado, três itens de Magia Inata com usos, Ataque Múltiplo, Estrela da Manhã a 3 m e
Rocha a 18 m. **Confirmado em código e testes (221, `npm test`), mas nunca visto na tela
do Foundry** — os passos 4 e 5 dependem de compêndio real (`skyfall-core.npc-creation`),
e só foram testados com um compêndio falso. Os passos 6 e 7 seguem pendentes; não bloqueiam
o uso do conversor no dia a dia — o Gigante já sai bem melhor do que antes desta rodada.
