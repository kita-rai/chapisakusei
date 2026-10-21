import {cleanCompleted,cleanLayout,parseBackup,stepDistance} from './storage.mjs';
import {FIELD as F,simulate,atDistance,idealAngle,snapAngle,angleIndex,ANGLE_STEP,unfoldedTarget,enemyParts,overlaps} from './physics.mjs';
import {lessons,lessonGroup} from './lessons.mjs';
import {pocketProgress,loopProgress,wallName} from './goals.mjs';
const $=id=>document.getElementById(id),ctx=$('board').getContext('2d'),clone=x=>JSON.parse(JSON.stringify(x));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}},write=(key,v)=>{try{localStorage.setItem(key,JSON.stringify(v));return true;}catch{return false;}};
let completed=cleanCompleted(read('shotlab-completed',[]),lessons.length),index=0,scene=clone(lessons[0]),mode='learn',angle=-25*Math.PI/180,budget=2200,run=null,previous=null,travel=0,playing=false,lastTime=0,finished=false,drag=null,editDrag=null,tool='shot',attempts=0,pulse=0,angleMode='discrete',collisionMode='stepped',group='all';
let aimVisible=false;
const CANCEL_RADIUS=12;
const predictionCache=new Map();
function predict(s,a,b){const key=JSON.stringify([s,a,b]);if(!predictionCache.has(key)){if(predictionCache.size>=6)predictionCache.delete(predictionCache.keys().next().value);predictionCache.set(key,simulate(s,a,b));}return predictionCache.get(key);}
const COLORS={lime:'#c6ee80',orange:'#ffb46d',muted:'#83a272',blue:'#82cbdd'};
function angleSet(v){aimVisible=true;const raw=angleMode==='discrete'?snapAngle(v):v;angle=Math.atan2(Math.sin(raw),Math.cos(raw));const deg=angle*180/Math.PI;$('angle').value=deg.toFixed(3);$('angleNumber').value=deg.toFixed(3);$('angleValue').textContent=(deg<0?'−':'')+Math.abs(deg).toFixed(3)+'°';$('angleStepLabel').textContent=angleMode==='discrete'?`1024段階 · ${angleIndex(angle)} / 1023`:'連続角度 · 刻みなし';}
const groupNames={basic:'基礎の作図',multi:'３〜８反射',loop:'ループ・８の字',gap:'隙間にはまる',collision:'敵・ブロック判定',control:'操作と角度の精度'};
function lessonList(){
 const shown=lessons.map((l,i)=>({l,i})).filter(({i})=>group==='all'||lessonGroup(i)===group);
 let lastGroup='';
 $('lessonList').innerHTML=shown.map(({l,i})=>{
  const g=lessonGroup(i),heading=group==='all'&&g!==lastGroup?`<div class="lesson-group">${groupNames[g]}</div>`:'';lastGroup=g;
  return heading+`<button class="lesson-item ${i===index&&mode==='learn'?'active':''}" data-lesson="${i}" aria-pressed="${i===index&&mode==='learn'}"><span class="lesson-num">${String(i+1).padStart(2,'0')}</span><span class="lesson-copy"><strong>${l.title}${i>=18?'<i class="new-dot" aria-label="追加した課題"></i>':''}</strong><small>${l.sub}</small></span><span class="lesson-check">${completed.includes(i)?'✓':'▶'}</span></button>`;
 }).join('');
 document.querySelectorAll('[data-lesson]').forEach(b=>b.onclick=()=>{selectLesson(+b.dataset.lesson);openPlay();});
 $('completedCount').textContent=completed.length+' / '+lessons.length;$('lessonTotal').textContent=lessons.length+' LESSONS';$('progressBar').style.width=completed.length/lessons.length*100+'%';
}
function selectLesson(i){cancelGesture();if(group!=='all'&&lessonGroup(i)!==group){group=lessonGroup(i);$('lessonCategory').value=group;}mode='learn';index=i;scene=clone(lessons[i]);write('shotlab-last-lesson',i);scene.collisionMode=collisionMode;if(['collision','wallsize','pocket'].includes(scene.type)){collisionMode='stepped';scene.collisionMode=collisionMode;$('collisionMode').value=collisionMode;$('collisions').checked=true;}previous=null;attempts=0;updateMode();budget=scene.budget||2200;$('budget').value=budget;$('budgetValue').textContent=budget.toLocaleString();angleSet(([-25,-50,-47,-68,-53,-55][i]??(idealAngle(scene)*180/Math.PI+2))*Math.PI/180);reset();updateContent();lessonList();}
function updateMode(){ $('learnTab').classList.toggle('active',mode==='learn');$('freeTab').classList.toggle('active',mode==='free');$('editor').hidden=mode!=='free';$('lessonList').hidden=mode==='free';document.querySelector('.small-note').hidden=mode==='free';}
function updateContent(){const l=lessons[index];$('lessonTag').textContent=mode==='free'?'SANDBOX':`LESSON ${String(index+1).padStart(2,'0')}`;$('gameTitle').textContent=mode==='free'?'自由実験室':l.title;$('stageChip').textContent=mode==='free'?'配置も、角度も自由':l.chip;$('ideaIndex').textContent=mode==='free'?'FREE':`${String(index+1).padStart(2,'0')} / ${lessons.length}`;$('ideaTitle').innerHTML=(mode==='free'?'自分だけの、\n実験をしよう。':l.heading).replace('\n','<br>');$('ideaLead').textContent=mode==='free'?'目標・敵・ブロックを置いて、自分でルートを作ってみよう。引っぱって弾く操作と「移動」ツールを使い分けられます。':l.lead;$('formula').innerHTML=(mode==='free'?'予想 → 発射 → 比較\n配置を変えて、新しい道へ':l.formula).replace('\n','<br>');$('steps').innerHTML=(mode==='free'?['「移動」で駒や目標をドラッグして配置。','敵・ブロック・目標を選んで盤面をタップ。','盤面のどこからでも引くか、「弾く」で実験。']:l.steps).map((x,i)=>`<div class="step"><span>${i+1}</span><p>${x}</p></div>`).join('');$('insight').textContent=mode==='free'?'敵は段差モデルと円を比較でき、弱点付き敵は複合判定を持ちます。ブロックは長方形のモデルです。壁だけの理論と、障害物に触れたときの違いを比較できます。':l.insight;$('ideal').disabled=mode==='free';$('missionText').textContent=mode==='free'?'配置を変えて、ルートを自由に実験。':l.goal;$('gestureTip').textContent=mode==='free'?'プレイ画面内で操作を選んで配置・発射。':'「プレイ画面を開く」で練習開始。開始位置に指を戻すとキャンセル。';$('playTitle').textContent=mode==='free'?'自由実験室':l.title;$('playMission').textContent=$('missionText').textContent;$('focusToolLabel').hidden=mode!=='free';$('focusIdeal').hidden=mode==='free';updatePager();updateDiagram();}
function updateDiagram(){const t=lessons[index].type;const defs='<defs><marker id="a" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="#54793b"/></marker></defs>';let content='';if(t==='pocket'){content='<circle cx="112" cy="54" r="29" fill="#d8c9af" stroke="#a78b65"/><circle cx="190" cy="54" r="29" fill="#d8c9af" stroke="#a78b65"/><path d="M38 142L164 79L141 67L162 57L146 49" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><circle cx="151" cy="70" r="38" fill="none" stroke="#d18b4b" stroke-dasharray="4 4"/><text x="213" y="124">入口と角度</text>';}else if(t==='crossloop'){const vertical=lessons[index].ratio.p===2;content='<rect x="50" y="20" width="200" height="130" fill="none" stroke="#93a486"/><path d="'+(vertical?'M150 85L250 52.5L150 20L50 52.5L150 85L250 117.5L150 150L50 117.5Z':'M150 85L200 20L250 85L200 150L150 85L100 20L50 85L100 150Z')+'" fill="none" stroke="#54793b" stroke-width="2"/><circle cx="150" cy="85" r="9" fill="#e8ecdf" stroke="#d18b4b" stroke-width="2"/><text x="166" y="91">交点</text>';}else if(t==='collision'){content='<path d="M100 36H185V55H202V116H185V135H100V116H82V55H100Z" fill="#d5dbca" stroke="#667d52" stroke-width="2"/><path d="M34 150L82 106L34 62" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><path d="M62 25H222V145H62Z" fill="none" stroke="#d18b4b" stroke-dasharray="4 4"/><text x="237" y="88">面</text><text x="95" y="165">外周で反射</text>';}else if(t==='multi'){content='<path d="M25 28H275V150H25Z M108 28V150 M191 28V150 M25 89H275" fill="none" stroke="#93a486" stroke-width="1" stroke-dasharray="4 4"/><path d="M38 134L258 45" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><circle cx="38" cy="134" r="6" fill="#54793b"/><circle cx="258" cy="45" r="8" fill="none" stroke="#d18b4b" stroke-width="2"/><text x="220" y="20">鏡写しの目標 T′</text><text x="150" y="165">展開図（概念図）</text>';}else if(t==='mirror'||t==='wallsize'){content='<path d="M210 18V151" stroke="#6c8860" stroke-width="3"/><path d="M48 130L210 70L267 48" fill="none" stroke="#54793b" stroke-width="2" stroke-dasharray="4 4"/><path d="M48 130L210 70L153 48" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><circle cx="48" cy="130" r="7" fill="#54793b"/><circle cx="153" cy="48" r="8" fill="none" stroke="#d18b4b" stroke-width="3"/><circle cx="267" cy="48" r="8" fill="none" stroke="#d18b4b" stroke-dasharray="3 3"/><text x="219" y="100">壁</text><text x="213" y="27">鏡写し</text><text x="136" y="30">目標</text>';}else if(t==='two'){content='<path d="M25 25H260V145" fill="none" stroke="#6c8860" stroke-width="3"/><path d="M65 130L200 25L260 72L185 130" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><path d="M65 130H185M125 130L260 25" fill="none" stroke="#8f9f76" stroke-dasharray="4 4"/><circle cx="65" cy="130" r="7" fill="#54793b"/><circle cx="185" cy="130" r="8" stroke="#d18b4b" fill="none" stroke-width="3"/><circle cx="125" cy="130" r="4" fill="#bd9959"/><text x="117" y="153">M</text><text x="266" y="23">C</text><text x="99" y="88">平行</text>';}else if(t==='corner'){content='<path d="M25 25H260V145" fill="none" stroke="#6c8860" stroke-width="3"/><path d="M65 130L260 25L66 130" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><path d="M65 130L245 25L260 34L81 139" fill="none" stroke="#d18b4b" stroke-width="1.5" stroke-dasharray="4 4"/><circle cx="65" cy="130" r="8" fill="#54793b"/><text x="172" y="110">帰り道も平行</text><text x="270" y="23">角</text>';}else if(t==='symmetry'){content='<path d="M25 25H275" stroke="#6c8860" stroke-width="3"/><path d="M150 15V153" stroke="#8f9f76" stroke-dasharray="4 4"/><path d="M65 130L150 25L235 130" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><circle cx="65" cy="130" r="7" fill="#54793b"/><circle cx="235" cy="130" r="8" stroke="#d18b4b" fill="none" stroke-width="3"/><text x="155" y="100">対称軸</text>';}else{content='<rect x="65" y="16" width="170" height="140" rx="3" fill="none" stroke="#6c8860" stroke-width="2"/><path d="M65 86L150 16L235 86L150 156Z" fill="none" stroke="#54793b" stroke-width="2" marker-end="url(#a)"/><circle cx="65" cy="86" r="7" fill="#54793b"/><text x="141" y="93">一周</text><text x="244" y="90">H</text><text x="146" y="12">W</text>';}$('diagram').innerHTML=defs+'<g font-family="sans-serif" font-size="10" fill="#68785c">'+content+'</g>';}
function lockControls(locked){for(const id of ['angle','angleNumber','angleMode','collisionMode','stepMinus','stepPlus'])$(id).disabled=locked;$('ideal').disabled=locked||mode==='free';}
function reset(){cancelGesture();aimVisible=false;$('playNext').hidden=true;$('playFeedback').textContent='引っぱって狙う · 開始位置に戻すとキャンセル';lockControls(false);run=null;travel=0;playing=false;finished=false;drag=null;$('replay').hidden=true;$('shotReview').hidden=true;$('scrub').value=0;$('shoot').disabled=false;$('boardHint').textContent=mode==='free'?'どこからでも引っぱって弾く · ツールで配置を変更':'盤面のどこからでも引っぱって、離す';$('result').className='result';$('result').innerHTML='<span class="result-icon">↗</span><div><strong>'+ (mode==='free'?'自由にルートを試してみよう':'まずは１ショット、試してみよう')+'</strong><p>'+(mode==='free'?'目標のリングは通過点。敵とブロックは反射します。':lessons[index].goal)+'</p></div>';}
function shoot(){if(playing)return;openPlay();aimVisible=false;$('playNext').hidden=true;$('playFeedback').textContent='軌道を観察しよう';scene.collisionMode=collisionMode;if(overlaps(scene)){$('playFeedback').textContent='自キャラが判定と重なっています。移動で離してください。';$('result').innerHTML='<span class="result-icon">↗</span><div><strong>自キャラが判定と重なっています</strong><p>自由実験の「移動」で、敵やブロックから離してください。</p></div>';return;}if(run&&$('compare').checked)previous=run;run=predict(scene,angle,budget);buildReview();travel=0;playing=true;lockControls(true);finished=false;attempts++;$('replay').hidden=false;$('playPause').textContent='Ⅱ';$('shoot').disabled=true;$('boardHint').textContent='軌道を観察しよう';}
function evaluate(){
 if(finished)return;finished=true;lockControls(false);$('shoot').disabled=false;$('playPause').textContent='▶';$('boardHint').textContent='軌道を見返す · どこからでも次のショット';
 const h=run.hits[0],l=lessons[index];let success=false,detail='';
 if(mode==='free'){success=run.hits.length>0;detail='配置や角度を変えて、別の道を試してみよう。';}
 else if(l.type==='pocket'){
  const g=pocketProgress(scene,run);success=g.success;
  detail=`隙間内 ${g.enemyHits} HIT · ${g.distinct}体の敵に接触。`+(g.routeOK?(g.success?'入口からの連続ヒットに成功！':'入口で弾かれたら、±１段階で進入面を変えてみよう。'):'最初の敵に触れるまでの壁の順番を確認しよう。');
 }else if(l.type==='crossloop'){
  const g=loopProgress(scene,run);success=g.success;detail=`中央の通過 ${g.passed} / ${g.required}。`+(success?'連続角度に切り替えると、幾何学上のループと比較できます。':'３反射後と６反射後の両方で中央を狙おう。');
 }else if(index===0)success=!!h&&h.refs===1&&Math.abs(run.events[0]?.x-F.right)<.01;
 else if(index===1||index===5)success=!!h&&h.refs===2&&Math.abs(run.events[0]?.y-F.top)<.01&&Math.abs(run.events[1]?.x-F.right)<.01&&(index!==5||!run.events.slice(0,2).some(x=>x.kind!=='wall'));
 else if(index===2)success=!!h&&h.refs>=2&&run.events.slice(0,2).every(e=>e.kind==='wall'&&(Math.abs(e.x-F.right)<.01||Math.abs(e.y-F.top)<.01));
 else if(index===3)success=!!h&&h.refs===1&&Math.abs(run.events[0]?.x-220)<6;
 else if(index===4)success=!!h&&h.refs>=3;
 else if(l.contact||l.type==='wallsize')success=!!h&&h.refs===1&&(l.contact?run.events[0]?.kind===l.contact:run.events[0]?.kind==='wall');
 else if(l.reflectionCount)success=!!h&&h.refs===l.reflectionCount&&run.events.slice(0,l.reflectionCount).map(wallName).join(',')===l.wallSequence.join(',');
 if(!detail)detail=success?'±１段階で比較すると、狙いの幅が見えてきます。':h?'目標は通りました。壁の順番と反射回数を確認しよう。':'理論ガイド、または「理論の角度をセット」で基準を確かめよう。';
 const distinct=new Set(run.hits.map(x=>x.id)).size,enemyHits=run.events.filter(e=>e.kind==='enemy').length,walls=run.events.filter(e=>e.kind==='wall').length;
 $('result').className='result '+(success?'success':'');
 $('result').innerHTML=`<span class="result-icon">${success?'✓':'↗'}</span><div><strong>${success?(mode==='free'?`${distinct}個の目標を通過！`:l.type==='pocket'?'CLEAR — 隙間への進入、成功！':'CLEAR — 理論が、軌道になった。'):'もう少し。軌道からヒントを探そう。'}</strong><p>${detail}<br>角度 ${(run.angle*180/Math.PI).toFixed(3)}° · 壁 ${walls}回 · 敵 ${enemyHits} HIT · 試行 ${attempts}回</p></div>`;
 $('playFeedback').textContent=(success?'CLEAR! ':'もう一度、狙ってみよう。 ')+detail;
 const next=lessons.findIndex((_,i)=>i>index&&(group==='all'||lessonGroup(i)===group));
 $('playNext').hidden=!(success&&mode==='learn'&&next>=0);
 if(success&&mode==='learn'&&next>=0){$('result').innerHTML+='<button class="next-lesson" id="nextLesson">次の課題へ →</button>';$('nextLesson').onclick=()=>{selectLesson(next);openPlay();};}
 if(success&&mode==='learn'&&!completed.includes(index)){completed.push(index);write('shotlab-completed',completed);lessonList();}
}
function line(a,b,color,width=1,dash=[]){ctx.beginPath();ctx.setLineDash(dash);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();ctx.setLineDash([]);}
function circle(x,y,r,color,fill=false,width=1){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);if(fill){ctx.fillStyle=color;ctx.fill();}else{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}}
function label(text,x,y,color='#b3c699',size=10){ctx.font=`${size}px 'Noto Sans JP',sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(text,x,y);}
function trajectory(r,max,color,width=2,dashed=false,min=0){if(!r)return;for(const s of r.segments){if(s.from>max||s.to<min)continue;const a=atDistance({segments:[s]},Math.max(min,s.from)),b=atDistance({segments:[s]},Math.min(max,s.to));line(a,b,color,width,dashed?[5,6]:[]);}}
function drawBoard(){ctx.setTransform(2,0,0,2,0,0);ctx.clearRect(0,0,440,640);const bg=ctx.createLinearGradient(0,0,440,640);bg.addColorStop(0,'#203728');bg.addColorStop(1,'#15291f');ctx.fillStyle=bg;ctx.fillRect(0,0,440,640);ctx.fillStyle='#1b2e23';ctx.fillRect(24,64,392,526);for(let y=74;y<590;y+=38)for(let x=34;x<416;x+=38){ctx.fillStyle=((x+y)/38)%2>1?'#223929':'#213527';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+18,y+18);ctx.lineTo(x,y+36);ctx.lineTo(x-18,y+18);ctx.closePath();ctx.fill();}
ctx.strokeStyle='#577146';ctx.lineWidth=6;ctx.strokeRect(24,64,392,526);ctx.strokeStyle='#a1b571';ctx.lineWidth=1;ctx.strokeRect(21,61,398,532);for(const [x,y] of [[24,64],[416,64],[24,590],[416,590]]){circle(x,y,8,'#b5c78a',true);circle(x,y,4,'#47643e',true);}ctx.strokeStyle='#68855370';ctx.lineWidth=.8;ctx.setLineDash([3,7]);ctx.strokeRect(F.left,F.top,F.right-F.left,F.bottom-F.top);ctx.setLineDash([]);
for(let x=60;x<405;x+=40){line({x,y:65},{x,y:70},'#8c9e68',1);line({x,y:584},{x,y:589},'#8c9e68',1);}for(let y=102;y<584;y+=40){line({x:24,y},{x:30,y},'#8c9e68',1);line({x:410,y},{x:416,y},'#8c9e68',1);}label('SHOT FIELD  /  反射モデル',220,48,'#809a72',8);
if(scene.pocket){const z=scene.pocket;circle(z.x,z.y,z.r,'#ffcb5120',true);circle(z.x,z.y,z.r,'#ffce6a88',false,1);label('POCKET',Math.min(362,z.x),z.y+z.r+14,'#f2cc7e',8);}if($('collisions').checked)drawCollisionOverlay();if($('theory').checked&&mode==='learn')drawTheory();
if($('compare').checked&&previous)trajectory(previous,previous.length,'#97a7ba55',1.2,true);
if($('guide').checked&&!playing){const predicted=predict(scene,angle,budget);const limit=scene.type==='crossloop'?Math.min(predicted.length,2*Math.hypot(scene.ratio.p*(F.right-F.left),scene.ratio.q*(F.bottom-F.top))+20):predicted.length;trajectory(predicted,limit,'#c5ed7b55',1,true);predicted.events.slice(0,scene.type==='crossloop'?6:8).forEach((e,i)=>{circle(e.x,e.y,4,'#c5ed7b88');label(i+1,e.x+(e.x>220?-12:12),e.y+(e.y<327?14:-10),'#c5ed7b99',8);});}
for(const b of scene.blocks||[]){ctx.shadowColor='#0009';ctx.shadowBlur=8;ctx.shadowOffsetY=4;ctx.fillStyle='#596473';ctx.fillRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);ctx.shadowBlur=0;ctx.shadowOffsetY=0;ctx.strokeStyle='#a0afbd';ctx.lineWidth=2;ctx.strokeRect(b.x-b.w/2+2,b.y-b.h/2+2,b.w-4,b.h-4);line({x:b.x-b.w/2+5,y:b.y-b.h/2+5},{x:b.x+b.w/2-5,y:b.y+b.h/2-5},'#7a8b99');label('BLOCK',b.x,b.y+3,'#d4deea',7);}
for(const e of scene.enemies||[]){ctx.save();ctx.translate(e.x,e.y);ctx.shadowColor='#de754455';ctx.shadowBlur=15;const g=ctx.createRadialGradient(-8,-10,2,0,0,e.r);g.addColorStop(0,'#d0835c');g.addColorStop(1,'#69452e');circle(0,0,e.r,g,true);ctx.shadowBlur=0;circle(0,0,e.r-3,'#dfa476',false,2);ctx.fillStyle='#eacdb0';ctx.beginPath();ctx.moveTo(-17,-17);ctx.lineTo(-13,-e.r-10);ctx.lineTo(-5,-21);ctx.fill();ctx.beginPath();ctx.moveTo(17,-17);ctx.lineTo(13,-e.r-10);ctx.lineTo(5,-21);ctx.fill();circle(-8,-3,5,'#17251e',true);circle(8,-3,5,'#17251e',true);circle(-7,-5,1.5,'#e7da7e',true);circle(9,-5,1.5,'#e7da7e',true);line({x:-7,y:12},{x:7,y:12},'#402e21',3);ctx.restore();label('反射',e.x,e.y+e.r+14,'#c39e80',8);}
for(const e of scene.enemies||[]){if(e.weak){const x=e.x+e.weak.dx,y=e.y+e.weak.dy;circle(x,y,e.weak.r,'#ffd65a88',true);circle(x,y,e.weak.r,'#ffef8d',false,2);label('弱',x,y+4,'#fff6a9',11);}}
for(const t of scene.targets||[]){const hit=run?.hits.some(h=>h.id===t.id&&h.dist<=travel),col=hit?COLORS.lime:COLORS.orange;ctx.shadowColor=col;ctx.shadowBlur=hit?18:7;circle(t.x,t.y,t.r||24,col,false,2);ctx.shadowBlur=0;circle(t.x,t.y,(t.r||24)+6,col+'55',false,1);line({x:t.x-7,y:t.y},{x:t.x+7,y:t.y},col+'99');line({x:t.x,y:t.y-7},{x:t.x,y:t.y+7},col+'99');if(hit)label('✓',t.x,t.y+4,col,15);else if(!(mode==='learn'&&(index===2||index===4)))label('TARGET',t.x,t.y+(t.r||24)+20,'#d1ad77',8);}
if(run&&$('trail').value!=='off')trajectory(run,travel,'#e3f6ab',2.2,false,$('trail').value==='recent'?Math.max(0,travel-220):0);
if(run)run.events.filter(e=>e.dist<=travel).forEach((e,i)=>{circle(e.x,e.y,scene.pocket?2:4,'#e1f3af',true);if(!scene.pocket||e.kind==='wall')circle(e.x,e.y,9,'#d2ed9566');if($('trail').value==='full'&&(!scene.pocket||e.kind==='wall')&&(i<10||e.kind==='wall'))label(e.refs,e.x+(e.x>220?-13:13),e.y+(e.y<327?17:-11),'#e4f3c3',9);});
const ball=run?atDistance(run,travel):scene.start;if(ball){drawBall(ball.x,ball.y);if($('collisions').checked){ctx.strokeStyle='#ffca83';ctx.lineWidth=1;ctx.setLineDash([3,3]);if(collisionMode==='circle')circle(ball.x,ball.y,F.r,'#ffca83');else ctx.strokeRect(ball.x-F.r,ball.y-F.r,F.r*2,F.r*2);ctx.setLineDash([]);}}
if(aimVisible&&(!drag||drag.ready)&&(!run||!playing&&travel===0)){const len=drag?Math.min(400,Math.max(65,Math.hypot(drag.dx,drag.dy)*1.55)):125;drawArrow(scene.start,angle,len,!!drag);}
const currentHits=run?.hits.filter(h=>h.dist<=travel).length||0,currentRefs=run?.events.filter(e=>e.dist<=travel).length||0;const enemyHits=run?.events.filter(e=>e.dist<=travel&&e.kind==='enemy').length||0;$('shotBadge').innerHTML=`反射 <b>${currentRefs}</b>　敵 <b>${enemyHits}</b> HIT　通過 <b>${currentHits}</b>`;drawMissionHUD();if(scene.pocket&&$('collisions').checked)drawPocketZoom(ball);if(drag)drawFinger();
}
const boundaryCache=new WeakMap();
function collisionBoundary(e){
 const key=JSON.stringify(e),cached=boundaryCache.get(e);if(cached?.key===key)return cached.lines;
 const parts=enemyParts(e).map(b=>({...b,x0:b.x-b.w/2-F.r,x1:b.x+b.w/2+F.r,y0:b.y-b.h/2-F.r,y1:b.y+b.h/2+F.r}));
 const xs=[...new Set(parts.flatMap(b=>[b.x0,b.x1]))].sort((a,b)=>a-b),ys=[...new Set(parts.flatMap(b=>[b.y0,b.y1]))].sort((a,b)=>a-b);
 const cell=(i,j)=>{if(i<0||j<0||i>=xs.length-1||j>=ys.length-1)return null;const x=(xs[i]+xs[i+1])/2,y=(ys[j]+ys[j+1])/2;return parts.find(b=>x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1);};
 const lines=[];
 for(let i=0;i<xs.length-1;i++)for(let j=0;j<ys.length-1;j++){
  const c=cell(i,j);if(!c)continue;const x=xs[i],xx=xs[i+1],y=ys[j],yy=ys[j+1],color=c.part==='weak'?'#ffe185bb':'#ffac8dbb';
  if(!cell(i-1,j))lines.push([{x,y},{x,y:yy},color]);if(!cell(i+1,j))lines.push([{x:xx,y},{x:xx,y:yy},color]);if(!cell(i,j-1))lines.push([{x,y},{x:xx,y},color]);if(!cell(i,j+1))lines.push([{x,y:yy},{x:xx,y:yy},color]);
 }
 boundaryCache.set(e,{key,lines});return lines;
}
function drawEnemyBoundary(e,width=1){
 if(collisionMode==='circle'){circle(e.x,e.y,e.r+F.r,'#ffac8dbb',false,width);if(e.weak)circle(e.x+e.weak.dx,e.y+e.weak.dy,e.weak.r+F.r,'#ffe185bb',false,width);}
 else for(const [a,b,c] of collisionBoundary(e))line(a,b,c,width);
}
function drawCollisionOverlay(){
 ctx.save();ctx.strokeStyle='#82cbdd99';ctx.lineWidth=1;ctx.setLineDash([5,4]);ctx.strokeRect(F.left,F.top,F.right-F.left,F.bottom-F.top);ctx.setLineDash([]);
 for(const b of scene.blocks||[]){ctx.fillStyle='#82cbdd14';ctx.fillRect(b.x-b.w/2-F.r,b.y-b.h/2-F.r,b.w+2*F.r,b.h+2*F.r);ctx.strokeStyle='#82cbdd';ctx.setLineDash([4,4]);ctx.strokeRect(b.x-b.w/2-F.r,b.y-b.h/2-F.r,b.w+2*F.r,b.h+2*F.r);ctx.setLineDash([]);}
 for(const e of scene.enemies||[])drawEnemyBoundary(e);
 if(!scene.pocket)label('水色：中心の境界 / 赤・黄：敵の衝突範囲',220,610,'#9bbfbb',8);ctx.restore();
}
function drawPocketZoom(ball){
 const z=scene.pocket,x=236,y=409,w=154,h=139;
 ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();ctx.fillStyle='#11241ff2';ctx.fillRect(x,y,w,h);
 ctx.translate(x+w/2,y+h/2+8);ctx.scale(3,3);ctx.translate(-z.x,-z.y);
 for(const e of scene.enemies){circle(e.x,e.y,e.r,'#bb795c38',true);drawEnemyBoundary(e,.4);}
 line({x:F.right,y:F.top},{x:F.right,y:F.bottom},'#82cbdd',.5);
 if($('guide').checked)trajectory(predict(scene,angle,budget),budget,'#c5ed7b77',.4,true);
 if(run)trajectory(run,travel,'#e3f6ab',.7);
 if(ball){circle(ball.x,ball.y,F.r,'#b8e48c44',true);circle(ball.x,ball.y,1.5,'#eaffac',true);ctx.strokeStyle='#dbf4a166';ctx.lineWidth=.4;ctx.strokeRect(ball.x-F.r,ball.y-F.r,F.r*2,F.r*2);}
 ctx.restore();ctx.fillStyle='#1c3026';ctx.fillRect(x,y,w,20);ctx.strokeStyle='#71866488';ctx.lineWidth=.7;ctx.strokeRect(x,y,w,h);label('隙間の判定 ×3',x+w/2,y+14,'#b7cda5',8);
}
function drawBall(x,y){ctx.save();ctx.translate(x,y);ctx.shadowColor='#aade6b66';ctx.shadowBlur=20;circle(0,0,21,'#14261b',true);const g=ctx.createRadialGradient(-7,-8,1,0,0,18);g.addColorStop(0,'#c4e88a');g.addColorStop(1,'#4c8957');circle(0,0,18,g,true);ctx.shadowBlur=0;circle(0,0,18,'#deef9e',false,2);ctx.beginPath();ctx.moveTo(-12,-13);ctx.lineTo(-11,-22);ctx.lineTo(-4,-17);ctx.moveTo(12,-13);ctx.lineTo(11,-22);ctx.lineTo(4,-17);ctx.fillStyle='#b0ce7d';ctx.fill();circle(-6,-2,4,'#263d29',true);circle(6,-2,4,'#263d29',true);circle(-5,-3,1,'#ffffce',true);circle(7,-3,1,'#ffffce',true);ctx.beginPath();ctx.moveTo(-4,7);ctx.quadraticCurveTo(0,10,4,7);ctx.strokeStyle='#233b28';ctx.lineWidth=2;ctx.stroke();ctx.restore();circle(x,y,26,'#c6ee8055',false,1);label('1P',x,y+38,'#d3e9b0',9);}
function drawArrow(p,a,len,active){
 ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);
 const tip=Math.min(350,len),tail=Math.min(230,Math.max(65,len*.8)),neck=tip-Math.min(55,tip*.36),shaft=active?12:9,head=active?29:23;
 ctx.globalAlpha=active?.96:.68;
 const shape=()=>{ctx.beginPath();ctx.moveTo(-tail,-2);ctx.lineTo(neck,-shaft);ctx.lineTo(neck,-head);ctx.lineTo(tip,0);ctx.lineTo(neck,head);ctx.lineTo(neck,shaft);ctx.lineTo(-tail,2);ctx.closePath();};
 ctx.shadowColor='#ff5f1888';ctx.shadowBlur=active?12:3;shape();ctx.fillStyle='#ce3d12';ctx.fill();ctx.strokeStyle='#8d2e10';ctx.lineWidth=4;ctx.lineJoin='round';ctx.stroke();
 ctx.shadowBlur=0;
 const g=ctx.createLinearGradient(-tail,0,tip,0);g.addColorStop(0,'#ff622c22');g.addColorStop(.28,'#ff792acc');g.addColorStop(.6,'#ffcf32');g.addColorStop(.88,'#ffed66');g.addColorStop(1,'#fff7a8');ctx.fillStyle=g;shape();ctx.fill();ctx.strokeStyle='#ffd86e';ctx.lineWidth=1.2;ctx.stroke();
 ctx.save();shape();ctx.clip();
 // Repeated inner chevrons preserve the familiar long direction guide.
 for(let x=-tail+23;x<neck-10;x+=26){ctx.beginPath();ctx.moveTo(x-6,-15);ctx.lineTo(x+5,0);ctx.lineTo(x-6,15);ctx.strokeStyle=x<0?'#ffe16d55':'#fffac08c';ctx.lineWidth=3;ctx.stroke();}
 ctx.restore();
 ctx.beginPath();ctx.moveTo(-tail+8,-1);ctx.lineTo(neck-3,-shaft+2);ctx.lineTo(neck-3,-head+4);ctx.lineTo(tip-5,-1);ctx.strokeStyle='#fff9ccbd';ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
}
function drawFinger(){
 const p=drag.start,q={x:p.x-drag.dx,y:p.y-drag.dy};
 line(p,q,'#fff2b775',1.2,[4,5]);circle(p.x,p.y,5,'#fff2b7');circle(q.x,q.y,11,'#fff2b799');circle(q.x,q.y,3,'#fff2b7',true);
 label(drag.ready?'引く':'離すとキャンセル',Math.max(30,Math.min(410,q.x)),Math.max(80,Math.min(575,q.y+26)),'#ffe2a1',9);
}
function drawMissionHUD(){
 if(mode!=='learn')return;
 const l=lessons[index];let text='';
 if(l.type==='pocket'){const g=pocketProgress(scene,run,travel);text=`隙間  ${g.enemyHits} / ${scene.pocket.minHits} HIT`;}
 if(l.type==='crossloop'){const g=loopProgress(scene,run,travel);text=`中央通過  ${g.passed} / ${g.required}`;}
 if(!text)return;
 ctx.fillStyle='#102218dc';ctx.fillRect(126,588,188,24);label(text,220,604,'#ffe19a',11);
}
function drawTheory(){const l=lessons[index],s=scene.start,t=scene.targets[0],c={x:F.right,y:F.top},col='#85cbdd99';if(l.type==='pocket'){const ref=predict(scene,idealAngle(scene),budget),first=ref.events.find(e=>e.kind==='enemy');trajectory(ref,first?.dist??ref.length,col,1.5,true);if(first){circle(first.x,first.y,7,'#ffe19a');label('入口 E',first.x-22,first.y+24,'#ffe19a',9);}if(scene.pocket.approach.length===2){const m={x:(s.x+scene.entry.x)/2,y:(s.y+scene.entry.y)/2},corner={x:F.left,y:F.bottom};line(s,scene.entry,'#82cbdd66',1,[4,5]);line(m,corner,col,1.5,[5,5]);circle(m.x,m.y,4,COLORS.blue,true);label('中点 M',m.x+25,m.y,COLORS.blue,9);}}else if(l.type==='crossloop'){const ref=predict(scene,idealAngle(scene),budget),limit=ref.hits.find(h=>h.refs===6)?.dist??ref.length;trajectory(ref,limit,col,1.5,true);ref.events.slice(0,6).forEach(e=>label(e.refs,e.x+(e.x>220?-15:15),e.y+(e.y<327?18:-12),COLORS.blue,10));line({x:220,y:F.top},{x:220,y:F.bottom},'#82cbdd33',1,[4,5]);line({x:F.left,y:327},{x:F.right,y:327},'#82cbdd33',1,[4,5]);label('交点：３反射後・６反射後',220,112,COLORS.blue,9);}else if(l.type==='collision'){const ref=predict(scene,idealAngle(scene),budget),hit=ref.hits[0];trajectory(ref,hit?hit.dist:ref.length,col,1.5,true);const e=ref.events[0];if(e){circle(e.x,e.y,8,COLORS.blue);if(e.normal)line(e,{x:e.x+e.normal.x*50,y:e.y+e.normal.y*50},COLORS.blue,2);label('接触点',e.x,e.y+25,COLORS.blue,9);}}else if(l.type==='multi'){const ref=predict(scene,idealAngle(scene),budget),hit=ref.hits[0];trajectory(ref,hit?hit.dist:ref.length,col,1.3,true);ref.events.slice(0,l.reflectionCount).forEach(e=>{circle(e.x,e.y,7,col);label(e.refs,e.x+(e.x>220?-14:14),e.y+(e.y<327?19:-14),COLORS.blue,10);});label('横 '+scene.tile.x+'回 / 縦 '+Math.abs(scene.tile.y)+'回',220,610,COLORS.blue,9);label('順番も確認しよう',220,48,COLORS.blue,8);}else if(l.type==='mirror'||l.type==='wallsize'){const hit=predict(scene,idealAngle(scene),1000).events[0];line(s,hit,col,1.5,[5,5]);line(hit,t,col,1.5,[5,5]);line({x:t.x,y:t.y},{x:F.right,y:t.y},'#85cbdd55',1,[4,4]);label('鏡写しへ向かう直線',245,196,COLORS.blue,9);circle(hit.x,hit.y,7,col);}
else if(l.type==='two'){const m={x:(s.x+t.x)/2,y:(s.y+t.y)/2};line(s,t,'#82cbdd88',1,[5,5]);line(m,c,'#82cbddaa',2,[6,4]);circle(m.x,m.y,5,COLORS.blue,true);label('中点 M',m.x,m.y+25,COLORS.blue,10);label('角 C',c.x-15,c.y+26,COLORS.blue,10);if(l.gesture){line(c,m,'#ffb46dbb',3,[8,5]);circle(c.x,c.y,13,'#ffb46d');label('ここから引く',320,126,'#ffb46d',10);label('指をここへ',m.x,m.y+43,'#ffb46d',10);}const a=idealAngle(scene);line(s,{x:s.x+Math.cos(a)*130,y:s.y+Math.sin(a)*130},'#82cbddaa',2,[6,4]);if(index===5){const tx=2*c.x-t.x,ty=2*c.y-t.y,dx=tx-s.x,dy=ty-s.y,dist=Math.hypot(dx,dy),da=Math.asin(t.r/dist);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.arc(s.x,s.y,145,a-da,a+da);ctx.closePath();ctx.fillStyle='#ffb46d44';ctx.fill();label('許容幅 ≈ '+(da*360/Math.PI).toFixed(1)+'°',160,470,'#ffb46d',9);}}
else if(l.type==='corner'){line(s,c,col,1.5,[5,5]);circle(c.x,c.y,7,col);label('中心が届く角',315,112,COLORS.blue,9);}
else if(l.type==='symmetry'){line({x:220,y:F.top},{x:220,y:F.bottom},'#82cbdd66',1,[5,5]);line(s,{x:220,y:F.top},col,1.5,[5,5]);line({x:220,y:F.top},t,col,1.5,[5,5]);circle(220,F.top,7,col);label('対称軸',250,327,COLORS.blue,9);}
else if(l.type==='loop'){const points=[s,{x:220,y:F.top},{x:F.right,y:327},{x:220,y:F.bottom},s];for(let i=1;i<points.length;i++)line(points[i-1],points[i],col,1.5,[6,6]);label('W = 356',220,112,COLORS.blue,9);label('H = 490',345,327,COLORS.blue,9);}}
function coords(e){const r=$('board').getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*440,y:(e.clientY-r.top)/r.height*640};}
function pick(p){if(Math.hypot(p.x-scene.start.x,p.y-scene.start.y)<30)return {obj:scene.start,kind:'start'};for(const [key,r] of [['targets',30],['enemies',40],['blocks',40]]){const found=scene[key]?.find(o=>Math.hypot(p.x-o.x,p.y-o.y)<r);if(found)return {obj:found,kind:key};}return null;}
function clamped(p,margin=0){return {x:Math.max(F.left+margin,Math.min(F.right-margin,p.x)),y:Math.max(F.top+margin,Math.min(F.bottom-margin,p.y))};}
function startGesture(e){if(!$('playDialog').open||drag||editDrag||playing||e.isPrimary===false||(e.button!==undefined&&e.button!==0))return;const p=coords(e);$('board').setPointerCapture(e.pointerId);const hit=pick(p);if(mode==='free'){if(tool==='move'&&hit){if(run)reset();editDrag={...hit,pointer:e.pointerId,ox:p.x-hit.obj.x,oy:p.y-hit.obj.y};return;}if(tool==='delete'){if(hit&&hit.kind!=='start'){scene[hit.kind]=scene[hit.kind].filter(x=>x!==hit.obj);reset();}return;}if(!['move','shot'].includes(tool)){if((scene.targets.length+scene.enemies.length+scene.blocks.length)>=20){$('saveNote').textContent='配置は合計20個まで。';return;}const q=clamped(p,40),id=Date.now()+Math.random();if(tool==='target')scene.targets.push({id,...q,r:24});if(tool==='enemy')scene.enemies.push({id,...q,r:27});if(tool==='boss')scene.enemies.push({id,...q,r:38,weak:{dx:40,dy:0,r:14}});if(tool==='block')scene.blocks.push({id,...q,w:56,h:38});reset();return;}}
if(mode==='learn'||tool==='shot'||hit?.kind==='start'){prepareAim();drag={start:p,clientStart:{x:e.clientX,y:e.clientY},dx:0,dy:0,ready:false,initialAngle:angle,pointer:e.pointerId};aimVisible=false;$('boardHint').textContent='引っぱって狙う · 開始位置へ戻すとキャンセル';}}
$('board').addEventListener('pointerdown',startGesture);

document.addEventListener('pointerdown',e=>{
 if(!$('playDialog').open||e.target===$('board')||$('board').contains(e.target))return;
 if(!e.target.closest('.board-wrap')||e.target.closest('button,input,select,textarea,a,label,.focus-top,.play-options,.focus-controls,.play-status'))return;
 startGesture(e);
});
function updateDrag(e){
 if(!drag||!Number.isFinite(e.clientX)||!Number.isFinite(e.clientY))return;
 const p=coords(e);drag.dx=drag.start.x-p.x;drag.dy=drag.start.y-p.y;
 drag.ready=Math.hypot(e.clientX-drag.clientStart.x,e.clientY-drag.clientStart.y)>CANCEL_RADIUS;
 aimVisible=drag.ready;
 if(drag.ready)angleSet(Math.atan2(drag.dy,drag.dx));
 $('boardHint').textContent=drag.ready?'離すと発射 · 開始位置へ戻すとキャンセル':'離すとキャンセル · 引けば狙い直せます';
}
$('board').addEventListener('pointermove',e=>{const p=coords(e);if(editDrag&&e.pointerId!==undefined&&e.pointerId!==editDrag.pointer)return;if(editDrag){const q=clamped({x:p.x-editDrag.ox,y:p.y-editDrag.oy},editDrag.kind==='start'?0:40);Object.assign(editDrag.obj,q);return;}if(drag&&e.pointerId!==undefined&&e.pointerId!==drag.pointer)return;updateDrag(e);});
function cancelGesture(){
 const pointer=drag?.pointer??editDrag?.pointer,restore=drag?.initialAngle;
 drag=null;editDrag=null;
 if(restore!==undefined)angleSet(restore);
 aimVisible=false;
 try{if(pointer!==undefined&&$('board').hasPointerCapture?.(pointer))$('board').releasePointerCapture(pointer);}catch{}
}
function release(e){
 if(editDrag&&e.pointerId!==undefined&&e.pointerId!==editDrag.pointer)return;
 if(drag&&e.pointerId!==undefined&&e.pointerId!==drag.pointer)return;
 editDrag=null;
 if(!drag)return;
 if(e.type==='pointerup')updateDrag(e);
 const fire=e.type==='pointerup'&&drag.ready&&$('playDialog').open;
 if(fire){drag=null;aimVisible=false;shoot();}
 else {cancelGesture();$('boardHint').textContent='キャンセルしました · もう一度引っぱれます';}
}
$('board').addEventListener('pointerup',release);$('board').addEventListener('pointercancel',release);
$('board').addEventListener('lostpointercapture',e=>{if(e?.pointerId!==undefined&&e.pointerId!==(drag?.pointer??editDrag?.pointer))return;cancelGesture();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(drag||editDrag)){e.preventDefault?.();cancelGesture();$('boardHint').textContent='キャンセルしました · もう一度引っぱれます';}});
function prepareAim(){if(run){if($('compare').checked)previous=run;reset();}}
$('collisionMode').onchange=e=>{if(playing)return;prepareAim();collisionMode=e.target.value;scene.collisionMode=collisionMode;};$('angleMode').onchange=e=>{if(playing)return;prepareAim();angleMode=e.target.value;angleSet(angle);};$('stepMinus').onclick=()=>{if(playing)return;prepareAim();angleSet(angle-ANGLE_STEP);};$('stepPlus').onclick=()=>{if(playing)return;prepareAim();angleSet(angle+ANGLE_STEP);};
$('angle').oninput=e=>{if(playing)return;prepareAim();angleSet(+e.target.value*Math.PI/180);};$('angleNumber').onchange=e=>{const v=Number(e.target.value);if(Number.isFinite(v)&&!playing){prepareAim();angleSet(Math.max(-180,Math.min(180,v))*Math.PI/180);}};$('shoot').onclick=shoot;$('reset').onclick=()=>{if(run&&$('compare').checked)previous=run;reset();};$('budget').oninput=e=>{budget=+e.target.value;$('budgetValue').textContent=budget.toLocaleString();};$('ideal').onclick=()=>{if(playing||mode==='free')return;prepareAim();angleSet(idealAngle(scene));$('theory').checked=true;};$('scrub').oninput=e=>{if(!run)return;openPlay();playing=false;lockControls(false);travel=run.length*(+e.target.value/1000);$('playPause').textContent='▶';$('shoot').disabled=false;if(travel>=run.length)evaluate();};$('playPause').onclick=()=>{if(!run)return;openPlay();if(travel>=run.length){travel=0;finished=false;}playing=!playing;lockControls(playing);$('playPause').textContent=playing?'Ⅱ':'▶';$('shoot').disabled=playing;};
$('lessonCategory').onchange=e=>{group=e.target.value;const first=lessons.findIndex((_,i)=>group==='all'||lessonGroup(i)===group);if(first>=0)selectLesson(first);lessonList();};
$('newPractice').onclick=()=>{group='loop';$('lessonCategory').value=group;selectLesson(18);openPlay();};
$('freeTab').onclick=()=>{if(mode==='free'){openPlay();return;}mode='free';scene={type:'free',start:{x:100,y:470},targets:[{id:1,x:315,y:190,r:24}],enemies:[{id:2,x:220,y:330,r:27}],blocks:[]};previous=null;attempts=0;updateMode();updateContent();reset();lessonList();openPlay();};$('learnTab').onclick=()=>selectLesson(index);
document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{tool=b.dataset.tool;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('selected',x===b));$('boardHint').textContent=tool==='shot'?'盤面のどこからでも引っぱって、離す':tool==='move'?'ドラッグで移動 · 「弾く」で発射':tool==='delete'?'消したいものをタップ':'盤面をタップして配置';});
$('saveLayout').onclick=()=>{$('saveNote').textContent=write('shotlab-layout',scene)?'盤面を保存しました。':'このブラウザでは保存できません。';};$('loadLayout').onclick=()=>{try{scene=cleanLayout(read('shotlab-layout',null));collisionMode=scene.collisionMode;$('collisionMode').value=collisionMode;previous=null;reset();$('saveNote').textContent='保存した盤面を開きました。';}catch{$('saveNote').textContent='有効な保存盤面がありません。';}};$('clearLayout').onclick=()=>{scene={type:'free',start:{x:100,y:470},targets:[],enemies:[],blocks:[]};previous=null;reset();};
$('fullscreen').onclick=openPlay;
$('help').onclick=$('about').onclick=()=>$('helpDialog').showModal();$('closeHelp').onclick=()=>$('helpDialog').close();$('helpDialog').onclick=e=>{if(e.target===$('helpDialog')){const r=$('helpDialog').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('helpDialog').close();}};
function frame(time){const dt=Math.min(.05,(time-lastTime)/1000||0);lastTime=time;pulse+=dt;if(playing&&run){travel=Math.min(run.length,travel+dt*680*Math.pow(.82,Math.min(10,run.events.filter(e=>e.kind==='enemy'&&e.dist<=travel).length))*(.35+.65*Math.min(1,(run.length-travel)/90))*(+$('speed').value));$('scrub').value=travel/run.length*1000;if(travel>=run.length){playing=false;evaluate();}}if($('playDialog').open){drawBoard();updateFocusControls();}updateReviewPosition();requestAnimationFrame(frame);}

function updatePager(){
 const available=lessons.map((_,i)=>i).filter(i=>group==='all'||lessonGroup(i)===group);
 const pos=available.indexOf(index);
 $('pagerCount').textContent=mode==='free'?'自由実験':`${String(index+1).padStart(2,'0')} / ${lessons.length}`;
 $('previousLesson').disabled=mode==='free'||pos<=0;
 $('followingLesson').disabled=mode==='free'||pos<0||pos>=available.length-1;
}
function changeLesson(delta){
 if(mode==='free')return;
 const available=lessons.map((_,i)=>i).filter(i=>group==='all'||lessonGroup(i)===group),next=available[available.indexOf(index)+delta];
 if(next!==undefined)selectLesson(next);
}
$('previousLesson').onclick=()=>changeLesson(-1);
$('followingLesson').onclick=()=>changeLesson(1);
function buildReview(){lastReviewLabel='';
 $('shotReview').hidden=false;
 $('contactList').innerHTML=run.events.map((e,i)=>`<button data-contact="${i}" title="この接触点で一時停止">${i+1} <span>${e.kind==='wall'?wallName(e)+'壁':e.kind==='block'?'ブロック':e.part==='weak'?'弱点':'敵'}</span></button>`).join('')||'<span class="no-contact">このショットには接触点がありません。</span>';
 document.querySelectorAll('[data-contact]').forEach(b=>b.onclick=()=>seekTo(run.events[+b.dataset.contact].dist));
}
function seekTo(distance){
 if(!run)return;openPlay();playing=false;lockControls(false);travel=Math.max(0,Math.min(run.length,distance));
 $('scrub').value=run.length?travel/run.length*1000:0;$('playPause').textContent='▶';$('shoot').disabled=false;
 if(travel>=run.length)evaluate();updateReviewPosition();
}
let lastReviewLabel='';
function updateReviewPosition(){
 if(!run)return;
 const reached=run.events.filter(e=>e.dist<=travel+.001).length,label=`${reached} / ${run.events.length} 接触`;
 if(label!==lastReviewLabel){lastReviewLabel=label;$('reviewPosition').textContent=label;document.querySelectorAll('[data-contact]').forEach(b=>b.classList.toggle('current',+b.dataset.contact===reached-1));}
 $('previousBounce').disabled=travel<=.001;$('nextBounce').disabled=travel>=run.length-.001;
}
$('previousBounce').onclick=()=>seekTo(stepDistance(run,travel,-1));
$('nextBounce').onclick=()=>seekTo(stepDistance(run,travel,1));
$('replayShot').onclick=()=>{if(!run)return;openPlay();travel=0;finished=false;playing=true;lockControls(true);$('shoot').disabled=true;$('playPause').textContent='Ⅱ';};
$('focusExit').onclick=closePlay;
$('focusReset').onclick=()=>$('reset').onclick();
$('focusMinus').onclick=()=>$('stepMinus').onclick();
$('focusPlus').onclick=()=>$('stepPlus').onclick();
$('focusShoot').onclick=shoot;
$('focusPause').onclick=()=>$('playPause').onclick();
function updateFocusControls(){
 $('focusAngle').textContent=(angle*180/Math.PI).toFixed(2)+'°';
 for(const id of ['focusMinus','focusPlus','focusShoot'])$(id).disabled=playing;
 $('focusTool').disabled=playing;$('focusIdeal').disabled=playing||mode==='free';$('focusPause').disabled=!run;$('focusPause').textContent=playing?'一時停止':'再生';
}
document.addEventListener('keydown',e=>{
 if(!$('playDialog').open||e.defaultPrevented||e.ctrlKey||e.altKey||e.metaKey||e.target?.closest?.('input,select,textarea,button,a')||$('helpDialog').open)return;
 if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();if(!playing){prepareAim();angleSet(angle+ANGLE_STEP*(e.key==='ArrowLeft'?-1:1));}}
 else if(e.code==='Space'){e.preventDefault();if(!playing&&!e.repeat)shoot();}
 else if(e.key?.toLowerCase()==='r'&&!e.repeat)$('reset').onclick();
});
$('exportProgress').onclick=()=>{
 try{
  const saved=read('shotlab-layout',null),layout=saved?cleanLayout(saved):null;
  const data={app:'shotlab',version:1,exportedAt:new Date().toISOString(),completed,lastLesson:index,layout};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download='shotlab-progress.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('backupStatus').textContent='進捗を書き出しました。別の端末では、このファイルを読み込んでください。';
 }catch{$('backupStatus').textContent='書き出せませんでした。保存済み盤面を確認してください。';}
};
$('importProgress').onclick=()=>$('backupFile').click();
$('backupFile').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>200000)throw Error('ファイルが大きすぎます。');
  const data=parseBackup(await file.text(),lessons.length);
  const merged=cleanCompleted([...completed,...data.completed],lessons.length);
  const progressSaved=write('shotlab-completed',merged),layoutSaved=data.layout?write('shotlab-layout',data.layout):true;
  completed=merged;selectLesson(data.lastLesson);lessonList();
  $('backupStatus').textContent=progressSaved&&layoutSaved?'進捗を読み込みました。保存済み自由盤面は「自由に試す」から開けます。':'この画面には反映しましたが、ブラウザへの保存に失敗しました。';
 }catch(error){$('backupStatus').textContent='読み込めませんでした。'+(error instanceof SyntaxError?'JSON形式の保存ファイルを選んでください。':error.message);}
 finally{e.target.value='';}
};


function openPlay(){
 if(!$('playDialog').open){$('playDialog').showModal();document.body.classList.add('play-open');$('board').focus?.({preventScroll:true});}
 for(const [focus,original] of [['focusGuide','guide'],['focusTheory','theory'],['focusCollisions','collisions']])$(focus).checked=$(original).checked;
 $('focusTool').value=tool;updateFocusControls();
}
function stopPlayInput(){
 cancelGesture();playing=false;lockControls(false);$('shoot').disabled=false;$('playPause').textContent='▶';document.body.classList.remove('play-open');
}
function closePlay(){stopPlayInput();$('playDialog').close();}
$('openPlay').onclick=openPlay;
$('playDialog').addEventListener('close',stopPlayInput);
$('playDialog').addEventListener('cancel',stopPlayInput);
for(const [focus,original] of [['focusGuide','guide'],['focusTheory','theory'],['focusCollisions','collisions']])$(focus).onchange=()=>{$(original).checked=$(focus).checked;};
$('focusIdeal').onclick=()=>{$('ideal').onclick();$('focusTheory').checked=$('theory').checked;};
$('focusTool').onchange=e=>{cancelGesture();tool=e.target.value;document.querySelectorAll('[data-tool]').forEach(x=>x.classList.toggle('selected',x.dataset.tool===tool));$('boardHint').textContent=tool==='shot'?'引っぱって弾く · 元の位置に戻すとキャンセル':tool==='move'?'駒や配置をドラッグで移動':tool==='delete'?'消したいものをタップ':'盤面をタップして配置';};
$('playNext').onclick=()=>changeLesson(1);

const resume=read('shotlab-last-lesson',0);selectLesson(Number.isInteger(resume)&&resume>=0&&resume<lessons.length?resume:0);requestAnimationFrame(frame);
