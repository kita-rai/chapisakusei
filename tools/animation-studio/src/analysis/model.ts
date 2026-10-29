// Large weights are split for static hosting. Images never leave this worker.
export async function loadModel(base: string, name: string): Promise<Uint8Array> {
 const response=await fetch(base+'models/chunks.json');
 if(!response.ok)throw Error('モデル一覧を読み込めません。接続を確認して再試行してください');
 const manifest=await response.json() as Record<string,{files:string[];bytes:number}>;
 const entry=manifest[name];if(!entry)throw Error('モデルが見つかりません: '+name);
 const result=new Uint8Array(entry.bytes);let offset=0;
 let cache:Cache|undefined;try{cache=await caches.open('illust-motion-models-v1');}catch{}
 for(const file of entry.files){const url=base+'models/'+file;let cached:Response|undefined;
  try{cached=await cache?.match(url);}catch{}
  const part=cached||await fetch(url);if(!part.ok)throw Error('モデルの取得に失敗しました。接続を確認して再試行してください');
  if(!cached&&cache)try{await cache.put(url,part.clone());}catch{}
  const bytes=new Uint8Array(await part.arrayBuffer());if(offset+bytes.length>result.length)throw Error('モデルのサイズが不正です');result.set(bytes,offset);offset+=bytes.length;
  self.postMessage({progress:.05+.12*offset/entry.bytes,message:`AIモデルを準備中 ${Math.round(offset/1024/1024)} / ${Math.round(entry.bytes/1024/1024)} MB（初回はダウンロード）`});
 }
 if(offset!==result.length)throw Error('モデルが不完全です。再試行してください');return result;
}
