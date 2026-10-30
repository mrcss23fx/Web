# Instala el programa puente de Tickora en MetaTrader 5 para Windows.
# Uso: pega esta línea en PowerShell:
#   irm https://mrcss23fx.github.io/Web/mt5/instalar-windows.ps1 | iex
$url = "https://mrcss23fx.github.io/Web/mt5"
$dirs = @()
if (Test-Path "$env:APPDATA\MetaQuotes\Terminal") {
  $dirs = Get-ChildItem "$env:APPDATA\MetaQuotes\Terminal" -Directory | ForEach-Object { Join-Path $_.FullName "MQL5\Experts" } | Where-Object { Test-Path $_ }
}
if (-not $dirs) { Write-Host "No encuentro MetaTrader 5. Abrelo una vez, cierralo y vuelve a pegar la linea." -ForegroundColor Red; return }
foreach ($d in $dirs) {
  Remove-Item (Join-Path $d "BitacoraPuente.mq5"),(Join-Path $d "BitacoraPuente.ex5") -ErrorAction SilentlyContinue
  Invoke-WebRequest "$url/Tickora.mq5" -OutFile (Join-Path $d "Tickora.mq5") -UseBasicParsing
  try { Invoke-WebRequest "$url/Tickora.ex5" -OutFile (Join-Path $d "Tickora.ex5") -UseBasicParsing -ErrorAction Stop } catch {}
  Write-Host "Programa puente instalado en: $d" -ForegroundColor Green
}
try { Set-Clipboard "https://xsvezicjksfrklwjskfv.supabase.co" } catch {}
Write-Host "He copiado la direccion que hay que permitir en MetaTrader 5 (Herramientas > Opciones > Asesores expertos)." -ForegroundColor Green
Write-Host "Siguiente paso: vuelve a la app."
