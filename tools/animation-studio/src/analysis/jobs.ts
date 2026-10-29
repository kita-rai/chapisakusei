export type Progress=(fraction:number,message:string)=>void;
export class WorkerJob{
 private worker?:Worker;private reject?: (e:Error)=>void;
 cancel(){this.worker?.terminate();this.worker=undefined;this.reject?.(new DOMException('処理を中止しました','AbortError'));this.reject=undefined;}
 async run<T>(factory:()=>Worker,data:unknown,transfer:Transferable[],progress:Progress):Promise<T>{this.cancel();return new Promise((resolve,reject)=>{this.reject=reject;const worker=this.worker=factory();worker.onmessage=e=>{if(e.data.progress!==undefined){progress(e.data.progress,e.data.message);return;}this.reject=undefined;worker.terminate();this.worker=undefined;e.data.error?reject(Error(e.data.error)):resolve(e.data.result);};worker.onerror=e=>{this.reject=undefined;worker.terminate();reject(Error(e.message||'処理を実行できませんでした'));};worker.postMessage(data,transfer);});}
}
