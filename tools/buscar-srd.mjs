// T24, passo 7 — busca de novo os monstros do SRD 5.1 na API pública do Open5e.
// Por quê: os 326 monstros de D&D já importados perderam teste de resistência, perícia,
// idioma e tamanho na primeira importação (não ficaram guardados em lugar nenhum, nem na
// biografia). Reconverter com o que já está no mundo não recupera isso — só buscando de
// novo a fonte. Roda no seu computador (Node), não no Foundry.
//
// Uso:
//   node tools/buscar-srd.mjs
//
// Grava .local/srd-monstros.json (fora do git — é dado de terceiro, licença CC-BY 4.0,
// SRD 5.1 da Wizards of the Coast via https://open5e.com). A macro
// .local/reconverter-monstros-dnd.js lê esse arquivo pra atualizar os Actors do mundo.
import { writeFileSync } from 'node:fs';
import { local } from './raiz.mjs';

const BASE = 'https://api.open5e.com/v1/monsters/';
const PARAMS = 'document__slug=wotc-srd&limit=100';

async function buscarTudo() {
  const resultados = [];
  let url = `${BASE}?${PARAMS}`;
  let pagina = 0;
  while (url) {
    pagina++;
    process.stdout.write(`Página ${pagina}... `);
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error(`Open5e respondeu ${resposta.status} em ${url}`);
    const corpo = await resposta.json();
    resultados.push(...(corpo.results ?? []));
    console.log(`${resultados.length} monstros até agora.`);
    url = corpo.next ?? null;
  }
  return resultados;
}

const monstros = await buscarTudo();
if (!monstros.length) {
  console.error('Nenhum monstro encontrado — confira se a API do Open5e mudou de formato (campo "results"/"next").');
  process.exit(1);
}
const destino = local('srd-monstros.json');
writeFileSync(destino, JSON.stringify(monstros, null, 2));
console.log(`\n${monstros.length} monstros do SRD salvos em ${destino}.`);
console.log('Agora rode a macro .local/reconverter-monstros-dnd.js no Foundry (prévia primeiro).');
