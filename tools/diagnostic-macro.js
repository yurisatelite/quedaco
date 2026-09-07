// Executar como macro Script no Foundry. Apenas lê compêndios do Livro Básico.
// Não lê macros, chats, usuários, configurações de credenciais ou fichas do mundo.
const report = { foundry: game.version, system: { id: game.system.id, version: game.system.version }, packs: [], failures: [] };
for (const pack of game.packs) {
  if (pack.documentName !== 'Item' || !pack.collection.startsWith('skyfall-core.')) continue;
  try {
    const docs = await pack.getDocuments();
    report.packs.push({ id: pack.collection, label: pack.metadata.label, documents: docs.map(doc => ({ uuid: doc.uuid, name: doc.name, type: doc.type, img: doc.img, system: doc.toObject().system, effects: doc.toObject().effects })) });
  } catch (error) { report.failures.push({pack:pack.collection,message:error.message}); }
}
const summary = report.packs.map(p => `${p.label}: ${p.documents.length}`).join('\n');
saveDataToFile(JSON.stringify(report, null, 2), 'application/json', 'skyfall-catalogo-diagnostico.json');
new Dialog({title:'Diagnóstico do catálogo',content:'<pre>'+summary+'</pre><p>Arquivo de diagnóstico exportado. Nenhuma ficha alterada.</p>',buttons:{ok:{label:'Fechar'}}},{width:600}).render(true);
