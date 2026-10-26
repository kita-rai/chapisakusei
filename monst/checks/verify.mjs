import assert from 'node:assert/strict';
import {simulate,idealAngle,FIELD,atDistance,enemyParts,overlaps,snapAngle,angleIndex,ANGLE_STEP} from '../physics.mjs';
import {pocketProgress,loopProgress} from '../goals.mjs';
import {lessons} from '../lessons.mjs';
for(const [i,scene] of lessons.entries()){
 const r=simulate(scene,snapAngle(idealAngle(scene)),scene.budget||2200);if(scene.type==='pocket'){assert(pocketProgress(scene,r).success,`pocket ${i+1} must be solvable`);continue;}if(scene.type==='crossloop'){assert(loopProgress(scene,r).success,`loop ${i+1} must be solvable`);continue;}assert(r.hits.length>0,`lesson ${i+1} must be solvable`);
 const h=r.hits[0];assert.equal(h.refs,[1,2,2,1,3,2,3,4,5,6,7,8,1,1,1,1,2,8][i]??scene.reflectionCount);
 for(const s of r.segments)for(const p of [s.a,s.b])assert(p.x>=FIELD.left-1e-4&&p.x<=FIELD.right+1e-4&&p.y>=FIELD.top-1e-4&&p.y<=FIELD.bottom+1e-4);
 assert(Math.abs(atDistance(r,r.length).x-r.segments.at(-1).b.x)<1e-5);
}
for(let deg=-179;deg<=180;deg+=3){const r=simulate(lessons[5],deg*Math.PI/180,4200);assert(Number.isFinite(r.length));assert(r.length<=4200.001);}
const enemyScene={start:{x:80,y:300},targets:[],enemies:[{x:220,y:300,r:27}],blocks:[]};assert.equal(simulate(enemyScene,0,500).events[0].kind,'enemy');
const blockScene={start:{x:80,y:300},targets:[],enemies:[],blocks:[{x:220,y:300,w:40,h:40}]};assert.equal(simulate(blockScene,0,500).events[0].kind,'block');
const corner=simulate(lessons[2],idealAngle(lessons[2]));assert.equal(corner.events[0].dist,corner.events[1].dist);
let callback,clock=0;const elements=new Map(),buttons=[];
function el(id){if(!elements.has(id))elements.set(id,{id,value:'',style:{},dataset:{},checked:false,hidden:false,disabled:false,textContent:'',className:'',classList:{toggle(){}},listeners:{},addEventListener(k,f){this.listeners[k]=f;},getBoundingClientRect(){return {left:0,top:0,width:440,height:640};},setPointerCapture(){},contains(target){return target===this;},closest(){return null;},showModal(){this.open=true;},close(){this.open=false;}});return elements.get(id);}
const gradient={addColorStop(){}};const ctx=new Proxy({}, {get:(o,k)=>k in o?o[k]:k==='createLinearGradient'||k==='createRadialGradient'?()=>gradient:()=>{}});
el('board').getContext=()=>ctx;
Object.defineProperty(el('lessonList'),'innerHTML',{set(v){this.html=v;buttons.length=0;for(const m of v.matchAll(/data-lesson="(\d+)"/g))buttons.push({dataset:{lesson:m[1]},classList:{toggle(){}}});},get(){return this.html;}});
const contacts=[];
Object.defineProperty(el('contactList'),'innerHTML',{set(v){this.html=v;contacts.length=0;for(const m of v.matchAll(/data-contact="(\d+)"/g))contacts.push({dataset:{contact:m[1]},classList:{toggle(){}}});},get(){return this.html;}});
const docListeners={};globalThis.document={body:{classList:{add(){},remove(){}}},addEventListener(k,f){const previous=docListeners[k];docListeners[k]=previous?e=>{previous(e);f(e);}:f;},getElementById:el,querySelectorAll:q=>q==='[data-lesson]'?buttons:q==='[data-contact]'?contacts:[],querySelector:q=>el(q),fullscreenElement:null};
const savedValues=new Map();globalThis.localStorage={getItem(k){return savedValues.get(k)??null;},setItem(k,v){savedValues.set(k,v);}};
globalThis.requestAnimationFrame=fn=>{callback=fn;};
el('compare').checked=true;el('speed').value='1';el('trail').value='full';
await import('../app.mjs');
assert(!el('playDialog').open,'reading the page must not automatically open gameplay');
el('board').listeners.pointerdown({clientX:360,clientY:80,pointerId:100});
el('board').listeners.pointermove({clientX:290,clientY:150,pointerId:100});
el('board').listeners.pointerup({type:'pointerup',clientX:290,clientY:150,pointerId:100});
assert(!el('shoot').disabled,'a gesture outside gameplay cannot fire');
for(let i=0;i<lessons.length;i++){
 buttons.find(b=>+b.dataset.lesson===i).onclick();el('ideal').onclick();el('shoot').onclick();
 for(let n=0;n<500;n++){clock+=50;callback(clock);}
 assert(el('result').innerHTML.includes('CLEAR'),`UI lesson ${i+1} must clear`);
 el('scrub').value=400;el('scrub').oninput({target:el('scrub')});callback(clock+=50);el('reset').onclick();
}
el('freeTab').onclick();assert.equal(el('editor').hidden,false);
const board=el('board');board.listeners.pointerdown({clientX:100,clientY:470,pointerId:1});board.listeners.pointermove({clientX:50,clientY:520,pointerId:1});board.listeners.pointerup({type:'pointerup'});assert.equal(el('shoot').disabled,true);for(let n=0;n<500;n++){clock+=50;callback(clock);}el('saveLayout').onclick();assert(el('saveNote').textContent.includes('保存'));
el('help').onclick();assert(el('helpDialog').open);el('closeHelp').onclick();assert(!el('helpDialog').open);
assert.equal(angleIndex(ANGLE_STEP),1);assert.equal(angleIndex(-ANGLE_STEP),1023);assert.equal(snapAngle(ANGLE_STEP*.49),0);assert.equal(snapAngle(ANGLE_STEP*.51),ANGLE_STEP);
el('reset').onclick();board.listeners.pointerdown({clientX:400,clientY:30,pointerId:2});board.listeners.pointermove({clientX:350,clientY:80,pointerId:2});board.listeners.pointerup({type:'pointerup',clientX:350,clientY:80,pointerId:2});assert.equal(el('shoot').disabled,true,'dragging outside the character and playable rectangle must shoot');
el('reset').onclick();board.listeners.pointerdown({clientX:360,clientY:80,pointerId:3});board.listeners.pointermove({clientX:300,clientY:140,pointerId:3});board.listeners.pointercancel({type:'pointercancel',pointerId:3});assert.equal(el('shoot').disabled,false,'cancelled gesture must not shoot');
const comparison=lessons[12],a=snapAngle(idealAngle(comparison));const stepped=simulate({...comparison,collisionMode:'stepped'},a),round=simulate({...comparison,collisionMode:'circle'},a);assert(stepped.events[0].normal);assert(round.events[0].normal);assert(Math.abs(stepped.events[0].normal.x-round.events[0].normal.x)>.01,'stepped and circle must reflect differently');assert(overlaps(enemyScene,{x:220,y:300}));assert(!overlaps(enemyScene));assert(enemyParts(lessons[15].enemies[0]).some(x=>x.part==='weak'));assert.equal(simulate(lessons[15],snapAngle(idealAngle(lessons[15]))).events[0].part,'weak');
console.log('PASS: 25 solvable quantized lessons, angle sweep, obstacle collisions, corner reflections, 25-lesson UI flow, full-board drag, angular snapping, replay, drag shot, save, help, stepped vs circle, weak-point union, overlap rejection');

