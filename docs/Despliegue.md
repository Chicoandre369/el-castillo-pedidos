# v0.4.0 - Despliegue en Nube (GitHub Pages + Google Cloud)

## Objetivo
Que la app quede online con link público para portafolio, sin exponer datos sensibles.
Recordatorio: La app es generadora stateless. No guarda pedidos. No hay datos de clientes en el repo.

## Paso A - GitHub Pages (gratis, hecho en v0.4.0)
1. GitHub > Repo > Settings > Pages
2. Source: Deploy from a branch
3. Branch: main / (root)
4. Save. Esperar 1-2 min.
5. URL: https://chicoandre369.github.io/el-castillo-pedidos/
6. Verificar: abrir en modo incógnito, probar generar un pedido de prueba (no con datos reales).

## Paso B - Google Cloud (roadmap, siguiente iteración)
1. Crear proyecto en Google Cloud Console (capa gratuita).
2. Crear Bucket Cloud Storage, nombre único, ubicación Sudamérica si disponible.
3. Subir index.html, css/, js/ (sin .git, sin backups/, sin scripts con datos).
4. Hacer bucket público solo para lectura web, o usar Cloud CDN.
5. Habilitar logging del bucket.
6. Comparar: GitHub Pages = demo rápida. GCP = control, logs, backup en nube.

## Checklist de seguridad antes de publicar
- [ ] Sin .env, sin claves, sin tokens en repo (revisar con scripts/audit.sh)
- [ ] Sin export_*.csv / backup_*.json / .doc con pedidos reales
- [ ] CSP activo en index.html
- [ ] Probar en incógnito que no muestra datos reales (debe salir 0 porque localStorage está vacío en otro navegador, eso es correcto)
- [ ] .gitignore cubre backups/

## Si algo falla
- 404 en Pages: esperar 2 min, verificar que branch es main y no version-0.4.0.
- Se ve sin diseño: verificar que css/styles.css y js/app.js están en main.
- Se ven datos reales: NO debería pasar, porque localStorage es por navegador. Si pasa, es porque estás en tu navegador con datos viejos. Probar en incógnito.
