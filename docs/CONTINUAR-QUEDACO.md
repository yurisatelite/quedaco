# QUEDAÇO — instrução de continuidade para Sol, Claude ou outra IA

Atualizado em 09/09/2026. Este é o ponto de entrada; não releia toda a conversa.

## Pedido atual do Yuri

Separar pesquisa de implementação para reduzir repetição e consumo de contexto. Usar o cruzamento já registrado, implementar em etapas curtas e manter este documento atualizado. Nesta rodada foram feitas leitura, conferência pontual e documentação; nenhum código funcional ou release foi alterado.

QUEDAÇO é um painel de auxílio ao mestre. A criação de personagens é uma área dele.

| Acesso | Mestre | Jogador |
|---|---|---|
| Botão lateral esquerdo do Foundry, junto dos controles de cena | Abre o painel completo | Botão não aparece |
| Botão “QUEDAÇO · Criar personagem” na aba Atores | Abre em Criação de Personagens, mantendo todas as abas disponíveis | Abre apenas a criação de personagens |

Os dois acessos devem reutilizar a mesma janela e preservar o personagem em elaboração. O compartilhamento de outras abas implementado por Claude não equivale a esse pedido: para esta especificação, a navegação do jogador fica restrita à criação. Preservar configurações existentes; não apagar dados de compartilhamento como efeito colateral.

## Estado comprovado localmente

- Pasta: `E:/CODEX-RPG`. Tag de referência anterior: `v0.4.8` (`4723271`).
- Manifesto e package.json: **0.4.9** preparados localmente. Foundry 13 build 351 / Skyfall 1.0.1 são o ambiente confirmado anteriormente.
- **65 testes passaram em 09/09/2026.** São testes locais; não demonstram funcionamento completo da ficha nativa.
- O handoff de Claude informa que 0.4.1 e 0.4.2 foram publicadas e 0.4.0 ficou em draft. Essa publicação e a versão instalada no servidor **não foram verificadas novamente nesta rodada**. Não publicar o draft antigo 0.4.0.
- Mundo remoto oficial: **Skyfall RPG**, em `https://yurisatelite2026.foundryserver.com/game`.
- Manifesto de atualização: `https://github.com/yurisatelite/quedaco/releases/latest/download/module.json`.

## Pesquisa existente — aproveitar, não recomeçar

| Domínio | Base pronta | Evidência / arquivo |
|---|---|---|
| Geografia | 10 regiões, 48 cidades/locais/Quedas, 5 entradas além de Opath; vínculos e destaques | `src/book-world.mjs`; índice `.local/book/index/world.md` |
| Monstros | 44 blocos com nome, ND, tipo, papel e página; ainda não são novas fichas | `src/book-monsters.mjs`; índice `.local/book/index/monsters.md` |
| Itens | 214 entradas de consulta, incluindo 58 sigilos, materiais, sinapses, artefatos e serviços | `src/book-items.mjs`, `src/book-sigils.mjs`; índice `.local/book/index/items.md` |
| Conferência anterior | Claude registra revisão das 321 entradas e correções de quatro pontos | `docs/CONFERENCIA-BIBLIOTECA.md` |

Não afirmar que todas as fichas dos compêndios foram comparadas mecanicamente com o livro. O audit atual de monstros compara **nome e tipo `npc`**. A quantidade real de ameaças ausentes no servidor continua dependendo do relatório da mesa conectada. Não criar aliases genéricos para forçar correspondências: “Profundo”, indivíduo e coletivo precisam ser examinados.

Conferências visuais complementares realizadas nesta rodada no PDF original:

- P. 457: Braço do Pesadelo é **ND 9**, Feérico, Pequeno, Simples (Sentinela). O ND não é erro de OCR.
- P. 357: a Trilha dos Onze Berrantes é descrita no corpo da seção Imensidão Gelada, com rota de fortalezas. A referência está correta.
- P. 369: o mar gelado de Güngii aparece expressamente na introdução de Tatsumari; não precisa de uma seção própria para ter cartão.

As divergências reais do livro continuam sinalizadas nos dados: custo de imbuir 4º grau, grau de +1 (escudo), preços dos escudos, conversão da Carteira e ícones/textos de ações. Não escolher uma interpretação automaticamente.

