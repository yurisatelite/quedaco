# v0.20.6 — Ampulheta e preparação de caçadas

Ampulheta compartilhada de tempo real, com iniciar, pausar, retomar e encerrar.
A Mestra usa o ícone de ampulheta nos controles de tokens ou a API openHourglass().
Jogadores recebem a contagem e podem fechar a janela sem interrompê-la para os demais.
Prazo usa relógio sincronizado do servidor, sem avançar data/tempo do mundo.

Preparação de perfis para ameaças Chefes e Complexas, excluindo Simples mesmo
quando Brutas. Prévia por API, aplicação em lote com backup da biografia e perfil.
Preserva valores mecânicos; dados ausentes ficam identificados e possibilidades
narrativas aparecem como sugestões. Nenhum Actor é atualizado na instalação.

As caçadas completas e o Atlas 2.0 continuam em desenvolvimento. A interface da
ampulheta usa DialogV2 nativo do Foundry 13. Testes locais e render em navegador com
Dialog simulado aprovados; falta conferência de sincronização entre contas reais
de mestre/jogador no servidor hospedado.

Uso para a Mestra após atualizar:

    game.modules.get('quedaco').api.openHourglass()

Preparar fichas (ler a prévia antes de aplicar):

    const api = game.modules.get('quedaco').api;
    const previa = api.previewMonsterHuntProfiles();
    console.table(previa.rows.map(r => ({nome:r.name, hierarquia:r.profile.hierarchy})));

Aplicar a prévia:

    await api.applyMonsterHuntProfiles(previa.id);

Poções/venenos V2 pertencem ao Gerador 0.2.1: auditados separadamente, sem mudança
de receitas nesta versão. Nome Veneno Escuro não foi localizado no catálogo local.
