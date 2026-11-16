# v0.3.0 - Linux + Python + Backup

## Objetivo
Aprender automatización y auditoría como en Cursos 4 y 7 de Google.

## Qué incluye
- scripts/backup.py: Backup local con zip + log. No sube a GitHub.
- scripts/audit.sh: Auditoría en Linux (WSL/Ubuntu) - secretos, eval, innerHTML, permisos.
- .gitignore actualizado: backups/ ya está cubierto por backup_*.json y *.zip, pero agregamos backups/ explícito.

## Cómo probar
1. En VS Code terminal (Windows): python scripts/backup.py
2. En WSL / Ubuntu: bash scripts/audit.sh

## Seguridad
- Backup es LOCAL, no en nube todavía (v0.4.0 = Google Cloud).
- Audit no borra nada, solo reporta.
