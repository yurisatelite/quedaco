const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function rollLevel(min,max,rng=Math.random){
  const low=clamp(Math.floor(Number(min)||1),1,12);
  const high=clamp(Math.floor(Number(max)||low),low,12);
  const sample=clamp(Number(rng())||0,0,1-Number.EPSILON);
  return low+Math.floor(sample*(high-low+1));
}