Fonte privada: `E:/RPG/Skyfall RPG - Livro Básico DIGITAL 1.25.pdf`. Usar os três índices curtos acima primeiro; abrir páginas completas apenas para uma dúvida identificada. Os índices estão em `.local` e não acompanham o pacote público.

## Código já implementado pelo Claude

Ler `docs/HANDOFF-CLAUDE-2026-09.md` apenas para detalhes técnicos da área em trabalho.

- `src/main.mjs`: atalho de Atores, API `open/openCampaign`, controle lateral exclusivo do GM, reaproveitamento da janela.
- `src/library.mjs`: biblioteca, filtros, conferência de Actors, imagens dos compêndios, configurações de compartilhamento, vínculos de cenas e imagem por local.
- `src/app.mjs`: abas por perfil, fluxo de criação, descrições enriquecidas, escolhas por nível, bloqueio de magias repetidas e dinheiro manual.
- `src/adapter.mjs`: inclusão dos benefícios, ajuste das origens de classe/trilha e recursos finais.
- Fontes: Outfit redistribuível no pacote; Noka opcional como asset privado. Não voltar a incluir Noka no ZIP público.

## Fila curta de implementação e verificação

**Registro — T1 concluída localmente (0.4.4, 09/09/2026):** os níveis 2 e 7 agora
tratam trilha como escolha visível, sem o selo `auto`; o nível 7 usa o rótulo completo
para avançar a primeira trilha ou selecionar a segunda. Os testes de plano validam os
dois grupos com uma opção acessível e uma escolha cada. `npm test` passou com 48 testes.
Ainda falta a confirmação visual do Yuri em uma ficha real no Foundry.

**Registro — correções de criação concluídas localmente (0.4.5, 09/09/2026):** a
janela voltou a respeitar o redimensionamento nativo do Foundry; a opção “Sem maldição”
fica selecionada visualmente; os botões de ajuda e controles de perícia têm dimensões
fixas; etapas pendentes recebem `!` amarelo e levam ao requisito ao serem abertas. Para
Ocultista, o fallback do livro oferece 3 truques no nível 1 e mais um nos níveis 5 e 9
quando os grants nativos estiverem ausentes. `npm test` passou com 49 testes. Falta
validação visual no Foundry após instalar o pacote.

**Registro — T2 concluída localmente (0.4.6, 09/09/2026):** cabeçalho e abas de área
não encolhem com bibliotecas altas; o conteúdo das áreas passa a rolar dentro do painel.
O menu permanece visível ao alternar Mapa, Monstros, Itens e NPCs. Falta confirmação
visual no Foundry após instalar o pacote.

**Registro — B1–B4 concluídos localmente (0.4.7, 09/09/2026):** etapas não visitadas
não recebem selo; etapas visitadas exibem `!` somente quando incompletas. A rolagem é
preservada no contêiner interno correto. Renderização, cliques e nova renderização
ignoram o painel quando ele já foi desmontado. O contorno amarelo concorrente foi
removido das grades de seleção. `npm test` passou com 49 testes. O erro de mapa exige
confirmação na mesa, pois não é reproduzível fora dela.

**Registro — T3 concluída localmente (0.4.8, 09/09/2026):** o cabeçalho passou a usar
`assets/quedaco-dragon.png`, a arte oficial transparente do dragão em queda. O ícone
SVG provisório foi removido e a sombra externa foi suavizada para não duplicar o brilho
da própria imagem. `npm test` passou com 49 testes. Falta confirmação visual no
Foundry após a instalação.

**Registro — T4–T13 concluídas localmente (0.4.9, 09/09/2026):** cartões, imagens
configuráveis de regiões, catálogo de itens, painel e vínculos de NPCs, lojas e o
montador de item modificado foram incorporados ao painel. Monstros agora têm filtros
por facetas com E entre facetas e OU dentro da mesma faceta; resultado vazio pode
executar somente a macro configurada pelo mestre. Actors criados ou atualizados
recarregam o painel, e NPCs `character` nas pastas da macro são detectados com local
derivado da pasta regional. `npm test` passou com 65 testes e o pacote foi gerado.
Ainda falta a confirmação visual do Yuri no Foundry.

