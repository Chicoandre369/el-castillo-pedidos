#!/bin/bash
# El Castillo de la Fruta - v0.3.0 - Auditoría Linux
# Curso 4 y 5 Google Cybersecurity: Linux + Assets / Vulnerabilidades
# Uso en WSL / Ubuntu:  bash scripts/audit.sh
# Uso en PowerShell:    NO, este es para Linux. En Windows usa backup.py

echo "=== AUDITORIA El Castillo v0.3.0 ==="
echo "Fecha: $(date)"
echo ""

echo "[1] Archivos con posible secreto (.env, clave, token, password)..."
grep -R -i -n --exclude-dir=.git --exclude-dir=backups -E "password\s*=|api[_-]?key\s*=|token\s*=|secret\s*=" . || echo "  ✅ No se encontraron secretos evidentes"
echo ""

echo "[2] innerHTML sin escapeHtml (revisar manual)..."
grep -n "innerHTML" js/app.js | head -n 30
echo "  -> Revisa que cada uno use escapeHtml() si viene del usuario"
echo ""

echo "[3] Uso de eval / document.write (debe ser 0)..."
echo "  eval: $(grep -c "eval(" js/app.js || echo 0)"
echo "  document.write: $(grep -c "document.write" js/app.js || echo 0)"
echo ""

echo "[4] Permisos (no debe haber 777)..."
find . -type f -perm 0777 -not -path "./.git/*" || echo "  ✅ Sin archivos 777"
echo ""

echo "[5] Tamaño y archivos..."
ls -lh index.html css/styles.css js/app.js
echo ""
echo "=== FIN AUDITORIA ==="
