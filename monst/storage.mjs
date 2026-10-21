import {FIELD} from './physics.mjs';

// Imports contain data only. Reconstruct a bounded scene instead of accepting
// arbitrary properties from the file (including HTML or prototype keys).
export function cleanCompleted(value, count) {
  return Array.isArray(value) ? [...new Set(value.filter(i => Number.isInteger(i) && i >= 0 && i < count))].sort((a,b)=>a-b) : [];
}
export function cleanLayout(value) {
  if (!value || typeof value !== 'object') throw Error('盤面の形式が正しくありません。');
  const point = p => {
    if (!p || !Number.isFinite(p.x) || !Number.isFinite(p.y) || p.x < FIELD.left || p.x > FIELD.right || p.y < FIELD.top || p.y > FIELD.bottom) throw Error('盤面の座標が範囲外です。');
    return {x:p.x,y:p.y};
  };
  const bounded = (n,lo,hi) => {if (!Number.isFinite(n) || n < lo || n > hi) throw Error('盤面のサイズが範囲外です。'); return n;};
  for (const key of ['targets','enemies','blocks']) if (!Array.isArray(value[key])) throw Error('盤面の形式が正しくありません。');
  if (value.targets.length + value.enemies.length + value.blocks.length > 20) throw Error('盤面の配置は20個までです。');
  let id=1;
  return {type:'free',start:point(value.start),collisionMode:value.collisionMode==='circle'?'circle':'stepped',
    targets:value.targets.map(t=>({id:id++,...point(t),r:bounded(t.r??24,5,60)})),
    blocks:value.blocks.map(b=>({id:id++,...point(b),w:bounded(b.w,10,150),h:bounded(b.h,10,150)})),
    enemies:value.enemies.map(e=>{const item={id:id++,...point(e),r:bounded(e.r,5,80)};if(e.weak)item.weak={dx:bounded(e.weak.dx,-100,100),dy:bounded(e.weak.dy,-100,100),r:bounded(e.weak.r,5,40)};return item;})};
}
export function parseBackup(text, count) {
  if (text.length > 200000) throw Error('ファイルが大きすぎます。');
  const data=JSON.parse(text);
  if (data?.app!=='shotlab' || data.version!==1 || !Array.isArray(data.completed)) throw Error('SHOT LABの保存ファイルを選んでください。');
  return {completed:cleanCompleted(data.completed,count),lastLesson:Number.isInteger(data.lastLesson)&&data.lastLesson>=0&&data.lastLesson<count?data.lastLesson:0,layout:data.layout==null?null:cleanLayout(data.layout)};
}
export function stepDistance(run, distance, direction) {
  if (!run) return 0;
  const points=[0,...new Set(run.events.map(e=>e.dist)),run.length];
  return direction>0 ? points.find(d=>d>distance+.001)??run.length : points.filter(d=>d<distance-.001).at(-1)??0;
}
