import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=path.resolve(import.meta.dirname,'..'),models=path.join(root,'dist/models');
const manifest=JSON.parse(await fs.readFile(path.join(root,'MODEL_MANIFEST.json'),'utf8'));
const chunks={};
for(const [name,info] of Object.entries(manifest)){
 const bytes=await fs.readFile(path.join(models,name));
 if(bytes.length!==info.bytes||createHash('sha256').update(bytes).digest('hex')!==info.sha256)throw Error('Model verification failed: '+name);
 if(!name.endsWith('.onnx'))continue;
 const files=[];const size=40*1024*1024;
 for(let start=0;start<bytes.length;start+=size){const file=info.sha256.slice(0,16)+'-'+files.length+'.bin';await fs.writeFile(path.join(models,file),bytes.subarray(start,start+size));files.push(file);}
 chunks[name]={files,bytes:bytes.length};await fs.unlink(path.join(models,name));
}
await fs.writeFile(path.join(models,'chunks.json'),JSON.stringify(chunks));
await fs.cp(path.join(root,'licenses'),path.join(root,'dist/licenses'),{recursive:true});
console.log('Static page ready; weights verified and split into files below 40 MiB.');
