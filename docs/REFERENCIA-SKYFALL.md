# Referência do sistema Skyfall — para não reabrir o `skyfall.mjs` toda vez

> Isto é sobre o **sistema Skyfall** (o motor de fichas do Foundry), não sobre o QUEDAÇO.
> Muda raramente — só quando o Foundry ou o Skyfall sobem de versão. Enquanto
> `system.json` continuar dizendo `"skyfall" 1.0.1` e `"minimum": "13"`, este documento
> vale. Se a versão mudar, confira de novo com o roteiro no fim.
>
> Serve pra responder rápido "onde eu guardo isso na ficha?" sem grepar o arquivo do
> sistema (`C:/Users/YURI/AppData/Local/FoundryVTT/Data/systems/skyfall/skyfall.mjs`,
> ~20 mil linhas minificadas) toda vez que uma feature nova precisa disso.

**Confirmado contra ficha real em:** 17/09/2026, com 4 Actors nativos do compêndio
`skyfall-core.enemies` (Golem Mecânico, Lobo, Espírito da Floresta, Líder dos Bandidos),
exportados por `.local/exportar-comparacao-monstro.js`. Onde não diz "confirmado", é lido
direto do código do sistema, não de uma ficha rodando.

## `system` de um Actor `npc` (o mais usado — NPCs, monstros, mercadores)

```
system.abilities.<str|dex|con|int|wis|cha>.value        modificador (não o atributo bruto)
system.abilities.<...>.proficient                        true = testa resistência treinado
system.skills.<chave>.value                               0–2 (rank; 1 = treinado) — confirmado
system.level.value                                        Nível de Desafio (ND), 1–12
system.proficiency                                        bônus de proficiência (calculado sozinho)
system.resources.hp.{value,max,temp}
system.resources.shadow.value                             0–5
system.movement.{walk,swim,burrow,flight}                 em METROS, não pés
system.size                                                'tiny'|'sm'|'med'|'lg'|'huge'|'grg'
system.creatureType                                        celestial|construct|dragon|elemental|
                                                            fey|beast|giant|ooze|humanoid|fiend|
                                                            monstrosity|undead|plant
system.hierarchy                                           'simple'|'complex'|'boss'
system.archetype                                           Set: ranged|brute|group|mount|
                                                            defender|flanker|leader|sentinel
                                                            (pode ter mais de um)
system.dr                                                  redução de dano, número
system.languages                                           array de ids (ver lista abaixo)
system.proficiencies                                       array (armas/armaduras; NPC geralmente [])
system.modifiers.damage.taken.<tipo>                       'normal'|'resistance'|'imunity'|
                                                            'vulnerability' — confirmado
system.modifiers.condition.imune                           array de ids de condição — confirmado
system.biography                                            HTML
```

**Tamanho e token:** setar só `system.size` é suficiente. O sistema ajusta
`prototypeToken.width/height` sozinho ao criar ou atualizar o Actor (`NPC._preCreate` /
`_preUpdate`, gridScale de `actorSizes`) — **não precisa mexer no token na mão**.
Confirmado lendo `skyfall.mjs`, não numa ficha (é lógica que roda só dentro do Foundry).

**Sentidos:** **não existe campo próprio.** Nenhum dos 4 nativos guarda sentido nenhum —
fica só descrito na biografia/traços. Não invente um campo pra isso.

**Tendência/temperamento:** idem, não existe campo. Vira texto de biografia.

## Chaves de perícia (`system.skills`)

`pres` Apresentação · `apti` Aptidão · `arca` Arcanismo · `cult` Cultura · `dipl` Diplomacia ·
`doct` Doutrinas · `stea` Furtividade · `inti` Intimidação · `insi` Intuição · `magi` Magitec ·
`rogu` Malandragem · `mani` Manipulação · `medi` Medicina · `natu` Natureza · `perc` Percepção ·
`fitn` Preparo Físico · `forg` Forja · `pois` Veneno · `fish` Pescaria · `alch` Alquimia ·
`dist` Destilação · `cart` Cartografia · `tail` Alfaiataria · `cook` Culinária · `pain` Pintura ·
`craf` Artesanato · `navi` Navegação · `inst` Instrumentos

Não existem perícias de D&D como Acrobacia, Atletismo, Investigação, Religião — a
correspondência com D&D é uma **aproximação nossa** (ver `docs/T24-MONSTROS-COMPLETOS.md`
seção 2), não algo do livro do Skyfall.

## Idiomas (`system.languages`)

`common`, `abyssal`, `anuri`, `bo`, `celestial`, `draconic`, `toranio`, `elvish`, `kia`,
`kishi`, `vampy`. É a lista inteira — não tem "outros" pra digitar à mão.

