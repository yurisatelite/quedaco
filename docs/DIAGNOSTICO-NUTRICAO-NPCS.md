# O que alimentar para gerar NPCs melhores

Avaliação de 20/10/2026 sobre a **base distribuída no código**. Não é um inventário
do conteúdo já importado no servidor oficial. Use `api.auditNpcGeneration()`
na mesa para conferir sua base atual e a disponibilidade real dos compêndios.

## O que existe

- 10 regiões, 48 localidades, 2 organizações iniciais (DIPS e COPA).
- Todas as regiões/localidades têm resumos no código; passaram a ser preservados
  na consulta compartilhada. Regiões oferecem também comércio, governo e pistas
  de funções de NPCs.
- A base distribuída começa sem ambientes ou modelos individuais importados.
  Os 235 modelos privados documentados em PROGRESSO-POPULACAO-AMBIENTACAO.md
  são material preparado fora do módulo, não prova de Actors/modelos já aplicados.
- Em 0.20.0: seis propósitos genéricos (Navegante, Lutador, Mercador,
  Batedor, Erudito, Ladrão) e três propostas de ânima (cobra, gato e gavião).
- Nenhum perfil regional específico de criação vem preenchido ainda. Os nomes
  e costumes dos perfis iniciais são propostas genéricas da campanha.

## Lacunas prioritárias

| Informação | Por que faz falta | Onde colocar |
|---|---|---|
| Fichas-base de povos usados pela mesa | Tritão não consta entre os 16 legados esperados pelo Criador; sem conteúdo acessível não há mecânica segura para gerar | Compêndio autorizado do Skyfall, como Item de legado/heranças/benefícios compatíveis; depois conferir diagnóstico |
| Profissões e sinônimos | Pedidos de função desconhecida ficam pendentes | Perfis kind=purpose com terms |
| Nomes e costumes de cada região/cidade | A ficha precisa ter identidade local em vez de variação apenas mecânica | Perfis com regionIds/placeIds, names, clothes, behavior, desire; descrição/ambientes para referências culturais |
| Equipamentos por função e experiência | Um kit genérico de Adaga não distingue todas as profissões e patentes | inventory, cash e possessions do perfil; perfis distintos de veteranos/cargos quando necessário |
| Outras ânimas e combinações aprovadas | O motor só possui as três propostas iniciais | Perfis kind=animal, terms, heritage, choicePriority; nomes exatos dos itens |
| Preferências de talento, trilha, magia e treinamento | A função deve orientar escolhas concretas de personagem | choicePriority, skillPriority, languagePriority e spellcasting do perfil; opções explícitas no pedido quando necessário |
| Organizações, cargos, relações e elencos locais | A base institucional distribuída é pequena | organizations/environments/npcModels do Cadastro e relações dos pedidos |
| Requisitos e decisões que o compêndio descreve apenas em texto | A seleção de um item não comprova todos os efeitos e requisitos internos | Revisão da regra no Criador; isso não se resolve adicionando apenas prosa ao Cadastro |

“Arquipélago de Uma” é reconhecido como alias de ditado para Huma neste fluxo;
não é uma região nova. “Tritão” não é trocado automaticamente por Humani, Anuro,
Urodelo ou Tatsunoko. Se a mesa usa uma adaptação, registre explicitamente a
ficha-base e suas regras compatíveis nos compêndios.

## Exemplo de alimentação regional

O pacote abaixo é uma proposta de campanha para complementar, não modificar,
os perfis genéricos. Importe pela Ambientação, gere prévia e aplique. Ele tem
precedência para pedidos de marinheiro/pescador em Huma. Não contém texto extenso
do livro nem concede capacidades por cultura.

```json
{
  "format": "quedaco-ambientacao", "schemaVersion": 1,
  "id": "perfis-huma", "title": "Propostas de criação para Huma",
  "records": {"npcGenerationProfiles": [{
    "id": "navegante-huma", "name": "Navegante de Huma",
    "kind": "purpose", "regionIds": ["huma"],
    "terms": ["marinheiro", "marinheira", "pescador", "pescadora", "navegante"],
    "characterClass": "Combatente", "background": "Navegante",
    "attributes": {"str":2,"dex":3,"con":2,"int":0,"wis":1,"cha":-1},
    "inventory": [{"name":"Adaga","quantity":1}], "cash": 12,
    "names": ["Nara", "Maro", "Tavi"],
    "skillPriority": ["navi","natu","perc"],
    "keywords": ["navegação","água","percepção"],
    "clothes": "Roupa de trabalho adaptada à maresia.",
    "behavior": "Conhece as rotas e consulta a comunidade antes de partir.",
    "desire": "Manter a tripulação e sua comunidade em segurança."
  }]}
}
```

Para animais, copie um perfil kind=animal da exportação e adapte terms,
heritage e choicePriority. Essas preferências precisam oferecer opções suficientes
de cada categoria do grupo: por exemplo, uma maior e duas menores. O motor
verifica pertença/quantidade com os compêndios e deixa pendente se não conseguir.
Não declare voo, veneno ou outros benefícios só porque o animal os sugere.

Referências de nomes/UUIDs: `getNpcCreationCatalog()` na API do Criador. O retorno
também expõe identificadores válidos de treinamento. Conteúdo desconhecido não
é executado. Perfis não devem conter segredos: eles ficam em settings do Cadastro;
use os pedidos privados para descrições confidenciais.
