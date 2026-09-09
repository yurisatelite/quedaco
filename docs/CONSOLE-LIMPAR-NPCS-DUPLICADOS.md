# Limpar NPCs duplicados pela macro — comando de console

Isto **não é o módulo**. É um comando pra você colar no **Console do Foundry**
(tecla F12 → aba Console) rodando **como Mestre**, no mundo onde estão os NPCs
duplicados. Faça um **backup do mundo** antes (Configuração → Backups, ou copie a pasta
`Data/worlds/<mundo>`).

A macro de geração criou NPCs como `type:"character"` dentro das pastas
`🤖 Criados pela IA` e `🤖 NPCs por Região`. O bug repetiu o mesmo NPC centenas de
vezes. O plano: **manter 1 de cada nome** (o mais antigo) e apagar o resto.

---

## PASSO 1 — conferir (não apaga nada)

```js
const ROOTS = ["🤖 Criados pela IA", "🤖 NPCs por Região"];
const inAi = a => { let f = a.folder; while (f) { if (ROOTS.includes(f.name)) return true; f = f.folder; } return false; };
const alvo = game.actors.filter(a => a.type === "character" && inAi(a) && !a.hasPlayerOwner);
const porNome = {};
for (const a of alvo) (porNome[a.name] ??= []).push(a);
console.table(Object.entries(porNome)
  .map(([nome, l]) => ({ nome, copias: l.length }))
  .sort((x, y) => y.copias - x.copias));
console.log(`Atores nas pastas da IA: ${alvo.length} · nomes distintos: ${Object.keys(porNome).length}`);
console.log("Personagens de jogador ignorados:", game.actors.filter(a => a.hasPlayerOwner).map(a => a.name));
```

Olhe a tabela. Se os números fazem sentido (um punhado de nomes, cada um com muitas
cópias, e nenhum PC de jogador na lista), siga.

---

## PASSO 2 — apagar as duplicatas (mantém a mais antiga de cada nome)

```js
const ROOTS = ["🤖 Criados pela IA", "🤖 NPCs por Região"];
const inAi = a => { let f = a.folder; while (f) { if (ROOTS.includes(f.name)) return true; f = f.folder; } return false; };
const alvo = game.actors.filter(a => a.type === "character" && inAi(a) && !a.hasPlayerOwner);
const porNome = {};
for (const a of alvo) (porNome[a.name] ??= []).push(a);

const apagar = [];
for (const l of Object.values(porNome)) {
  l.sort((x, y) => (x._stats?.createdTime ?? 0) - (y._stats?.createdTime ?? 0));
  apagar.push(...l.slice(1).map(a => a.id)); // tudo menos o primeiro (mais antigo)
}
console.log(`Vou apagar ${apagar.length} duplicatas e manter ${Object.keys(porNome).length}.`);

// Apaga em lotes de 200 para não travar
for (let i = 0; i < apagar.length; i += 200) {
  await Actor.deleteDocuments(apagar.slice(i, i + 200));
  console.log(`  ${Math.min(i + 200, apagar.length)}/${apagar.length}`);
}
console.log("Pronto.");
```

---

## Variante — apagar TUDO nas pastas da IA (recomeçar do zero)

Só se você quer zerar e gerar de novo. Não deixa nenhum.

```js
const ROOTS = ["🤖 Criados pela IA", "🤖 NPCs por Região"];
const inAi = a => { let f = a.folder; while (f) { if (ROOTS.includes(f.name)) return true; f = f.folder; } return false; };
const ids = game.actors.filter(a => inAi(a) && !a.hasPlayerOwner).map(a => a.id);
console.log(`Apagando ${ids.length} atores das pastas da IA…`);
for (let i = 0; i < ids.length; i += 200) { await Actor.deleteDocuments(ids.slice(i, i + 200)); }
console.log("Zerado.");
```

---

## Se o nome não for igual em todas as cópias

Se a macro variou o nome (ex. "Guarda", "Guarda 2", "Guarda (1)"), troque a chave de
agrupamento no PASSO 1 e 2 de `a.name` por um nome normalizado:

```js
const chave = a => a.name.toLowerCase().replace(/\s*[\(\-–]?\s*\d+\)?\s*$/, "").trim();
// ...e use (porNome[chave(a)] ??= []) no lugar de (porNome[a.name] ??= [])
```

Rode o PASSO 1 com essa mudança primeiro e confira a tabela antes de apagar.
