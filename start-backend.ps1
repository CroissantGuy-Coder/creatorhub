Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
Set-Location "$PSScriptRoot\backend"
node src/index.js
