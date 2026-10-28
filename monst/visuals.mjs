// Small, staged concept drawings. Labels explain the role of each point;
// the live board retains the lesson's exact dimensions and collision model.
const C={ball:'#c6ee80',finger:'#ffbc7c',guide:'#89d7ec',ink:'#ecf4e6',dim:'#7f9689'};
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
export function lessonVisual(l,step,prefix='visual'){
 const n=Math.max(0,Math.min(2,step)),id=prefix.replace(/[^a-z0-9-]/gi,'');
 const line=(points,color=C.guide,dashed=false,arrow=false)=>`<polyline points="${points}" fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" ${dashed?'stroke-dasharray="6 6"':''} ${arrow?`marker-end="url(#${id}-${color===C.finger?'finger':color===C.ball?'ball':'guide'})"`:''}/>`;
 const text=(s,x,y,color=C.ink,size=16)=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="middle">${esc(s)}</text>`;
 const dot=(x,y,name,color=C.ball,ghost=false)=>`<circle cx="${x}" cy="${y}" r="9" fill="${ghost?'#14271e':color}" stroke="${color}" stroke-width="3" ${ghost?'stroke-dasharray="3 3"':''}/>${name?text(name,x,y+28,color):''}`;
 const board=(x=40,y=25,w=300,h=170)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="#20382b" stroke="#708b73" stroke-width="2"/>`;
 let body='',titles=[],captions=[];
 if(l.gestureThree){
  titles=['① 目標を、下の壁の向こうへ写す','② 自キャラと「写した目標」の中間','③ 右上の角から、中点へ引く'];
  captions=['壁から同じ距離だけ、外側にもう１つの目標を置くイメージ。','使うのは、壁の外に写した目標。青い線のちょうど真ん中が中点。','オレンジが指の動き。玉は逆向きに飛び、上→右→下と反射する。'];
  body=board(40,30,260,125)+dot(80,55,'',C.ball)+text('自キャラ',80,20)+dot(220,115,'',C.ball)+text('目標',252,105);
  body+=line('220,115 220,195',C.guide,true)+dot(220,195,'',C.guide,true)+text('写した目標',300,202,C.guide)+text('最後の壁',95,177,C.dim,14);
  if(n===0)body+=line('230,135 245,135')+line('230,175 245,175')+text('同じ距離',307,150,C.guide,14);
  if(n>=1)body+=line('80,55 220,195',C.guide,true)+dot(150,125,'中点',C.finger);
  if(n===2)body+=line('80,55 119.47,30 300,144.33 283.16,155 220,115',C.ball,false,true)+dot(300,30,'',C.finger)+text('角',325,35,C.finger)+line('300,30 150,125',C.finger,false,true);
 }else if(l.type==='two'){
  titles=['① 自キャラと目標の、真ん中を探す','② 中点と、右上の角を結ぶ','③ 角から中点へ、指を動かす'];
  captions=['２点を結ぶ線を、同じ長さに半分ずつ分ける。','青い線の向きが、玉を飛ばしたい方向。','角に触れて中点まで引く。玉は上→右の２反射で目標へ。'];
  body=board(40,35,270,150)+dot(70,170,'自キャラ')+dot(230,170,'目標')+line('70,170 230,170',C.guide,true)+dot(150,170,'中点',C.finger);
  if(n>=1)body+=dot(310,35,'',C.finger)+text('角',335,28,C.finger)+(n===1?line('150,170 310,35',C.guide,false,true):'');
  if(n===2)body+=line('70,170 230,35 310,102.5 230,170',C.ball,false,true)+line('310,35 150,170',C.finger,false,true);
 }else if(['mirror','wallsize'].includes(l.type)){
  titles=['① 壁の向こうにも目標を置く','② 写した目標へ、まっすぐ線を引く','③ 線と壁が交わるところを狙う'];
  captions=['目標を鏡に映すイメージ。壁の左右で距離は同じ。','曲がる道を考える代わりに、まず青い直線を１本。','緑が実際の玉の道。基準にする壁は、玉の中心が反射する位置。'];
  body=line('235,25 235,195',C.dim)+text('壁',235,218,C.dim)+dot(65,165,'自キャラ')+dot(135,65,'目標')+dot(335,65,'写した目標',C.guide,true)+line('135,65 335,65',C.guide,true);
  if(n>=1)body+=line('65,165 335,65',C.guide,false,true);
  if(n===2)body+=line('65,165 235,102.04 135,65',C.ball,false,true)+dot(235,102.04,'ここを狙う',C.finger);
 }else if(l.type==='corner'){
  titles=['① 内側の角を見つける','② 角へ向けると、来た道を戻る','③ 少しずらすと、帰り道もずれる'];
  captions=['見た目の壁ではなく、玉の中心が届く角が基準。','縦と横の壁で反射すると、向きが両方反転する。','青が角ぴったりの基準。緑の帰り道と比べよう。'];
  body=board(40,35,270,150)+dot(70,170,'自キャラ')+dot(310,35,'',C.finger)+text('内側の角',305,20,C.finger)+line('70,170 310,35',C.guide,true);
  if(n===1)body+=line('310,35 80,164',C.ball,false,true)+text('同じ道を戻る',220,183,C.ball);
  if(n===2)body+=line('70,170 295,35 310,44 100,170',C.ball,false,true)+text('帰り道がずれる',234,202,C.ball);
 }else if(l.type==='symmetry'){
  titles=['① 左右が鏡写しか確認する','② 壁の真ん中を狙う','③ 前半を裏返すと、後半の道'];
  captions=['中央の青い線から、左右の距離が同じ位置。','中央へ向かう緑の線を作ろう。','反射後の道も左右対称。最後は目標へ届く。'];
  body=board()+line('200,25 200,195',C.guide,true)+dot(80,170,'自キャラ')+dot(320,170,'目標')+text('中央',200,20,C.guide);
  if(n>=1)body+=line('80,170 200,25',C.ball,false,true)+dot(200,25,'',C.finger);
  if(n===2)body+=line('200,25 320,170',C.ball,false,true);
 }else if(l.type==='multi'){
  titles=['① 画面を鏡写しに並べる','② 遠くの目標まで、１本の直線','③ 画面に折り戻すと、反射の道'];
  captions=['壁の向こうにも、裏返した画面が続くと考える。','写した目標と自キャラを結べば、最初の方向が決まる。','これは仕組みの簡略図。課題ごとの正確な回数・順番は盤面の番号で確認。'];
  for(let i=0;i<3;i++)body+=board(30+i*112,45,112,130);
  body+=dot(50,145,'自キャラ')+dot(340,65,'写した目標',C.guide,true);
  if(n>=1)body+=line('50,145 340,65',C.guide,false,true);
  if(n===2){body=board(75,30,250,150)+dot(110,155,'自キャラ')+dot(220,140.6,'目標');body+=line('110,155 190,30 325,114.4 283,180 220,140.6',C.ball,false,true)+text('折り返しのイメージ',200,220,C.guide,14);}
 }else if(['loop','crossloop'].includes(l.type)){
  const vertical=l.ratio?.p===2;
  const path=l.type==='loop'?'70,110 200,30 330,110 200,190 70,110':vertical?'200,110 330,70 200,30 70,70 200,110 330,150 200,190 70,150 200,110':'200,110 265,30 330,110 265,190 200,110 135,30 70,110 135,190 200,110';
  const pts=path.split(' '),first=pts.slice(0,l.type==='loop'?3:5).join(' '),start=l.type==='loop'?[70,110]:[200,110];
  titles=['① 戻ってくる場所を決める','② まず半周の形を追う','③ もう半周で、同じ道へ戻る'];
  captions=['オレンジの輪が、戻りたい場所。','緑の道を、壁の反射ごとにたどってみよう。','一周する形を覚えたら、角度を少しずらして違いを比べよう。'];
  body=board(70,30,260,160)+dot(...start,'',C.finger)+text(l.type==='loop'?'出発点へ戻る':'中央を２回通る',200,220,C.finger);
  if(n>=1)body+=line(n===1?first:path,C.ball,false,true);
 }else if(l.type==='pocket'){
  titles=['① 隙間の入口を見つける','② 入口へ、斜めに入る道を作る','③ 入った後の往復も見る'];
  captions=['オレンジが入口。見た目の隙間と、玉が通れる幅は違う。','場所だけでなく、入っていく方向も大切。','緑は往復のイメージ。必要な壁の順番とヒット数は実際の盤面で確認。'];
  body=board();
  if(l.pocket.wall)body+=`<circle cx="220" cy="90" r="42" fill="#745b4e" stroke="#e2a180" stroke-width="2"/>`+line('290,35 290,180',C.dim);
  else body+=`<circle cx="135" cy="85" r="42" fill="#745b4e" stroke="#e2a180" stroke-width="2"/><circle cx="245" cy="85" r="42" fill="#745b4e" stroke="#e2a180" stroke-width="2"/>`;
  const x=l.pocket.wall?272:190;
  body+=dot(x,127,'入口',C.finger)+text('敵',l.pocket.wall?220:135,91)+dot(75,175,'自キャラ');
  if(n>=1)body+=line(`75,175 ${x},127`,C.ball,false,true);
  if(n===2)body+=line(l.pocket.wall?'272,127 290,111 263,94 290,77 263,60':'190,127 205,110 175,90 205,70 175,50',C.ball,false,true);
 }else if(l.type==='collision'){
  titles=['① 触れる「面」を見る','② 面に当たると、向きが変わる','③ 少しずらして、違いを比べる'];
  captions=['薄い色が見た目。青い境界が玉の中心の反射位置のイメージ。','平らな面では、面に向かう成分が反転する。','円・段差・ブロックでは反射位置が違う。実際の判定表示で比較しよう。'];
  body=board()+`<path d="M230 55H300V140H230V125H210V75H230Z" fill="#79675b" stroke="#d6ac8b" stroke-width="2"/>`+line('195,65 195,145',C.guide,true)+dot(80,175,'自キャラ')+text('中心の境界',186,45,C.guide,14);
  if(n>=1)body+=line('80,175 195,110 95,53',C.ball,false,true)+dot(195,110,'接触点',C.finger);
  if(n===2)body+=line('80,175 215,70 140,30',C.guide,true,true);
 }else{
  titles=['① 配置する','② 向きを決める','③ 弾いて比べる'];captions=['玉と目標を置いてみよう。','オレンジが指、緑が玉の方向。','予測と実際の軌道を比べよう。'];
  body=board()+dot(110,150,'自キャラ')+dot(290,70,'目標');
  if(n>=1)body+=line('200,100 130,150',C.finger,false,true);
  if(n===2)body+=line('110,150 290,70',C.ball,false,true);
 }
 const defs=`<defs>${['guide','ball','finger'].map(key=>`<marker id="${id}-${key}" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0 0L6 3L0 6Z" fill="${C[key]}"/></marker>`).join('')}</defs>`;
 const content=defs+`<rect width="400" height="230" rx="10" fill="#14271e"/><g font-family="Noto Sans JP, sans-serif">${body}</g>`;
 return {title:titles[n],caption:captions[n],content,svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 230" role="img" aria-label="${esc(titles[n]+'。'+captions[n])}">${content}</svg>`};
}
