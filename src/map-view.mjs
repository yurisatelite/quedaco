export const MAP_MIN_SCALE=1;
export const MAP_MAX_SCALE=6;

const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export function clampPan(state,imgW,imgH,viewW,viewH){
  const scale=clamp(finite(state?.scale,MAP_MIN_SCALE),MAP_MIN_SCALE,MAP_MAX_SCALE);
  const width=Math.max(1,finite(imgW,1))*scale,height=Math.max(1,finite(imgH,1))*scale;
  const viewportWidth=Math.max(1,finite(viewW,1)),viewportHeight=Math.max(1,finite(viewH,1));
  const axis=(translation,size,viewport)=>size<=viewport?(viewport-size)/2:clamp(finite(translation),viewport/2-size,viewport/2);
  return {...state,scale,tx:axis(state?.tx,width,viewportWidth),ty:axis(state?.ty,height,viewportHeight)};
}

export function zoomToPoint(state,point,factor){
  const oldScale=clamp(finite(state?.scale,MAP_MIN_SCALE),MAP_MIN_SCALE,MAP_MAX_SCALE);
  const scale=clamp(oldScale*finite(factor,1),MAP_MIN_SCALE,MAP_MAX_SCALE),ratio=scale/oldScale;
  const x=finite(point?.x),y=finite(point?.y),tx=finite(state?.tx),ty=finite(state?.ty);
  return {...state,scale,tx:x-(x-tx)*ratio,ty:y-(y-ty)*ratio};
}

export function focusRegion(regionId,regions,viewW,viewH,imgW=viewW,imgH=viewH){
  const region=regions.find(entry=>entry.id===regionId);
  if(!region||!Array.isArray(region.hotspot))return null;
  const width=Math.max(1,finite(viewW,1)),height=Math.max(1,finite(viewH,1)),imageWidth=Math.max(1,finite(imgW,width)),imageHeight=Math.max(1,finite(imgH,height)),scale=2.4;
  const x=imageWidth*finite(region.hotspot[0])/100,y=imageHeight*finite(region.hotspot[1])/100;
  return clampPan({scale,tx:width/2-x*scale,ty:height/2-y*scale,focus:regionId},imageWidth,imageHeight,width,height);
}

export function resolveHotspot(overrides,kind,id,fallback){
 const value=overrides?.[kind]?.[id];
 return Array.isArray(value)&&value.length===2&&value.every(Number.isFinite)?[Math.max(0,Math.min(100,value[0])),Math.max(0,Math.min(100,value[1]))]:fallback;
}