## Tipos de dano (`system.modifiers.damage.taken/dealt`)

`acid`, `bludgeoning`, `cold`, `fire`, `lightning`, `necrotic`, `piercing`, `poison`,
`psychic`, `radiant`, `slashing`, `thunder`, `energy` (equivalente ao "force" de D&D),
`mundane`, `special`, `all`.

## Condições (`system.modifiers.condition.imune`)

O Skyfall não define uma lista própria — usa os status padrão do Foundry, em inglês, os
mesmos nomes de D&D: `blinded`, `charmed`, `deafened`, `exhaustion`, `frightened`,
`grappled`, `incapacitated`, `invisible`, `paralyzed`, `petrified`, `poisoned`, `prone`,
`restrained`, `stunned`, `unconscious`.

## Tipos de Item (`type` de um Item embutido num Actor)

`legacy`, `heritage`, `curse`, `background`, `class`, `path`, `feature`, `feat`,
**`ability`** (ação, traço, ataque — o mais comum), `spell`, `sigil`, `weapon`, `armor`,
`clothing`, `equipment`, `consumable`, `loot`, **`hierarchy`**, **`archetype`**, `seal`,
`facility`, `guild-ability`.

**Hierarquia e arquétipo são Itens**, não só texto em `system.hierarchy`/`system.archetype`.
A ficha mostra "Complexo (Bruto)" lendo esses Itens (`NPC.directoryData`, `NPC.isBoss`), e
cada um deles carrega os próprios Itens `ability` de passiva (ex.: o Item `archetype`
"Bruto" carrega uma `ability` "Bruto" com o efeito de dado extra + crítico em 19–20). Pra
copiar um pronto: os compêndios de Actor (`pacotesDeAtor` abaixo) têm um `npc-creation`
com esses Itens já prontos, identificáveis por `system.identifier` (`'boss'`, `'brute'`...).

## Um item `ability` de ataque (o molde que o conversor de monstros usa)

```
system.range.{value,units}          alcance de VERDADE (corpo a corpo também — não é sempre 1,5m)
system.attack.{ability,protection,damage}   ability = atributo do ataque; damage = número FIXO (sem dado)
system.rolls.<id>.{label,type:'attack'|'damage',terms:[{expression:'@str'},{expression:'@proficiency'}]}
```
Dano fixo, sem dado — a mesa rola atributo + proficiência, não um d20+dado de dano.

## Progressão do personagem (`character`): como o nível é guardado

Lido em `skyfall.mjs` 1.0.1 em 11/10/2026 (não conferido numa ficha rodando). Usado pela
[T27 — Ficha V2](T27-FICHA-V2.md).

- **Nível do personagem** = soma de `system.level` de todos os Itens `class`
  (`level.value`, ~5953). Não existe campo próprio.
- **Qual nível do personagem é de qual classe** mora em `system.origin` de cada classe:
  lista de `class-01`…`class-12`, ordenada. A posição na lista é o nível **da classe**:
  `origin.indexOf('class-10') + 1`. A classe inicial tem `system.initial: true`.
- `system.level` da classe deveria ser `origin.filter(startsWith('class-')).length`. Só o
  `Class.levelUp` (~7720) mantém isso; o "Excluir" do menu do nível (~13655) **não**
  mantém. Se os dois discordarem, a ficha trava a subida (ver T27).
- **Benefícios da classe:** `system.benefits[]` com `{_id, level, type: feature|grant, uuid
  | granting+query+quantity}`. `level` é nível **da classe**. Os `_id` vêm do compêndio e
  são fixos.
- **Item ganho num nível** (pelo `BenefitsDialog`) recebe `system.origin = [<_id do
  benefício>]`. Para saber o nível do personagem: benefício → `level` (da classe) →
  `classe.system.origin[level-1]` → `class-XX`. Item com `origin` vazio ou apontando pra
  algo que não existe aparece em "Bônus" (é o "solto").
- Raízes fixas da árvore (`_progression`, ~6226): `legacy`, `curse`, `background`,
  `class-01..12`, `guild`, `bonus`; `path-01` entra depois de `class-02`, `path-02` depois do
  7º nível de uma classe, `feat-mc` depois do 2º nível de uma classe inicial.
- **Subir de nível:** arrastar a classe já existente chama `levelUp(level.value + 1)`; o
  clique direito em "Nível X" chama `levelUp(X)` da classe escolhida (serve pra multiclasse
  e pra preencher buraco).
- **A lixeira da linha de nível apaga o Item classe inteiro**, sem confirmação.

## Regras de criação que parecem exceção mas valem para todo mundo

