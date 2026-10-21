import {simulate,idealAngle,snapAngle,unfoldedTarget} from './physics.mjs';
export const lessons=[
{title:'１反射を狙う',sub:'鏡写しで、狙いを一本に',chip:'右壁を１回',type:'mirror',start:{x:90,y:430},targets:[{id:1,x:135,y:230,r:24,minRefs:1}],enemies:[],blocks:[],heading:'壁の向こうに、\n目標を置く。',lead:'跳ね返る道を、鏡写しの世界では直線として考えられます。まずは右の壁を使ってリングを通そう。',formula:'自キャラ → 鏡写しの目標\nその直線が、反射後のルート',steps:['目標を右壁の向こうへ鏡写しにする。','自キャラと、鏡写しの目標を直線で結ぶ。','その線が壁を横切る位置を狙う。'],insight:'壁までの距離が違う２点では、単純に「中間の高さ」を狙っても当たりません。鏡写しなら距離の違いも扱えます。',goal:'右壁で１回反射したあと、目標を通る。'},
{title:'２反射の中点',sub:'中点と角で方向を決める',chip:'上 → 右の２反射',type:'two',start:{x:110,y:430},targets:[{id:1,x:290,y:430,r:24,minRefs:2}],enemies:[],blocks:[],heading:'２反射は、\n中点から角へ。',lead:'直角な２つの壁を経由する道。自キャラと目標の中点を使えば、打つ方向がひとつの線で決まります。',formula:'打つ方向 ∥ 中点 M → 角 C\nM =（自キャラ ＋ 目標）÷ 2',steps:['自キャラと目標の中点 M を見つける。','M から、経由する壁の角 C へ線を引く。','その線と平行に、自キャラを弾く。'],insight:'中点そのものを狙うのではありません。「中点から角へ」の向きと平行に弾くのがポイント。',goal:'上壁、右壁の順に反射して、目標を通る。'},
{title:'角打ちとずれ',sub:'帰り道を平行にずらす',chip:'角で折り返す',type:'corner',start:{x:135,y:430},targets:[{id:1,x:135,y:430,r:24,minRefs:2}],enemies:[],blocks:[],heading:'角を基準に、\n帰り道を読む。',lead:'直角の２つの壁で両方の方向成分が反転すると、来た方向へ戻ります。角から少しずらして、帰り道の変化を見よう。',formula:'（vx, vy）→（−vx, −vy）\n２反射後は、出発時と平行',steps:['理論ガイドで、自キャラ中心から角への線を見る。','角へ弾き、２つの壁での反射を観察する。','角度を１°ずつ変えて、戻る道を比較する。'],insight:'本当に狙うのは駒の中心が届く「内側の角」。画面に見える壁の角を狙うと、駒の半径ぶんずれます。',goal:'右上の２つの壁で反射し、出発位置へ戻る。'},
{title:'真ん中と対称性',sub:'後半の道を、前半から読む',chip:'上壁の中央へ',type:'symmetry',start:{x:100,y:450},targets:[{id:1,x:340,y:450,r:24,minRefs:1}],enemies:[],blocks:[],heading:'半分読めば、\n残りが見える。',lead:'左右対称の２点をつなぐなら、上壁の中央で反射。前半の道を鏡写しにすると、後半の道がわかります。',formula:'中央線で、左右を鏡写し\n出発点 S ↔ 目標 T',steps:['自キャラと目標が、中央線に対して対称か見る。','上壁の中央を狙い、反射させる。','再生バーで、左右の軌道の形を比較する。'],insight:'「真ん中理論」の入口になる課題。複雑な盤面へ使うには、反射面と途中の障害物も対称である必要があります。',goal:'上壁の中央を経由し、対称位置の目標を通る。'},
{title:'菱形ループ',sub:'一周して、同じ軌道へ',chip:'４つの壁を一周',type:'loop',start:{x:42,y:327},targets:[{id:1,x:42,y:327,r:24,minRefs:3}],enemies:[],blocks:[],heading:'一度決まれば、\n同じ道を巡る。',lead:'縦横の長さの比に合わせて弾くと、４つの壁を回って出発点へ戻ります。距離を増やして２周目も確かめよう。',formula:'tan θ = −H / W\nW：中心の移動幅　H：移動高さ',steps:['左壁の中央から、幅と高さの比で方向を決める。','上・右・下・左の壁を順に経由する。','移動距離を増やし、同じ軌道が重なるか見る。'],insight:'縦長の盤面では45°ではありません。角度を少しずらすと、一周ごとのずれが積み重なっていきます。',goal:'上・右・下・左と一周し、出発位置へ戻る。'},
{title:'狙いの許容幅',sub:'正解は一点だけじゃない',chip:'小さなリングへ',type:'two',start:{x:110,y:430},targets:[{id:1,x:290,y:430,r:12,minRefs:2}],enemies:[{id:2,x:275,y:265,r:27}],blocks:[{id:3,x:130,y:240,w:54,h:38}],heading:'当てる角度の、\n幅をつかむ。',lead:'リングが小さくなると、少しの角度差が結果を分けます。２反射のルートを作り、角度を0.5°刻みで変えてみよう。',formula:'目標の両端を鏡写し\n２本の線の間が、許容角度',steps:['中点から角への方向で、２反射の道を作る。','理論ガイドの細い扇形で、角度の幅を見る。','前の軌道と比較しながら、少しずつ角度を変える。'],insight:'ルートが長いほど、同じ角度差で目標付近のずれが大きくなります。途中の敵やブロックに触れると、別のルートになります。',goal:'敵・ブロックに触れず、上 → 右の２反射でリングへ。'}];

