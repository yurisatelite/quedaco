# Motor local de NPCs por descrição

Em 0.20.0 / Criador 0.3.0: [contrato para IA e grupos por código/texto](GRUPOS-NPCS-PARA-IA.md),
com prepareNpcGroup/createPreparedNpcGroup, elenco aleatório reutilizável e
capability npcProfileSelection. A interface abaixo continua sendo alternativa.

Entrega de código: QUEDAÇO 0.19.0 + Personagens Skyfall RPG 0.2.0, 20/10/2026.
Compatibilidade preservada: Foundry 13, Skyfall 1.0.1.

## Uso pela interface

Abra Ambientação -> Importar arquivo / texto -> **Descrever e preparar NPCs**.
Exemplos reconhecidos quando os compêndios e perfis correspondentes estão presentes:

```text
Cria uma gnoma com ânima de gato, nível 1, batedora em Huma.
Um Anuro guarda em Alberich, nível 3.
Uma Humani comerciante que mora em Kiki, nível 2.
```

Nome e nível também podem ser informados nos campos separados. Clique Guardar
e preparar descrição: o pedido é salvo, e o Criador tenta resolver uma proposta.
Depois selecione pedidos, use Revisar selecionados, confira escolhas/justificativas
e clique Criar selecionados. Pendências impedem criar; só os IDs selecionados
participam do lote. O relatório mostra UUIDs e erros. Pedidos criados ficam
identificados e não são recriados. A fila pode ser consultada após recarregar.

**É um motor local de regras, termos e perfis, não um modelo de linguagem geral.**
Reconhece nomes do catálogo, nível numérico, propósito e animal da ânima. Não
pressupõe entendimento de toda frase, metáfora ou intenção em português. Expanda
os termos de reconhecimento e perfis conforme a mesa. Um serviço externo de IA
não é chamado. A descrição original é preservada; o motor não inventa lore canônico.

## O que o motor escolhe

O propósito define uma proposta editável de classe, antecedente, modificadores,
prioridades de perícias/idiomas, equipamento e comportamento. O conteúdo mecânico
precisa existir nos compêndios acessíveis. Os benefícios são resolvidos até o nível
pedido e recebem seleções explícitas por grupo/UUID, que o Criador valida de novo.
Nomes gerados e traços dos perfis são propostas de campanha. A bolsa inicial é a
do perfil/pedido (os perfis iniciais usam zero), não uma rolagem oficial de riqueza.

O contexto usa nome, descrição, comércio e governo da região, descrição da
localidade e ambientes cadastrados. Perfis específicos por regionIds/placeIds
têm precedência sobre o genérico quando também correspondem ao propósito.
A cultura não concede bônus mecânicos. Sem preferência concreta, uma herança
não gnômica válida pode ser proposta de forma estável pelo ID; a prévia indica isso.

Para gnomos, exige animal da ânima e um perfil compatível. O perfil escolhe a
estrutura de herança e prioriza opções concretas que precisam pertencer aos
grupos autorizados. Se faltarem opções suficientes, o pedido fica pendente.
Os exemplos de cobra, gato e gavião são propostas de campanha, não uma tabela
oficial obrigatória animal -> benefício. Gavião não concede voo automaticamente.

Uma palavra reconhecida na descrição não prova que todos os efeitos mencionados
foram implementados mecanicamente: confira a proposta e a ficha nativa, em
especial capacidades adicionais narradas e escolhas descritas só em prosa.

## Pedidos enviados por outros módulos

```js
const api = game.modules.get('quedaco').api;
const guide = api.getNpcBatchInstructions().descriptionEngine;
await api.stageNpcRequests({
  id: 'teatro:guarda-01',
  sourceModule: 'quedaco-teatro', batchId: 'equipe-areia', teamId: 'areia',
  text: 'Uma gnoma com ânima de cobra, batedora em Huma, nível 1',
  name: 'Serena'
});
const preview = await api.prepareNpcRequests({ids: ['teatro:guarda-01']});
// Mostrar preview.rows: proposta, decisões e pendências.
// Após a ação da Mestra:
if (!preview.issues.length) {
  const result = await api.createPreparedNpcRequests(
    {ids: ['teatro:guarda-01']}, {expectedSignature: preview.signature}
  );
}
```

`listNpcRequests({sourceModule,batchId,state})` consulta a fila. Um mesmo pedido
com o mesmo ID e conteúdo não cria outra entrada. Para editar, reenviar o pedido
com `expectedRevision` correspondente à revisão atual. IDs explícitos são
recomendados aos módulos; quando omitidos, um ID é derivado do conteúdo.
Para gerar dois indivíduos idênticos em conceito, envie IDs diferentes.

O pedido aceita text e opções explícitas de name, level, purpose, legacy,
heritage, anima, characterClass, background, attributes, cash, inventory,
benefitChoices, sourceModule, batchId, teamId, organizationId, environmentId, regionId, placeId, relations,
tags, appearance, clothes, behavior, desire e spellcasting.

O estado pode ser draft, needs-choices, ready, created ou needs-review.
Mudança de pedido, revisão do Cadastro, perfil ou documento resolvido invalida
a prévia. Falhas depois de criar são reportadas; fichas não são apagadas.
Execute pela sessão da Mestra ativa. A fila client-side não é uma transação
distribuída entre várias abas da mesma conta.

## Armazenamento e dados para alimentar

Pedidos e propostas ficam em JournalEntries com ownership.default=0 e flag
`quedaco.npcRequest`, fora de settings compartilhados. Não são Journals de
ambientação pública. Os perfis genéricos, sem segredos, ficam no Cadastro
`npcGenerationProfiles`; aceitam importação/exportação pelo formato existente.

Veja [DIAGNOSTICO-NUTRICAO-NPCS.md](DIAGNOSTICO-NUTRICAO-NPCS.md) para a avaliação
e um exemplo concreto de perfil regional. O botão Diagnosticar informações do
Cadastro executa `api.auditNpcGeneration()` usando os compêndios reais da sessão.

## Validação desta entrega

Testes Node cobrem reconhecimento, prioridades regionais, escolha de nível,
ânimas distintas, as duas estruturas de herança, entrada inválida, persistência,
permissões, revisão/assinaturas, idempotência, seleção de pedidos e erro parcial.
A interface foi exercitada no Chrome headless com APIs/documentos simulados.
Nenhum Actor oficial foi criado. Ainda falta conferir o resultado nos compêndios
e fichas nativas da mesa real. Os limites de regras descritos em COBERTURA.md do
Criador continuam aplicáveis, sobretudo decisões internas descritas só em prosa.
