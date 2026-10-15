# Inventário de ambientação — Skyfall RPG

Fonte inicial: Livro Básico Digital 1.25, texto local em `.local/book/`. Este
inventário não reproduz o livro: registra só nomes, relações e páginas para a
Mestra conseguir montar conteúdo próprio no QUEDAÇO.

## Critério de cadastro

Uma entrada de **organização** precisa ter atuação, um local ou região possível
e pelo menos um gancho de NPC/função. Povos, divindades, monstros, boatos e
grupos sem nome ficam em seus próprios cadastros. Uma organização pode ser
marcada como `canônica`, `de campanha`, `rumor` ou `alternativa`; nada de uma
linha alternativa entra na campanha por acidente.

Campos propostos para o futuro catálogo central:

```text
id, name, kind, status, visibility,
regionIds, placeIds, headquartersPlaceId,
summary, functions[], npcRoles[], relatedOrganizationIds[],
schoolSubjects[], source {book, page}, notes
```

`kind` começa com: governo, polícia/investigação, militar, escola, academia,
ordem, guilda, hansa, círculo, culto, família/casa e organização extraplanar.
Os campos são referências aos IDs já existentes de regiões e localidades; não
duplicam os nomes geográficos nem obrigam qualquer módulo satélite a estar
instalado.

## Organizações canônicas identificadas para desenvolver

| Organização | Tipo | Região/local de partida | Funções e NPCs que o cadastro deve permitir | Fonte |
|---|---|---|---|---|
| Senado de Alberich | governo | Thur Thur · Alberich | senadores, prefeitos, escrivães, autorização de guildas e Portas | p. 335, 373–375 |
| DIPS — Divisão/Departamento de Investigação de Portas e Salas | polícia/investigação | Thur Thur · Alberich | comissário, detetives, agentes de campo, analistas arcanos, custódia de Portas/Salas e casos extraplanares | p. 335, 376, 391 |
| COPA | organização de resposta | Thur Thur · Bosque da Passagem | investigadores, caçadores e equipe de contenção para a ameaça dos quimerizadores; expansão depende da conferência do vídeo | p. 376 |
| Guildas de aventureiros reconhecidas | guilda | Alberich e toda Opath | membros, mecenas, selos, bases/Portas, missões e rivalidades | p. 305–315 |
| Conselho dos Dez | conselho de guildas | Lim’Sa · Salim | representantes das dez guildas, governadores aliados, autorização de expedições e reconstrução | p. 344–346 |
| Universidade Arcana de Opath (UAO) | universidade | atuação continental | professores, geólogos, arqueólogos, pesquisadores e diplomatas arcanos | p. 335, 341, 343–348 |
| Salão dos Acordos Perpétuos (SAP) | escola de arcanismo | Huma · Foice | docentes, ocultistas, pactos sobrenaturais e conflitos com a UAO | p. 341 |
| Frota Rompante | militar/governo | Huma · Foice | governadora, oficiais, corsários, marinheiros e defesa costeira | p. 341, 343 |
| Cortes das Estações — Primavera, Verão, Outono e Inverno | governos feéricos | Forah; Inverno também em Norvak | monarcas, regentes, burocratas arcanos, guardas, emissários e agendas sazonais | p. 77, 358–360, 432 |
| Academia de Magia Élfica de Forah | academia/escola | Forah · Sarfo | reitoria, docentes, estudantes, pesquisa feérica e vínculos com as Cortes | p. 359–360 |
| Conclave das Fadas Risonhas | conclave | Forah · Recanto Verdejante | representantes feéricos, diplomatas, anfitriões e intrigas de Refúgio | p. 360 |
| Irmandade dos Esquilos Voadores | irmandade | Forah · Recanto Verdejante | exploradores, mensageiros, guias e contatos da floresta | p. 360 |
| Ordem dos Cavaleiros Tópteros | ordem militar | Blurgh’ta · Maruma | cavaleiros, montarias, instrutores, guardas de portal e batedores | p. 165, 362–364 |
| Irmandade dos Primeiros Saltadores | irmandade de caçadores | Blurgh’ta · Armação Fétida | caçadores, fornecedores, barqueiros e expositores de troféus | p. 365 |
| Escola de Oratória Democrática | escola | Wam’Mawina · Nambowa | administrador, docentes, oradores, diplomatas e disputas cívicas | p. 366–367 |
| Grandes Famílias de Sodori | famílias/casas | Tatsumari · Sodori | chefes de casa, vassalos, administradores e política imperial | p. 369–371 |
| Guarda de Jade | guarda militar | Tatsumari · Sodori | guardas, instrutores, recrutas do serviço obrigatório e oficiais | p. 370–371 |
| Armada Sulfúrica | força militar extraplanar | Varmah; legado em Huma | generais, oficiais, soldados, corsários e conflitos de conquista | p. 340–343, 389 |
| Círculo Calcífero | círculo político-religioso | Varmah · Fortaleza Aragonita | líderes de fortaleza, oficiais, doutrinadores e mediadores entre diabos/demônios | p. 389–390 |
| Coros/seraphs de Lápis | administração carcerária | Lápis | maestros, corifeus, guardas e o acordo secreto ligado à DIPS | p. 390–391 |

## Organizações que exigem uma distinção antes de aparecerem como canônicas

