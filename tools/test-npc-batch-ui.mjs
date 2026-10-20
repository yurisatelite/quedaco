import {chromium} from 'playwright-core';
import {mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createVisualServer} from './visual-server.mjs';
const {server,url}=await createVisualServer();let browser;
try{
  browser=await chromium.launch({executablePath:process.env.QUEDACO_BROWSER_PATH??'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const page=await browser.newPage({viewport:{width:1000,height:800}});
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.waitForSelector('html[data-ready="true"]',{state:'attached'});
  await page.evaluate(async()=>{
    document.body.innerHTML='';
    class Dialog {
      constructor(options){this.options=options;}
      _onRender(){}
      render(){
        this.element=document.createElement('section');this.element.className='application sy-creator';
        this.element.style.cssText='width:min(760px,calc(100% - 16px));height:auto;max-height:95vh;background:#171e29;color:#e6edf5;overflow:auto';
        this.element.innerHTML=`<header class="window-header"><h1>${this.options.window?.title??''}</h1></header><div class="window-content">${this.options.content}</div><footer>${(this.options.buttons??[]).map(button=>`<button type="button" data-action="${button.action}">${button.label}</button>`).join('')}</footer>`;
        document.body.append(this.element);
        for(const button of this.options.buttons??[])this.element.querySelector(`[data-action="${button.action}"]`).onclick=async event=>{try{await button.callback?.(event,event.target,this);}catch(error){globalThis.uiErrors.push(error.message);}};
        this._onRender({},{});return this;
      }
      static async confirm(){return true;}
    }
    globalThis.uiErrors=[];
    globalThis.foundry.applications.api.DialogV2=Dialog;
    const {createWorldCatalogService}=await import('/src/world-catalog.mjs');
    const {createNpcModelService,CREATOR_ID}=await import('/src/npc-models.mjs');
    const {createNpcRequestService}=await import('/src/npc-requests.mjs');
    const {createNpcPopulationService}=await import('/src/npc-population.mjs');
    const {NPC_BATCH_EXAMPLE}=await import('/src/npc-batch-content.mjs');
    const {openAmbientImporter,createAmbientNpcModels}=await import('/src/panels/ambient-import.mjs');
    let stored={};globalThis.game={user:{id:'gm',isGM:true},actors:[],journal:[],modules:new Map(),settings:{get:()=>stored,set:async(_id,_key,value)=>{stored=value;}}};
    globalThis.ui={notifications:{info:message=>globalThis.lastNotice=message}};
    game.modules.set(CREATOR_ID,{active:true,api:{family:'quedaco',contractVersion:1,capabilities:{npcTemplates:true,npcBatch:true},prepareNpcTemplate(){},createNpcFromTemplate(){},async prepareNpcBatch(batch){return {total:batch.npcs.length,signature:'preview',errors:[],rows:batch.npcs.map(npc=>({...npc,capacity:10,volume:0,inventory:'Sem itens'}))};},async createNpcBatch(){return {created:0,existing:0,errors:1,warnings:[],results:[{id:'teatro:mara',name:'Mara',status:'error',error:'Falha simulada de criação'}]};}}});
    const catalog=createWorldCatalogService(game),service=createNpcModelService(game,catalog);
    const creator=game.modules.get(CREATOR_ID).api;
    creator.capabilities.npcDescription=true;
    creator.capabilities.npcProfileSelection=true;
    creator.prepareNpcDescription=async request=>request.text.includes('tritão')?{id:request.id,state:'needs-choices',issues:['Tritão não disponível nos compêndios.']}:{id:request.id,state:'ready',name:request.batchId?.startsWith('pop:')?request.id:'Nara',model:{id:request.id,name:request.batchId?.startsWith('pop:')?request.id:'Nara',legacy:'Anuro',characterClass:'Combatente',background:'Militar',level:1},signature:'ready',issues:[],decisions:[{value:'Militar',reason:'Perfil da campanha.'}]};
    creator.createNpcFromTemplate=async model=>{const actor={uuid:'Actor.nara',flags:{[CREATOR_ID]:{npcModel:{id:model.id}}},async update(){}};game.actors.push(actor);return {status:'created',actorUuid:actor.uuid};};
    creator.getNpcCreationCatalog=async()=>({items:[{name:'Anuro',type:'legacy'}],failures:[]});
    const JournalClass={async create(data){const doc=structuredClone(data);doc.update=async changes=>{doc.flags.quedaco.npcRequest=structuredClone(changes['flags.quedaco.npcRequest']);};game.journal.push(doc);return doc;}};
    const requests=createNpcRequestService(game,catalog,{JournalClass});
    const population=createNpcPopulationService(game,catalog,requests);
    globalThis.batchUI={api:{...catalog,...service,...requests,...population},example:NPC_BATCH_EXAMPLE,create:()=>createAmbientNpcModels(batchUI.api),open:()=>openAmbientImporter(batchUI.api)};
    openAmbientImporter(catalog);
  });
  await page.getByText('Como preparar um lote de NPCs',{exact:true}).click();
  await page.locator('[name="ambientText"]').fill(await page.evaluate(()=>batchUI.example));
  if(!await page.locator('[data-action="apply"]').isDisabled())throw Error('Aplicar habilitado antes da prévia.');
  await page.locator('[data-preview-ambient]').click();
  await page.locator('[data-ambient-preview]').getByText('Adicionar',{exact:false}).waitFor();
  await page.locator('[data-action="apply"]').click();
  if(await page.evaluate(()=>batchUI.api.listNpcModels().length)!==1)throw Error('Importação não persistiu o modelo.');
  await page.evaluate(()=>batchUI.create());
  await page.getByText('Falha simulada de criação',{exact:false}).waitFor();
  await mkdir(resolve('.local/visual-review'),{recursive:true});
  await page.screenshot({path:resolve('.local/visual-review/npc-batch-import.png')});
  await page.evaluate(()=>{document.body.innerHTML='';batchUI.open();});
  await page.getByText('Descrever e preparar NPCs',{exact:true}).click();
  await page.locator('[name="npcRequestText"]').fill('Uma Anura guarda em Huma nível 1');
  await page.locator('[data-npc-request="stage"]').click();
  await page.locator('[data-npc-request-output]').getByText('Pronto para revisar',{exact:false}).waitFor();
  if(await page.evaluate(()=>game.actors.length)!==0)throw Error('Preparar criou Actor.');
  await page.locator('[data-npc-request-list] input[type="checkbox"]').check();
  await page.locator('[data-npc-request="preview"]').click();
  await page.locator('[data-npc-request-output]').getByText('Perfil da campanha.',{exact:false}).waitFor();
  await page.screenshot({path:resolve('.local/visual-review/npc-description-ready.png')});
  await page.locator('[data-npc-request="create"]').click();
  await page.locator('[data-npc-request-output]').getByText('1 criados',{exact:false}).waitFor();
  await page.locator('[name="npcRequestText"]').fill('Um tritão guarda no arquipélago de Uma nível 2');
  await page.locator('[data-npc-request="stage"]').click();
  await page.locator('[data-npc-request-output]').getByText('Tritão não disponível nos compêndios.',{exact:true}).waitFor();
  if(!await page.locator('[data-npc-request="create"]').isDisabled())throw Error('Criação permitida com pendência.');
  await page.locator('[data-npc-request="audit"]').click();
  await page.locator('[data-npc-request-output] pre').waitFor();
  await page.setViewportSize({width:480,height:700});
  if(await page.locator('.sy-ambient-import').evaluate(element=>element.scrollWidth>element.clientWidth+2))throw Error('Conteúdo da janela transborda em largura estreita.');
  if(await page.evaluate(()=>game.actors.length)!==1)throw Error('Ficha foi duplicada ou criada em pendência.');
  await page.locator('[data-npc-request="guide"]').click();
  if(!(await page.locator('[data-npc-request-output] textarea').inputValue()).includes('prepareNpcGroup'))throw Error('Modelo não mostra fluxo por código.');
  await page.locator('[name="npcPopulationRegion"]').selectOption('huma');
  await page.locator('[name="npcPopulationCount"]').fill('2');
  await page.locator('[name="npcPopulationLegacies"]').fill('Anuro');
  await page.locator('[data-npc-request="population-plan"]').click();
  await page.locator('[data-npc-request-output]').getByText('2 propostas',{exact:false}).waitFor();
  if(await page.evaluate(()=>game.actors.length)!==1)throw Error('Sortear criou Actor.');
  await page.screenshot({path:resolve('.local/visual-review/npc-population-preview.png')});
  await page.locator('[data-npc-request="population-stage"]').click();
  await page.locator('[data-npc-request-output]').getByText('2 pedidos guardados',{exact:false}).waitFor();
  if(await page.locator('[data-npc-request-list] input:checked').count()!==2)throw Error('Lote regional não ficou selecionado.');
  if(!await page.locator('[data-npc-request="population-stage"]').isDisabled())throw Error('Elenco já guardado ainda pode ser reenviado pelo botão.');
  await page.locator('[data-npc-request="preview"]').click();
  await page.locator('[data-npc-request-output]').getByText('Perfil da campanha.',{exact:false}).first().waitFor();
  await page.locator('[data-npc-request="create"]').click();
  await page.locator('[data-npc-request-output]').getByText('2 criados',{exact:false}).waitFor();
  if(await page.evaluate(()=>game.actors.length)!==3)throw Error('Lote regional não chegou ao Criador.');
  const callbackErrors=await page.evaluate(()=>uiErrors);
  if(errors.length||callbackErrors.length)throw Error([...errors,...callbackErrors].join('\n'));
  console.log('UI: importação, descrição, modelo para IA por código, sorteio regional, fila, revisão, criação selecionada, pendência e diagnóstico conferidos no navegador com mocks.');
}finally{await browser?.close();await new Promise(done=>server.close(done));}
