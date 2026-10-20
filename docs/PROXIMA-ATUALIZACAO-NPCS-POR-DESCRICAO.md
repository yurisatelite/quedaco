# Próxima atualização — descrição, ânima e NPCs preparados

Atualização em 20/10/2026: implementação inicial entregue no código 0.19.0 /
Criador 0.2.0. Guia atual: [MOTOR-NPCS-POR-DESCRICAO.md](MOTOR-NPCS-POR-DESCRICAO.md).
Este arquivo preserva a especificação original; nomes de APIs propostos abaixo
foram concretizados, e os itens de conferência no Foundry continuam pendentes.

Pedido do Yuri em 20/10/2026. **Especificação para implementar; não confundir com
funcionalidade já entregue em QUEDAÇO 0.18.6 / Criador 0.1.9.**

## Resultado esperado

O usuário descreve um personagem, ou um módulo como o Teatro prepara um elenco.
O Cadastro recebe o pedido e conserva o texto original. O Criador resolve as
escolhas mecânicas compatíveis com a descrição e os compêndios autorizados.
Os NPCs ficam preparados no Cadastro por lote e módulo de origem. A Mestra
abre a seleção, confere a prévia e clica em Criar NPCs preparados.

O motor atual já importa modelos completos e cria Actors pelo Criador.
Não interpreta texto livre nem considera animal de ânima. `featPriority` orienta
algumas escolhas; as demais podem ser preenchidas por ordem de nome. Isso não
é validação de coerência com o conceito narrativo.

## Texto de referência para o usuário e módulos

O bloco abaixo é um **pedido narrativo da próxima atualização**, não um pacote
QUEDACO-NPCS 1 pronto para importar no parser atual. Será armazenado antes da
resolução; dados mecânicos ausentes não devem ser inventados silenciosamente.

```text
PEDIDO DE PERSONAGEM
Identificador: teatro:serena
Nome: Serena
Módulo de origem: quedaco-teatro
Lote: teatro-equipe-areia
Local/contexto: Teatro dos Condenados, coliseu no deserto
Função: lutadora da arena
Equipe: equipe-areia
Legado: Gnomo
Animal da ânima: cobra
Características desejadas: movimentos sinuosos, escamas e olhar atento
Estilo de combate: emboscada e aproximação discreta
Personalidade: observadora, paciente e desconfiada
Aparência e vestuário: lenços leves, olhos alongados e desenhos de escamas
História: ex-artista que luta para pagar uma dívida
Objetivo: comprar a liberdade de sua equipe
Relações: parceira de teatro:maro
Nível desejado: 3
Preferências mecânicas: priorizar escolhas compatíveis com a ânima descrita
Escolhas que quero definir pessoalmente: deixar pendentes se houver ambiguidade
```

Para gato, gavião ou outro animal, trocam-se animal, aspectos e conceito.
Cada indivíduo mantém seu ID. Nome do animal é intenção narrativa, não nome
de herança nem autorização para conceder habilidades adicionais.

## Regra de resolução da ânima

1. Exigir animal da ânima para um gnomo neste fluxo; ausência produz pendência.
2. Registrar os aspectos desejados separadamente das escolhas mecânicas.
3. Resolver primeiro a estrutura de heranças, depois cada escolha concreta.
   Conferir categorias, quantidades e vínculos no conteúdo autorizado.
4. Animal não determina uma única ficha oficial. Uma proposta deve explicar
   por que as escolhas atendem ao conceito; ambiguidades ficam para revisão.
5. Nunca completar escolhas de gnomo por ordem alfabética ou aceitar opções
   de outro animal só para preencher a quantidade. Prioridade não substitui
   seleção explícita quando a escolha determina o conceito.
6. Registrar escolhas por UUID, grupo de benefício e nível, com justificativa
   e fonte. Validar novamente no Criador antes de criar o Actor.
7. Aplicar o mesmo cuidado a talentos que adicionem novas heranças e decisões
   dependentes do conceito em outros legados.

