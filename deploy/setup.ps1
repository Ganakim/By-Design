# One-time setup of by-design.dev on the Windows machine it shares with Mechaclasm. Run in PowerShell as
# administrator, from this folder:
#   powershell -ExecutionPolicy Bypass -File setup.ps1 -RunnerToken <token>
# It makes D:\By Design (app\, which each deploy replaces, and logs\), registers the site as a Windows service through
# NSSM, running as LOCAL SERVICE and listening on 127.0.0.1:8092 only; adds the site's blocks to nginx
# (nginx-bydesign.conf) and reloads it, keeping the old config as nginx.conf.before-bydesign; and registers a GitHub
# Actions runner for this repo in D:\actions-runner-bydesign, as NETWORK SERVICE, which may write D:\By Design and
# start and stop the site's service, nothing else. Touches nothing of Mechaclasm's. Safe to run again: it keeps
# what's there.
param([string] $Root = "D:\By Design", [string] $RunnerToken, [string] $Runner = "D:\actions-runner-bydesign")
$ErrorActionPreference = "Stop"
$name = "ByDesign"
$nssm = "D:\nssm\win32\nssm.exe"
$nginx = "D:\nginx"
$node = "C:\Program Files\nodejs\node.exe"

# the bundle is built against meteor's node (meteor node -v), and its socket library ships one binary per major
$version = & $node -v
if ($version -notlike "v26.*") { throw "The site needs Node 26; this machine has $version." }

New-Item -ItemType Directory -Force -Path $Root, "$Root\app", "$Root\logs" | Out-Null
# the site reads its files and writes its log; the runner swaps builds in (sids, so it reads the same in any language)
icacls $Root /grant "*S-1-5-19:(OI)(CI)RX" "*S-1-5-20:(OI)(CI)M" | Out-Null
icacls "$Root\logs" /grant "*S-1-5-19:(OI)(CI)M" | Out-Null

# the site itself, started by the first deploy (its files aren't here until then)
if (-not (Get-Service $name -ErrorAction SilentlyContinue)) {
  & $nssm install $name $node main.js | Out-Null
  & $nssm set $name AppDirectory "$Root\app\bundle" | Out-Null
  & $nssm set $name AppEnvironmentExtra "ROOT_URL=https://by-design.dev" "PORT=8092" "BIND_IP=127.0.0.1" | Out-Null
  & $nssm set $name DisplayName "By-Design Labs site" | Out-Null
  & $nssm set $name Description "by-design.dev, on 127.0.0.1:8092 (D:\By Design)" | Out-Null
  & $nssm set $name ObjectName "NT AUTHORITY\LocalService" "" | Out-Null
  & $nssm set $name Start SERVICE_AUTO_START | Out-Null
  & $nssm set $name AppStdout "$Root\logs\site.log" | Out-Null
  & $nssm set $name AppStderr "$Root\logs\site.log" | Out-Null
  & $nssm set $name AppRotateFiles 1 | Out-Null
  & $nssm set $name AppRotateBytes 5000000 | Out-Null
  & $nssm set $name AppExit Default Restart | Out-Null
  & $nssm set $name AppRestartDelay 5000 | Out-Null
}

# lets NETWORK SERVICE (the runner) query, start and stop this one service
$ace = "(A;;RPWPLCLORC;;;NS)"
$sddl = (sc.exe sdshow $name | Out-String).Trim()
if ($sddl -notlike "*$ace*") {
  $sddl = if ($sddl -like "*S:*") { $sddl -replace "S:", "${ace}S:" } else { $sddl + $ace }
  sc.exe sdset $name $sddl | Out-Null
  if ($LASTEXITCODE) { throw "Couldn't let the runner start and stop $name (sc sdset $LASTEXITCODE)." }
}

# nginx: the site's blocks go in just ahead of nginx's own default site (listen 80, server_name localhost)
$conf = "$nginx\conf\nginx.conf"
if (-not (Select-String -Path $conf -Pattern "server_name by-design.dev;" -Quiet)) {
  $lines = [Collections.Generic.List[string]] (Get-Content $conf)
  $at = $lines.FindIndex([Predicate[string]] { param($l) $l -match '^\s*server_name\s+localhost;' })
  while ($at -gt 0 -and $lines[$at] -notmatch '^\s*server\s*\{') { $at-- }
  if ($at -le 0) { throw "Couldn't find nginx's default site in $conf to put by-design.dev ahead of." }
  Copy-Item $conf "$conf.before-bydesign" -Force
  $lines.InsertRange($at, [string[]] ((Get-Content "$PSScriptRoot\nginx-bydesign.conf") + ""))
  # no byte-order mark: nginx reads one as part of the first directive
  [IO.File]::WriteAllLines($conf, $lines)
  Push-Location $nginx
  cmd /c "nginx.exe -t 2>&1"
  $ok = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $ok) {
    Copy-Item "$conf.before-bydesign" $conf -Force
    throw "nginx didn't accept the new blocks, so the old config is back and nothing was reloaded."
  }
  # nginx runs as SYSTEM (NSSM) and only SYSTEM may signal it, so the reload goes through a one-off task as SYSTEM
  schtasks /create /tn bydesign-nginx-reload /ru SYSTEM /sc once /st 00:00 /f /tr "cmd /c cd /d $nginx && nginx.exe -s reload" 2>$null | Out-Null
  schtasks /run /tn bydesign-nginx-reload | Out-Null
  Start-Sleep -Seconds 3
  schtasks /delete /tn bydesign-nginx-reload /f | Out-Null
  Write-Host "nginx reloaded with by-design.dev's blocks (the old config is $conf.before-bydesign)."
}

# the runner, for this repo only (the machine's other one belongs to Mechaclasm's)
if ($RunnerToken -and -not (Test-Path "$Runner\.runner")) {
  New-Item -ItemType Directory -Force $Runner | Out-Null
  $release = Invoke-RestMethod https://api.github.com/repos/actions/runner/releases/latest
  $zip = $release.assets | Where-Object name -like "actions-runner-win-x64-*.zip" | Select-Object -First 1
  Invoke-WebRequest $zip.browser_download_url -OutFile "$Runner\runner.zip" -UseBasicParsing
  Expand-Archive "$Runner\runner.zip" $Runner -Force
  Remove-Item "$Runner\runner.zip"
  Push-Location $Runner
  .\config.cmd --unattended --url https://github.com/Ganakim/By-Design --token $RunnerToken --name SERVER-BYDESIGN `
    --work _work --runasservice --windowslogonaccount "NT AUTHORITY\NETWORK SERVICE"
  $ok = $LASTEXITCODE -eq 0
  Pop-Location
  if (-not $ok) { throw "The runner didn't register (config.cmd $LASTEXITCODE); the token lasts an hour." }
}

Write-Host "Set up. The site starts with the first deploy (push to main, or Actions > Deploy > Run workflow)."
