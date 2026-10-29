import {Application,Mesh,MeshGeometry,Texture,Shader,UniformGroup,Buffer,BufferUsage,Sprite} from 'pixi.js';
import type {Doc,Bone,Part,Pose} from '../core/types';
import {multiply,trs,dist,wrap,angle} from '../core/math';
import {partTexture,canvas} from '../assets/images';import {dilate,union} from '../assets/masks';
const vertex=`precision highp float;
attribute vec2 aPosition;attribute vec2 aUV;attribute vec4 aBoneIds;attribute vec4 aWeights;
uniform vec4 uCrop;uniform mat3 uBones[14];uniform mat3 uManual;uniform vec2 uSize;uniform vec3 uSoft;uniform vec4 uRegion;uniform vec4 uJoint0;uniform vec4 uJoint1;uniform float uMode;uniform float uBreath;varying vec2 vUV;
void main(){vec3 p=vec3(aPosition,1.);vec3 q=(uBones[int(aBoneIds.x)]*p)*aWeights.x+(uBones[int(aBoneIds.y)]*p)*aWeights.y+(uBones[int(aBoneIds.z)]*p)*aWeights.z+(uBones[int(aBoneIds.w)]*p)*aWeights.w;
float influence=exp(-dot((aPosition-uRegion.xy)/max(uRegion.z,1.),(aPosition-uRegion.xy)/max(uRegion.z,1.))*2.);
if(uMode>1.5){influence=clamp((aPosition.y-uRegion.y)/max(uRegion.z,1.),0.,1.);influence*=influence;}
q.xy+=uSoft.xy*influence*uRegion.w;
if(uMode>0.5&&uMode<1.5){float breath=uBreath*.008*uRegion.w;q.xy+=(aPosition-uRegion.xy)*breath*influence;}
vec2 j0=aPosition-uJoint0.xy;vec2 j1=aPosition-uJoint1.xy;
q.xy+=vec2(j0.x,j0.y)*uJoint0.w*exp(-dot(j0,j0)/max(uJoint0.z*uJoint0.z,1.));
q.xy+=vec2(j1.x,j1.y)*uJoint1.w*exp(-dot(j1,j1)/max(uJoint1.z*uJoint1.z,1.));
q=uManual*q;gl_Position=vec4(q.x/uSize.x*2.-1.,1.-q.y/uSize.y*2.,0.,1.);vUV=(aUV-uCrop.xy)/uCrop.zw;}`;
const fragment=`precision highp float;varying vec2 vUV;uniform sampler2D uTexture;void main(){gl_FragColor=texture2D(uTexture,vUV);}`;
type View={part:Part;mesh:Mesh<MeshGeometry,Shader>;uniforms:UniformGroup;texture:Texture};
export class SceneRenderer{
 app=new Application();views:View[]=[];private bg?:Sprite;doc?:Doc;
 async init(c:HTMLCanvasElement){await this.app.init({canvas:c,width:640,height:800,preference:'webgl',preferWebGLVersion:2,backgroundAlpha:0,antialias:true,preserveDrawingBuffer:true,autoStart:false,resolution:1});this.app.ticker.stop();}
 async rebuild(doc:Doc){this.doc=doc;this.clear();this.app.renderer.resize(doc.width,doc.height);const bg=Texture.from(doc.replacementBackground||doc.background||doc.source,true);this.bg=new Sprite(bg);this.app.stage.addChild(this.bg);const coverage=union(doc.parts,doc.width,doc.height,false);
  for(const part of [...doc.parts].sort((a,b)=>a.order-b.order)){if(!part.geometry||!part.visible)continue;const g=part.geometry;const geometry=new MeshGeometry({positions:g.rest,uvs:g.uv,indices:g.indices});geometry.batchMode='no-batch';geometry.addAttribute('aBoneIds',{buffer:new Buffer({data:new Float32Array(g.boneIndices),usage:BufferUsage.VERTEX}),format:'float32x4'});geometry.addAttribute('aWeights',{buffer:new Buffer({data:g.weights,usage:BufferUsage.VERTEX}),format:'float32x4'});
   const display=dilate(part.mask,doc.width,doc.height,2);for(let i=0;i<display.length;i++)display[i]=part.fillMask?.[i]?part.mask[i]:Math.min(display[i],coverage[i]);let paint=partTexture(doc.source,display,doc.feather);if(part.fill&&part.fillMask){const composite=partTexture(part.fill,part.fillMask,0);composite.getContext('2d')!.drawImage(paint,0,0);paint=composite;}let x0=doc.width,y0=doc.height,x1=0,y1=0;for(let i=0;i<g.rest.length;i+=2){x0=Math.min(x0,g.rest[i]);y0=Math.min(y0,g.rest[i+1]);x1=Math.max(x1,g.rest[i]);y1=Math.max(y1,g.rest[i+1]);}x0=Math.floor(x0)-2;y0=Math.floor(y0)-2;const tw=Math.max(1,Math.ceil(x1)-x0+2),th=Math.max(1,Math.ceil(y1)-y0+2),cropped=canvas(tw,th);cropped.getContext('2d')!.drawImage(paint,-x0,-y0);const texture=Texture.from(cropped,true);const uniforms=new UniformGroup({uCrop:{value:new Float32Array([x0/doc.width,y0/doc.height,tw/doc.width,th/doc.height]),type:'vec4<f32>'},uBones:{value:new Float32Array(14*9),type:'mat3x3<f32>',size:14},uManual:{value:new Float32Array(9),type:'mat3x3<f32>'},uSize:{value:new Float32Array([doc.width,doc.height]),type:'vec2<f32>'},uSoft:{value:new Float32Array(3),type:'vec3<f32>'},uRegion:{value:new Float32Array(4),type:'vec4<f32>'},uJoint0:{value:new Float32Array(4),type:'vec4<f32>'},uJoint1:{value:new Float32Array(4),type:'vec4<f32>'},uMode:{value:0,type:'f32'},uBreath:{value:0,type:'f32'}});
   const shader=Shader.from({gl:{vertex,fragment},resources:{uniforms,uTexture:texture.source}});const mesh=new Mesh({geometry,shader,texture});this.app.stage.addChild(mesh);this.views.push({part,mesh,uniforms,texture});
  }
 }
 render(pose:Pose,bones:Bone[]){const doc=this.doc;if(!doc)return;for(const v of this.views){const u=v.uniforms.uniforms;const mats=u.uBones as Float32Array;for(let i=0;i<bones.length;i++){const m=multiply(pose.matrices[bones[i].id],bones[i].inverse);mats.set([m[0],m[1],0,m[2],m[3],0,m[4],m[5],1],i*9);}const p=v.part,m=multiply(trs({x:p.anchor.x+p.offset.x,y:p.anchor.y+p.offset.y},p.rotation,p.scale),trs({x:-p.anchor.x,y:-p.anchor.y}));(u.uManual as Float32Array).set([m[0],m[1],0,m[2],m[3],0,m[4],m[5],1]);(u.uSoft as Float32Array).set([pose.soft.x,pose.soft.y,pose.soft.r]);const radius=dist(doc.rig.chest,doc.rig.pelvis)*.45;(u.uRegion as Float32Array).set(p.kind==='body'?[doc.rig.chest.x,doc.rig.chest.y,radius,p.softness]:[p.anchor.x,p.anchor.y,Math.max(30,doc.height*.15),p.softness]);u.uMode=p.kind==='body'?1:['hair','cloth'].includes(p.kind)?2:0;u.uBreath=doc.motion.preset==='breath'?Math.sin(pose.time*doc.motion.speed*2*Math.PI/doc.motion.loop)*doc.motion.power:0;
   const side=p.kind.endsWith('L')?'L':'R',isArm=p.kind.startsWith('arm'),isLeg=p.kind.startsWith('leg');const key=(isArm?'elbow':'knee')+side;const j=doc.rig[key as keyof typeof doc.rig],a=bones.find(b=>b.id===(isArm?'upper':'thigh')+side),b=bones.find(b=>b.id===(isArm?'fore':'shin')+side);let bulge=0;if((isArm||isLeg)&&a&&b){const ma=pose.matrices[a.id],mb=pose.matrices[b.id];bulge=.13*Math.abs(Math.sin(wrap(Math.atan2(mb[1],mb[0])-Math.atan2(ma[1],ma[0])-angle(b.start,b.end)+angle(a.start,a.end))));}(u.uJoint0 as Float32Array).set((isArm||isLeg)?[j.x,j.y,Math.max(12,radius*.35),bulge]:[0,0,1,0]);v.uniforms.update();v.mesh.visible=p.visible;}
  this.app.render();
 }
 clear(){for(const v of this.views){v.mesh.geometry.destroy();v.mesh.shader?.destroy();v.mesh.destroy({children:true});v.texture.destroy(true);}this.views=[];if(this.bg){this.bg.texture.destroy(true);this.bg.destroy();this.bg=undefined;}}
 dispose(){this.clear();this.app.destroy();}
}
