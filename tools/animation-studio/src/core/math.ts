import type {Mat,Vec} from './types';
export const identity=():Mat=>[1,0,0,1,0,0];
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const dist=(a:Vec,b:Vec)=>Math.hypot(a.x-b.x,a.y-b.y);
export const angle=(a:Vec,b:Vec)=>Math.atan2(b.y-a.y,b.x-a.x);
export const wrap=(a:number)=>Math.atan2(Math.sin(a),Math.cos(a));
export function multiply(a:Mat,b:Mat):Mat{return [a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];}
export function inverse(m:Mat):Mat{const d=m[0]*m[3]-m[1]*m[2];if(Math.abs(d)<1e-8)throw Error('変換が不正です');return [m[3]/d,-m[1]/d,-m[2]/d,m[0]/d,(m[2]*m[5]-m[3]*m[4])/d,(m[1]*m[4]-m[0]*m[5])/d];}
export const transform=(m:Mat,p:Vec):Vec=>({x:m[0]*p.x+m[2]*p.y+m[4],y:m[1]*p.x+m[3]*p.y+m[5]});
export function trs(p:Vec,r=0,sx=1,sy=sx):Mat{const c=Math.cos(r),s=Math.sin(r);return [c*sx,s*sx,-s*sy,c*sy,p.x,p.y];}
export function segment(p:Vec,a:Vec,b:Vec){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return {t,d:Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)};}
export function solveIK(start:Vec,target:Vec,l1:number,l2:number,bend:number){l1=Math.max(l1,.01);l2=Math.max(l2,.01);const dx=target.x-start.x,dy=target.y-start.y,d=clamp(Math.hypot(dx,dy),Math.abs(l1-l2)+.001,l1+l2-.001),dir=Math.atan2(dy,dx),beta=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1)),a=dir+(bend>=0?1:-1)*beta;const elbow={x:start.x+l1*Math.cos(a),y:start.y+l1*Math.sin(a)},b=Math.atan2(start.y+d*Math.sin(dir)-elbow.y,start.x+d*Math.cos(dir)-elbow.x);return {a,b,elbow,end:{x:elbow.x+l2*Math.cos(b),y:elbow.y+l2*Math.sin(b)}};}
