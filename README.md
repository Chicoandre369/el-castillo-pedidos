# El Castillo de la Fruta - Hoja de Pedidos

App real en producción para gestionar pedidos, catálogo, clientes e historial de ventas.
Proyecto portafolio del Certificado de Ciberseguridad de Google (Coursera).

## Versiones
- **v0.1.0** - App original monolítica (1 solo `index.html`), 556 pedidos en producción.
- **v0.2.0** - Refactorización + seguridad base: separación en `index.html` / `css/styles.css` / `js/app.js`, CSP, sin `eval`, sin `document.write`, `escapeHtml` en renders.

## Cómo correrlo
1. Abrir la carpeta en VS Code.
2. Abrir `index.html` con Live Server o doble clic.
3. No requiere servidor ni instalación. Los datos quedan en `localStorage` del navegador (no se suben a Git).

## Estructura
```
index.html      # Estructura + CSP
css/styles.css  # Estilos (extraídos sin cambios visuales de v0.1.0)
js/app.js       # Lógica: pedidos, catálogo, clientes, historial, reportes, export .doc
docs/threat-model.md  # Modelo de amenazas - Curso 5 Google Cybersecurity
SECURITY.md     # Cómo reportar, controles aplicados
CHANGELOG.md    # Historial por versión
```

## Seguridad aplicada (v0.2.0)
- Content-Security-Policy: `default-src 'self'`, sin scripts externos.
- Sin `eval()` ni `document.write()`.
- `escapeHtml()` en todo lo que viene del usuario antes de `innerHTML`.
- Sin secretos / claves / tokens en el código.
- `.gitignore` cubre `.env`, backups, exportes.
- Backups locales antes de cada cambio grande (tag `v0.1.0`).

## Nube (roadmap)
- v0.3.0: Backup con Python + auditoría en Linux (WSL).
- v0.4.0: Despliegue en Google Cloud (Cloud Storage) + GitHub Pages.

## Autor
Chicoandre369 - En formación: Certificado de Ciberseguridad de Google.
