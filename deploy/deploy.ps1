# Puts a new build of the site in place, from the tarball the workflow's build job made (meteor build, for Windows).
# Unpacks it beside the live one and installs its npm packages there, then stops the site, swaps the folders and starts
# it again. If it doesn't answer within two minutes, the build before goes back. Run by the runner (NETWORK SERVICE),
# or by hand as administrator.
param([Parameter(Mandatory)] [string] $From, [string] $Commit = "by hand", [string] $Root = "D:\By Design")
$ErrorActionPreference = "Stop"
$name = "ByDesign"
$app = "$Root\app"
$next = "$Root\next"
$old = "$Root\old"
$failed = "$Root\failed"

Remove-Item $next, $old -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory $next | Out-Null
# .bin holds command shims, symlinks from the linux build that windows won't make; nothing runs them here
tar -xzf $From -C $next --exclude "*/node_modules/.bin/*"
if ($LASTEXITCODE) { throw "Couldn't unpack $From (tar $LASTEXITCODE)." }
Set-Content "$next\commit.txt" $Commit

# what meteor's own readme in the bundle asks for; done here so it's built for this machine's node
Push-Location "$next\bundle\programs\server"
cmd /c "npm install --omit=dev --no-audit --no-fund 2>&1"
$ok = $LASTEXITCODE -eq 0
Pop-Location
if (-not $ok) { throw "npm install failed in the new build; the site wasn't touched." }

Stop-Service $name -ErrorAction SilentlyContinue
# its files freed once it's stopped; a moment for that
Start-Sleep -Seconds 2
if (Test-Path $app) { Rename-Item $app old }
Rename-Item $next app
Start-Service $name

for ($i = 0; $i -lt 24; $i++) {
  try {
    if ((Invoke-WebRequest http://127.0.0.1:8092/ -UseBasicParsing -TimeoutSec 5).StatusCode -eq 200) {
      Remove-Item $old -Recurse -Force -ErrorAction SilentlyContinue
      Write-Host "Running $Commit."
      exit 0
    }
  } catch { }
  Start-Sleep -Seconds 5
}

# never answered: the one before goes back, this one's kept to look at
Stop-Service $name -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Remove-Item $failed -Recurse -Force -ErrorAction SilentlyContinue
Rename-Item $app failed
if (Test-Path $old) { Rename-Item $old app; Start-Service $name }
throw "The new build didn't answer on 127.0.0.1:8092; the one before is back. It's in $failed, its log in $Root\logs."