const advanced=[
 [3,1,-2,'３反射の展開図','３回曲がる道を、一本に'],
 [4,2,-2,'４反射のつながり','縦横の鏡写しを重ねる'],
 [5,3,-2,'５反射の逆算','到着点から、道を決める'],
 [6,3,-3,'６反射と精度','小さな角度差が広がる'],
 [7,4,-3,'７反射の順番','似た道でも、順序は違う'],
 [8,4,-4,'８反射に挑戦','長いルートを一筆で読む']
];
for(const [n,x,y,title,sub] of advanced){
 const scene={title,sub,chip:`${n}反射して目標へ`,type:'multi',reflectionCount:n,tile:{x,y},start:{x:104,y:449},targets:[{id:1,x:310,y:254,r:n>=6?18:24,minRefs:n}],enemies:[],blocks:[],heading:`${n}反射も、\n展開すれば直線。`,lead:`画面を鏡写しに並べると、反射の道が一本の直線になります。横方向に${x}回、縦方向に${Math.abs(y)}回の壁を経由して、目標を通そう。`,formula:`鏡写しの目標 T′へ直線\n横 ${x}回 ＋ 縦 ${Math.abs(y)}回 ＝ ${n}反射`,steps:['目標を、指定回数だけ鏡写しにした位置へ移す。','その目標と自キャラを直線で結び、方向を決める。','番号付きの軌道で、壁に触れる順番を確かめる。'],insight:n>=6?'遠い鏡写しの目標ほど、１段階の角度差によるずれが大きくなります。±１段階で比較し、連続角度との違いも観察しよう。':'同じ目標でも、別の鏡写しを選ぶと別のルートになります。反射回数だけでなく、壁に触れる順番も見てみよう。',goal:`指定された順番で${n}回反射して、目標を通る。`};
 const a=idealAngle(scene),distance=Math.hypot(unfoldedTarget(scene).x-scene.start.x,unfoldedTarget(scene).y-scene.start.y);
 const run=simulate(scene,snapAngle(a),distance+250);
 scene.budget=Math.ceil((distance+250)/100)*100;
 scene.wallSequence=run.events.slice(0,n).map(e=>Math.abs(e.x-398)<.01?'右':Math.abs(e.x-42)<.01?'左':Math.abs(e.y-82)<.01?'上':'下');
 scene.goal=`${scene.wallSequence.join(' → ')}の順に${n}反射して、目標を通る。`;
 lessons.push(scene);
}
const collisionLessons=[
 {title:'敵の面と角',sub:'円と段差で、反射は変わる',chip:'敵で１回反射',type:'collision',contact:'enemy',start:{x:100,y:420},enemies:[{id:2,x:260,y:290,r:32}],blocks:[],aim:-32*Math.PI/180,heading:'見た目の丸と、\n跳ね方は別。',lead:'同じ丸い見た目でも、判定が平らな面の集合なら、その面に合わせて反射します。敵に当ててリングへ。その後、単純な円と比較しよう。',formula:'平らな面：方向成分を反転\n円：接触点の法線で反射',steps:['判定表示をオンにして、敵の段差を確認。','敵の面で１回反射して、目標を通る。','「敵の反射」を単純な円に変え、同じ角度で比較。'],insight:'この段差の大きさ・形は説明用です。本家の敵ごとの判定データを再現したものではありません。微細な段差がどの角度で効くかを観察しよう。'},
 {title:'ブロックの辺と角',sub:'駒の中心だけでは抜けない',chip:'ブロックで１回反射',type:'collision',contact:'block',start:{x:100,y:420},enemies:[],blocks:[{id:2,x:220,y:280,w:74,h:56}],aim:-45*Math.PI/180,heading:'ブロックは、\n中心より先に当たる。',lead:'自キャラの大きさがあるため、中心がブロックに届く前に反射します。判定を表示して、見える辺と中心の反射位置を比べよう。',formula:'中心の衝突範囲\nブロック ＋ 自キャラの半幅',steps:['判定表示で、ブロック周囲の点線を見る。','底辺で反射して、目標へ向かう。','少し角度を変え、辺に当たる場所の違いを確認。'],insight:'この教材のブロック判定は、四角い自キャラとの衝突モデルです。斜めの隙間は中心線だけでなく、駒の幅で考える必要があります。'},
 {title:'壁と駒の大きさ',sub:'反射点は、壁の内側にある',chip:'右壁で１回反射',type:'wallsize',start:{x:110,y:470},targets:[{id:1,x:305,y:370,r:18,minRefs:1}],enemies:[],blocks:[],heading:'狙う壁は、\n駒ひとつ内側。',lead:'壁に接するのは駒の外周です。鏡写しや角打ちで使う基準は、駒の中心が動ける範囲。見える壁の線と区別しよう。',formula:'中心の反射位置\n見える壁 − 自キャラの半幅',steps:['判定表示をオンにして、内側の点線を見る。','目標を、その点線を基準に鏡写しにする。','右壁で１回反射し、目標を通る。'],insight:'見た目の壁で鏡写しにすると、基準がずれてしまいます。駒の大きさを考慮することは、何反射先でも共通です。'},
 {title:'弱点を含む判定',sub:'本体と別の領域を観察する',chip:'複合判定で反射',type:'collision',contact:'enemy',start:{x:365,y:315},enemies:[{id:2,x:235,y:315,r:38,weak:{dx:40,dy:0,r:14}}],blocks:[],aim:Math.PI,heading:'弱点も、\nひとつの領域。',lead:'本体と弱点の領域を組み合わせた説明用モデル。どちらの外側の面に触れるかで、反射点が変わります。判定表示で確かめよう。',formula:'本体の判定 ∪ 弱点の判定\n重なった内部の面は反射しない',steps:['本体の赤い判定と、弱点の黄色い判定を確認。','複合判定の外側に当てて、リングへ。','自由実験で弱点付きの敵を置いて試す。'],insight:'本家の弱点のヒット条件や倍率、ヒットバックは別の仕様です。この教材では複合判定の外周だけを学び、マッチ成立は再現していません。'}
];
for(const l of collisionLessons){l.collisionMode='stepped';l.budget=1800;if(!l.targets){l.targets=[];const r=simulate(l,snapAngle(l.aim),l.budget);const seg=r.segments[1];if(!seg)throw Error('Collision lesson missing rebound');const len=Math.min(90,(seg.to-seg.from)*.6),d=len/(seg.to-seg.from);l.targets=[{id:1,x:seg.a.x+(seg.b.x-seg.a.x)*d,y:seg.a.y+(seg.b.y-seg.a.y)*d,r:20,minRefs:1}];}l.goal=(l.contact==='block'?'ブロック':l.contact==='enemy'?'敵':'右壁')+'で１回反射して、目標を通る。';lessons.push(l);}
const gestureLesson={...JSON.parse(JSON.stringify(lessons[1])),title:'角から中点へ引く',sub:'指の動きで２反射を作る',chip:'どこからでも引ける応用',gesture:true,reflectionCount:2,wallSequence:['上','右'],heading:'指の始点も、\n理論の一部。',lead:'自キャラを触らなくても弾ける操作を利用します。盤面右上の内側の角 C に触れ、中点 M へ引くと、２反射の方向をそのまま作れます。',formula:'指：C → M に引く\n発射：C − M の方向へ',steps:['自キャラと目標の中点 M を見つける。','右上の内側の角 C に触れて、M へ指を動かす。','離すと、上 → 右の２反射で目標へ。'],insight:'発射方向は「触れ始めた点 − 今の指の位置」。自キャラと目標の中点を使うと、面倒な角度合わせを指の２点で作れます。これはこの教材で導いた応用です。',goal:'角 C から中点 M へ引き、上 → 右の２反射で目標へ。'};
lessons.push(gestureLesson);
const precisionLesson=JSON.parse(JSON.stringify(lessons[11]));
const oldAim=snapAngle(idealAngle(precisionLesson)),oldDistance=Math.hypot(unfoldedTarget(precisionLesson).x-precisionLesson.start.x,unfoldedTarget(precisionLesson).y-precisionLesson.start.y),rr=simulate(precisionLesson,oldAim,precisionLesson.budget),ss=rr.segments.find(s=>s.from<=oldDistance&&s.to>=oldDistance),k=(oldDistance-ss.from)/(ss.to-ss.from);
precisionLesson.targets[0]={id:1,x:ss.a.x+(ss.b.x-ss.a.x)*k,y:ss.a.y+(ss.b.y-ss.a.y)*k,r:6,minRefs:8};precisionLesson.aim=oldAim;
Object.assign(precisionLesson,{title:'１段階で何が変わる？',sub:'８反射先で誤差を体験',chip:'±１段階で比較',heading:'たった１段階、\nその先で大きな差。',lead:'小さなリングに向かう８反射。理論の角度をセットして一度弾いたら、＋１段階で同じ距離を試そう。２本の軌道はどこまで似ている？',formula:'ずれ ≈ 展開図の距離 × 角度差\n１段階 ≈ 0.006136 ラジアン',steps:['理論の角度で弾き、まずはリングを通す。','＋１を押して、１段階だけ角度を変える。','前の軌道と、８反射後の違いを比較する。'],insight:'このリングは1024段階の基準角度で通れるよう配置しています。正解角度が細かい刻みに乗るかどうかと、指でその角度を作れるかは別の問題です。',goal:'指定の８反射で小さなリングへ。達成後に±１段階を比較。'});
lessons.push(precisionLesson);

