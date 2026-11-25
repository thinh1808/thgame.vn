import {mkdir,copyFile,cp,readFile,writeFile} from 'node:fs/promises';
import {escapeHTML as e,safeURL,screenshotGallery} from '../app.js';

const data=JSON.parse(await readFile('content.json','utf8'));
const paragraphs=text=>String(text||'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${e(p).replace(/\n/g,'<br>')}</p>`).join('');
const gamePage=g=>{
  const links=[['Google Play',g.android],['App Store',g.ios],['Tải game / Chơi ngay',g.download]].filter(([,url])=>safeURL(url));
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${e(g.description)}"><title>${e(g.title)} · ${e(data.settings.name)}</title><link rel="icon" type="image/svg+xml" href="../assets/favicon.svg"><link rel="stylesheet" href="../style.css"></head>
<body><main><section class="detail wrap"><a class="back" href="../">← Về TH Game</a><div class="detail-grid"><div class="detail-art tone-0">${safeURL(g.image)?`<img class="detail-image" src="${e(safeURL(g.image))}" alt="Biểu tượng ${e(g.title)}" width="300" height="300">`:'<span class="cover-placeholder" aria-hidden="true">✧</span>'}<span class="detail-caption">${e(g.platform||'GAME')} · ${e(data.settings.name.toUpperCase())}</span></div><article><span class="eyebrow">${e(g.category||'GAME')}</span><h1>${e(g.title)}</h1><div class="prose">${paragraphs(g.description)}</div><div class="download-links">${links.map(([label,url])=>`<a class="button" target="_blank" rel="noopener noreferrer" href="${e(safeURL(url))}">Tải trên ${label} ↗</a>`).join('')}</div>${safeURL(g.privacy)?`<a class="text-link" href="private.html">Chính sách quyền riêng tư ↗</a>`:''}</article></div>${screenshotGallery(g)}</section></main><footer><div class="footer-bottom wrap"><span>© ${new Date().getFullYear()} ${e(data.settings.name)}</span><a href="../">thgame.vn</a></div></footer><script type="module">import {initScreenshotGalleries} from '../gallery.js'; initScreenshotGalleries();</script></body></html>`;
};

await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','gallery.css','app.js','gallery.js','content.json','CNAME','.nojekyll']) await copyFile(file,`dist/${file}`);
await cp('admin','dist/admin',{recursive:true});
await cp('assets','dist/assets',{recursive:true});
for(const game of data.games.filter(g=>g.published)){
  const directory=`dist/${game.id}`;
  await mkdir(directory,{recursive:true});
  await writeFile(`${directory}/index.html`,gamePage(game));
  if(safeURL(game.privacy)){
    const policyPage=`<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=${e(safeURL(game.privacy))}"><title>Privacy Policy · ${e(game.title)}</title></head><body><p>Đang chuyển đến <a href="${e(safeURL(game.privacy))}">chính sách quyền riêng tư của ${e(game.title)}</a>…</p></body></html>`;
    await writeFile(`${directory}/private.html`,policyPage);
    await mkdir(`${directory}/private`,{recursive:true});
    await writeFile(`${directory}/private/index.html`,policyPage);
  }
}
await cp('game-pages','dist',{recursive:true});
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
