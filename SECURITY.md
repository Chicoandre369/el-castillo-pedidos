# Política de Seguridad - El Castillo de la Fruta

## Reportar una vulnerabilidad
Si encuentras un problema de seguridad, no lo publiques en Issues. Escríbeme por GitHub (@Chicoandre369) con:
1. Qué encontraste, 2. Dónde (archivo/línea), 3. Cómo reproducirlo, 4. Impacto sugerido.

## Controles aplicados en v0.2.0
| Control | Estado |
|---|---|
| Content-Security-Policy (default-src 'self') | ✅ |
| Sin eval() / document.write() | ✅ |
| escapeHtml() en inputs de usuario | ✅ |
| Sin secretos en repo | ✅ |
| .gitignore (.env, backups, exportes) | ✅ |
| Versionado por tags (v0.1.0 sellada) | ✅ |
| Rama por versión (version-0.2.0) | ✅ |

## Fuera de alcance / Riesgos conocidos
- Los datos viven en `localStorage` del navegador: si se borra el navegador, se pierden sin backup. Mitigación: backup manual + script Python en v0.3.0.
- Sin autenticación todavía (app local de un solo usuario). Roadmap v0.4.0: roles.
- CSP permite `style-src 'unsafe-inline'` temporalmente por estilos heredados. Roadmap: mover a CSS externo puro.

## Checklist antes de cada push
- [ ] Sin `console.log` con datos de clientes
- [ ] Sin claves / tokens
- [ ] `git status` revisado (no subir .doc / .csv de pedidos reales)
