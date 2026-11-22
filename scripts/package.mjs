import {mkdir,copyFile,cp} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','content.json','CNAME','.nojekyll']) await copyFile(file,`dist/${file}`);
await cp('admin','dist/admin',{recursive:true});
await cp('assets','dist/assets',{recursive:true});
console.log('Website packaged into dist/');

import fs from 'node:fs';
import path from 'node:path';

const sourceAppAds = path.resolve('app-ads.txt');
const targetDistDir = path.resolve('dist');
const targetAppAds = path.join(targetDistDir, 'app-ads.txt');

if (fs.existsSync(sourceAppAds)) {
  fs.mkdirSync(targetDistDir, { recursive: true });
  fs.copyFileSync(sourceAppAds, targetAppAds);
  console.log('Copied app-ads.txt to dist/app-ads.txt');
} else {
  console.warn('Warning: app-ads.txt not found at repository root.');
}