Conferido no livro (v1.25, cap. 2 "Determinando seus Atributos" e cap. 1 "Atributos"), 11/10/2026:

- **"+1 em um atributo" (valores fixos):** vale para **qualquer** personagem que use o método
  de valores fixos (+3, +2, +1, +1, 0, −1), não é bônus de legado. Nenhum atributo passa de +3
  nessa distribuição, então o +1 não pode ir no atributo que já recebeu o +3. Nos métodos de
  rolagem não existe esse +1.
- **Truque ou perícia por INT:** **toda** classe ganha, **para cada 2 pontos positivos de INT**,
  um truque mágico **ou** proficiência em perícia, à escolha. Não depende de a classe conjurar.
  (Especialista com INT +3 → 1 escolha; INT +4 → 2.) O criador implementa isso como o bloco
  "Bônus de INT" em `training.mjs`.

## Compêndios de Actor instalados (conferir a cada versão nova do sistema/mundo)

`skyfall-core.creation`, `skyfall-core.enemies`, `skyfall-fastplay.characters`.

## Foundry 13.351 (núcleo) — clique em token por quem não é o dono

Conferido em 11/10/2026 no código instalado (`client/canvas/placeables/token.mjs` e
`placeable-object.mjs`). Importa pra qualquer recurso "o jogador clica no NPC".

- **Clique simples (`clickLeft`)** exige `_canControl`, que pede `document.canUserModify(user,"update")`.
  **Jogador não controla token de NPC**, então `Token#_onClickLeft` nunca é chamado pra ele —
  interceptar esse método não adianta.
- **Duplo clique (`clickLeft2` → `_onClickLeft2`)** exige `_canView`: permissão **LIMITED** no ator.
  É o que abre a ficha hoje. Funciona pra NPC liberado (o QUEDAÇO dá LIMITED ao salvar o NPC).
- **Hover** (`hoverIn`) funciona pra qualquer usuário.
- Não existe hook `clickToken` no núcleo; os hooks de token são `controlToken`, `targetToken`,
  `hoverToken`, `refreshToken`, `updateToken` etc. Os módulos que reagem a clique usam `libWrapper`.
- **Sincronizar sem socket:** setting de mundo (só o GM grava; `onChange` chega em todos) +
  flag no próprio usuário (`user.setFlag`; o jogador grava a dele). Já usado em `sceneAtlas`,
  `sharedContent` e nas tags `npcRoles2`. Hora comum entre clientes: `game.time.serverTime`.

## Módulos de terceiros que o QUEDAÇO lê (sem depender)

### World Explorer (`world-explorer`, CarlosFdez) — conferido em 17/09/2026, v2.2.1

- Não tem API pública. O dado mora na **Scene**: `scene.flags['world-explorer'].gridData`,
  um objeto `{<chave>: {offset:{i,j}, reveal: true | false | 'partial'}}`.
- Esse formato é estável desde a v2.1.0 (set/2025). Antes era `revealedPositions: [x,y][]`.
- Leia direto de `scene.flags`, **não** com `scene.getFlag('world-explorer',...)` — o
  `getFlag` lança erro se o módulo dono estiver desativado.
- O QUEDAÇO só conta hexágonos revelados pra mostrar; nunca escreve. Código em
  `src/world-explorer.mjs`, com formato estranho = `null` (a contagem some, a tela segue).

### ConversationHUD (`conversation-hud`, Saervicus) — conferido em 11/10/2026, v6.0.0

- É um **painel de retratos** (quem está na conversa, quem fala). **Não tem** texto de fala,
  escolhas nem ramificação — não serve como motor de diálogo. Análise completa e decisão
  em `docs/T28-DIALOGO-DE-VENDA.md`.
- Foundry 13 apenas; dependências obrigatórias: `lib-wrapper`, `socketlib`,
  `lib-dfreds-ui-extender`. Última release 16/10/2025. Licença MIT.
- **API não documentada** (wiki: "Coming Soon") e **quebrada na 6.0.0**. Alcança-se por
  `game.ConversationHud` (global), não por `game.modules.get(...).api`.
- Se um dia houver ponte, tratar como o World Explorer: só ligar se o módulo estiver ativo,
  e dado fora do formato esperado = recurso some, nunca erro.

## Como reconferir isto (se o Foundry/Skyfall subir de versão)

```
.local/exportar-comparacao-monstro.js
```
Roda como Mestre, baixa um JSON com Actors nativos completos (sistema, Itens, efeitos).
Se algo aqui não bater com o JSON novo, corrija este arquivo — ele é o que evita reabrir
o `skyfall.mjs` na próxima vez.
