# Banco de mapas do Mapa Imersivo — seleção inicial

Atualizado em 22/09/2026. A lista executável está em `src/map-bank.mjs`: **48 localidades e Quedas**, cada uma com uma fonte sugerida. As dez regiões são contêineres conceituais e não recebem battlemap nesta leva. A seleção indica o *tipo visual* de mapa que pode representar a localidade na mesa; não afirma que o desenho retrata literalmente o lugar do livro.

| Região | Localidades → fonte selecionada |
| --- | --- |
| Arquipélago de Huma | Foice → Coastal Town; Pacuma e Papuáma → Desert Island; Kiki, Mahuku e Lapuko → Coastal Town; Vulcão Tief → Dragon’s Lair Bridge; Queda do Tempo → Ruined Keep |
| Confederação de Lim’Sa | Salim e Primeira Grande Queda → Desert Ruins; Travessia → Town Center; Três Bosques → Forest Camp; Ruínas de Esh’El → Ruined Keep |
| Deserto de Mirmir | Kravokia → Town Center; Atoleiro de Kramboso → Jungle Wetland |
| Norvak | At’ui e Imensidão Gelada → Snowy Summit; Bosque de Cordas → Forest Camp; Fosso Vazio → Ruined Keep; Onze Berrantes → Castle Town |
| Protetorado de Forah | Sarfo → Town Center; Recanto Verdejante → Forest Camp; Chegada do Inverno → Castle Town; Queda das Víboras → Jungle Wetland |
| Reino de Blurgh’ta | Maruma e Armação Fétida → Coastal Town; Foz do Encontro → Shipyard Warehouse; Castelete da Tora Furada → Castle Town; Lagoa das Garras Esfomeadas e Vila de Lomp’ta → Jungle Wetland |
| República de Wam’Mawina | Nambowa → Town Center; Pomares Rúnicos e Fazenda Lumb → Forest Camp |
| Tatsumari | Sodori → Town Center; Espinha de Vorax → Highland Pass; Mar de Güngii → Desert Island; Queda da Maré Vermelha → Coastal Town |
| Thur Thur | Alberich, Lado de Fora e Casebres → Town Center; Velha Alberich → Ruined Keep; Mercado Repentino → Market Festival; Bosque da Passagem → Forest Camp; Salgado Fim → Highland Pass |
| Tormund | Ruínas de Tormund, Torá e NoáTorá e Segunda Grande Queda → Desert Ruins; Torres de Marfim → Ruined Keep |

As páginas de cada mapa estão ligadas diretamente na tela **Banco de mapas** do QUEDAÇO. Fonte comum: Ross McConnell / 2-Minute Tabletop, **CC BY-NC 4.0**. Confira os termos do item antes de usar e dê crédito ao artista. A [página de licenciamento do autor](https://2minutetabletop.com/faq/license-and-attribution/) explica o uso não comercial. Os arquivos escolhidos pertencem ao mundo privado Foundry, não ao pacote público do módulo.

## Como a montagem funciona

1. Abra uma região no Mapa Imersivo e expanda **Banco de mapas**. Cada cartão mostra a fonte, licença, saídas planejadas e o arquivo já selecionado.
2. Obtenha o mapa na página do autor e escolha, no FilePicker do Foundry, a versão VTT que você guardou na pasta da mesa. A escolha grava somente o caminho no setting `mapBankFiles`.
3. **Criar cenas com mapas escolhidos** mostra apenas locais sem Scene direta, interna ou legada. Linhas sem arquivo ficam desativadas.
4. **Aplicar cenas marcadas** cria `Scene` com `background.src` e `navigation:false`, registra cada ID sob `place:<id>` no Mapa Imersivo e grava o atlas uma vez. Uma nova execução pula locais que já têm cena.

Este fluxo foi testado com dados e `Scene.create` falsos. Nenhum arquivo de mapa existia na pasta do projeto e nenhuma cena do mundo real foi criada nesta rodada. O visual, a escala e a grade precisam ser conferidos em uma cópia do mundo Foundry; a cena conserva os padrões do Foundry para grade e dimensão.

## Saídas, NPCs, visão e lojas

O banco lista apenas saídas cuja relação pai → sublocal já consta em `book-world.mjs`. Cada uma recebe um nome como **Entrada para Mercado Repentino**, aparece na seção **Mapa Imersivo** e aguarda duas cenas e duas posições. A construção jogável continua dependente da marcação manual dos pontos e do mecanismo escolhido (Stairways ou Regiões nativas). O banco não inventa estradas entre cidades.

Depois da conferência visual das cenas: distribuir os NPCs já existentes por localidade como tokens com prévia e posição escolhida, sem criar ou alterar Atores; configurar a visão por cena após validar no Foundry; e confirmar que a loja do cartão do NPC continua vinculada ao Actor existente. Esses passos dependem de mapas reais para decidir onde cada token e passagem fica.
