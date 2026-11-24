#!/bin/bash
set -e
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
  echo "Falta Node.js. Instálalo desde https://nodejs.org/ y vuelve a ejecutar este archivo."
  read -r -p "Pulsa Enter para cerrar..."
  exit 1
fi
npm install
npm start
