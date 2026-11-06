import {createHuntProfileService} from './hunt-profiles.mjs';
Hooks.once('ready',()=>{
  const module=game.modules.get('quedaco'),profiles=createHuntProfileService(game,{updateActors:changes=>foundry.documents.Actor.updateDocuments(changes)});
  module.api=Object.freeze({...module.api,...profiles,capabilities:Object.freeze({...module.api?.capabilities,huntProfiles:true})});
  Hooks.callAll('quedaco:register',module.api);
});