// A pocket requires actual repeated contact on the first valid approach.
for(const scene of lessons.filter(l=>l.pocket)){
 const run=simulate(scene,snapAngle(idealAngle(scene)),scene.budget);
 const g=pocketProgress(scene,run);assert(g.success);assert(g.enemyHits>=4);
 assert(!pocketProgress(scene,run,run.events.find(e=>e.kind==='enemy').dist).success,'one touch cannot clear');
 const wrong={...scene,pocket:{...scene.pocket,approach:['上','下','左']}};
 assert(!pocketProgress(wrong,run).success,'wrong approach cannot clear after lucky later contacts');
 const miss=simulate(scene,snapAngle(idealAngle(scene))+ANGLE_STEP*8,scene.budget);
 assert(!pocketProgress(scene,miss).success,'an inaccurate approach must not magnetically snap into the pocket');
 const sameEnemy={...run,events:run.events.map(e=>e.kind==='enemy'?{...e,objectId:2}:e)};
 if(!scene.pocket.wall)assert(!pocketProgress(scene,sameEnemy).success,'both enemies are required');
}
// In the continuous model a six-bounce loop closes in position and direction.
for(const scene of lessons.filter(l=>l.type==='crossloop')){
 const {p,q}=scene.ratio,lap=2*Math.hypot(p*(FIELD.right-FIELD.left),q*(FIELD.bottom-FIELD.top));
 const run=simulate(scene,idealAngle(scene),lap+.001),end=atDistance(run,lap);
 assert(Math.hypot(end.x-scene.start.x,end.y-scene.start.y)<.001,'loop closes');
 assert(loopProgress(scene,run).success);assert.equal(run.events.length,6);
 assert(!loopProgress(scene,run,lap*.4).success,'first half of the loop alone cannot clear');
}
// Canvas-wide input: point of contact is independent of the character.
el('boardMargin').closest=q=>q==='.board-wrap'?el('.board-wrap'):null;
el('reset').onclick();docListeners.pointerdown({target:el('boardMargin'),clientX:460,clientY:30,pointerId:9,button:0,pointerType:'mouse'});
board.listeners.pointermove({clientX:390,clientY:100,pointerId:9});
board.listeners.pointerup({type:'pointerup',clientX:390,clientY:100,pointerId:9});
assert(el('shoot').disabled,'dragging from fullscreen margin must shoot');
el('reset').onclick();board.listeners.pointerdown({clientX:360,clientY:80,pointerId:10});board.listeners.pointermove({clientX:300,clientY:140,pointerId:10});docListeners.keydown({key:'Escape'});board.listeners.pointerup({type:'pointerup',clientX:300,clientY:140,pointerId:10});assert(!el('shoot').disabled,'Escape cancels without firing');
// Controls and right clicks never start a shot.
docListeners.pointerdown({target:{closest(){return true;}},clientX:350,clientY:80,pointerId:11,button:0});board.listeners.pointermove({clientX:280,clientY:140,pointerId:11});board.listeners.pointerup({type:'pointerup',clientX:280,clientY:140,pointerId:11});assert(!el('shoot').disabled);
board.listeners.pointerdown({clientX:350,clientY:80,pointerId:12,button:2});board.listeners.pointermove({clientX:280,clientY:140,pointerId:12});board.listeners.pointerup({type:'pointerup',clientX:280,clientY:140,pointerId:12});assert(!el('shoot').disabled);
el('lessonCategory').onchange({target:{value:'gap'}});assert(el('gameTitle').textContent.includes('隙間'));assert(buttons.length===4);el('newPractice').onclick();assert(el('gameTitle').textContent.includes('８の字'));assert(buttons.length===3);
console.log('PASS: first-approach and both-enemy pocket criteria, misses, exact six-bounce closure, margin input, Escape, controls, right click, theme navigation');

