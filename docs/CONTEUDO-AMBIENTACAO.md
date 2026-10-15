# Ambientação por arquivos e modelos de NPC

## Responsabilidades

O QUEDAÇO guarda organizações, ambientes e modelos de preparação. A ficha em jogo é
sempre um Actor nativo do Skyfall. O módulo independente de Personagens resolve os
compêndios, benefícios, treinamento, progressão, inventário, dinheiro e vida.
Sem o Criador ativo e compatível, consultar/importar ambientação continua funcionando;
apenas criar fichas fica indisponível. Nenhuma dependência obrigatória foi adicionada.

Esta infraestrutura exige instalar o código atualizado nos dois módulos uma vez.
Depois disso, adicionar conteúdo usa arquivos, sem mudar a versão do módulo.
A revisão do catálogo do mundo e `schemaVersion` do formato são coisas distintas da
versão instalável. Criar um Actor não aumenta a revisão do catálogo.

## Fluxo da Mestra

1. Na Ambientação, escolha **Importar arquivo/texto** e leia um JSON/TXT/MD.
2. Gere a prévia: cada entrada mostra os campos, antes e depois. Nada foi gravado.
3. **Aplicar conteúdo** grava o lote inteiro uma vez, validando suas referências.
4. **Criar fichas** prepara os modelos ausentes pelo Criador e apresenta outra prévia.
   Confirme somente depois de conferir nível, classe, legado, carga e inventário.
5. Os Actors criados aparecem no catálogo pela flag `flags.quedaco.npc`.

Importar nunca cria Actors. Reimportar dados iguais não grava nem aumenta a revisão.
Dados omitidos permanecem; listas fornecidas substituem a lista anterior. Exporte um
backup antes de atualizar. Exportar não inclui as fichas dos Actors nem seus retratos.
O arquivo aceita somente dados: JavaScript, efeitos e campos desconhecidos são rejeitados.
Textos são exibidos escapados. Limites: 2 MB de texto e 500 registros por lote.

A permissão da API/interface é de Mestra. O armazenamento usa configurações do mundo:
não é um cofre criptográfico para informações confidenciais. A visibilidade filtra a
API dos jogadores, sem prometer sigilo contra acesso aos dados brutos do mundo.

## Modelo JSON

```json
{
  "format": "quedaco-ambientacao",
  "schemaVersion": 1,
  "id": "posto-de-campanha",
  "title": "Posto de campanha",
  "records": {
    "environments": [{
      "id": "posto-de-campanha",
      "name": "Posto de campanha",
      "regionId": "thurthur",
      "placeId": "alberich",
      "organizationId": "dips",
      "visibility": "gm",
      "sections": [{"id": "rotina", "title": "Rotina", "text": "Troca de plantão ao amanhecer."}]
    }],
    "npcModels": [{
      "id": "agente-exemplo",
      "name": "Agente de exemplo",
      "organizationId": "dips",
      "environmentId": "posto-de-campanha",
      "model": {
        "name": "Agente de exemplo", "level": 1,
        "legacy": "Anuro", "heritage": "Bufonin",
        "characterClass": "Combatente", "background": "Militar",
        "attributes": {"str": 3, "dex": 1, "con": 2, "int": 0, "wis": 2, "cha": -1},
        "cash": 20, "regionId": "thurthur", "placeId": "alberich",
        "job": "Guarda do posto", "clothes": "Uniforme de serviço gasto.",
        "behavior": "Escuta antes de registrar a ocorrência.",
        "inventory": [{"name": "Lança", "quantity": 1}],
        "relations": []
      }
    }]
  }
}
```

O exemplo demonstra o formato, não certifica uma combinação de compêndios da mesa.
Nomes de legado, herança, classe, antecedente, trilha e itens precisam existir exatamente
nos compêndios autorizados. Ausência, ambiguidade, herança incompatível, opções
insuficientes, falta de proficiência ou excesso de carga interrompem a preparação.

