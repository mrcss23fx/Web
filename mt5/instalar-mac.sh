#!/bin/bash
# Instala el programa puente de la Bitácora en MetaTrader 5 para Mac.
# Uso: pega esta línea en la Terminal:
#   curl -fsSL https://mrcss23fx.github.io/Web/mt5/instalar-mac.sh | bash
BASE="$HOME/Library/Application Support/net.metaquotes.wine.metatrader5/drive_c/Program Files"
URL="https://mrcss23fx.github.io/Web/mt5"
DIRS=$(find "$BASE" -maxdepth 3 -type d -path "*/MQL5/Experts" 2>/dev/null)
if [ -z "$DIRS" ]; then
  echo "✗ No encuentro MetaTrader 5. Ábrelo una vez, ciérralo y vuelve a pegar la línea."
  exit 1
fi
echo "$DIRS" | while IFS= read -r DEST; do
  curl -fsSL "$URL/BitacoraPuente.mq5" -o "$DEST/BitacoraPuente.mq5" || { echo "✗ No se pudo descargar. ¿Tienes internet?"; exit 1; }
  if curl -fsSL "$URL/BitacoraPuente.ex5" -o "$DEST/BitacoraPuente.ex5.tmp" 2>/dev/null; then
    mv "$DEST/BitacoraPuente.ex5.tmp" "$DEST/BitacoraPuente.ex5"
  else
    rm -f "$DEST/BitacoraPuente.ex5.tmp"
  fi
  echo "✓ Programa puente instalado en: $DEST"
done
printf "https://xsvezicjksfrklwjskfv.supabase.co" | pbcopy 2>/dev/null
echo "✓ He copiado la dirección que hay que permitir en MetaTrader 5 (Herramientas → Opciones → Asesores expertos)."
echo "  Siguiente paso: vuelve a la app."
