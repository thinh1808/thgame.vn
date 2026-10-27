import {mkdir,copyFile,cp,rm,writeFile} from 'node:fs/promises';
import {resolve,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const projectRoot=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const privateBuild=process.argv.includes('--private-admin');
const destination=privateBuild?'private-dist':'dist';
const resolvedDestination=resolve(destination);
if(!resolvedDestination.startsWith(projectRoot+sep)||!['dist','private-dist'].includes(destination))throw Error('Invalid output directory');
await rm(resolvedDestination,{recursive:true,force:true});
await mkdir(destination,{recursive:true});
if(privateBuild){await cp('admin',destination+'/admin',{recursive:true});}
else {
 for(const file of ['index.html','style.css','app.js','content.json','CNAME','.nojekyll']) await copyFile(file,destination+'/'+file);
 await cp('assets',destination+'/assets',{recursive:true});
 await mkdir(destination+'/admin',{recursive:true});
 await writeFile(destination+'/admin/index.html','<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>TH Game Admin</title><link rel="stylesheet" href="../style.css"><body class="admin-body"><main class="admin-shell"><section class="admin-panel"><h1>TH Game Admin</h1><p>&#272;ang thi&#7871;t l&#7853;p &#273;&#259;ng nh&#7853;p GitHub. Trang qu&#7843;n tr&#7883; t&#7841;m kh&#243;a.</p><a href="/">V&#7873; website</a></section></main></body></html>');
}
console.log('Website packaged into '+destination+'/');
