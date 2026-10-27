import test from 'node:test';
import assert from 'node:assert/strict';
import {handle,seal,open} from '../auth/worker.mjs';
import {execFileSync} from 'node:child_process';
import {readFile,readdir} from 'node:fs/promises';
const env={PUBLIC_ORIGIN:'https://thgame.vn',GITHUB_CLIENT_ID:'test-client',GITHUB_CLIENT_SECRET:'test-secret',GITHUB_CONTENT_TOKEN:'test-write-token',SESSION_SECRET:'test-session-secret-at-least-32-characters',ALLOWED_GITHUB_ID:'22042427',ASSETS:{fetch:async()=>new Response('PRIVATE EDITOR')}};
const req=(path,init={})=>new Request('https://thgame.vn'+path,init);
const noFetch=()=>{throw Error('Unexpected upstream request');};
const session=async(extra={})=>await seal({kind:'session',id:22042427,csrf:'test-csrf',exp:Date.now()+60000,...extra},env);
const headers=async(extra={})=>({Cookie:'__Host-thgame_session='+await session(),...extra});
test('anonymous users cannot read editor assets or content API',async()=>{
 for(const path of ['/admin','/admin/','/admin/admin.js','/admin/index.html']){const r=await handle(req(path),env,noFetch);assert.equal(r.status,303);assert.equal(r.headers.get('Location'),'/admin/auth/login');assert.equal(r.headers.get('Cache-Control'),'no-store, private');}
 assert.equal((await handle(req('/admin/api/content'),env,noFetch)).status,401);
 assert.equal((await handle(req('/admin/'),{...env,GITHUB_CLIENT_SECRET:''},noFetch)).status,503);
 assert.equal((await handle(new Request('https://other.example/admin/'),env,noFetch)).status,404);
});
test('sessions reject tampering, expiry, wrong identity and wrong purpose',async()=>{
 for(const value of [await session({id:99}),await session({exp:Date.now()-1}),await seal({kind:'pending',id:22042427,exp:Date.now()+60000},env),(await session())+'x']){
 assert.equal((await handle(req('/admin/api/content',{headers:{Cookie:'__Host-thgame_session='+value}}),env,noFetch)).status,401);}
});
test('OAuth uses state, PKCE and no repository scopes; mismatched state fails',async()=>{
 const r=await handle(req('/admin/auth/login'),env,noFetch);const url=new URL(r.headers.get('Location'));
 assert.equal(url.origin,'https://github.com');assert.equal(url.searchParams.get('scope'),'');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.ok(url.searchParams.get('state').length>=43);
 assert.match(r.headers.get('Set-Cookie'),/HttpOnly/);assert.match(r.headers.get('Set-Cookie'),/Secure/);
 const flowCookie=r.headers.getSetCookie().find(c=>c.startsWith('__Host-thgame_flow=')).split(';')[0];
 assert.equal((await handle(req('/admin/auth/callback?code=fake&state=wrong',{headers:{Cookie:flowCookie}}),env,noFetch)).status,400);
});
test('wrong GitHub account is denied even after valid OAuth',async()=>{
 const flow=await seal({kind:'flow',state:'state',verifier:'verifier',exp:Date.now()+60000},env);
 const fetcher=async url=>Response.json(url.includes('access_token')?{access_token:'test-oauth-token'}:{id:42,login:'other'});
 const r=await handle(req('/admin/auth/callback?code=test&state=state',{headers:{Cookie:'__Host-thgame_flow='+flow}}),env,fetcher);assert.equal(r.status,403);assert.equal(r.headers.get('Set-Cookie'),null);
});
test('owner signs in, explicitly confirms, then gets private editor',async()=>{
 const flow=await seal({kind:'flow',state:'state',verifier:'verifier',exp:Date.now()+60000},env);
 const fetcher=async(url,init)=>{if(url.includes('access_token')){assert.equal(JSON.parse(init.body).code_verifier,'verifier');return Response.json({access_token:'test-oauth-token'});}return Response.json({id:22042427,login:'thinh1808'});};
 const callback=await handle(req('/admin/auth/callback?code=test&state=state',{headers:{Cookie:'__Host-thgame_flow='+flow}}),env,fetcher);
 assert.equal(callback.headers.get('Location'),'/admin/auth/confirm');assert.ok(!callback.headers.get('Set-Cookie').includes('test-oauth-token'));
 const pendingCookie=callback.headers.getSetCookie().find(c=>c.startsWith('__Host-thgame_pending=')).split(';')[0];
 const pending=await open(pendingCookie.split('=')[1],env,'pending');
 assert.equal((await handle(req('/admin/',{headers:{Cookie:pendingCookie}}),env,noFetch)).status,303);
 assert.equal((await handle(req('/admin/auth/confirm',{method:'POST',headers:{Cookie:pendingCookie,Origin:env.PUBLIC_ORIGIN},body:new URLSearchParams({csrf:'wrong'})}),env,noFetch)).status,403);
 const confirmed=await handle(req('/admin/auth/confirm',{method:'POST',headers:{Cookie:pendingCookie,Origin:env.PUBLIC_ORIGIN},body:new URLSearchParams({csrf:pending.csrf})}),env,noFetch);
 const sessionCookie=confirmed.headers.getSetCookie().find(c=>c.startsWith('__Host-thgame_session=')).split(';')[0];
 assert.equal(confirmed.headers.get('Location'),'/admin/');
 const editor=await handle(req('/admin/admin.js',{headers:{Cookie:sessionCookie}}),env,noFetch);assert.equal(await editor.text(),'PRIVATE EDITOR');assert.equal(editor.headers.get('Cache-Control'),'no-store, private');
});
test('content writes require Origin and CSRF; repo/branch are fixed server-side',async()=>{
 const body={content:btoa(JSON.stringify({settings:{},games:[],pages:[],menus:[]})),sha:'test-sha',branch:'evil',message:'untrusted'};
 for(const extra of [{Origin:env.PUBLIC_ORIGIN},{Origin:'https://evil.example','X-CSRF-Token':'test-csrf'}]){const r=await handle(req('/admin/api/content',{method:'PUT',headers:await headers(extra),body:JSON.stringify(body)}),env,noFetch);assert.equal(r.status,403);}
 let called=false;
 const r=await handle(req('/admin/api/content',{method:'PUT',headers:await headers({Origin:env.PUBLIC_ORIGIN,'X-CSRF-Token':'test-csrf'}),body:JSON.stringify(body)}),env,async(url,init)=>{called=true;assert.equal(url,'https://api.github.com/repos/thinh1808/thgame.vn/contents/content.json');assert.equal(init.headers.Authorization,'Bearer test-write-token');const sent=JSON.parse(init.body);assert.equal(sent.branch,'main');assert.notEqual(sent.message,'untrusted');return Response.json({content:{sha:'next'}});});assert.equal(r.status,200);assert.ok(called);
 assert.equal((await handle(req('/admin/auth/logout',{method:'POST',headers:await headers({Origin:'https://evil.example'})}),env,noFetch)).status,403);
 const logout=await handle(req('/admin/auth/logout',{method:'POST',headers:await headers({Origin:env.PUBLIC_ORIGIN,'X-CSRF-Token':'test-csrf'})}),env,noFetch);assert.equal(logout.status,303);assert.match(logout.headers.get('Set-Cookie'),/Max-Age=0/);
});
test('public build never packages the editor and cleans stale files',async()=>{
 execFileSync(process.execPath,['scripts/package.mjs']);
 assert.deepEqual(await readdir('dist/admin'),['index.html']);
 assert.ok(!(await readFile('dist/admin/index.html','utf8')).includes('admin.js'));
 execFileSync(process.execPath,['scripts/package.mjs','--private-admin']);
 assert.ok((await readFile('private-dist/admin/admin.js','utf8')).includes('/admin/api/content'));
 assert.ok(!(await readFile('private-dist/admin/admin.js','utf8')).includes('api.github.com'));
});
