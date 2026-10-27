import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','content.json','CNAME','.nojekyll']) await copyFile(file,`dist/${file}`);
await cp('admin','dist/admin',{recursive:true});
await cp('assets','dist/assets',{recursive:true});
console.log('Website packaged into dist/');