// Pages edition: verify actual handlers, not just the helper functions.
el('lessonCategory').onchange({target:{value:'basic'}});
assert.equal(el('previousLesson').disabled,true);
el('followingLesson').onclick();assert(el('gameTitle').textContent.includes('２反射'));
assert.equal(JSON.parse(savedValues.get('shotlab-last-lesson')),1);
el('ideal').onclick();el('shoot').onclick();assert.equal(el('shotReview').hidden,false);
assert(contacts.length>1);contacts[1].onclick();assert(+el('scrub').value>0);assert.equal(el('shoot').disabled,false);
el('previousBounce').onclick();const previousPercent=+el('scrub').value;el('nextBounce').onclick();assert(+el('scrub').value>previousPercent);
el('replayShot').onclick();assert.equal(el('shoot').disabled,true);
for(let n=0;n<500;n++)callback(clock+=50);
let comparisonStrokes=0;ctx.stroke=()=>{if(ctx.strokeStyle==='#97a7ba55')comparisonStrokes++;};
board.listeners.pointerdown({clientX:360,clientY:80,pointerId:21});
board.listeners.pointermove({clientX:300,clientY:140,pointerId:21});callback(clock+=50);
assert(comparisonStrokes>0,'the last trajectory survives preparing the next drag');
board.listeners.pointercancel({type:'pointercancel',pointerId:21});
el('focusMinus').onclick();el('focusShoot').onclick();callback(clock+=50);
assert.equal(el('focusShoot').disabled,true);el('focusPause').onclick();callback(clock+=50);assert.equal(el('focusShoot').disabled,false);
el('focusReset').onclick();assert.equal(el('shotReview').hidden,true);
const beforeAngle=+el('angleNumber').value;
docListeners.keydown({key:'ArrowRight',target:el('board'),preventDefault(){}});assert(+el('angleNumber').value>beforeAngle);
const inputAngle=+el('angleNumber').value;
docListeners.keydown({key:'ArrowRight',target:{closest(){return true;}},preventDefault(){}});assert.equal(+el('angleNumber').value,inputAngle);
await el('backupFile').onchange({target:{files:[{size:10,text:async()=>'{bad'}]}});assert(el('backupStatus').textContent.includes('読み込めません'));
await el('backupFile').onchange({target:{files:[{size:100,text:async()=>JSON.stringify({app:'shotlab',version:1,completed:[23],lastLesson:23,layout:null})}]}});
assert(el('gameTitle').textContent.includes('敵と壁'));assert(JSON.parse(savedValues.get('shotlab-completed')).includes(23));
assert(el('backupStatus').textContent.includes('読み込みました'));
console.log('PASS: lesson paging/resume, clickable contact replay, bounce stepping, replay restart, drag comparison retention, fullscreen controls, keyboard isolation and progress import.');

