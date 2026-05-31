$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
Start-Process -NoNewWindow -FilePath "C:\PROGRA~1\nodejs\npm.cmd" -ArgumentList "start"
Start-Sleep -Seconds 5
C:\PROGRA~1\nodejs\npx.cmd localtunnel --port 5173
