# Criar NPCs em escala pelo Cadastro

Pedido adicional de 20/10/2026: resolução por descrição/ânima e fila de pedidos
preparados constam em [PROXIMA-ATUALIZACAO-NPCS-POR-DESCRICAO.md](PROXIMA-ATUALIZACAO-NPCS-POR-DESCRICAO.md).
Implementação inicial em QUEDAÇO 0.19.0 / Criador 0.2.0: veja
[MOTOR-NPCS-POR-DESCRICAO.md](MOTOR-NPCS-POR-DESCRICAO.md). Esse fluxo usa
perfis de ânima e seleções explícitas; a API antiga de modelos completos não
passa a interpretar automaticamente toda descrição livre.

Versões locais: QUEDAÇO 0.18.6 e Personagens Skyfall RPG 0.1.9. Foundry 13,
Skyfall 1.0.1. A importação dos modelos funciona mesmo com o Criador desativado.

## Para a Mestra

Envie ao assistente o texto sobre o local e seus personagens: quantidades,
funções, equipes, aparências, personalidades, recursos, segredos e relações.
Peça: “Prepare um documento QUEDACO-NPCS 1 seguindo as instruções do Cadastro”.
O assistente organiza a narrativa e preenche as escolhas mecânicas consultando
o conteúdo autorizado. O módulo interpreta o documento padronizado; ele não tem
uma IA externa embutida para inferir fichas de prosa arbitrária.

No QUEDAÇO, abra **Ambientação → Importar arquivo / texto**. O importador
contém **Como preparar um lote de NPCs**, com instruções e exemplo completos.
Aceita .txt, .md e .json, ou texto colado. Gere a prévia e aplique.
Isso salva modelos no Cadastro; depois clique **Criar fichas dos modelos**,
confira a prévia mecânica e confirme. Ao terminar, veja o relatório.

Cada pessoa recebe ID e nome próprios, inclusive os integrantes de uma equipe.
Reenvios usam os mesmos IDs. Não use “quantidade: 3” em um único modelo: escreva
os três integrantes e atribua a mesma Equipe a eles. Equipe é metadado, não um
Actor de guilda ou time. Apostadores e lutadores são NPCs narrativos construídos
como `Actor.character` pelo Criador; não são ameaças `Actor.npc`.

Os NPCs novos ficam sob controle da Mestra. O lote não cria tokens em cenas,
organizações, locais ou equipes dentro de outro módulo automaticamente.
Organização e Ambiente são IDs opcionais já cadastrados. Um pacote JSON nativo
`quedaco-ambientacao` pode registrar organizações/ambientes e modelos juntos.

## Contrato para módulos e assistentes

Consulte a API pública antes de preparar conteúdo:

```js
const cadastro = game.modules.get('quedaco')?.api;
const instructions = cadastro.getNpcBatchInstructions();
// instructions.example, instructions.fields, instructions.workflow
```

O retorno declara formato, campos, exemplo, limite de 200 NPCs e 2 MB.
O exemplo é conteúdo ilustrativo de campanha, não cânone de Skyfall.
Obtenha escolhas de legado, herança, classe, antecedente, trilha e equipamento
nos compêndios autorizados. Prioridades de perícias e idiomas usam os IDs do
Criador. Dinheiro é inteiro em Trocados; atributos são seis modificadores entre
-4 e +4. O nível permitido é 1–12.

```js
const preview = cadastro.previewAmbientContent(documento);
await cadastro.importAmbientContent(documento, {
  expectedRevision: preview.expectedRevision
});
const ids = ['teatro:mara', 'teatro:lutador-01'];
const fichas = await cadastro.previewNpcBatch({ids});
if (!fichas.errors.length) {
  const report = await cadastro.createNpcBatch({ids}, {
    expectedRevision: fichas.catalogRevision,
    expectedSignature: fichas.signature
  });
  // report.results: status, id, name, actorUuid ou error
  // report.warnings: erro de vínculo ou relação depois da criação
}
```

Métodos de gravação exigem sessão da Mestra. Uma interface consumidora apresenta
a prévia antes de criar. Também pode selecionar por organizationId/environmentId.
IDs explícitos restringem o lote ao elenco pedido. Seleção inválida é rejeitada.
Depois da criação, `cadastro.listNpcs()` oferece UUID, modelId, teamId, tags,
sourceModule, organizationId e environmentId. Um módulo como o Teatro consulta
essa lista para associar seus elencos e equipes às fichas, sem ler flags privadas
do Criador nem repetir regras de criação.

JSON de lote alternativo: um objeto com format: "quedaco-npcs", schemaVersion: 1,
id, name e npcs (lista de modelos completos). O formato humano começa com
`QUEDACO-NPCS 1`, metadados `id:` e `nome:`, separador `---` e um bloco
`## id-estavel | Nome` por NPC. Campos em português estão em instructions.fields.
Listas e atributos usam JSON em uma linha. Descrições continuam em linhas
indentadas por dois espaços. Campos desconhecidos ou repetidos são reportados.

## Falhas e repetição

A prévia resolve os compêndios e aponta erros por NPC sem gravar. Qualquer erro
de validação impede iniciar o lote inteiro. Mudanças no documento, na seleção,
nos compêndios resolvidos ou na revisão invalidam a prévia.
Após iniciar, uma falha é reportada por NPC e os demais continuam.
Ficha parcialmente criada fica needs-review com seu UUID; não é apagada.
Reimportação por ID não adota fichas por nome nem reescreve ficha existente.
Relações entre fichas novas são vinculadas após o lote. Actors com dono jogador
não têm a biografia de relações atualizada.

Testes Node cobrem parser, importação idempotente, seleção, revisão, assinaturas,
falha parcial e criação com documentos fictícios. Compêndios e recursos derivados
reais exigem conferência dentro do Foundry.
