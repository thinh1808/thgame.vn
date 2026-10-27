# Private TH Game admin: GitHub login

Status: implementation prepared; external service setup is required. GitHub Pages serves a locked holding page, never the editor. No browser-only password gate.

## Deployment architecture

Keep the public website on GitHub Pages. Use a Cloudflare Worker route on thgame.vn/admin* (and www variant). Move the DNS zone to Cloudflare and proxy the web DNS records to enable Worker routes; keep all existing email/DNS records. Registering the domain can stay with P.A Vietnam.

The Worker packages admin files separately. run_worker_first=true authenticates before serving any editor asset, including admin.js. workers.dev and preview URLs are disabled. Public repository source remains readable, but accessing the deployed admin or writing content requires a server session. GitHub Pages never includes editor files, so its origin cannot bypass this gate.

Only GitHub numeric user ID 22042427 (thinh1808) may sign in. OAuth requests no repository or email scopes. After GitHub sign-in, a separate confirmation screen creates a one-hour HttpOnly/Secure/SameSite session. All content API requests check the session. Writes and logout also check Origin and CSRF. Repository and branch are fixed on the server.

## One-time setup (owner performs secret/permission steps)

1. Connect thgame.vn to Cloudflare; preserve MX/TXT records and proxy the web records. Cloudflare must have an active zone before deploying routes. Check website and email DNS after switching nameservers.
2. GitHub > Settings > Developer settings > OAuth Apps > New OAuth App. Application name: TH Game Admin. Homepage URL: https://thgame.vn. Authorization callback URL: https://thgame.vn/admin/auth/callback. Create the app and generate its client secret. Never commit secrets or paste them in chat.
3. Make a fine-grained GitHub token restricted to thinh1808/thgame.vn, with Contents: Read and write only. This server-side token is separate from the scope-free identity OAuth app. Set an expiry and rotate it before expiration.
4. Run npx wrangler@4 login and complete Cloudflare authentication yourself.
5. Store secrets using each interactive command below. GITHUB_CLIENT_ID is the OAuth Client ID; GITHUB_CLIENT_SECRET is its secret; GITHUB_CONTENT_TOKEN is the fine-grained token. SESSION_SECRET must be a password-manager-generated random secret of at least 32 characters.

~~~powershell
npx wrangler@4 secret put GITHUB_CLIENT_ID --config auth/wrangler.jsonc
npx wrangler@4 secret put GITHUB_CLIENT_SECRET --config auth/wrangler.jsonc
npx wrangler@4 secret put GITHUB_CONTENT_TOKEN --config auth/wrangler.jsonc
npx wrangler@4 secret put SESSION_SECRET --config auth/wrangler.jsonc
npm.cmd run deploy:admin
~~~

6. Test https://thgame.vn/admin in a private browser window: GitHub login, thinh1808 confirmation, editor, content update, logout. Other GitHub users must receive 403. Check unauthenticated /admin/admin.js and /admin/api/content cannot be read. Direct GitHub Pages origin has only the locked holding page.
7. If Worker is removed or fails, admin remains locked on GitHub Pages. Rotate SESSION_SECRET to revoke all sessions. When the content token expires or is revoked, writes fail closed; replace it as a Worker secret.

OAuth identity token is used only to verify /user and is not sent to the browser or kept in the session. No user content tokens are stored in public source or browser storage. Existing source code in Git history remains public; it contains no credentials.

## References

- https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps
- https://developers.cloudflare.com/workers/static-assets/binding/
- https://developers.cloudflare.com/workers/configuration/routing/routes/

## Local checks

npm test
npm run build
npm run build:admin

The automated tests mock GitHub; a real OAuth round-trip and Worker route test must still be completed after account setup. The Worker is deployed separately from the GitHub Pages workflow; redeploy it after editing admin files.