// Dedicated play surface: scrolling the reading page never initiates aiming.
el('focusExit').onclick();assert(!el('playDialog').open);
docListeners.pointerdown({target:el('boardMargin'),clientX:360,clientY:80,pointerId:30,button:0,pointerType:'touch'});
board.listeners.pointermove({clientX:300,clientY:140,pointerId:30});
board.listeners.pointerup({type:'pointerup',clientX:300,clientY:140,pointerId:30});
assert(!el('shoot').disabled);
el('openPlay').onclick();assert(el('playDialog').open);
let arrowFills=0;ctx.fill=()=>{if(ctx.fillStyle==='#ce3d12')arrowFills++;};
el('reset').onclick();callback(clock+=50);assert.equal(arrowFills,0,'no idle arrow after reset');
board.listeners.pointerdown({clientX:200,clientY:200,pointerId:31});
board.listeners.pointermove({clientX:120,clientY:280,pointerId:31});callback(clock+=50);
assert(arrowFills>0,'drag away from the start shows the arrow');
arrowFills=0;
board.listeners.pointermove({clientX:204,clientY:203,pointerId:31});callback(clock+=50);
assert.equal(arrowFills,0,'returning near the starting point hides the arrow');
board.listeners.pointerup({type:'pointerup',clientX:204,clientY:203,pointerId:31});callback(clock+=50);
assert(!el('shoot').disabled);assert.equal(arrowFills,0,'cancelled release stays arrow-free');
// The release position is authoritative even without a final pointermove.
board.listeners.pointerdown({clientX:200,clientY:200,pointerId:32});
board.listeners.pointermove({clientX:100,clientY:300,pointerId:32});
board.listeners.pointerup({type:'pointerup',clientX:200,clientY:200,pointerId:32});
assert(!el('shoot').disabled);
// Returning to the start does not prevent pulling out again on the same touch.
board.listeners.pointerdown({clientX:200,clientY:200,pointerId:33});
board.listeners.pointermove({clientX:100,clientY:300,pointerId:33});
board.listeners.pointermove({clientX:200,clientY:200,pointerId:33});
board.listeners.pointermove({clientX:100,clientY:300,pointerId:33});
board.listeners.pointerup({type:'pointerup',clientX:100,clientY:300,pointerId:33});assert(el('shoot').disabled);
// Closing gameplay mid-gesture cancels it; opening it again cannot release it.
el('reset').onclick();board.listeners.pointerdown({clientX:200,clientY:200,pointerId:34});
board.listeners.pointermove({clientX:100,clientY:300,pointerId:34});el('focusExit').onclick();el('openPlay').onclick();
board.listeners.pointerup({type:'pointerup',clientX:100,clientY:300,pointerId:34});assert(!el('shoot').disabled);
// The cancel area is measured in screen pixels, independent of board scaling.
board.getBoundingClientRect=()=>({left:0,top:0,width:220,height:320});
board.listeners.pointerdown({clientX:100,clientY:100,pointerId:35});
board.listeners.pointermove({clientX:70,clientY:130,pointerId:35});
board.listeners.pointerup({type:'pointerup',clientX:110,clientY:100,pointerId:35});assert(!el('shoot').disabled,'10 screen pixels cancels even at half-size');
board.listeners.pointerdown({clientX:100,clientY:100,pointerId:36});
board.listeners.pointerup({type:'pointerup',clientX:113,clientY:100,pointerId:36});assert(el('shoot').disabled,'13 screen pixels is an intentional shot');
el('focusExit').onclick();assert(!el('shoot').disabled,'leaving play pauses the shot');
console.log('PASS: isolated play screen, inert reading-page gestures, disappearing arrow, return-to-origin cancellation, final pointer position, re-aiming, close-during-drag and scale-independent cancel radius.');