Grupos: `regions`, `places`, `tags`, `climates`, `organizations`, `environments`,
`npcModels`. IDs estáveis usam letras minúsculas, números, hífen ou dois-pontos.
Um ambiente pode ter `parentEnvironmentId` e `connections` (IDs de ambientes).
Organizações podem ter `regionIds`, `placeIds`, `headquartersPlaceId`, `functions`,
`npcRoles`, `sections` e `campaignProfile` (uniforme, conduta, equipamento por função,
finanças, patentes, ganchos e limites). Perfis acrescentados são propostas da campanha.

Campos opcionais do modelo: `curse`, `spellcasting`, `path`, `role`, `appearance`,
`voice`, `routine`, `desire`, `fear`, `secret`, `hook`, `tactics`, `possessions`,
`skillPriority`, `languagePriority`, `featPriority`. Dinheiro em Trocados inteiros;
atributos são os seis modificadores, não resultados de dados. Inventário aceita
`name`, `quantity`, `rename`, `uniform`, `equipped`; uniforme altera descrição/aparência,
sem conceder bônus. Pertences narrativos são identificados como tais, sem preço ou
benefício mecânico. Relações: `target` (ID do modelo), `name`, `kind`, `text`.

Para documentar cada ambiente, preencha seções de aparência, sons/cheiros, iluminação,
acessos, rotina, responsáveis, visitantes, recursos, riscos, conflitos e ganchos.
Separe explicitamente referência do livro e criação da campanha.

## Texto simples para um ambiente

```text
QUEDACO-AMBIENTACAO 1
id: posto-de-campanha
name: Posto de campanha
regionId: thurthur
placeId: alberich
organizationId: dips
---
# Aparência
Sala estreita com mesa de registro e armário de equipamentos.
# Rotina
Troca de plantão ao amanhecer.
```

O formato simples cria um ambiente ou, com `group: organizations`, uma organização.
Pacotes com NPCs usam JSON (também pode ser salvo como `.txt`). Não se executa prosa
livre: o formato precisa ser reconhecido para evitar interpretações silenciosas.

## Console e integração opcional

Abrir o mesmo importador pelo console, depois da instalação:

```js
game.modules.get('quedaco').api.openAmbientImporter()
```

API do principal: `previewAmbientContent(input)`,
`importAmbientContent(input, {expectedRevision})`, `exportAmbientContent()`,
`listEnvironments()`, `getAmbientEnvironment(id)`, `listNpcModels()`,
`previewNpcModel(id)`, `createNpcModel(id, {expectedRevision, expectedSignature})`.
Use a revisão e assinatura retornadas pela prévia. Não cole comando de criação sem
preparar o modelo: a assinatura protege contra mudança de conteúdo/compêndio.

O Criador anuncia `capabilities.npcTemplates: true` no protocolo QUEDAÇO v1 e oferece
`prepareNpcTemplate(model)`, `createNpcFromTemplate(model, {expectedSignature})` e
`refreshNpcTemplateRelations(model)`. A ficha recebe ID do modelo em
`flags.quedaco-personagens-skyfall-rpg.npcModel`.

Uma ficha existente nunca é adotada por nome, substituída ou recriada. Uma criação
parcial fica marcada `needs-review`, com UUID e erro para revisão humana. Relações
atualizam somente o bloco próprio marcado na biografia, preservando texto ao redor;
remover esse bloco impede sua atualização. Actors com dono jogador não recebem
essa atualização de relações. A fila impede concorrência no mesmo cliente; execute
a criação em uma única sessão da Mestra, sem disparar lotes simultâneos em navegadores.

## Validação e limites atuais

Testes automatizados usam dados falsos: importação atômica, repetição, referências,
visibilidade, validação, ponte opcional, identidade de Actor e relações. A ficha completa
com compêndios reais, recursos do Skyfall, permissões e os botões do DialogV2 ainda
precisam de conferência no Foundry 13. Nenhum Actor oficial foi criado nesta implementação.

Referência da interface: [DialogV2 do Foundry 13](https://foundryvtt.com/api/v13/classes/foundry.applications.api.DialogV2.html).
