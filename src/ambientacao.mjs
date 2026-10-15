/**
 * Organizações de ambientação próprias da campanha.
 *
 * NPCs não pertencem a este arquivo: são sempre Actors nativos do sistema
 * Skyfall. O QUEDAÇO apenas lê a flag de catálogo do Actor para agrupá-lo na
 * organização certa, sem duplicar ficha, legado, classe ou nível.
 */
import {ORGANIZATION_PROFILES} from './organization-profiles.mjs';
export const ORGANIZATIONS=Object.freeze([
  {id:'dips',name:'DIPS',aliases:['Divisão de Investigação de Portas e Saletas','Divisão de Investigação de Portais e Seletas','Departamento de Investigação de Portas e Salas de Alberich'],kind:'polícia/investigação',status:'canônica',visibility:'gm',regionIds:['thurthur'],placeIds:['alberich','bosque-passagem'],headquartersPlaceId:'alberich',functions:['Investigar crimes e ocorrências ligados a Portas, Salas e Saletas','Conter ameaças e criminosos extraplanares','Registrar e fiscalizar fenômenos planares'],npcRoles:['comissário','detetive','agente de campo','analista de Portas','perito arcano','guarda de custódia','informante'],source:{book:'Skyfall RPG — Livro Básico Digital 1.25',pages:[329,335,376,391]}},
  {id:'copa',name:'COPA',aliases:['Central de Operações da Política de Alberich'],kind:'força-tarefa',status:'canônica',visibility:'gm',regionIds:['thurthur'],placeIds:['alberich','bosque-passagem'],headquartersPlaceId:'alberich',functions:['Atuar em Thur Thur e auxiliar governos vizinhos','Patrulhar, conter e responder a incidentes regionais','Coordenar a segurança da rota do Bosque da Passagem'],npcRoles:['coordenador de operações','oficial de ligação','patrulheiro','caçador/rastreador','especialista em contenção','socorrista'],source:{book:'Skyfall RPG — Livro Básico Digital 1.25',pages:[376]}}
].map(org=>({...org,campaignProfile:ORGANIZATION_PROFILES[org.id]})));
