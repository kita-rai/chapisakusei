import { defineConfig } from 'vite';
export default defineConfig({base:'./',define:{global:'globalThis'},build:{target:'es2022',chunkSizeWarningLimit:1800},server:{host:'127.0.0.1',port:4173,strictPort:true,watch:{ignored:['**/tests/**','**/release/**','**/src-tauri/target/**']}},worker:{format:'es'}});