Conferência local em 20/10/2026: Livro Básico DIGITAL 1.25, página 81, permite
duas heranças maiores ou uma maior e duas menores. Página 82 descreve talento
que acrescenta escolhas de herança. São critérios de validação; não existe
nesse trecho um mapeamento fechado “animal → heranças obrigatórias”. O animal
orienta a proposta, e o sistema valida os benefícios realmente disponíveis.
Não redistribuir a prosa do livro nem criar capacidades fora dessas concessões.

## Fila persistente e contrato de integração a implementar

Separar pedido narrativo de modelo mecânico. Um pedido incompleto precisa poder
ser salvo: a validação atual de npcModels exige ficha mecânica completa e não
serve, sozinha, de armazenamento de rascunhos narrativos.

Cada lote guarda ID, módulo de origem, texto original, elenco por IDs, revisão,
estado e relatório. Cada pessoa guarda conceito, ânima (quando aplicável),
escolhas resolvidas, pendências e eventual actorUuid. Atualização por ID não
duplica lote nem substitui ficha existente.

Estados propostos:

- Rascunho: pedido recebido, ainda incompleto ou não resolvido.
- Precisa de escolhas: animal, regra, conteúdo ou decisão não resolvida.
- Pronto para revisar: modelo mecânico resolvido e validado pelo Criador.
- Criado: Actor confirmado com seu UUID.
- Com pendência: criação parcial/erro, com relatório para revisão.

O selo Pronto é invalidado quando o pedido, escolhas ou compêndios resolvidos
mudam. A criação sempre recalcula a prévia e compara a assinatura atual.
O botão atua somente sobre os IDs do lote selecionado; não cria todos os NPCs
do Cadastro. Fichas já criadas não são recriadas.

Métodos **propostos, ainda não publicados**:

- `stageNpcRequests(packet)`: salva pedidos por lote e origem, sem criar Actor.
- `listNpcRequests({sourceModule, batchId, state})`: consulta a fila da Mestra.
- `prepareNpcRequests({ids})`: retorna escolhas resolvidas ou pendências.
- `createPreparedNpcRequests({ids}, {expectedRevision, expectedSignature})`:
  executa pelo Criador após revisão da seleção.

Os nomes finais podem ser ajustados, mas precisam de capability própria e
contrato versionado. Não anunciar estes métodos no descritor antes de existirem.
`getNpcBatchInstructions()` deve distinguir formatos e versões suportados.
Sem armazenamento confidencial novo, não colocar segredos no setting público
do mundo: definir armazenamento/permissões da fila antes de salvar narrativas.

## Divisão de responsabilidade

- Cadastro: pedidos persistentes, instruções, seleção por lote/origem, pendências,
  prévia e ação da Mestra. Aproveitar a Ambientação existente.
- Criador: interpretar seleções explícitas, validar regras e resolver benefícios;
  aplicar tudo à ficha nativa sem substituir decisões por ordenação automática.
- Módulos consumidores: enviar descrição e identidade estável, consultar estado
  e receber UUIDs. Nenhum módulo duplica a lógica de ficha.
- Assistente: pode converter o texto em proposta estruturada hoje. IA embutida
  no Foundry é uma integração separada; não é pressuposta nesta atualização.

## Critérios para considerar entregue

- [ ] Pedido em texto persiste mesmo com campos mecânicos pendentes.
- [ ] Gnomo sem animal não chega a pronto e não cria Actor.
- [ ] Animal e aspectos orientam escolhas explícitas, preservadas na ficha.
- [ ] Testar cobra, gato e gavião com propostas distintas e regras válidas,
      sem inventar equivalência obrigatória entre animal e benefício.
- [ ] Testar as duas estruturas legais de heranças e concessões adicionais.
- [ ] Opção indisponível, ambígua ou incompatível produz pendência legível.
- [ ] Outro módulo envia lote; ele reaparece após recarregar o mundo.
- [ ] Botão cria somente os IDs revisados; repetir não duplica.
- [ ] Relatório liga cada pedido à ficha ou à pendência correspondente.
- [ ] Guia e texto padrão disponíveis no próprio Cadastro e por sua API.
- [ ] Conferir no Foundry 13 com compêndios reais, preservando o mundo oficial.
