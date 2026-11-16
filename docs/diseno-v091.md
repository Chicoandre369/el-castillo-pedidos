# v0.9.1 Fix tabs + Config

Problema: Pedidos mostraba Pedidos + Reporte + Historial juntos. Config tenia campos apretados en misma linea.
Fix:
- Inicio: solo Nuevo Pedido + revision
- Pedidos: SOLO hoja actual + Compartir + Generar + Vaciar (sin Reporte ni Historial)
- Estadisticas: SOLO Reporte del dia + Historial de documentos
- Configuracion: SOLO Datos negocio + Catalogo + Clientes, con CSS que fuerza label block + input 100% + catalogo apilado en columna en movil
- showTab igual que v090, guarda tab en localStorage, al agregar -> Pedidos, al Editar -> Inicio
