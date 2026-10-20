# Ponto de entrada para IA e módulos: grupos de NPCs

QUEDAÇO 0.20.0 + Personagens Skyfall RPG 0.3.0, Foundry 13 / Skyfall 1.0.1.
Preparado localmente; não publicado nem instalado na mesa por esta entrega.

## Primeiro, consulte este contrato

```js
const api = game.modules.get('quedaco').api;
const guia = api.getNpcBatchInstructions().populationEngine;
const cadastro = api.getWorldCatalog();
const diagnostico = await api.auditNpcGeneration();
```

Este é o lugar para apontar qualquer IA/módulo que receba “crie um grupo de
ladrões de Maruma”. Também está no início de Ambientação → Importar arquivo /
texto → Descrever e preparar NPCs → **Modelo para IA e outros módulos**.
A interface é alternativa: o fluxo inteiro funciona por código, sem clique por
personagem e sem confirmação de janela obrigatória.

A IA externa transforma o pedido humano em JSON, consulta IDs reais do Cadastro
e usa os nomes mecânicos disponíveis. Não existe uma IA conversacional embutida.
O próprio QUEDAÇO recebe JSON, valida os pedidos e usa o Criador para criar os
Actors nativos, sem substituir fichas do mundo nem alterar os compêndios.

## Exemplo executável: grupo de ladrões de Maruma

Maruma é a localidade `maruma` na região `blurghta`, não uma região separada.
O perfil inicial `ladrao` propõe Especialista/Procurado, sem afirmar que toda
pessoa ladra tem essa combinação. É editável e precisa ser validado nos
compêndios reais. O conceito do grupo abaixo é proposta de campanha, não cânone.

```js
const api = game.modules.get('quedaco').api;
const documento = {
  format: 'quedaco-grupo-npcs', schemaVersion: 1,
  population: {
    regionId: 'blurghta', placeWeights: {maruma: 1},
    purposeWeights: {ladrao: 1}, legacyWeights: {Anuro: 1},
    count: 6, minLevel: 1, maxLevel: 3,
    teamId: 'ladroes-de-maruma', seed: 'maruma-grupo-01',
    text: 'Proposta da campanha: ladrões que observam os barcos em Maruma, '
      + 'circulam pelas palafitas e usam túneis submersos como rota de fuga. '
      + 'Querem interceptar uma carga sem prejudicar os moradores.'
  }
};
const revisao = await api.prepareNpcGroup(documento);
console.log(revisao.rows, revisao.issues, revisao.population);
```

`prepareNpcGroup` também recebe o JSON como string, inclusive em bloco ```json.
Guarda os pedidos em Journals privados e prepara escolhas. Não cria Actors.
Após conferir as propostas e autorizar a criação, execute:

```js
const resultado = await api.createPreparedNpcGroup(revisao);
console.log(resultado); // created, existing, errors e resultados por Actor
```

Essa chamada passa pelo serviço de pedidos, delega a `createNpcFromTemplate`
do Criador e cataloga as fichas recém-criadas no QUEDAÇO. São Actors `character`,
com inventário, atributos, classe, benefícios e recursos pelo motor existente;
não apenas descrições ou Journals. Pendências bloqueiam o grupo antes de criar.
Falhas depois de iniciar geram relatório individual, sem apagar Actors parciais.

Reenviar o mesmo documento com a mesma seed preserva IDs e evita duplicação.
Para outro grupo recorrente, troque a seed ou omita-a: o sorteio gera uma nova.
Consulte `listNpcRequests({batchId})` para recuperar os pedidos persistidos após
recarregar e `prepareNpcRequests({ids})` para obter outra revisão assinada.

## Elenco escrito pela IA, sem sorteio

Para indivíduos ricos em detalhes, use `requests` no lugar de `population`:

```json
{
  "format": "quedaco-grupo-npcs",
  "schemaVersion": 1,
  "requests": [
    {
      "id": "campanha:maruma:lider-01",
      "sourceModule": "campanha",
      "batchId": "ladroes-maruma-01",
      "teamId": "ladroes-maruma-01",
      "name": "Neri das Cordas",
      "regionId": "blurghta",
      "placeId": "maruma",
      "purposeProfileId": "ladrao",
      "legacy": "Anuro",
      "level": 3,
      "text": "Líder de um grupo de ladrões em Maruma. Observa as cargas dos barcos e conhece rotas entre as palafitas. Prefere roubar mercadores abusivos e evita confronto com moradores.",
      "appearance": "Pele marcada pelo sol, mãos calejadas e uma cicatriz no queixo.",
      "clothes": "Roupa leve de secagem rápida e cordas enroladas na cintura.",
      "behavior": "Mede saídas antes de negociar e mantém os cúmplices informados.",
      "desire": "Libertar uma companheira sem comprometer seu esconderijo."
    }
  ]
}
```

Um objeto por integrante, até 200. Reutilize IDs ao reenviar e escolha outros IDs
para indivíduos diferentes. `purposeProfileId` fixa o perfil; se ele não existir
ou estiver fora do local permitido, não substitui por outro. Para editar pedidos
já guardados, use `stageNpcRequests(pedido,{expectedRevision})`, depois prepare.

Para gnomo, incluir `anima` e usar um perfil de animal aprovado: herança e
benefícios são escolhidos com essa referência. Não usar texto de “gavião” para
conceder voo nem inventar regras que não existem nos documentos autorizados.

## Distribuição regional e limites

`population` aceita quantidade 1–200, níveis 1–12, região ativa e pesos positivos
opcionais por localidade/perfil; legados permitidos são obrigatórios. IDs não
listados nos pesos são excluídos. Sem pesos de local, sorteia entre localidades
ativas da região; sem pesos de propósito, sorteia entre perfis em escopo. Pesos
são probabilidades, não cotas exatas. O contexto textual não altera os pesos.
Não se supõe distribuição demográfica oficial nem relações entre organizações.

O caminho de baixo nível continua disponível: `planNpcPopulation(config)`,
`stageNpcPopulation(plano,{expectedSignature})`, `prepareNpcRequests({ids})` e
`createPreparedNpcRequests({ids},{expectedSignature})`.
As revisões invalidam mudanças de pedido, Cadastro, perfil ou conteúdo resolvido.
Nomes repetidos dentro do lote são pendências, não criação parcial silenciosa.

Não cria Scenes, tokens, pastas, paredes, lojas nem ambientação canônica nova.
Não escolhe proficiência/inventário a partir de prosa sem cobertura no motor.
Execute na sessão da Mestra ativa; não execute simultaneamente em várias abas.
Os limites de regras documentados no Criador ainda se aplicam. Testes Node e de
navegador usam dados simulados; falta validar os resultados nativos no Foundry.

Validação local desta entrega: 281 testes do Cadastro + 66 do Criador, teste de
interface no Chrome (inclusive largura 480px), CSS lint e ZIPs conferidos.
Pacotes: `dist/quedaco-0.20.0.zip` e, no repositório do Criador,
`dist/quedaco-personagens-skyfall-rpg-0.3.0.zip`. Nada publicado/instalado.
