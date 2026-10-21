import {FIELD as F} from './physics.mjs';

export function wallName(e) {
  if (e.kind !== 'wall') return null;
  if (Math.abs(e.x - F.right) < .01) return '右';
  if (Math.abs(e.x - F.left) < .01) return '左';
  if (Math.abs(e.y - F.top) < .01) return '上';
  return '下';
}

// Count only the first approach and the following uninterrupted contacts in
// the pocket. A later lucky return cannot satisfy the prescribed approach.
export function pocketProgress(scene, run, distance = run?.length ?? 0) {
  const empty = {success:false, routeOK:false, contacts:0, enemyHits:0, distinct:0, prefix:[], cluster:[]};
  if (!run || !scene.pocket) return empty;
  const events = run.events.filter(e => e.dist <= distance);
  const first = events.findIndex(e => e.kind === 'enemy');
  if (first < 0) return empty;
  const prefix = events.slice(0, first).map(wallName);
  const expected = scene.pocket.approach;
  const routeOK = prefix.length === expected.length && events.slice(0,first).every(e=>e.kind==='wall') && prefix.join(',') === expected.join(',');
  const {x,y,r} = scene.pocket;
  const cluster = [];
  for (const e of events.slice(first)) {
    if (Math.hypot(e.x-x,e.y-y)>r || e.kind==='block' || (!scene.pocket.wall && e.kind!=='enemy')) break;
    cluster.push(e);
  }
  const enemyHits = cluster.filter(e => e.kind==='enemy').length;
  const distinct = new Set(cluster.filter(e => e.kind==='enemy').map(e=>e.objectId)).size;
  const sidesOK = scene.pocket.wall ? cluster.some(e=>e.kind==='wall'&&wallName(e)===scene.pocket.wall) : distinct>=2;
  return {success:routeOK&&sidesOK&&enemyHits>=scene.pocket.minHits,routeOK,contacts:cluster.length,enemyHits,distinct,prefix,cluster};
}

export function loopProgress(scene, run, distance = run?.length ?? 0) {
  const required = scene.loopCrossings ?? [3,6];
  const hits = run?.hits.filter(h=>h.dist<=distance&&h.id===1)??[];
  const passed = required.filter(n=>hits.some(h=>h.refs===n));
  return {success:passed.length===required.length, passed:passed.length, required:required.length};
}
