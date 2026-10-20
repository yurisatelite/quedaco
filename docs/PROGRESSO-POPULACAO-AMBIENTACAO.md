# População de ambientação — 18/10/2026

## Estado verificável

Preparação local concluída. **Criação no mundo ainda não confirmada.**
Não confundir os modelos escritos com Actors existentes.

- [x] Mapear 48 localidades de Opath e cinco referências além de Opath.
- [x] Preparar 24 núcleos institucionais, sem guildas, hansas ou universos alternativos.
- [x] Preparar 235 modelos (37 de Thur Thur), com nomes únicos, legado/herança,
  classe, nível, bolsa, inventário, roupa, rotina, objetivo, segredo e relações.
- [x] Preparar console de pastas e console de criação, com prévia, cópia dos
  dados afetados, relatório e preservação de fichas existentes identificadas.
- [ ] Validar os modelos nos compêndios reais da mesa.
- [ ] Aplicar e registrar quantidades de Actors completos e eventuais pendências.
- [ ] Conferir fichas, recursos, retratos e tokens no Foundry.

São elencos iniciais definidos, não uma enumeração de toda a população possível.
Os integrantes, núcleos e uniformes novos são propostas da campanha; governantes
e personagens canônicos não são substituídos. Os dez modelos anteriores da DIPS
e COPA mantêm seus IDs. As demais combinações mecânicas reutilizam os dez modelos
previamente preparados; a prévia real ainda precisa confirmar seus benefícios.
Contatos mortais de áreas extraplanares não substituem seraphs, diabos ou blocos
de ameaça. Torá/NoáTorá recebe pesquisadores de história, não novos moradores.
O vídeo sobre escolas ainda pode levar a revisão de seus núcleos propostos.

## Conteúdo privado da campanha

Tudo em `.local/populacao/`, fora do pacote público e do git:

- `PACOTE-TODOS.json`: instituições, ambientes, 235 modelos e caminhos de pastas.
- `PACOTE-THUR-THUR.json`: recorte de 37 modelos para a região atual.
- `CONSOLE-CRIAR-PASTAS.txt`: copie inteiro no console e selecione o pacote.
- `CONSOLE-CRIAR-NPCS.txt`: prévia mecânica, Aplicar, importação e criação pelo Criador.
- `CATALOGO-NPCS.md`: elenco completo para revisão da Mestra.
- `PROGRESSO.md`: tabela detalhada por região/localidade.
- `COMO-USAR.md`: instruções de execução e limites.
- `runtime.mjs`, `runtime.test.mjs`: execução portátil e testes com dados falsos.
- `preparar.mjs`, `gerar-console.mjs`: geram os dados e os comandos.

Não exige nova versão do módulo: usa API existente no QUEDAÇO 0.18.5+ e no
Personagens Skyfall RPG 0.1.8+. Não modifica o código dos módulos, nem depende
das alterações de lotes que estavam em trabalho no momento da preparação.
O console de pastas funciona sem o Criador. Executar em uma única sessão da
Mestra; não rodar lotes simultâneos. O relatório e a cópia baixada não substituem
backup completo do mundo no servidor.

## Pastas de Actors

Estrutura: `NPCs · Ambientação / Região / Localidade ou Organização`.
Consulta `CONST.FOLDER_MAX_DEPTH`; se necessário, junta os últimos nomes para
caber no limite. Reaproveita pasta por nome, tipo Actor e pai; ambiguidade
interrompe. Nunca apaga pastas. Só organiza as fichas do elenco identificadas
por ID do Criador ou do antigo importador DIPS/COPA; não adota por nome e não
move fichas com dono jogador. A P.I.P.I. não é tocada.

Referência de API: [Folder — Foundry 13](https://foundryvtt.com/api/v13/classes/foundry.documents.Folder.html).

## Fora desta aplicação

Não cria tokens, Scenes, paredes, luzes, visão, automação de lojas ou
teletransportes. Os retratos ainda são ícones de referência. Importar o elenco
não muda o foco reversível de Thur Thur no painel.