// The loop ratios are independent geometric constructions, rather than a
// transcription of a particular creator's named technique.
for(const [title,sub,p,q,shape,budget] of [
 ['８の字で中央を往復','上下の輪で、同じ点を２回',2,1,'８',3800],
 ['∞字の６反射ループ','左右の輪と、中央の交差',1,2,'∞',4200]
]) {
 lessons.push({title,sub,chip:`${shape}字 · 中央を２回通過`,type:'crossloop',loopCrossings:[3,6],ratio:{p,q},budget,
  start:{x:220,y:327},targets:[{id:1,x:220,y:327,r:14,minRefs:3}],enemies:[],blocks:[],aim:Math.atan2(-q*490,p*356),
  heading:`${shape}字の交点を、\n何度も通る。`,
  lead:`${shape==='８'?'上と下':'左と右'}に輪を描き、中央へ戻るルートです。３反射後と６反射後に中央のリングを通そう。途中で交点を通っても、同じ方向に戻るまでが一周です。`,
  formula:`tan θ = −${q}H / ${p}W\n一周：横 ${2*p}回 ＋ 縦 ${2*q}回 ＝ ６反射`,
  steps:['中央から、盤面の幅 W と高さ H の比で狙う。','３反射後に交点を通り、もう一方の輪へ進む。','６反射後にも交点を通る。連続角度と±１段階を比較。'],
  insight:'長方形を展開して、横に2pW・縦に2qH進むと元の位置と向きへ戻る、という幾何学の課題です。1024段階では理論角度と少しずれるため、周回ごとのずれも観察できます。実戦の敵・減速条件は別途考える必要があります。',
  goal:'３反射後と６反射後に、中央のリングをそれぞれ１回通る。'});
}
const gapBase = {
 type:'pocket',collisionMode:'stepped',budget:3000,blocks:[],targets:[],
 enemies:[{id:2,x:200,y:230,r:32},{id:3,x:300,y:230,r:32}],
 pocket:{x:250,y:255,r:38,minHits:4},
 insight:'入口の一点へ届くだけでは足りません。入ったあとにどちらの面へ当たるかが連続ヒットを左右します。この教材は段差判定と減速のモデルで、実機のマッチやヒットバックの再現ではありません。',
};
const pockets=[
 {...gapBase,title:'敵同士の隙間にはまる',sub:'入口と進入角度を、両方狙う',chip:'直撃 → ４ HIT',start:{x:100,y:330},aim:976*Math.PI*2/1024,pocket:{...gapBase.pocket,approach:[]},
  heading:'隙間へ、\nどう入るか。',lead:'敵２体の間へ、浅い角度で入ろう。金色のエリア内で、両方の敵を含む連続４ヒットが目標。リングを通るだけの練習から、進入後まで考える練習へ。',
  formula:'到着点 ＋ 進入する方向\n両方の敵に、連続４ヒット',steps:['判定表示で、見た目の隙間と中心が入れる範囲を比べる。','浅く入り、隙間の奥へ向かう方向成分を残す。','左右の敵へ交互に当たるかをスロー再生で確認。']},
 {...gapBase,title:'１反射からはまる',sub:'入口を鏡写しにして狙う',chip:'左壁 → ４ HIT',start:{x:100,y:450},aim:607*Math.PI*2/1024,pocket:{...gapBase.pocket,approach:['左']},
  heading:'入口の手前を、\n鏡写しに。',lead:'左壁を１回経由し、敵２体の隙間へ。入口までのルートを鏡写しで作り、到着時の角度が連続ヒットにつながるかを確かめよう。',
  formula:'壁の反射：入口を鏡写し\n隙間の中：面の向きで反射',steps:['最初に入る面と、入口 E の位置を確認。','E を左壁で鏡写しにし、進入方向を決める。','左壁のあとに両方の敵へ連続４ヒットさせる。']},
 {...gapBase,title:'２反射から斜めの隙間へ',sub:'壁の順番と、進入面を読む',chip:'左 → 下 → ４ HIT',start:{x:100,y:450},enemies:[{id:2,x:230,y:230,r:32},{id:3,x:310,y:310,r:32}],aim:351*Math.PI*2/1024,pocket:{x:270,y:280,r:35,minHits:4,approach:['左','下']},
  heading:'２反射の先も、\n入口まで読む。',lead:'左壁、下壁を順に使い、斜めに並ぶ２体の隙間へ。壁だけの２反射で終わらず、最初の敵の面へ当たった後の動きまで見よう。',
  formula:'２反射後の道 ∥ 発射方向\n入口 E と自キャラの中点を使う',steps:['入口 E と自キャラの中点から、左下の角への方向を見る。','その方向と平行に弾き、左 → 下の壁を使う。','隙間の中で両方の敵を含む連続４ヒットを狙う。']},
 {...gapBase,title:'敵と壁の間ではまる',sub:'壁際の細い往復を作る',chip:'右壁 → 敵と壁で往復',start:{x:100,y:450},enemies:[{id:2,x:350,y:230,r:32}],aim:937*Math.PI*2/1024,pocket:{x:391,y:245,r:35,minHits:4,approach:['右'],wall:'右'},
  heading:'壁際の往復を、\n狙って作る。',lead:'最初に右壁へ当て、敵の下側から壁際へ入ろう。金色のエリア内で、敵と壁を往復して敵に４回当てる課題です。',
  formula:'細い往復 ＋ 奥へ進む成分\n敵に４ヒット、壁も経由',steps:['敵の右側と壁の内側の境界を見る。','右壁へ当ててから、隙間の入口へ進む。','敵と壁を交互に触れるか、判定と軌道で確認。']}
];
for (const l of pockets) {
 l.goal=`${l.pocket.approach.length?l.pocket.approach.join(' → ')+'で反射してから':'壁を経由せず'}隙間へ入り、エリア内で敵に連続４ヒット。`;
 const run=simulate(l,l.aim,l.budget),first=run.events.find(e=>e.kind==='enemy');
 l.entry={x:first.x,y:first.y};
 lessons.push(l);
}
export function lessonGroup(i) {
 if (lessons[i].type==='pocket') return 'gap';
 if (['loop','crossloop'].includes(lessons[i].type)) return 'loop';
 if (i===16||i===17) return 'control';
 if (i>=12&&i<=15) return 'collision';
 if (lessons[i].type==='multi') return 'multi';
 return 'basic';
}
