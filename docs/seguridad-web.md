# v0.5.0 - Seguridad Web Completa (OWASP)

## Bug encontrado
En GitHub Pages Analizar no hacia nada. En Netlify si. Causa: CSP script-src self bloquea handlers inline (onclick="..."). Fix: 0 handlers inline, todo con addEventListener + delegacion data-action.

## Controles
- XSS: escapeHtml + CSP script-src self sin unsafe-inline + sin eval + sin document.write + allowlist (nunca eval(action))
- Clickjacking: frame-ancestors none
- MIME: X-Content-Type-Options nosniff en _headers (Netlify)
- File Upload: logo solo image/* max 2MB validado
- Validacion: sanitizarTexto max 200, validarNumero min/max, allowlist unidad kg/g/unidad y data-action
- Privacidad: Referrer-Policy no-referrer, sin trackers, sin cookies, sin dependencias externas (0 CDN)
- HTTPS: Enforce HTTPS en Pages
- Stateless: no persiste datos sensibles, solo genera .doc local
- Versionado: tags, PR, backup.py

## Probar
1. F12 Console debe tener 0 errores CSP
2. XSS: poner <img src=x onerror=alert(1)> en nombre -> debe mostrarse como texto, no ejecutar
3. Analizar: "2 tomate, 1kg palta" -> debe detectar
4. Logo .exe -> debe rechazar
