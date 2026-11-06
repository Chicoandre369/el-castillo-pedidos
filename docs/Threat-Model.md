# Modelo de Amenazas - El Castillo de la Fruta (Curso 5 - Assets, Threats & Vulnerabilities)

## Activos
1. Pedidos (556 registros) - Confidencialidad media / Integridad alta / Disponibilidad alta.
2. Clientes (nombre, direccion, telefono) - Confidencialidad alta. Dato sensible.
3. Catalogo / precios - Integridad alta.
4. Historial de ventas - Integridad alta.
5. Codigo en GitHub - Integridad alta.

## Amenazas
- XSS: Nombre de cliente con script en pedido -> Mitigacion v0.2.0: escapeHtml() + CSP script-src self. Pendiente: auditar los 25 innerHTML.
- Perdida de datos: Borrar localStorage / formatear PC -> Mitigacion: Tag v0.1.0 + backup manual. Pendiente: backup.py + bucket GCP (v0.3.0/v0.4.0).
- Filtracion de secretos: Subir .env o export con datos -> Mitigacion: .gitignore. Pendiente: Secret scanning en GitHub.
- Manipulacion de precios: Editar precio sin validar -> Mitigacion: validacion basica en JS. Pendiente: validacion estricta (v0.3.0).
- Acceso no autorizado: Otra persona abre el PC -> App local sin auth. Pendiente: Login / roles (v0.4.0).

## Flujo
Usuario -> Formulario (validar + escape) -> localStorage -> Render (escape) -> Export .doc (local)

## Supuestos
App local de un solo usuario, sin backend. Riesgo mayor hoy: perdida de datos y XSS por inputs.
