import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {escapeHTML,safeURL} from '../app.js';
test('blocks unsafe content and URL protocols',()=>{assert.equal(escapeHTML('<script>"&'), '&lt;script&gt;&quot;&amp;');for(const url of ['javascript:alert(1)','data:text/html,test','//evil.test','file:///etc/passwd'])assert.equal(safeURL(url),'');assert.equal(safeURL('/#/page/privacy-policy'),'./#/page/privacy-policy');assert.equal(safeURL('https://example.com/game'),'https://example.com/game');});
test('initial content has unique routes and valid menu parents',async()=>{const d=JSON.parse(await readFile('content.json','utf8'));for(const group of ['games','pages','menus']){assert.equal(new Set(d[group].map(x=>x.id)).size,d[group].length);for(const x of d[group])assert.match(x.id,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);}for(const m of d.menus)if(m.parent)assert.ok(d.menus.some(p=>p.id===m.parent&&!p.parent));assert.equal(d.pages.find(p=>p.id==='privacy-policy').published,false);});
