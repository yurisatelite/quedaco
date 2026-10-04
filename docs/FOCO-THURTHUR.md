# Foco da campanha — Thur Thur

Em 03/10/2026, o escopo ativo do QUEDAÇO foi reduzido a **Thur Thur**. A redução é uma camada de visualização: nenhum Actor, Scene, Folder, Item ou vínculo das outras regiões é apagado.

## Conteúdo visível

- Região: Thur Thur e suas 7 localidades.
- Guilda protegida: P.I.P.I.
- Guildas sorteadas: Artífices do Amanhã; Latrun; Segredos; Conselho dos Cavaleiros; Chá da Meia-Noite; Associação Magina; Corruptores; Serviços Gerais de Opath; Pilares de Op; Ratos de Taverna.
- Legados sorteados: Walshie, Tôra, Gnomo e Urodelo.
- NPCs: somente os cuja região resolvida é Thur Thur.

O botão **Mostrar tudo temporariamente** desliga o setting `campaignFocus`. **Retomar foco em Thur Thur** restaura a seleção. Isso não grava alterações em Atores.

## Régua atual de Thur Thur

| Etapa | Peso | Estado |
|---|---:|---|
| Foco de região, guildas, legados e NPCs | 25% | concluído em código e teste falso |
| Sete localidades com cenas vinculadas | 20% | 7/7 no retrato anterior do mundo |
| Escolher e conferir arquivos visuais | 15% | conferir no Foundry hospedado |
| Posicionar tokens dos NPCs | 15% | pendente |
| Conferir visão, iluminação e lojas | 10% | estrutura mantida; conferência pendente |
| Posicionar e ativar passagens | 10% | estrutura mantida; posições pendentes |
| Validação final e atualização instalável | 5% | pendente de autorização de versão |

**Progresso de implementação verificável: 45%.** Os 20% de cenas precisam ser revistos no Foundry depois da instalação.

## Inventário local de mapas — 04/10/2026

Na pasta privada `E:\RPG\QUEDACO\mapas-privados\2-minute-tabletop`, a conferência encontrou
somente os pacotes **Desert Ruins** e **Ruined Keep**. Para a seleção ativa de Thur Thur,
isso já cobre **Velha Alberich** (`Ruined Keep`); Alberich, Lado de Fora, Casebres, Mercado
Repentino, Bosque da Passagem e Salgado Fim continuam dependentes de arquivos que estejam
no Foundry hospedado ou de novos downloads. O FilePicker do mundo é a fonte de verdade para
essa segunda conferência, pois a pasta privada local não espelha o armazenamento do servidor.

## Conferência no Foundry hospedado — 04/10/2026

O Mapa Imersivo do mundo abriu com 123 cenas, 51 organizadas e nenhuma ligação jogável.
Thur Thur já tem uma cena vinculada para cada uma das sete localidades: Alberich, Lado de
Fora, Casebres, Velha Alberich, Mercado Repentino, Bosque da Passagem e Salgado Fim. Os
mapas exibidos no atlas são, respectivamente, `Mapa: Alberich`, `Old Town Roads (Night)`,
`Warehouse - Large`, `Alberich Luta`, `Messy Shop (Day)`, `Forest Overwatch` e
`Death Pits (Day)`.

Há uma entrada órfã sob Lado de Fora (`GaT46iOjJwumsAP5`), cuja cena já foi apagada do
Foundry. Ela foi apenas registrada: o botão para removê-la não foi usado. O Stairways
0.11.1 está disponível e marcado; Regiões nativas está desligado. O mundo ainda mostra as
dez regiões no atlas, portanto a versão publicada 0.11.0 ainda não está instalada ou ativa
nele. Revalidar o foco de campanha depois da atualização.