// Solve using the actual gesture rather than the ideal-angle button.
board.getBoundingClientRect=()=>({left:0,top:0,width:440,height:640});
el('lessonCategory').onchange({target:{value:'multi'}});
buttons.find(b=>+b.dataset.lesson===24).onclick();
assert(el('coachStep').textContent.includes('鏡写し'));
el('coachNext').onclick();assert(el('coachStep').textContent.includes('中点'));
el('coachNext').onclick();assert(el('coachStep').textContent.includes('角 C'));
assert(el('coachNext').disabled);assert(el('coachDiagram').innerHTML.includes('714'));
const lesson=lessons[24],m={x:(lesson.start.x+lesson.targets[0].x)/2,y:(lesson.start.y+2*FIELD.bottom-lesson.targets[0].y)/2};
assert(Math.abs(Math.atan2(FIELD.top-m.y,FIELD.right-m.x)-idealAngle(lesson))<1e-12);
board.listeners.pointerdown({clientX:FIELD.right,clientY:FIELD.top,pointerId:50});
board.listeners.pointerup({type:'pointerup',clientX:m.x,clientY:m.y,pointerId:50});
for(let n=0;n<500;n++)callback(clock+=50);
assert(el('result').innerHTML.includes('CLEAR'));
assert.equal(JSON.parse(savedValues.get('shotlab-last-lesson')),24);
el('reset').onclick();
docListeners.pointerdown({target:{closest(q){return q==='.board-wrap'||q.includes('.play-coach');}},clientX:200,clientY:100,pointerId:51});
board.listeners.pointerup({type:'pointerup',clientX:100,clientY:200,pointerId:51});
assert(!el('shoot').disabled,'reading coach text must not begin a shot');
console.log('PASS: 3-reflection midpoint construction, corner gesture, coach navigation and input isolation');