| Nome/grupo | Tratamento inicial |
|---|---|
| Culto de ocultistas quimerizadores | Registrar como culto/ameaça de campanha, associado ao Bosque da Passagem. O livro dá o grupo, mas a estrutura interna deve ser criada pela mesa. |
| Hansa de Alberich | Registrar como categoria criminal com entradas específicas; não criar uma hansa genérica como se fosse um grupo oficial único. |
| Círculos druídicos dos Três Bosques | Registrar como rede de círculos, pronta para subdivisões locais. |
| Famílias nobres de Alberich | Registrar como rede de casas, sem inventar membros ou casas antes da fonte complementar. |
| SIVA — Sindicato dos Vendedores Ambulantes | Registrar como sindicato; a primeira leitura local o cita em conteúdo de personagem, portanto região e sede ficam abertas até conferência. |
| Sangue Macabro, Corte do Crepúsculo e Guarda da Noite Eterna | Marcar `alternativa`: aparecem em material de universo/campanha alternativa, não entram no mundo padrão. |

## Base já disponível, ainda sem usar como cenário automático

O repositório possui `.local/guildas.json`, extraído do Apêndice B: **174 registros**
(139 guildas e 35 hansas). Eles são candidatos para popular o catálogo ou gerar
facções, mas precisam receber `status`, região e localidade antes de aparecerem
como presença ativa no mapa. Não serão criados NPCs, cenas ou organizações no
mundo a partir dessa lista sem uma escolha explícita da Mestra.

## Escolas de magia

As escolas inicialmente confirmadas no texto são SAP, UAO e Academia de Magia
Élfica de Forah. Elas devem ser organizações do tipo `escola` ou `academia`, e
não uma simples tag: isso permite associar matérias, docentes, estudantes,
campus, relações com outras instituições e NPCs. O vídeo pode acrescentar
escolas da campanha sem precisar mudar o modelo de dados.

## Próxima implementação, depois do vídeo

1. Criar o grupo **Ambientação** no catálogo do QUEDAÇO, com organizações e
   escolas independentes de Regiões/Localidades.
2. Exibir uma lista filtrável por região, tipo e status, com ficha de edição
   simples e referências para localidades e NPCs.
3. Publicar métodos de leitura na API de catálogo; módulos satélites continuam
   opcionais e fazem fallback local quando o QUEDAÇO não estiver instalado.
4. Começar pela DIPS como primeiro registro canônico, depois COPA, mantendo o
   conteúdo do vídeo como fonte de complementação da campanha.

## Primeiro núcleo: DIPS e COPA

As duas instituições serão cadastradas separadamente, mas relacionadas pelo
caso do Bosque da Passagem. Esse vínculo é uma relação de trabalho, não uma
fusão: cada NPC mantém uma organização, cargo e local próprios.

### DIPS

- **Nome para exibição:** DIPS.
- **Expansões encontradas no livro:** “Divisão de Investigação de Portas e
  Saletas”, “Divisão de Investigação de Portais e Seletas” e “Departamento de
  Investigação de Portas e Salas de Alberich”. Como o próprio texto varia, o
  cadastro usará DIPS como nome estável e guardará as demais como aliases.
- **Âmbito:** polícia de Alberich especializada em crimes, fenômenos e
  criminosos ligados a Portas, Salas, Saletas e outros eventos planares.
- **Locais iniciais:** Alberich; Bosque da Passagem; uma referência privada à
  ligação com Lápis só deve existir se a Mestra decidir usar esse gancho.
- **Cargos previstos:** comissário, detetive, agente de campo, analista de
  Portas, perito arcano, guarda de custódia e informante.
- **NPC canônico confirmado:** **Ribs**, detetive da DIPS (p. 118). O livro não
  fornece, no trecho usado, ficha, aparência ou biografia suficiente para
  completar sua ficha; esses campos devem continuar “a definir”, não ser
  inventados como informação oficial.
  Na reconferência de 15/10/2026, a ilustração está no trecho dos **Retornados**;
  a ficha da campanha inclui essa maldição. Legado anterior, herança, classe,
  nível, roupas, equipamento e relações da ficha são adaptações da mesa.

### COPA

- **Nome:** Central de Operações da Política de Alberich.
- **Âmbito:** primeira força-tarefa de Alberich com atuação em Thur Thur e
  apoio a governos vizinhos.
- **Local inicial:** Bosque da Passagem, Thur Thur; manter Alberich como base
  administrativa até a mesa definir uma sede específica.
- **Cargos previstos:** coordenador de operações, oficial de ligação,
  patrulheiro, caçador/rastreador, especialista em contenção e apoio médico.
- **Caso fundador:** foi repelida pelos quimerizadores e, depois da convocação
  da DIPS, participou da neutralização das células principais. O retorno das
  quimeras reabre o caso.
- **NPC canônico:** o trecho não nomeia integrante da COPA. Os primeiros NPCs
  desse órgão serão personagens da campanha, marcados como `origem: mesa`.

### O que entra primeiro no módulo

1. Dois registros de organização com as relações e locais acima.
2. Ribs e qualquer equipe futura como **Actors nativos do Skyfall**, vinculados
   à organização por uma flag de catálogo; o QUEDAÇO não mantém dossiês deles.
3. Vagas de cargo para os NPCs originais da COPA e da DIPS, para receberem os
   nomes, imagens e traços que vierem no vídeo.
4. Uma relação “Operação Bosque da Passagem” que liga os dois órgãos, o culto
   quimerizador e o local, sem revelar o conteúdo privado aos jogadores.
