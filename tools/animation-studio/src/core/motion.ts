import type {Rig,Bone,Motion,Pose} from './types';
import {poseAt} from './rig';
const DT=1/120;
/** Fixed-step spring state; arbitrary seek replays from a warmed deterministic origin. */
export class MotionEngine{
 private tick=-1;private state={x:0,y:0,vx:0,vy:0,r:0,vr:0};private config='';private last?:{x:number;y:number;r:number};
 reset(){this.tick=-1;this.state={x:0,y:0,vx:0,vy:0,r:0,vr:0};this.last=undefined;}
 evaluate(rig:Rig,bones:Bone[],m:Motion,t:number):Pose{
  t=Math.max(0,t);const cfg=JSON.stringify([rig,m]);if(cfg!==this.config){this.config=cfg;this.reset();}
  const wanted=Math.floor(t/DT);if(wanted<this.tick||wanted-this.tick>7200)this.reset();
  if(this.tick<0){for(let i=-360;i<0;i++)this.step(rig,bones,m,i*DT);this.tick=0;}
  while(this.tick<wanted){this.tick++;this.step(rig,bones,m,this.tick*DT);}
  return poseAt(rig,bones,m,t,{x:this.state.x,y:this.state.y,r:this.state.r});
 }
 private step(rig:Rig,bones:Bone[],m:Motion,t:number){const p=poseAt(rig,bones,m,t),now={x:p.joints.chest.x,y:p.joints.chest.y,r:Math.atan2(p.matrices.spine[1],p.matrices.spine[0])},prev=this.last||now,k=75,d=8+m.damping*16,max=Math.max(2,Math.hypot(rig.chest.x-rig.pelvis.x,rig.chest.y-rig.pelvis.y)*.12),drive=m.secondary;
  const targetX=-(now.x-prev.x)/DT*.07*drive,targetY=-(now.y-prev.y)/DT*.09*drive,targetR=-(now.r-prev.r)/DT*.03*drive;
  this.state.vx+=((targetX-this.state.x)*k-this.state.vx*d)*DT;this.state.vy+=((targetY-this.state.y)*k-this.state.vy*d)*DT;this.state.vr+=((targetR-this.state.r)*k-this.state.vr*d)*DT;
  this.state.x=Math.max(-max,Math.min(max,this.state.x+this.state.vx*DT));this.state.y=Math.max(-max,Math.min(max,this.state.y+this.state.vy*DT));this.state.r=Math.max(-.12,Math.min(.12,this.state.r+this.state.vr*DT));this.last=now;
 }
}