1. **Validar 0.4.4 na mesa.** Esta versão corrige `openCreator` para sempre abrir a área solicitada, remove `onChange` duplicado do controle de cena, inclui seleção de trilha de reserva nos níveis 2 e 7, permite a mesma trilha duas vezes no plano e preserva/atribui `path-01` e `path-02` por UUID do compêndio. Os testes agora cobrem ambas as formas de trilha; falta confirmar no Actor real.
2. **Acessos e permissões.** O botão lateral já existe; verificar sua posição e o hook no Foundry 13. Aplicar a matriz de acesso acima, inclusive nos manipuladores.
3. **Progressão nativa, especialmente trilhas.** Criar ficha nível ≥3 e nível ≥7 com trilha; abrir a ficha e verificar níveis 2..N, primeira trilha, trilha avançada e segunda trilha. Não criar Actor oficial sem autorização expressa.
3. **Auditoria da mesa.** Abrir Monstros, executar a conferência e salvar o relatório. Separar encontrado por nome, ausente, outro tipo de ficha e falha de acesso. Não criar as ameaças pendentes.
4. **Verificação visual pontual.** Descrições com blocos nativos, rodapé fixo, filtros e scroll; acesso GM/jogador. Hotspots do mapa são estimados, não geografia validada. Coordenadas e imagens dependem da imagem escolhida por Yuri.
5. **Distribuição.** Só preparar versão posterior à última publicada após a etapa implementada passar nas verificações. Nunca substituir ZIP de versão publicada. Conferir manifesto remoto antes de escolher a próxima versão.

## Conhecimento caro do sistema — não redescobrir

Arquivo local do sistema: `C:/Users/YURI/AppData/Local/FoundryVTT/Data/systems/skyfall/skyfall.mjs`.

- Nível do Actor deriva dos Items de classe.
- A árvore da ficha usa `system.origin`: classe nos slots `class-01`…`class-N`; trilhas em `path-01` e `path-02`; benefícios ligados aos IDs dos benefícios de origem.
- O ciclo de criação da classe pode reescrever a origem para `class-01`, por isso existe finalização posterior.
- `Path.identityOrigin()` (aprox. 7841) adiciona `path-02` a uma trilha já existente de mesmo identifier e cancela a nova criação. Logo, uma trilha pode ocupar dois slots em um único Item.
- O código do sistema deriva o nível da trilha da quantidade de origens `path-` (aprox. 7829). Não converter isso em “número de Items de trilha”.
- O QUEDAÇO suspende temporariamente `BenefitsDialog.prompt` durante inclusão e o restaura em `finally`; preservar a restauração em falhas.

## Limites e rotina econômica

Não criar/editar/excluir Actors oficiais para testar sem autorização expressa. Nenhuma criação automática de ameaças, aplicação de modificações em itens, preenchimento de Quests ou seleção de encontros/mapas foi autorizada para esta fase. NPCs e demais áreas futuras continuam reservados.

Para cada etapa: ler somente arquivos pertinentes, implementar, rodar os testes adequados e registrar resultado aqui. `npm test` e `npm run package` antes de declarar implementação pronta. Não reler o livro inteiro, não carregar toda a conversa, não usar múltiplos agentes por padrão. Se surgir dúvida nova de regra, registrar a pergunta, página e campo afetado; resolver somente essa lacuna.

Ao encerrar, informar: etapa concluída, testes, validação real no Foundry, pendência seguinte. Não confundir “código implementado”, “release publicada” e “atualização instalada”.

## Prompt para colar em outra IA

> Continue o QUEDAÇO em E:/CODEX-RPG. Leia primeiro docs/CONTINUAR-QUEDACO.md e siga a fila curta, começando pelos acessos e permissões. Aproveite os dados e índices existentes; não refaça o cruzamento completo do livro. Preserve o trabalho do Claude na versão local 0.4.2. O painel lateral é exclusivo do mestre; Atores → Criar personagem abre a criação na mesma janela, com todas as abas para GM e só criação para jogadores. Trabalhe uma etapa por vez, registre evidências e pendências no documento. Não altere Actors oficiais nem publique uma versão antiga. Se não tiver acesso à pasta, peça este documento e somente os arquivos necessários à etapa atual.
