const encoder = new TextEncoder();
const SESSION = '__Host-thgame_session';
const FLOW = '__Host-thgame_flow';
const PENDING = '__Host-thgame_pending';
const MAX_AGE = 3600;
const CONTENT_URL = 'https://api.github.com/repos/thinh1808/thgame.vn/contents/content.json';
const secureHeaders = {'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Frame-Options':'DENY'};
function base64(bytes) { return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,''); }
function unbase64(text) { return Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')), c=>c.charCodeAt(0)); }
function random() { return base64(crypto.getRandomValues(new Uint8Array(32))); }
async function key(env) { return crypto.subtle.importKey('raw',encoder.encode(env.SESSION_SECRET),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']); }
export async function seal(value, env) { const payload = base64(encoder.encode(JSON.stringify(value))); const signature = await crypto.subtle.sign('HMAC',await key(env),encoder.encode(payload)); return payload+'.'+base64(new Uint8Array(signature)); }
export async function open(value, env, kind) { try { const parts=(value||'').split('.'); if(parts.length!==2)return null; if(!await crypto.subtle.verify('HMAC',await key(env),unbase64(parts[1]),encoder.encode(parts[0])))return null; const data=JSON.parse(new TextDecoder().decode(unbase64(parts[0]))); return data.kind===kind && Number.isFinite(data.exp) && data.exp>Date.now() ? data : null; } catch {return null;} }
function cookie(name,value,age=MAX_AGE) { return name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age; }
function cookies(request) { return Object.fromEntries((request.headers.get('Cookie')||'').split(';').map(s=>s.trim().split('='))); }
function response(body,status=200,extra={}) { return new Response(body,{status,headers:{...secureHeaders,...extra}}); }
function redirect(path, setCookies=[]) { const headers=new Headers({...secureHeaders,Location:path}); for(const c of setCookies)headers.append('Set-Cookie',c); return new Response(null,{status:303,headers}); }
function html(body,status=200) { return response('<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>TH Game Admin</title><link rel="stylesheet" href="/style.css"><body class="admin-body"><main class="admin-shell"><section class="admin-panel"><h1>TH Game Admin</h1>'+body+'</section></main></body></html>',status,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}); }
function allowed(data,env) { return data && String(data.id)===String(env.ALLOWED_GITHUB_ID); }
function sameOrigin(request,env) { return request.headers.get('Origin')===env.PUBLIC_ORIGIN; }
async function github(url, token, init={}, fetcher=fetch) { return fetcher(url,{...init,headers:{Accept:'application/vnd.github+json','User-Agent':'TH-Game-Admin','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+token,...init.headers}}); }
export async function handle(request, env, fetcher=fetch) {
 const url=new URL(request.url), path=url.pathname;
 if(!env.PUBLIC_ORIGIN || new URL(env.PUBLIC_ORIGIN).protocol!=='https:')return response('Invalid server configuration',503);
 if(url.origin!==env.PUBLIC_ORIGIN)return response('Not found',404);
 if(path!=='/admin'&&!path.startsWith('/admin/'))return response('Not found',404);
 if(!env.GITHUB_CLIENT_ID||!env.GITHUB_CLIENT_SECRET||!env.SESSION_SECRET||env.SESSION_SECRET.length<32||!env.ALLOWED_GITHUB_ID||!env.GITHUB_CONTENT_TOKEN)return html('<p>GitHub login is not configured yet. Please contact the website owner.</p>',503);
 const jar=cookies(request);
 if(path==='/admin/auth/login' && request.method==='GET') {
  const state=random(), verifier=random();
  const flow=await seal({kind:'flow',state,verifier,exp:Date.now()+600000},env);
  const auth=new URL('https://github.com/login/oauth/authorize');
  for(const [k,v]of Object.entries({client_id:env.GITHUB_CLIENT_ID,redirect_uri:env.PUBLIC_ORIGIN+'/admin/auth/callback',state,scope:'',login:'thinh1808',allow_signup:'false',code_challenge:base64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(verifier)))),code_challenge_method:'S256'}))auth.searchParams.set(k,v);
  return redirect(auth.href,[cookie(FLOW,flow,600),cookie(PENDING,'',0),cookie(SESSION,'',0)]);
 }
 if(path==='/admin/auth/callback' && request.method==='GET') {
  const flow=await open(jar[FLOW],env,'flow');
  if(!flow||flow.state!==url.searchParams.get('state')||!url.searchParams.get('code'))return html('<p>Login expired or invalid. <a href="/admin/auth/login">Try again</a>.</p>',400);
  const tokenRes=await fetcher('https://github.com/login/oauth/access_token',{method:'POST',headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:env.GITHUB_CLIENT_ID,client_secret:env.GITHUB_CLIENT_SECRET,code:url.searchParams.get('code'),redirect_uri:env.PUBLIC_ORIGIN+'/admin/auth/callback',code_verifier:flow.verifier})});
  const token=await tokenRes.json();
  if(!tokenRes.ok||!token.access_token)return html('<p>GitHub login failed. Please try again.</p>',401);
  const userRes=await github('https://api.github.com/user',token.access_token,{},fetcher), user=await userRes.json();
  if(!userRes.ok||!allowed(user,env))return html('<p>This GitHub account cannot access TH Game Admin.</p><a href="/admin/auth/login">Use another account</a>',403);
  const pending=await seal({kind:'pending',id:user.id,csrf:random(),exp:Date.now()+300000},env);
  return redirect('/admin/auth/confirm',[cookie(FLOW,'',0),cookie(PENDING,pending,300)]);
 }
 if(path==='/admin/auth/confirm') {
  const pending=await open(jar[PENDING],env,'pending');
  if(!allowed(pending,env))return redirect('/admin/auth/login');
  if(request.method==='GET')return html('<p>GitHub: <strong>thinh1808</strong></p><p>X&#225;c nh&#7853;n v&#224;o qu&#7843;n tr&#7883; TH Game tr&#234;n thi&#7871;t b&#7883; n&#224;y?</p><form method="post"><input type="hidden" name="csrf" value="'+pending.csrf+'"><button class="button" type="submit">X&#225;c nh&#7853;n &amp; v&#224;o admin</button></form>');
  if(request.method!=='POST'||!sameOrigin(request,env))return response('Forbidden',403);
  const form=await request.formData(); if(form.get('csrf')!==pending.csrf)return response('Forbidden',403);
  const session=await seal({kind:'session',id:pending.id,csrf:random(),exp:Date.now()+MAX_AGE*1000},env);
  return redirect('/admin/',[cookie(PENDING,'',0),cookie(SESSION,session)]);
 }
 const session=await open(jar[SESSION],env,'session');
 if(!allowed(session,env))return path.startsWith('/admin/api/')?response('Unauthorized',401):redirect('/admin/auth/login');
 if(path==='/admin/api/session' && request.method==='GET')return response(JSON.stringify({login:'thinh1808',csrf:session.csrf}),200,{'Content-Type':'application/json'});
 if(path==='/admin/auth/logout') {
  if(request.method!=='POST'||!sameOrigin(request,env)||request.headers.get('X-CSRF-Token')!==session.csrf)return response('Forbidden',403);
  return redirect('/admin/auth/login',[cookie(SESSION,'',0),cookie(PENDING,'',0),cookie(FLOW,'',0)]);
 }
 if(path==='/admin/api/content') {
  if(!['GET','PUT'].includes(request.method))return response('Method not allowed',405);
  const init={method:request.method};
  if(request.method==='PUT') {
   if(!sameOrigin(request,env)||request.headers.get('X-CSRF-Token')!==session.csrf)return response('Forbidden',403);
   if(Number(request.headers.get('Content-Length')||0)>1500000)return response('Too large',413);
   const raw=await request.text();if(raw.length>1500000)return response('Too large',413);
   let body;try{body=JSON.parse(raw);}catch{return response('Invalid JSON',400);}
   if(typeof body.content!=='string'||typeof body.sha!=='string')return response('Invalid content update',400);
   try{const content=JSON.parse(new TextDecoder().decode(unbase64(body.content)));if(!content.settings||!['games','pages','menus'].every(k=>Array.isArray(content[k])))throw Error();}catch{return response('Invalid website content',400);}
   init.headers={'Content-Type':'application/json'};init.body=JSON.stringify({message:'content: update TH Game from authenticated admin',branch:'main',sha:body.sha,content:body.content});
  }
  const upstream=await github(CONTENT_URL+(request.method==='GET'?'?ref=main':''),env.GITHUB_CONTENT_TOKEN,init,fetcher);
  return response(await upstream.text(),upstream.status,{'Content-Type':'application/json'});
 }
 if(path.startsWith('/admin/api/')||path.startsWith('/admin/auth/'))return response('Not found',404);
 if(request.method!=='GET'&&request.method!=='HEAD')return response('Method not allowed',405);
 if(path==='/admin')return redirect('/admin/');
 const asset=await env.ASSETS.fetch(request); const headers=new Headers(asset.headers);for(const [k,v]of Object.entries(secureHeaders))headers.set(k,v);return new Response(asset.body,{status:asset.status,headers});
}
export default {async fetch(request,env){try{return await handle(request,env);}catch{return response('Authentication service unavailable. Please retry.',502);}}};
