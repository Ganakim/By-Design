# Deploying by-design.dev

The site runs on the Windows machine that runs Mechaclasm, as the `ByDesign` service on `127.0.0.1:8092`, from
`D:\By Design`. nginx there answers `by-design.dev` and sends `www` and plain http to it. Each push to `main` builds it
on GitHub's machines and swaps it in on the server (`.github/workflows/deploy.yml`).

| File                   | What it is                                                                |
| ---------------------- | ------------------------------------------------------------------------- |
| `nginx-bydesign.conf`  | the site's three `server` blocks, which `setup.ps1` puts into nginx.conf  |
| `setup.ps1`            | run once: folder, service, nginx, runner                                  |
| `deploy.ps1`           | run by each deploy: unpack, `npm install`, swap, start, check, roll back |

Nothing here touches Mechaclasm's services or folders. It does share nginx.conf, and a reload of it.

## Once, in this order

Commands marked **server** run in PowerShell as administrator on the server (`ssh -p 2222 -i ~/.ssh/mechaclasm_deploy
server@mechaclasm-game.by-design.dev` gets you there). Commands marked **mac** run here.

### 1. Node 26 on the server

The bundle is built against Meteor's Node (`meteor node -v`, 26.13.0), and its socket library has one binary per Node
major. ServiceDash and Classroom Audio use the same Node, so stop them for the install. Both have no compiled addons of
their own, so the upgrade doesn't break them.

**server**

```powershell
$msi = "$env:TEMP\node-v26.13.0-x64.msi"
Invoke-WebRequest https://nodejs.org/dist/v26.13.0/node-v26.13.0-x64.msi -OutFile $msi -UseBasicParsing
Stop-Service ServiceDash, ClassroomAudio
Start-Process msiexec.exe "/i `"$msi`" /qn /norestart" -Wait
Start-Service ServiceDash, ClassroomAudio
node -v
```

**Check:** `v26.13.0`; `Get-Service ServiceDash, ClassroomAudio` both Running; `https://classroom.by-design.dev` and
`https://dash.by-design.dev` still load.
**Undo:** the same with `node-v22.16.0-x64.msi`.

### 2. A runner token

**mac**

```sh
gh api -X POST repos/Ganakim/By-Design/actions/runners/registration-token --jq .token
```

It lasts an hour. (Or: the repo's Settings > Actions > Runners > New self-hosted runner, the `--token` in its config
line.)

### 3. Setup

**mac**

```sh
ssh -p 2222 -i ~/.ssh/mechaclasm_deploy server@mechaclasm-game.by-design.dev 'mkdir "D:\By Design\deploy"'
scp -P 2222 -i ~/.ssh/mechaclasm_deploy deploy/* "server@mechaclasm-game.by-design.dev:D:/By Design/deploy/"
```

**server**

```powershell
cd "D:\By Design\deploy"
powershell -ExecutionPolicy Bypass -File setup.ps1 -RunnerToken <token>
```

nginx runs as SYSTEM and only SYSTEM may signal it, so the script reloads it through a one-off scheduled task.

**Check:**

- `Get-Service ByDesign` shows Stopped (it starts with the first deploy).
- The script printed `nginx reloaded`.
- `https://mechaclasm.by-design.dev` and `https://mechaclasm-game.by-design.dev/version` still answer.
- `https://by-design.dev` gives a 502 (nginx has it; nothing's on 8092 yet), not the Classroom Audio page.
- The repo's Settings > Actions > Runners lists `SERVER-BYDESIGN` as Idle.

**Undo:**

```powershell
D:\nssm\win32\nssm.exe remove ByDesign confirm
Copy-Item D:\nginx\conf\nginx.conf.before-bydesign D:\nginx\conf\nginx.conf -Force; cd D:\nginx; .\nginx.exe -s reload
cd D:\actions-runner-bydesign; .\config.cmd remove --token <a removal token from the same Settings page>
Remove-Item "D:\By Design", D:\actions-runner-bydesign -Recurse -Force
```

### 4. Keep outsiders' pull requests off the runner

The repo is public, and a pull request can bring its own workflow. Require approval before any outside contributor's
runs:

**mac**

```sh
gh api -X PUT repos/Ganakim/By-Design/actions/permissions/fork-pr-contributor-approval -f approval_policy=all_external_contributors
```

(Or: Settings > Actions > General > Approval for running fork pull request workflows > all external contributors.)

### 5. First deploy

**mac**

```sh
git push -u origin main
```

**Check:** the repo's Actions > Deploy goes green and its last line says `Running <commit>`; `https://by-design.dev`
shows the site, with the theme switch working and no errors in the browser console (the socket connects through
nginx); `https://www.by-design.dev` and `http://by-design.dev` land on `https://by-design.dev`; Mechaclasm's two
addresses still answer.

## Cloudflare

DNS for all three names already points at Cloudflare's proxy. Plain http reaches the server on port 80, which is why
nginx redirects it; Cloudflare's "Always Use HTTPS" would do the same a step earlier. Its email-address obfuscation
rewrites addresses in the html it passes, but this site's html has no address in it (Blaze draws the page in the
browser), so it has nothing to do and can stay as it is.

## Afterwards

- Each push to `main` (other than markdown) deploys. A deploy that never answers puts the one before back and leaves
  itself in `D:\By Design\failed`.
- The site's log is `D:\By Design\logs\site.log`.
- To deploy by hand: `deploy.ps1 -From <a tarball from meteor build --server-only --architecture os.windows.x86_64>`.
