# El Castillo de la Fruta - Hoja de Pedidos

App stateless para generar hojas de pedidos / documento Word desde texto de WhatsApp.
Sin backend, sin base de datos en la nube, sin login. Todo se genera en local en el navegador.

## Demo en vivo - 2 nubes

| Nube | URL | Uso |
|---|---|---|
| **GitHub Pages** | https://chicoandre369.github.io/el-castillo-pedidos/ | Portafolio |
| **Google Cloud - Firebase Hosting** | https://el-castillo-pedidos-ab575.web.app | Portafolio / Producción |
| **Netlify** | (URL del local) | Negocio - celular del local |

> La misma app, mismo código, 2 nubes. Ideal para portafolio y para ebook "Crea tu app con seguridad y GitHub".

## Qué hace

- Pega texto de WhatsApp: `2 alcachofas 4 pepinos 2 lechugas`
- Detecta productos aunque vengan corridos, con comas o con " y ": `2 tomate, 1kg palta y 3 lechugas`
- Revisa cantidades / unidades / precios antes de agregar
- Genera documento Word `.doc` con la hoja de pedidos
- Catálogo, clientes, historial, reporte del día, fiado
- Sin persistencia sensible: en incógnito sale en 0, en el celular del local usa `localStorage`

## Seguridad web (v0.5.0 - OWASP)

- **CSP estricta:** `script-src 'self'` sin `unsafe-inline` - 0 handlers inline (`onclick`, `onchange`)
- Todo con `addEventListener` + delegación con `data-action` / `data-field` y allowlist (nunca `eval()`)
- **XSS:** `escapeHtml()` en todos los renders. Prueba: `<img src=x onerror=alert(1)>` se muestra como texto, no ejecuta
- **Headers:** `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy`, `COOP/CORP` - en `_headers` (Netlify) y `firebase.json` (Google Cloud)
- **Validación:** `sanitizarTexto()` max 200, `validarNumero()` min/max, logo solo `image/*` max 2MB, `unidad` solo `kg/g/unidad`
- **Privacidad:** sin trackers, sin cookies, sin analytics, 0 dependencias externas (sin CDN)
- **HTTPS** forzado en GitHub Pages y Firebase Hosting
- Ver `docs/seguridad-web.md` y `docs/threat-model.md`

## Parser - Fix v0.5.1

Antes solo separaba por salto de línea y por " y ", por eso `2 alcachofas 4 pepinos 2 lechugas` daba solo 1 producto.
Ahora separa en 3 pasos: 1) por coma `,`, 2) por " y ", 3) por número. Probado:
- `2 alcachofas 4 pepinos 2 lechugas` -> 3 productos
- `2 tomate, 1kg palta` -> 2 productos
- `1 kilo de papa 2 kilos de tomate` -> 2 productos

## Despliegue - v0.6.0 / v0.6.1

### GitHub Pages
Push a `main` -> Pages despliega automático. Archivo `.nojekyll` en raíz.

### Google Cloud - Firebase Hosting (gratis, sin tarjeta)
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting
# URL: https://el-castillo-pedidos-ab575.web.app
```
Config en `firebase.json` + `.firebaserc` (proyecto `el-castillo-pedidos-ab575`).
v0.6.1: `firebase.json` ignora `backups/`, `scripts/`, `*.md`, `.git/`, `.firebase/` para subir solo lo necesario.

### Netlify (negocio)
Headers en `_headers` en raíz. Misma CSP que en Firebase.

## Desarrollo local

Solo abre `index.html` o usa:
```bash
npx serve .
```

## Versionado

Una rama + tag por versión, PR merge a `main`:
- v0.1.0 original, v0.2.0 refactor + CSP, v0.3.0 backup/audit, v0.4.0 Pages, v0.4.1 fix case-sensitive
- v0.5.0 seguridad web completa, v0.5.1 fix lectura corrida, v0.6.0 Firebase Hosting, v0.6.1 README + deploy limpio

## Estructura

```
index.html
css/styles.css
js/app.js
firebase.json
.firebaserc
_headers
docs/
  amenaza / threat-model.md
  seguridad-web.md
  despliegue.md
scripts/
  backup.py
  audit.sh
```

## Autor

Andrés - El Castillo de la Fruta - Santiago, Chile
Google Cybersecurity Certificate en progreso (Curso 5/9) - aplicado en esta app.
