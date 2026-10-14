const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups={regions:'Regiões',places:'Localidades',tags:'Tags',climates:'Climas'};

/** Editor leve: um registro por vez, gravação somente no botão Salvar. */
export async function openWorldCatalogEditor(api,group='places',id=''){
  if(!globalThis.game?.user?.isGM)throw Error('Somente a Mestra pode editar os cadastros.');
  const catalog=api.getWorldCatalog({includeInactive:true});
  const row=catalog[group].find(r=>r.id===id)??{};
  const options=(entries,current)=>`<option value="">Nenhum</option>${entries.map(r=>`<option value="${esc(r.id)}" ${r.id===current?'selected':''}>${esc(r.name)}${r.active===false?' (inativo)':''}</option>`).join('')}`;
  const field=(label,name,value='')=>`<label>${esc(label)}<input name="${name}" value="${esc(value)}"></label>`;
  const select=(label,name,entries,current)=>`<label>${esc(label)}<select name="${name}">${options(entries,current)}</select></label>`;
  const geographic=['regions','places'].includes(group);
  const content=`<div class="sy-catalog-editor"><p>Os módulos conectados consultarão este cadastro. O ID permanece estável; para retirar uma entrada de uso, marque-a como inativa.</p><label>Cadastro<select name="group">${Object.entries(groups).map(([g,label])=>`<option value="${g}" ${g===group?'selected':''}>${label}</option>`).join('')}</select></label><label>Editar entrada<select name="entry">${options(catalog[group],id)}</select></label>${field('ID (novo cadastro)', 'id',row.id)}${field('Nome','name',row.name)}${geographic?`${field('Aliases separados por vírgula','aliases',(row.aliases??[]).join(', '))}${field('IDs das tags separados por vírgula','tags',(row.tags??[]).join(', '))}${select('Perfil de clima','climateId',catalog.climates,row.climateId)}`:''}${group==='places'?`${select('Região','regionId',catalog.regions,row.regionId)}${select('Dentro de outra localidade','parentId',catalog.places.filter(p=>p.id!==id),row.parentId)}${field('Tipo de local','kind',row.kind)}`:''}${group==='regions'?`${select('Capital','capitalId',catalog.places,row.capitalId)}${field('Cor hexadecimal','color',row.color)}`:''}${group==='tags'?field('Categoria','category',row.category):''}${group==='climates'?field('Descrição do perfil','description',row.description):''}<label>Disponibilidade<select name="active"><option value="true" ${row.active!==false?'selected':''}>Ativo</option><option value="false" ${row.active===false?'selected':''}>Inativo (preserva vínculos)</option></select></label><label>Visibilidade<select name="visibility"><option value="gm" ${row.visibility==='gm'||!row.id?'selected':''}>Só Mestra</option><option value="public" ${row.id&&row.visibility!=='gm'?'selected':''}>Público</option></select></label></div>`;
  const Dialog=globalThis.foundry.applications.api.DialogV2;
  class CatalogDialog extends Dialog {
    _onRender(context,options){super._onRender(context,options);const root=this.element;const idInput=root.querySelector('[name="id"]');if(idInput&&row.id)idInput.readOnly=true;for(const name of ['group','entry'])root.querySelector(`[name="${name}"]`)?.addEventListener('change',event=>{const nextGroup=name==='group'?event.target.value:group;void this.close();void openWorldCatalogEditor(api,nextGroup,name==='entry'?event.target.value:'');});}
  }
  const dialog=new CatalogDialog({window:{title:`QUEDAÇO — ${groups[group]}`},position:{width:560},content,buttons:[{action:'save',label:'Salvar cadastro',default:true,callback:async(_event,button)=>{
    const form=button.form??dialog.element.querySelector('form');
    const data=Object.fromEntries(new FormData(form));
    data.id=row.id||data.id;data.active=data.active==='true';
    for(const name of ['tags','aliases'])if(data[name]!==undefined)data[name]=data[name].split(',').map(v=>v.trim()).filter(Boolean);
    try{await api.upsertCatalogRecord(group,data,{expectedRevision:catalog.revision});globalThis.ui.notifications.info('Cadastro salvo.');}catch(error){globalThis.ui.notifications.error(error.message);throw error;}
  }},{action:'close',label:'Fechar'}]});
  return dialog.render({force:true});
}
