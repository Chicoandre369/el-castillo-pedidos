/* El Castillo de la Fruta - v0.2.0 - Logica extraida de index.html original (v0.1.0)
   Seguridad v0.5.0 + Fix lectura corrida v0.5.1: CSP estricta sin inline handlers, validacion, allowlist. sin eval, sin document.write, escapeHtml en renders, CSP en index.html.
   Datos: localStorage (pedidos, catalogo, clientes, historial) - no se suben a Git. */
let catalogo = [];
let pedidosPendientes = [];
let itemsEnRevision = [];
let clientes = [];
let historialPedidos = [];
let ventasLog = [];
let config = {nombreNegocio:'', infoNegocio:'', logo:null, pedidosPorHoja:3};
let editingIndex = null;

function fechaLocalISO(d){
  d = d || new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off*60000);
  return local.toISOString().slice(0,10);
}

// ---------- Persistencia del catálogo ----------
function cargarCatalogo(){
  try{
    const val = localStorage.getItem('catalogo_verduleria');
    if(val) catalogo = JSON.parse(val);
  }catch(e){
    catalogo = [];
  }
  renderCatalogo();
}
function guardarCatalogo(){
  try{
    localStorage.setItem('catalogo_verduleria', JSON.stringify(catalogo));
  }catch(e){
    console.error('No se pudo guardar el catálogo', e);
  }
}

// ---------- Persistencia de config del negocio ----------
function cargarConfig(){
  try{
    const val = localStorage.getItem('config_negocio_verduleria');
    if(val) config = Object.assign(config, JSON.parse(val));
  }catch(e){}
  const _nN = document.getElementById('negNombre'); if(_nN) _nN.value = config.nombreNegocio || '';
  const _nI = document.getElementById('negInfo'); if(_nI) _nI.value = config.infoNegocio || '';
  const _pH = document.getElementById('pedidosPorHojaSelect'); if(_pH) _pH.value = config.pedidosPorHoja || 3;
  const _lP = document.getElementById('logoPreview'); if(_lP && config.logo){ _lP.src = config.logo; _lP.style.display = 'block'; }
  // logo ya manejado arriba con guard (v0.9.6)
}
function guardarConfig(){
  try{ localStorage.setItem('config_negocio_verduleria', JSON.stringify(config)); }catch(e){}
}
function actualizarNombreNegocio(){
  const _a=document.getElementById('negNombre'); if(_a) config.nombreNegocio = _a.value.trim();
  guardarConfig();
}
function actualizarInfoNegocio(){
  const _b=document.getElementById('negInfo'); if(_b) config.infoNegocio = _b.value.trim();
  guardarConfig();
}
function actualizarPedidosPorHoja(){
  const _c=document.getElementById('pedidosPorHojaSelect'); if(_c) config.pedidosPorHoja = parseInt(_c.value) || 3;
  guardarConfig();
  renderPedidosPendientes();
}
function cargarLogo(input){
  const file = input.files && input.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = function(e){
    config.logo = e.target.result;
    guardarConfig();
    const prev = document.getElementById('logoPreview');
    prev.src = config.logo; prev.style.display = 'block';
  };
  reader.readAsDataURL(file);
}
function quitarLogo(){
  config.logo = null;
  guardarConfig();
  const prev = document.getElementById('logoPreview');
  prev.src = ''; prev.style.display = 'none';
}

// ---------- Persistencia de pedidos pendientes (hoja actual) ----------
function cargarPedidosPendientes(){
  try{
    const val = localStorage.getItem('pedidos_pendientes_verduleria');
    if(val) pedidosPendientes = JSON.parse(val);
  }catch(e){
    pedidosPendientes = [];
  }
}
function guardarPedidosPendientes(){
  try{ localStorage.setItem('pedidos_pendientes_verduleria', JSON.stringify(pedidosPendientes)); }catch(e){}
}

// ---------- Clientes ----------
function cargarClientes(){
  try{
    const val = localStorage.getItem('clientes_verduleria');
    if(val) clientes = JSON.parse(val);
  }catch(e){
    clientes = [];
  }
  renderClientes();
  renderClientesDatalist();
}
function guardarClientes(){
  try{ localStorage.setItem('clientes_verduleria', JSON.stringify(clientes)); }catch(e){}
}
function buscarCliente(nombre){
  const n = normalizarTexto(nombre);
  return clientes.find(c => normalizarTexto(c.nombre) === n);
}
function renderClientesDatalist(){
  const _dl = document.getElementById('clientesDatalist'); if(!_dl && !document.getElementById('clienteInput')) return;
  const dl = document.getElementById('clientesDatalist');
  if(dl) dl.innerHTML = clientes.map(c => `<option value="${escapeHtml(c.nombre)}">`).join('');
}
function agregarCliente(){
  const nombre = document.getElementById('cliNombre').value.trim();
  const direccion = document.getElementById('cliDireccion').value.trim();
  const telefono = document.getElementById('cliTelefono').value.trim();
  if(!nombre) return;
  let c = buscarCliente(nombre);
  if(c){
    c.direccion = direccion;
    c.telefono = telefono;
  } else {
    clientes.push({nombre, direccion, telefono, deuda: 0});
  }
  document.getElementById('cliNombre').value = '';
  document.getElementById('cliDireccion').value = '';
  document.getElementById('cliTelefono').value = '';
  renderClientes();
  renderClientesDatalist();
  guardarClientes();
}
function eliminarCliente(i){
  clientes.splice(i, 1);
  renderClientes();
  renderClientesDatalist();
  guardarClientes();
}
function abonarDeuda(i){
  const val = prompt('Monto a abonar (resta de la deuda):', '0');
  const monto = parseFloat(val);
  if(!monto || monto <= 0) return;
  clientes[i].deuda = Math.max(0, (clientes[i].deuda || 0) - monto);
  renderClientes();
  guardarClientes();
}
function renderClientes(){
  const cont = document.getElementById('clientesLista');
  const _cc = document.getElementById('cliCount'); if(_cc) _cc.textContent = clientes.length;
  if(!cont) return; // v0.9.6: Clientes manual ya no existe, no tumbar app.js
  if(clientes.length === 0){
    cont.innerHTML = '<p class="empty-hint">Aún no agregas clientes.</p>';
    return;
  }
  cont.innerHTML = clientes.map((c, i) => `
    <div class="cliente-row">
      <div>
        <b>${escapeHtml(c.nombre)}</b>
        <div class="cliente-sub">${escapeHtml(c.direccion || '-')}${c.telefono ? ' · ' + escapeHtml(c.telefono) : ''}</div>
      </div>
      <div class="cliente-deuda ${c.deuda > 0 ? 'con-deuda' : ''}">$${Math.round(c.deuda || 0).toLocaleString('es-CL')}</div>
      <div class="cliente-actions">
        <button class="btn-ghost btn-small" data-action="abonarDeuda" data-index="${i}">Abonar</button>
        <button class="icon-btn" data-action="eliminarCliente" data-index="${i}" title="Eliminar">✕</button>
      </div>
    </div>
  `).join('');
}

// ---------- Historial de documentos generados ----------
function cargarHistorial(){
  try{
    const val = localStorage.getItem('historial_pedidos_verduleria');
    if(val) historialPedidos = JSON.parse(val);
  }catch(e){
    historialPedidos = [];
  }
  renderHistorial();
}
function guardarHistorial(){
  try{ localStorage.setItem('historial_pedidos_verduleria', JSON.stringify(historialPedidos)); }catch(e){}
}
function renderHistorial(){
  const cont = document.getElementById('historialLista');
  const empty = document.getElementById('historialEmpty');
  document.getElementById('historialCount').textContent = historialPedidos.length;
  if(historialPedidos.length === 0){
    cont.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  cont.innerHTML = historialPedidos.map((h, i) => {
    const fechaTxt = new Date(h.fecha).toLocaleString('es-CL');
    const totD = h.pedidos.reduce((a, p) => a + p.items.reduce((a2, it) => a2 + it.precio, 0), 0);
    return `
      <div class="historial-row">
        <div>
          <b>${fechaTxt}</b>
          <div class="cliente-sub">${h.pedidos.length} pedido(s)${totD > 0 ? ' · $' + Math.round(totD).toLocaleString('es-CL') : ''}</div>
        </div>
        <div class="cliente-actions">
          <button class="btn-secondary btn-small" data-action="reimprimirHistorial" data-index="${i}">Reimprimir</button>
          <button class="icon-btn" data-action="eliminarHistorial" data-index="${i}" title="Eliminar">✕</button>
        </div>
      </div>
    `;
  }).reverse().join('');
}
function eliminarHistorial(i){
  historialPedidos.splice(i, 1);
  renderHistorial();
  guardarHistorial();
}
function reimprimirHistorial(i){
  generarWordDesdeLista(historialPedidos[i].pedidos);
}

// ---------- Registro de ventas / reporte del día ----------
function cargarVentasLog(){
  try{
    const val = localStorage.getItem('ventas_log_verduleria');
    if(val) ventasLog = JSON.parse(val);
  }catch(e){
    ventasLog = [];
  }
}
function guardarVentasLog(){
  try{ localStorage.setItem('ventas_log_verduleria', JSON.stringify(ventasLog)); }catch(e){}
}
function registrarVenta(pedido){
  const total = pedido.items.reduce((a, it) => a + it.precio, 0);
  ventasLog.push({diaISO: pedido.diaISO, cliente: pedido.cliente, items: pedido.items, total});
  guardarVentasLog();
}
function renderReporte(){
  const fechaEl = document.getElementById('reporteFecha');
  if(!fechaEl) return; // v0.9.6 guard
  const dia = fechaEl.value || fechaLocalISO();
  const ventasDia = ventasLog.filter(v => v.diaISO === dia);
  const totalVendido = ventasDia.reduce((a, v) => a + v.total, 0);

  const _rr = document.getElementById('reporteResumen'); if(_rr) _rr.innerHTML = `
    <div class="totales">
      <span><b>${ventasDia.length}</b> pedido(s)</span>
      <span><b>$${Math.round(totalVendido).toLocaleString('es-CL')}</b> vendido</span>
    </div>
  `;

  const conteo = {};
  ventasDia.forEach(v => v.items.forEach(it => {
    conteo[it.producto] = (conteo[it.producto] || 0) + it.cantidad;
  }));
  const top = Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const cont = document.getElementById('reporteTop');
  if(!cont) return;
  if(top.length === 0){
    cont.innerHTML = '<p class="empty-hint">Sin ventas registradas ese día.</p>';
  } else {
    cont.innerHTML = '<ol style="padding-left:18px;margin:6px 0;font-size:0.85rem;">' +
      top.map(([nombre, cant]) => `<li>${escapeHtml(nombre)} — ${cant}</li>`).join('') +
      '</ol>';
  }
}

// ---------- Exportar a CSV / Excel ----------
function descargarCSV(filename, filas){
  const csv = filas.map(f => f.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function exportarCatalogoCSV(){
  const filas = [['Producto', 'Unidad', 'Precio'], ...catalogo.map(p => [p.nombre, p.unidad, p.precio])];
  descargarCSV('catalogo_verduleria.csv', filas);
}
function exportarBaseDatosCSV(){
  const filas = [['Producto', 'Unidad por defecto', 'Alias reconocidos'], ...PRODUCTOS_DB.map(p => [p.nombre, p.unidad, p.alias.join(' | ')])];
  descargarCSV('base_datos_productos.csv', filas);
}

function renderCatalogo(){
  const cont = document.getElementById('catalogoLista');
  const _cc = document.getElementById('catCount'); if(_cc) _cc.textContent = catalogo.length;
  const _cc2 = document.getElementById('catCount2'); if(_cc2) _cc2.textContent = catalogo.length;
  if(!cont) return;
  if(catalogo.length === 0){
    cont.innerHTML = '<p class="empty-hint">Aún no agregas productos.</p>';
    return;
  }
  const buscarEl = document.getElementById('catBuscar');
  const filtro = buscarEl ? normalizarTexto(buscarEl.value) : '';
  const lista = filtro ? catalogo.filter(p => normalizarTexto(p.nombre).includes(filtro)) : catalogo;
  if(lista.length === 0){
    cont.innerHTML = '<p class="empty-hint">Sin resultados para tu búsqueda.</p>';
    return;
  }
  cont.innerHTML = lista.map((p) => {
    const i = catalogo.indexOf(p);
    return `
    <div class="catalogo-row" style="grid-template-columns:1fr 78px 70px auto;">
      <span style="font-size:0.85rem;">${escapeHtml(p.nombre)}</span>
      <span style="font-size:0.8rem;color:#8a8371;">${p.unidad}</span>
      <span style="font-size:0.8rem;color:#8a8371;">${p.precio>0 ? '$'+p.precio : '-'}</span>
      <button class="icon-btn" data-action="eliminarProductoCatalogo" data-index="${i}" title="Eliminar">✕</button>
    </div>
  `;
  }).join('');
}

function agregarProductoCatalogo(){
  const nombre = document.getElementById('catNombre').value.trim();
  const unidad = document.getElementById('catUnidad').value;
  const precio = parseFloat(document.getElementById('catPrecio').value) || 0;
  if(!nombre) return;
  catalogo.push({nombre, unidad, precio});
  document.getElementById('catNombre').value = '';
  document.getElementById('catPrecio').value = '';
  renderCatalogo();
  guardarCatalogo();
}
function eliminarProductoCatalogo(i){
  catalogo.splice(i,1);
  renderCatalogo();
  guardarCatalogo();
}

// ---------- Base de datos de productos ----------
// Formato: [nombre mostrado, unidad por defecto ('kg'|'g'|'unidad'), alias / formas de escribirlo]
const PRODUCTOS_DB_RAW = [
  // --- Verduras ---
  ['Tomate','kg',['tomate','tomates','tomatito','tomatitos']],
  ['Tomate cherry','unidad',['tomate cherry','tomates cherry','cherry']],
  ['Lechuga','unidad',['lechuga','lechugas']],
  ['Lechuga marina','unidad',['lechuga marina','lechugas marinas']],
  ['Lechuga escarola','unidad',['lechuga escarola','escarola']],
  ['Lechuga costina','unidad',['lechuga costina','costina']],
  ['Zapallo italiano','unidad',['zapallo italiano','zapallos italianos','zapallito italiano','zucchini']],
  ['Zapallo camote','kg',['zapallo camote','zapallo']],
  ['Choclo','unidad',['choclo','choclos','maiz']],
  ['Repollo','unidad',['repollo','repollos']],
  ['Repollo morado','unidad',['repollo morado','col morada']],
  ['Pepino','unidad',['pepino','pepinos','pepino ensalada']],
  ['Pepino ensalada','unidad',['pepino ensalada']],
  ['Pimentón rojo','unidad',['pimenton rojo','pimentones rojos','pimiento rojo','pimentones']],
  ['Pimentón verde','unidad',['pimenton verde','pimentones verdes','pimiento verde','pimentones']],
  ['Pimentón amarillo','unidad',['pimenton amarillo','pimentones amarillos','pimiento amarillo','pimentones']],
  ['Ají verde','kg',['aji verde','ajies verdes','aji']],
  ['Ají cristal','kg',['aji cristal']],
  ['Berenjena','unidad',['berenjena','berenjenas']],
  ['Betarraga','unidad',['betarraga','betarragas','beterraga','beterragas']],
  ['Cebolla','unidad',['cebolla','cebollas']],
  ['Cebolla morada','unidad',['cebolla morada','cebollas moradas']],
  ['Cebollín','unidad',['cebollin','cebollines']],
  ['Puerro','unidad',['puerro','puerros']],
  ['Ajo','unidad',['ajo','ajos','cabeza de ajo','cabezas de ajo']],
  ['Apio','unidad',['apio','apios']],
  ['Acelga','unidad',['acelga','acelgas']],
  ['Espinaca','unidad',['espinaca','espinacas']],
  ['Brócoli','unidad',['brocoli','brocolis','brócoli']],
  ['Coliflor','unidad',['coliflor','coliflores']],
  ['Zanahoria','kg',['zanahoria','zanahorias']],
  ['Rabanito','unidad',['rabanito','rabanitos','rabano','rábano']],
  ['Poroto verde','kg',['poroto verde','porotos verdes','poroto granado','porotos granados']],
  ['Arveja','kg',['arveja','arvejas']],
  ['Haba','kg',['haba','habas']],
  ['Alcachofa','unidad',['alcachofa','alcachofas']],
  ['Espárrago','unidad',['esparrago','esparragos','espárrago']],
  ['Champiñón','kg',['champiñon','champiñones','champinon','champinones','hongo','hongos']],
  ['Cilantro','unidad',['cilantro','culantro']],
  ['Perejil','unidad',['perejil']],
  ['Albahaca','unidad',['albahaca']],
  ['Orégano','unidad',['oregano','orégano']],
  ['Menta','unidad',['menta']],
  ['Romero','unidad',['romero']],
  ['Jengibre','kg',['jengibre']],
  ['Papa','kg',['papa','papas']],
  ['Camote','kg',['camote','camotes','batata']],
  ['Alcachofa','unidad',['alcachofa','alcachofas','alcachofa de corte']],

  // --- Frutas ---
  ['Palta','kg',['palta','paltas','palta hass','aguacate']],
  ['Plátano','kg',['platano','platanos','plátano','plátanos','banana','bananas','concha de platano','concha de platanos','conchas de platano','conchas de platanos']],
  ['Manzana','kg',['manzana','manzanas']],
  ['Naranja','kg',['naranja','naranjas']],
  ['Mandarina','kg',['mandarina','mandarinas']],
  ['Limón','kg',['limon','limones','limón']],
  ['Pomelo','kg',['pomelo','pomelos']],
  ['Pera','kg',['pera','peras']],
  ['Uva','kg',['uva','uvas']],
  ['Sandía','unidad',['sandia','sandias','sandía']],
  ['Melón','unidad',['melon','melones','melón']],
  ['Piña','unidad',['piña','piñas','pina','pinas']],
  ['Kiwi','kg',['kiwi','kiwis']],
  ['Durazno','kg',['durazno','duraznos']],
  ['Nectarín','kg',['nectarin','nectarines','nectarín']],
  ['Ciruela','kg',['ciruela','ciruelas']],
  ['Frutillas','unidad',['frutilla','frutillas']],
  ['Arándanos','unidad',['arandano','arandanos','arándano','arándanos']],
  ['Frambuesas','unidad',['frambuesa','frambuesas']],
  ['Moras','unidad',['mora','moras']],
  ['Mango','kg',['mango','mangos']],
  ['Papaya','kg',['papaya','papayas']],
  ['Chirimoya','kg',['chirimoya','chirimoyas']],
  ['Granada','kg',['granada','granadas']],
  ['Membrillo','kg',['membrillo','membrillos']],
  ['Higo','kg',['higo','higos']],
  ['Damasco','kg',['damasco','damascos']],

  // --- Frutos secos ---
  ['Nuez','kg',['nuez','nueces']],
  ['Almendra','kg',['almendra','almendras']],
  ['Maní','kg',['mani','manies','maní']],
  ['Avellana','kg',['avellana','avellanas']],
  ['Castaña','kg',['castaña','castañas']],
  ['Pasas','kg',['pasas','pasas de uva']],
  ['Ciruela seca','kg',['ciruela seca','ciruelas secas']],

  // --- Huevos ---
  ['Huevos','unidad',['huevo','huevos']],

  // --- Otros / productos habituales ---
  ['Dulces','unidad',['dulce','dulces']],
  ['Miel','unidad',['miel']],
  ['Palmitos','unidad',['palmito','palmitos']],
  ['Aceituna','unidad',['aceituna','aceitunas']],
  ['Choclo desgranado','kg',['choclo desgranado','choclo en grano']],
  ['Pepinillos','unidad',['pepinillo','pepinillos','pepinillo dill','pepinillos dill','pepino encurtido','pepinos encurtidos']],
  ['Ají escabeche','unidad',['aji escabeche','ajies escabeche','aji en escabeche','aji escabechado']],
  ['Cebolla escabeche','unidad',['cebolla escabeche','cebollas escabeche','cebolla en escabeche','cebolla escabechada']],

  // --- Embutidos / cecinas ---
  ['Jamón','unidad',['jamon','jamones']],
  ['Jamón de pavo','unidad',['jamon de pavo','jamon pavo']],
  ['Salchichas','unidad',['salchicha','salchichas','vienesa','vienesas']],
  ['Mortadela','unidad',['mortadela','mortadelas']],
  ['Salame','unidad',['salame','salames','salami']],
  ['Chorizo','unidad',['chorizo','chorizos']],
  ['Longaniza','unidad',['longaniza','longanizas']],
  ['Queso de cabeza','unidad',['queso de cabeza']],
  ['Arrollado','unidad',['arrollado','arrollados','arrollado huaso']],
  ['Paté','unidad',['pate','patés','pates']],
  ['Tocino','unidad',['tocino','tocinos']],
  ['Panceta','unidad',['panceta','pancetas']],
  ['Prietas','unidad',['prieta','prietas']],
  ['Queso mantecoso','unidad',['queso mantecoso']],
];
// El 4º elemento (opcional, no usado por ahora en ningún producto) permite
// configurar una EXCEPCIÓN puntual a la regla "cantidad sin unidad = unidad":
// ej. ['Papa','kg',['papa','papas'],'kg'] haría que "5 papas" se interprete
// como 5 kg en vez de 5 unidades. Si se omite, se aplica la regla general.
const PRODUCTOS_DB = PRODUCTOS_DB_RAW.map(([nombre, unidad, alias, reglaCantidadSinUnidad]) => ({
  nombre,
  // Unidad por defecto cuando el producto se escribe SOLO por su nombre,
  // sin cantidad ni unidad (ej: "Papa" -> 1 kg; "Lechuga" -> 1 unidad).
  unidad,
  siempreUnidad: unidad === 'unidad',
  // Unidad a usar cuando el cliente SÍ escribe una cantidad numérica pero
  // sin especificar la unidad (ej: "5 plátanos"). null = usar la regla
  // general (unidad), salvo que se configure una excepción arriba.
  reglaCantidadSinUnidad: reglaCantidadSinUnidad || null,
  alias: [...new Set(alias.map(normalizarTexto))]
}));

function normalizarTexto(s){
  return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
}

function buscarEnBaseDatos(texto){
  const n = normalizarTexto(texto);
  let mejor = null, mejorLen = 0;
  for(const p of PRODUCTOS_DB){
    for(const alias of p.alias){
      if(!alias) continue;
      // límites de palabra: evita que alias cortos (ej: "ajo") coincidan dentro de otra palabra (ej: "trabajo")
      const patron = new RegExp('(^|[^a-záéíóúñ0-9])' + alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '($|[^a-záéíóúñ0-9])');
      if(patron.test(n) && alias.length > mejorLen){
        mejor = p; mejorLen = alias.length;
      }
    }
  }
  return mejor;
}

// ---------- Parseo del pedido pegado ----------
function normUnit(tok){
  if(!tok) return null;
  tok = tok.toLowerCase();
  if(tok.startsWith('k')) return 'kg';
  if(tok.startsWith('g')) return 'g';
  if(tok.startsWith('u')) return 'unidad';
  return null;
}
function capitalize(s){
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function buscarEnCatalogo(nombreProducto){
  const n = normalizarTexto(nombreProducto);
  return catalogo.find(p => {
    const pn = normalizarTexto(p.nombre);
    return n.includes(pn) || pn.includes(n);
  });
}

// Convierte fracciones escritas ("1/2", "1 1/2", "½", "1 ½") en su valor
// decimal equivalente (0.5, 1.5, etc.), dejando el resto de la línea intacta.
function convertirFracciones(linea){
  const simbolos = {'½':0.5,'¼':0.25,'¾':0.75,'⅓':1/3,'⅔':2/3,'⅕':0.2,'⅖':0.4,'⅗':0.6,'⅘':0.8};
  const redondear = (n) => Math.round(n * 1000) / 1000;

  // "1 ½" (entero + símbolo de fracción)
  linea = linea.replace(/(\d+)\s+([½¼¾⅓⅔⅕⅖⅗⅘])/g, (m, entero, simb) =>
    String(redondear(parseInt(entero, 10) + simbolos[simb]))
  );
  // "½" solo
  linea = linea.replace(/([½¼¾⅓⅔⅕⅖⅗⅘])/g, (m, simb) => String(simbolos[simb]));
  // "1 1/2" (fracción mixta con espacio)
  linea = linea.replace(/(\d+)\s+(\d+)\/(\d+)/g, (m, entero, num, den) => {
    const d = parseInt(den, 10);
    if(d === 0) return m;
    return String(redondear(parseInt(entero, 10) + parseInt(num, 10) / d));
  });
  // "1/2" (fracción simple, sin número pegado antes)
  linea = linea.replace(/(^|[^\d.])(\d+)\/(\d+)/g, (m, pre, num, den) => {
    const d = parseInt(den, 10);
    if(d === 0) return m;
    return pre + String(redondear(parseInt(num, 10) / d));
  });
  return linea;
}

function extraerCantidadYUnidad(texto){
  const unidadTok = '(kgs?|kilos?|k|grs?|gramos?|uds?|unid(?:ades)?|un|u)';
  let m;

  // 1) "5 kg de papa", "2 kilos de manzana"
  m = texto.match(new RegExp('^(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '\\.?\\s*(?:de\\s+)?(.+)$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[1].replace(',', '.')),
      unidad: normUnit(m[2]),
      producto: m[3].trim(),
      cantidadExplicita: true
    };
  }

  // 2) "papa 5 kg", "manzana 2 kilos"
  m = texto.match(new RegExp('^(.+?)\\s+(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '\\.?$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[2].replace(',', '.')),
      unidad: normUnit(m[3]),
      producto: m[1].trim(),
      cantidadExplicita: true
    };
  }

  // 3) "5 papa", "3 tomates", "5 plátanos"
  m = texto.match(/^(\d+(?:[.,]\d+)?)\s+(.+)$/i);
  if(m){
    return {
      cantidad: parseFloat(m[1].replace(',', '.')),
      unidad: null,
      producto: m[2].trim(),
      cantidadExplicita: true
    };
  }

  // 4) "papa x5", "tomates x 3 kg"
  m = texto.match(new RegExp('^(.+?)\\s*[xX×]\\s*(\\d+(?:[.,]\\d+)?)\\s*' + unidadTok + '?\\.?$', 'i'));
  if(m){
    return {
      cantidad: parseFloat(m[2].replace(',', '.')),
      unidad: normUnit(m[3]),
      producto: m[1].trim(),
      cantidadExplicita: true
    };
  }

  // 5) Solo nombre: "lechuga", "papa"
  return {
    cantidad: null,
    unidad: null,
    producto: texto.trim(),
    cantidadExplicita: false
  };
}

function limpiarProductoExtraido(producto){
  return producto
    .replace(/^[.\-–—\s]+|[.\-–—\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectarProductoEnTexto(texto){
  const matchCatalogo = buscarEnCatalogo(texto);
  const matchBase = buscarEnBaseDatos(texto);
  if(!matchCatalogo && !matchBase) return null;

  const base = matchBase || null;
  const cat = matchCatalogo || null;
  return {
    catalogo: cat,
    base,
    nombre: cat ? cat.nombre : base.nombre
  };
}

function resolverItem(productoTexto, cantidad, unidad, cantidadExplicita){
  const textoLimpio = limpiarProductoExtraido(productoTexto);
  if(!textoLimpio) return null;

  const encontrado = detectarProductoEnTexto(textoLimpio);
  if(!encontrado) return null;

  const catMatch = encontrado.catalogo;
  const baseMatch = encontrado.base;

  let cantidadFinal = cantidad;
  if(cantidadFinal === null || Number.isNaN(cantidadFinal)){
    cantidadFinal = 1;
  }
  if(cantidadFinal === 0) return null;

  // Prioridad:
  // 1. Unidad escrita explícitamente por el cliente.
  // 2. Regla específica del producto, si existe.
  // 3. Si escribió una cantidad sin unidad -> unidad.
  // 4. Si escribió solo el nombre -> unidad habitual del catálogo/base.
  let unidadFinal = unidad;
  if(!unidadFinal){
    if(cantidadExplicita){
      unidadFinal = (baseMatch && baseMatch.reglaCantidadSinUnidad)
        || 'unidad';
    } else {
      unidadFinal = catMatch ? catMatch.unidad : (baseMatch ? baseMatch.unidad : 'unidad');
    }
  }

  // Mantener la regla existente de productos vendidos por unidad.
  // Estos productos (por ejemplo cebolla, lechuga, etc.) ya estaban
  // configurados como "siempreUnidad" y esa lógica NO se modifica.
  // Por lo tanto, "cebolla 1 kg" seguirá mostrándose como 1 unidad,
  // igual que en la versión original.

  if(baseMatch && baseMatch.siempreUnidad) unidadFinal = 'unidad';

  const nombreFinal = catMatch
    ? catMatch.nombre
    : (baseMatch ? baseMatch.nombre : textoLimpio);

  const precio = catMatch ? (parseFloat(catMatch.precio) || 0) : 0;

  return {
    producto: capitalize(nombreFinal),
    cantidad: cantidadFinal,
    unidad: unidadFinal,
    precio
  };
}

function separarMultiplesProductos(linea){
  // v0.5.1: pedidos "hacia el lado" - "2 alcachofas 4 pepinos 2 lechugas"
  if(/[,;]/.test(linea)){
    const porComa = linea.split(/[,;]+/).map(s => s.trim()).filter(Boolean);
    if(porComa.length > 1){
      let out = [];
      for(let p of porComa) out.push(...separarMultiplesProductos(p));
      return out;
    }
  }
  const partes = linea.split(/\s+\by\b\s+/i).map(s => s.trim()).filter(Boolean);
  if(partes.length > 1){
    const resultados = [];
    for(let i = 0; i < partes.length; i++){
      let parte = partes[i];
      if(i === 0){
        const pos = parte.search(/\d/);
        if(pos > 0) parte = parte.slice(pos);
      }
      const tieneProducto = buscarEnCatalogo(parte) || buscarEnBaseDatos(parte);
      const tieneCantidad = /\d/.test(parte);
      if(tieneProducto || tieneCantidad) resultados.push(parte);
    }
    if(resultados.length) {
      let final = [];
      for(let r of resultados) final.push(...separarPorNumeros(r));
      return final;
    }
    return [linea];
  }
  return separarPorNumeros(linea);
}
function separarPorNumeros(linea){
  const t = linea.trim();
  if(!t) return [linea];
  const nums = t.match(/\d+(?:[.,]\d+)?/g) || [];
  if(nums.length < 2) return [linea];
  let desdeNum = t;
  const primerNum = t.search(/\d/);
  if(primerNum > 0) desdeNum = t.slice(primerNum);
  const trozos = desdeNum.split(/\s+(?=\d+(?:[.,]\d+)?\s)/).map(s => s.trim()).filter(Boolean);
  if(trozos.length <= 1) return [linea];
  const todosValidos = trozos.every(tr => buscarEnCatalogo(tr) || buscarEnBaseDatos(tr) || /\d/.test(tr));
  if(!todosValidos) return [linea];
  return trozos;
}

function parsearTexto(texto){
  const lineas = texto.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const items = [];

  for(let raw of lineas){
    let linea = raw.replace(/^[-*•·]+\s*/, '');
    linea = convertirFracciones(linea);

    // Primero intenta separar varias solicitudes en la misma línea.
    const segmentos = separarMultiplesProductos(linea);

    for(let segmento of segmentos){
      // Quitar conectores/palabras de relleno antes de la solicitud.
      segmento = segmento
        .replace(/^(?:(?:hola|holaa|buenas|buenos dias|buenas días|tambien|también|casero|casera|necesito|quiero|por favor|porfa)\s+)+/i, '')
        .trim();

      if(!segmento) continue;

      const parsed = extraerCantidadYUnidad(segmento);
      const item = resolverItem(
        parsed.producto,
        parsed.cantidad,
        parsed.unidad,
        parsed.cantidadExplicita
      );

      if(item){
        items.push(item);
      }
    }
  }

  return items;
}

function analizarPedido(){
  const texto = document.getElementById('textoInput').value;
  const statusEl = document.getElementById('statusMsg');
  if(!texto.trim()){
    statusEl.innerHTML = '<div class="status-msg warn">Pega primero el texto del pedido.</div>';
    return;
  }
  itemsEnRevision = parsearTexto(texto);
  if(itemsEnRevision.length === 0){
    statusEl.innerHTML = '<div class="status-msg warn">No se detectaron productos automáticamente. Agrega las líneas manualmente abajo.</div>';
  } else {
    statusEl.innerHTML = `<div class="status-msg ok">${itemsEnRevision.length} producto(s) detectado(s). Revisa antes de agregar.</div>`;
  }
  document.getElementById('revisionWrap').style.display = 'block';
  renderItemsRevision();
}

function renderItemsRevision(){
  const cont = document.getElementById('itemsLista');
  cont.innerHTML = itemsEnRevision.map((it, i) => `
    <div class="item-row">
      <input type="text" value="${escapeHtml(it.producto)}" data-field="producto" data-index="${i}" data-item-input="1" />
      <input type="number" step="0.1" value="${it.cantidad}" data-field="cantidad" data-index="${i}" data-item-input="1" />
      <select data-field="unidad" data-index="${i}" data-item-input="1">
        <option value="kg" ${it.unidad==='kg'?'selected':''}>kg</option>
        <option value="g" ${it.unidad==='g'?'selected':''}>g</option>
        <option value="unidad" ${it.unidad==='unidad'?'selected':''}>unidad</option>
        <option value="oferta" ${it.unidad==='oferta'?'selected':''}>OFERTA</option>
      </select>
      <input type="number" value="${it.precio}" data-field="precio" data-index="${i}" data-item-input="1" />
      <button class="icon-btn" data-action="quitarItemRevision" data-index="${i}">✕</button>
    </div>
  `).join('');
  actualizarTotalesPreview();
}
function quitarItemRevision(i){
  itemsEnRevision.splice(i,1);
  renderItemsRevision();
}
function agregarLineaManual(){
  itemsEnRevision.push({producto:'', cantidad:1, unidad:'unidad', precio:0});
  renderItemsRevision();
}
function actualizarTotalesPreview(){
  const totK = itemsEnRevision.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
  const totG = itemsEnRevision.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
  const totU = itemsEnRevision.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
  const totD = itemsEnRevision.reduce((a,it)=>a+it.precio,0);
  document.getElementById('totalesPreview').innerHTML = `
    <span><b>${totK.toLocaleString('es-CL')}</b> kg</span>
    ${totG>0?`<span><b>${totG.toLocaleString('es-CL')}</b> g</span>`:''}
    <span><b>${totU.toLocaleString('es-CL')}</b> unidades</span>
    <span><b>$${Math.round(totD).toLocaleString('es-CL')}</b></span>
  `;
}

function agregarPedidoALaHoja(){
  const cliente = document.getElementById('clienteInput').value.trim();
  const statusEl = document.getElementById('statusMsg');
  if(!cliente){
    statusEl.innerHTML = '<div class="status-msg warn">Falta el nombre del cliente.</div>';
    return;
  }
  const items = itemsEnRevision.filter(it => it.producto.trim() !== '');
  if(items.length === 0){
    statusEl.innerHTML = '<div class="status-msg warn">Agrega al menos un producto.</div>';
    return;
  }

  const esFiado = document.getElementById('fiadoCheckbox').checked;

  if(editingIndex !== null){
    // Actualiza un pedido ya existente en la hoja (no vuelve a registrar venta ni fiado)
    pedidosPendientes[editingIndex].cliente = cliente;
    pedidosPendientes[editingIndex].items = JSON.parse(JSON.stringify(items));
    editingIndex = null;
    document.getElementById('btnCancelarEdicion').style.display = 'none';
    statusEl.innerHTML = '<div class="status-msg ok">Pedido actualizado.</div>';
  } else {
    const pedidoObj = {
      cliente,
      items: JSON.parse(JSON.stringify(items)),
      fecha: new Date().toISOString(),
      diaISO: fechaLocalISO(),
      fiado: esFiado
    };
    pedidosPendientes.push(pedidoObj);
    registrarVenta(pedidoObj);

    if(esFiado){
      const totD = items.reduce((a, it) => a + it.precio, 0);
      let c = buscarCliente(cliente);
      if(!c){
        c = {nombre: cliente, direccion: '', telefono: '', deuda: 0};
        clientes.push(c);
      }
      c.deuda = (c.deuda || 0) + totD;
      renderClientes();
      renderClientesDatalist();
      guardarClientes();
    }
    statusEl.innerHTML = '<div class="status-msg ok">Pedido agregado a la hoja.</div>';
  }

  // reset del formulario
  document.getElementById('clienteInput').value = '';
  document.getElementById('textoInput').value = '';
  document.getElementById('fiadoCheckbox').checked = false;
  document.getElementById('revisionWrap').style.display = 'none';
  itemsEnRevision = [];

  renderPedidosPendientes();
  guardarPedidosPendientes();
  renderReporte();
}

function editarPedidoPendiente(i){
  const p = pedidosPendientes[i];
  document.getElementById('clienteInput').value = p.cliente;
  itemsEnRevision = JSON.parse(JSON.stringify(p.items));
  editingIndex = i;
  document.getElementById('revisionWrap').style.display = 'block';
  document.getElementById('btnCancelarEdicion').style.display = 'block';
  document.getElementById('statusMsg').innerHTML = '<div class="status-msg warn">Editando el pedido de ' + escapeHtml(p.cliente) + '. Corrige y guarda, o cancela.</div>';
  renderItemsRevision();
  document.getElementById('clienteInput').scrollIntoView({behavior: 'smooth', block: 'center'});
}
function cancelarEdicion(){
  editingIndex = null;
  itemsEnRevision = [];
  document.getElementById('clienteInput').value = '';
  document.getElementById('textoInput').value = '';
  document.getElementById('revisionWrap').style.display = 'none';
  document.getElementById('btnCancelarEdicion').style.display = 'none';
  document.getElementById('statusMsg').innerHTML = '';
}

function eliminarPedidoPendiente(i){
  pedidosPendientes.splice(i,1);
  renderPedidosPendientes();
  guardarPedidosPendientes();
}
function vaciarHoja(){
  if(pedidosPendientes.length === 0) return;
  if(confirm('¿Vaciar todos los pedidos de la hoja actual?')){
    pedidosPendientes = [];
    renderPedidosPendientes();
    guardarPedidosPendientes();
  }
}

function renderPedidosPendientes(){
  const cont = document.getElementById('pedidosLista');
  const empty = document.getElementById('pedidosEmpty');
  const count = document.getElementById('pedidosCount');
  const btnGen = document.getElementById('btnGenerar');
  const pageHint = document.getElementById('pageHint');

  count.textContent = pedidosPendientes.length;
  btnGen.disabled = pedidosPendientes.length === 0;

  const porHoja = config.pedidosPorHoja || 3;

  if(pedidosPendientes.length === 0){
    cont.innerHTML = '';
    empty.style.display = 'block';
    pageHint.textContent = `Se agrupan de a ${porHoja} pedidos por hoja de Word.`;
    return;
  }
  empty.style.display = 'none';
  const totalHojas = Math.ceil(pedidosPendientes.length / porHoja);
  pageHint.textContent = `${pedidosPendientes.length} pedido(s) → ${totalHojas} hoja(s) de papel (${porHoja} por hoja).`;

  cont.innerHTML = pedidosPendientes.map((pedido, i) => {
    const totK = pedido.items.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
    const totG = pedido.items.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
    const totU = pedido.items.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
    const totD = pedido.items.reduce((a,it)=>a+it.precio,0);
    const hoja = Math.floor(i/porHoja)+1;
    const fechaHoy = new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit',year:'numeric'});
    return `
      <div class="ticket">
        <div class="ticket-head"><span class="cliente">${escapeHtml(pedido.cliente)}</span><span class="ticket-num">📅 ${fechaHoy} · Hoja ${hoja}</span></div>
        <ul>${pedido.items.map(it => `<li><span>${emojiParaProducto(it.producto)} ${escapeHtml(it.producto)}</span><span>${it.cantidad} ${it.unidad}</span></li>`).join('')}</ul>
        <div class="ticket-foot">${totK>0?`<span>${totK} kg</span>`:''}${totG>0?`<span>${totG} g</span>`:''}${totU>0?`<span>${totU} unidades</span>`:''}${totD>0?`<span>$${Math.round(totD).toLocaleString('es-CL')}</span>`:''}</div>
        <div class="ticket-actions"><button data-action="editarPedidoPendiente" data-index="${i}">✏️ Editar</button><button data-action="eliminarPedidoPendiente" data-index="${i}">🗑️ Eliminar</button></div>
      </div>`;
  }).join('');
}

// ---------- Generar Word ----------
function generarWord(){
  if(pedidosPendientes.length === 0) return;
  generarWordDesdeLista(pedidosPendientes);

  historialPedidos.push({
    fecha: new Date().toISOString(),
    pedidos: JSON.parse(JSON.stringify(pedidosPendientes))
  });
  guardarHistorial();
  renderHistorial();
}

function generarWordDesdeLista(lista){
  if(!lista || lista.length === 0) return;
  const fecha = new Date().toLocaleDateString('es-CL');
  const porHoja = config.pedidosPorHoja || 3;

  const chunks = [];
  for(let i=0;i<lista.length;i+=porHoja) chunks.push(lista.slice(i,i+porHoja));

  const fontSize = porHoja >= 4 ? '10.5px' : (porHoja <= 2 ? '13px' : '12px');
  // Encabezado (logo + nombre/info del negocio) eliminado a propósito: ocupa
  // espacio y no es necesario, así entran más pedidos por hoja al imprimir.

  let bodyHtml = '';
  chunks.forEach((chunk, ci) => {
    bodyHtml += `<div style="${ci>0?'page-break-before:always;':''}">`;
    chunk.forEach(pedido => {
      const totK = pedido.items.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
      const totG = pedido.items.filter(it=>it.unidad==='g').reduce((a,it)=>a+it.cantidad,0);
      const totU = pedido.items.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
      const totD = pedido.items.reduce((a,it)=>a+it.precio,0);
      let totalTxt = [];
      if(totK>0) totalTxt.push(totK.toLocaleString('es-CL')+' kg');
      if(totG>0) totalTxt.push(totG.toLocaleString('es-CL')+' g');
      if(totU>0) totalTxt.push(totU.toLocaleString('es-CL')+' unidades');
      if(totD>0) totalTxt.push('$'+Math.round(totD).toLocaleString('es-CL'));
      const fiadoTxt = pedido.fiado ? ' (FIADO)' : '';

      bodyHtml += `
        <table class="pedido-tabla">
          <tr><td colspan="4" class="cliente-cell">Cliente: ${escapeHtml(pedido.cliente)}${fiadoTxt}</td></tr>
          <tr class="header-row"><th>Producto</th><th>Cantidad</th><th>Unidad</th><th>Subtotal</th></tr>
          ${pedido.items.map(it => `<tr><td>${escapeHtml(it.producto)}</td><td>${it.cantidad}</td><td>${it.unidad}</td><td>${it.precio>0 ? '$'+Math.round(it.precio).toLocaleString('es-CL') : '-'}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="4">Total: ${totalTxt.join(' | ') || '-'}</td></tr>
        </table>
        <div style="height:14px;"></div>
      `;
    });
    bodyHtml += `</div>`;
  });

  const fullHtml = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset="utf-8"><title>Pedidos</title>
  <style>
    @page{size:A4;margin:14mm;}
    body{font-family:Calibri,Arial,sans-serif;font-size:${fontSize};color:#222;}
    table.pedido-tabla{width:100%;border-collapse:collapse;margin-bottom:6px;border:1.5px solid #2F5233;}
    table.pedido-tabla td, table.pedido-tabla th{border:1px solid #6B9362;padding:4px 6px;}
    .cliente-cell{background:#2F5233;color:#fff;font-weight:bold;font-size:${porHoja>=4?'11.5px':'13px'};}
    .header-row th{background:#EDE6D0;text-align:left;}
    .total-row td{font-weight:bold;background:#F7F4EA;}
  </style></head>
  <body>
  <p style="text-align:right;font-size:10px;color:#777;">Generado ${fecha}</p>
  ${bodyHtml}
  </body></html>`;

  const blob = new Blob(['\ufeff', fullHtml], {type: 'application/msword'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `pedidos_${fecha.replace(/\//g,'-')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  document.getElementById('statusMsg').innerHTML = '<div class="status-msg ok">Documento generado y descargado.</div>';
}


// ================= v0.5.0 SEGURIDAD WEB =================
// Bug: CSP script-src 'self' bloquea handlers inline (onclick="..."). Por eso Analizar no hacia nada en GitHub Pages y si en Netlify (sin CSP).
// Fix: 0 handlers inline, todo con addEventListener + delegacion. Permite CSP estricta sin unsafe-inline en scripts (OWASP).
function sanitizarTexto(v, maxLen){
  if(typeof v !== 'string') return '';
  return v.trim().slice(0, maxLen || 200);
}
function validarNumero(v, min, max){
  const n = parseFloat(v);
  if(!Number.isFinite(n)) return 0;
  if(min !== undefined && n < min) return min;
  if(max !== undefined && n > max) return max;
  return n;
}
function validarArchivoLogo(file){
  if(!file) return {ok:false, msg:'Sin archivo'};
  if(!file.type || !file.type.startsWith('image/')) return {ok:false, msg:'El logo debe ser una imagen'};
  if(file.size > 2*1024*1024) return {ok:false, msg:'El logo debe pesar menos de 2MB'};
  return {ok:true};
}
document.addEventListener('click', function(e){
  const btn = e.target.closest('[data-action]');
  if(!btn) return;
  const action = btn.getAttribute('data-action');
  const idx = parseInt(btn.getAttribute('data-index'), 10);
  if(!Number.isFinite(idx)) return;
  const acciones = { abonarDeuda, eliminarCliente, reimprimirHistorial, eliminarHistorial, eliminarProductoCatalogo, quitarItemRevision, editarPedidoPendiente, eliminarPedidoPendiente };
  const fn = acciones[action];
  if(typeof fn === 'function') fn(idx);
});
document.addEventListener('change', function(e){
  const el = e.target;
  if(!el || !el.getAttribute('data-item-input')) return;
  const idx = parseInt(el.getAttribute('data-index'), 10);
  const field = el.getAttribute('data-field');
  if(!Number.isFinite(idx) || !itemsEnRevision[idx]) return;
  if(field === 'producto') itemsEnRevision[idx].producto = sanitizarTexto(el.value, 120);
  if(field === 'cantidad') itemsEnRevision[idx].cantidad = validarNumero(el.value, 0, 10000);
  if(field === 'unidad'){ const permitidas = ['kg','g','unidad']; if(permitidas.includes(el.value)) itemsEnRevision[idx].unidad = el.value; }
  if(field === 'precio') itemsEnRevision[idx].precio = validarNumero(el.value, 0, 10000000);
  if(typeof actualizarTotalesPreview === 'function') actualizarTotalesPreview();
});
document.addEventListener('input', function(e){
  const el = e.target;
  if(el && el.id === 'catBuscar' && typeof renderCatalogo === 'function') renderCatalogo();
});
function cablearEventosEstaticos(){
  const mapa = [
    ['btnQuitarLogo','click', function(){ if(typeof quitarLogo==='function') quitarLogo(); }],
    ['btnAgregarProductoCatalogo','click', function(){ if(typeof agregarProductoCatalogo==='function') agregarProductoCatalogo(); }],
    ['btnExportarCatalogoCSV','click', function(){ if(typeof exportarCatalogoCSV==='function') exportarCatalogoCSV(); }],
    ['btnExportarBaseDatosCSV','click', function(){ if(typeof exportarBaseDatosCSV==='function') exportarBaseDatosCSV(); }],
    ['btnAgregarCliente','click', function(){ if(typeof agregarCliente==='function') agregarCliente(); }],
    ['btnAnalizarPedido','click', function(){ if(typeof analizarPedido==='function') analizarPedido(); }],
    ['btnAgregarLineaManual','click', function(){ if(typeof agregarLineaManual==='function') agregarLineaManual(); }],
    ['btnAgregarPedidoALaHoja','click', function(){ if(typeof agregarPedidoALaHoja==='function') agregarPedidoALaHoja(); }],
    ['btnCancelarEdicion','click', function(){ if(typeof cancelarEdicion==='function') cancelarEdicion(); }],
    ['btnGenerar','click', function(){ if(typeof generarWord==='function') generarWord(); }],
    ['btnVaciarHoja','click', function(){ if(typeof vaciarHoja==='function') vaciarHoja(); }],
    ['negNombre','change', function(){ if(typeof actualizarNombreNegocio==='function') actualizarNombreNegocio(); }],
    ['negInfo','change', function(){ if(typeof actualizarInfoNegocio==='function') actualizarInfoNegocio(); }],
    ['pedidosPorHojaSelect','change', function(){ if(typeof actualizarPedidosPorHoja==='function') actualizarPedidosPorHoja(); }],
    ['reporteFecha','change', function(){ if(typeof renderReporte==='function') renderReporte(); }],
  ];
  mapa.forEach(function(item){
    const el = document.getElementById(item[0]);
    if(el) el.addEventListener(item[1], item[2]);
  });
  const logoInput = document.getElementById('negLogo');
  if(logoInput){
    logoInput.addEventListener('change', function(){
      const f = logoInput.files && logoInput.files[0];
      const v = validarArchivoLogo(f);
      if(!v.ok){ alert(v.msg); logoInput.value=''; return; }
      if(typeof cargarLogo==='function') cargarLogo(logoInput);
    });
  }
}
// ================= FIN v0.5.0 =================
// init v0.9.6: cada paso en try/catch, un render fallido no tumba el resto
try{ cablearEventosEstaticos(); }catch(e){ console.error('init cablear', e); }
try{ cargarConfig(); }catch(e){ console.error('init cargarConfig', e); }
try{ cargarCatalogo(); }catch(e){ console.error('init cargarCatalogo', e); }
try{ cargarClientes(); }catch(e){ console.error('init cargarClientes', e); }
try{ cargarPedidosPendientes(); }catch(e){ console.error('init cargarPedidos', e); }
try{ renderPedidosPendientes(); }catch(e){ console.error('init renderPedidos', e); }
try{ cargarHistorial(); }catch(e){ console.error('init cargarHistorial', e); }
try{ cargarVentasLog(); }catch(e){ console.error('init cargarVentas', e); }
const _rf = document.getElementById('reporteFecha'); if(_rf) _rf.value = fechaLocalISO();
try{ renderReporte(); }catch(e){ console.error('init renderReporte', e); }

// ================= v0.7.0 - Compartir por WhatsApp =================
// Flujo local: 1) llega pedido a WhatsApp 2) copiar 3) pegar en app anclada 4) Analizar
// 5) pesar y poner valor 6) Generar Word para imprimir y corchetear en la caja
// 7) NUEVO: Compartir por WhatsApp - genera texto listo para enviar al cliente:
// "Hola {cliente}, tu pedido en El Castillo: - 2 kg Tomate $... Total $... Revisa tu hoja impresa en la caja. Gracias!"
function construirMensajeWhatsApp(){
  const cliente = (document.getElementById('clienteInput').value || '').trim() || 'Cliente';
  const items = itemsEnRevision.filter(it => it.producto && it.producto.trim() !== '');
  if(items.length === 0) return null;
  const lineas = items.map(it => `- ${it.cantidad} ${it.unidad} ${it.producto} - $${Math.round(it.precio || 0).toLocaleString('es-CL')}`);
  const total = items.reduce((a,it)=>a+(it.precio||0),0);
  const totalKg = items.filter(it=>it.unidad==='kg').reduce((a,it)=>a+it.cantidad,0);
  const totalUn = items.filter(it=>it.unidad==='unidad').reduce((a,it)=>a+it.cantidad,0);
  let msg = `Hola ${cliente}, tu pedido en El Castillo de la Fruta:\n${lineas.join('\n')}\n`;
  if(totalKg>0) msg += `Total kilos: ${totalKg} kg\n`;
  if(totalUn>0) msg += `Total unidades: ${totalUn}\n`;
  msg += `Total: $${Math.round(total).toLocaleString('es-CL')}\nRevisa tu hoja impresa que va corcheteada en tu caja. ¡Gracias!`;
  return msg;
}
function compartirPorWhatsApp(){
  const msg = construirMensajeWhatsApp();
  const statusEl = document.getElementById('statusMsg');
  if(!msg){
    if(statusEl) statusEl.innerHTML = '<div class="status-msg warn">Primero analiza el pedido y agrega productos para compartir.</div>';
    return;
  }
  const url = 'https://wa.me/?text=' + encodeURIComponent(msg);
  window.open(url, '_blank', 'noopener');
  if(statusEl) statusEl.innerHTML = '<div class="status-msg ok">Mensaje listo para WhatsApp. Elige al cliente y envíalo. La hoja Word sigue lista para imprimir.</div>';
}
// Cablear boton WhatsApp (seguro, sin inline)
document.addEventListener('DOMContentLoaded', function(){
  const b = document.getElementById('btnCompartirWhatsApp');
  if(b) b.addEventListener('click', compartirPorWhatsApp);
});
// Fallback si DOMContentLoaded ya paso
(function(){
  const b = document.getElementById('btnCompartirWhatsApp');
  if(b && !b.dataset.cableado){ b.dataset.cableado='1'; b.addEventListener('click', compartirPorWhatsApp); }
})();

// ================= v0.8.0 - Clean UI: emoji, badges, bottom nav, carrito =================
function emojiParaProducto(nombre){
  const n = (nombre||'').toLowerCase();
  if(n.includes('pepino')) return '🥒';
  if(n.includes('tomate')) return '🍅';
  if(n.includes('zanahoria')) return '🥕';
  if(n.includes('lechuga')) return '🥬';
  if(n.includes('palta')||n.includes('aguacate')) return '🥑';
  if(n.includes('manzana')) return '🍎';
  if(n.includes('naranja')) return '🍊';
  if(n.includes('plátano')||n.includes('platano')||n.includes('banana')) return '🍌';
  if(n.includes('pera')) return '🍐';
  if(n.includes('uva')) return '🍇';
  if(n.includes('frutilla')||n.includes('fresa')) return '🍓';
  if(n.includes('limón')||n.includes('limon')) return '🍋';
  if(n.includes('cebolla')) return '🧅';
  if(n.includes('papa')||n.includes('patata')) return '🥔';
  if(n.includes('huevo')) return '🥚';
  if(n.includes('pimiento')||n.includes('piment')) return '🫑';
  if(n.includes('zapallo')||n.includes('calabaza')) return '🎃';
  if(n.includes('sandía')||n.includes('sandia')) return '🍉';
  if(n.includes('melón')||n.includes('melon')) return '🍈';
  if(n.includes('kiwi')) return '🥝';
  if(n.includes('choclo')||n.includes('maíz')||n.includes('maiz')) return '🌽';
  return '🥦';
}
// Envolver botones principales en flex cuando existen
function agruparAccionesPrincipales(){
  const wa = document.getElementById('btnCompartirWhatsApp');
  const word = document.getElementById('btnGenerar');
  if(wa && word && !wa.parentElement.classList.contains('acciones-principales')){
    const wrap = document.createElement('div');
    wrap.className = 'acciones-principales';
    wa.parentNode.insertBefore(wrap, wa);
    wrap.appendChild(wa); wrap.appendChild(word);
    wa.textContent = '💬 Compartir WhatsApp';
    word.textContent = '📄 Generar Word';
  }
}
// Bottom nav: scroll suave a secciones, sin esconder nada para no romper flujo
function initBottomNav(){ return; /* v0.9.6: los tabs los maneja showTab, este nav viejo solo hacia scroll y peleaba */ }
function actualizarCarrito(){
  const el = document.getElementById('cartCount');
  if(!el) return;
  const n = (typeof pedidosPendientes !== 'undefined' ? pedidosPendientes.length : 0) + (typeof itemsEnRevision !== 'undefined' && itemsEnRevision.length>0 ? 1 : 0);
  el.textContent = Math.max(n, 0);
  el.style.display = n===0 ? 'none' : 'flex';
}
document.addEventListener('DOMContentLoaded', ()=>{ agruparAccionesPrincipales(); initBottomNav(); actualizarCarrito(); });
setTimeout(()=>{ agruparAccionesPrincipales(); actualizarCarrito(); }, 800);

// v0.8.1 bottom nav DESACTIVADO en v0.9.6 - lo maneja showTab, el viejo solo hacia scroll
(function(){ return; })();

// ================= v0.9.1 Tabs independientes =================
function showTab(tab){ if(!tab) return;
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  const page = document.getElementById('tab-'+tab);
  if(page) page.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(b=>{
    const isActive = b.dataset.nav===tab;
    b.classList.toggle('active', isActive);
    b.style.background = isActive ? '#F0FDF4' : 'none';
    b.style.color = isActive ? '#14532D' : '#9CA3AF';
  });
  window.scrollTo({top:0, behavior:'instant'});
  try{ localStorage.setItem('castillo_tab_activa', tab); }catch(e){}
  if(tab==='clientes'){ if(typeof renderReporte==='function') renderReporte(); if(typeof renderClientesAutomaticos==='function') renderClientesAutomaticos(); }
  if(tab==='productos' && typeof renderListaProductosConfig==='function') renderListaProductosConfig();
  if(tab==='pedidos' && typeof renderPedidosPendientes==='function') renderPedidosPendientes();
}
function initTabsV091(){
  document.querySelectorAll('.nav-item').forEach(b=>{
    b.addEventListener('click', ()=> showTab(b.dataset.nav));
  });
  const cart = document.getElementById('btnCarrito');
  if(cart) cart.addEventListener('click', ()=> showTab('pedidos'));
  // Flujo: al agregar a la hoja, saltar a Pedidos
  const btnAdd = document.getElementById('btnAgregarPedidoALaHoja');
  if(btnAdd) btnAdd.addEventListener('click', ()=> setTimeout(()=> showTab('pedidos'), 250));
  // Al editar, volver a Inicio
  document.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-action="editarPedidoPendiente"]');
    if(btn) setTimeout(()=> showTab('inicio'), 100);
  });
  // Tab guardada o Inicio por defecto
  let saved = 'inicio';
  try{ saved = localStorage.getItem('castillo_tab_activa') || 'inicio'; }catch(e){}
  if(!['inicio','pedidos','clientes','productos'].includes(saved)) saved='inicio';
  showTab(saved);
}
document.addEventListener('DOMContentLoaded', initTabsV091);

// ================= v0.9.6 CORREGIDA: productos nuevos + clientes automaticos =================
// Negocio fijo - ya no se edita
const NEGOCIO_FIJO = { nombre: 'El Castillo de la Fruta', direccion: '', telefono: '' };
function normTxt(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim(); }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; const d=Array.from({length:m+1},(_,i)=>[i]); for(let j=1;j<=n;j++) d[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ d[i][j]=Math.min(d[i-1][j]+1, d[i][j-1]+1, d[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return d[m][n]; }
function buscarProductoParecido(nombreMal){
  const n = normTxt(nombreMal);
  if(!n) return null;
  let catalogo = [];
  try{ catalogo = JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e){}
  // 1) alias exacto
  for(const p of catalogo){ const alias = (p.alias||'').split(',').map(normTxt); if(alias.includes(n)) return {producto:p, tipo:'alias'}; }
  // 2) parecido por distancia (tolera 1-2 letras mal escritas: tomte -> tomate, savahoria -> zanahoria)
  let mejor=null, mejorDist=99;
  for(const p of catalogo){ const d = lev(n, normTxt(p.nombre||p.name||'')); if(d<mejorDist){ mejorDist=d; mejor=p; } }
  const umbral = n.length<=4 ? 1 : 2;
  if(mejor && mejorDist<=umbral) return {producto:mejor, tipo:'parecido', dist:mejorDist};
  return null;
}
window.buscarProductoParecido = buscarProductoParecido;
// Mostrar aviso cuando un producto del pedido no se reconocio
function mostrarProductosNoReconocidos(noReconocidos){
  const wrap = document.getElementById('revisionWrap');
  if(!wrap || !noReconocidos || !noReconocidos.length) return;
  const items = noReconocidos.map(n=>{
    const sug = buscarProductoParecido(n);
    const btnSug = sug ? `<button data-corregir-a="${(sug.producto.nombre||sug.producto.name||'').replace(/"/g,'')}" data-corregir-de="${n.replace(/"/g,'')}" style="margin-left:6px;padding:6px 10px;border:none;border-radius:999px;background:#14532D;color:#fff;font-weight:700;font-size:12px;">Usar ${(sug.producto.nombre||sug.producto.name)}</button>` : '';
    return `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span>⚠️ <b>${n}</b> no está en la lista.</span>${btnSug}<button data-agregar-nuevo="${n.replace(/"/g,'')}" style="padding:6px 10px;border:1px solid #14532D;border-radius:999px;background:#fff;color:#14532D;font-weight:700;font-size:12px;">＋ Agregar como nuevo</button></div>`;
  }).join('');
  const div = document.createElement('div');
  div.id='avisoNoReconocidos';
  div.style.cssText='background:#FFFBEB;border:1px solid #FDE68A;border-radius:14px;padding:12px;margin:10px 0;';
  div.innerHTML = `<b>¿El cliente escribió mal un producto?</b><p style="margin:4px 0 8px;color:#6B7280;font-size:13px;">No se perdió. Elige corregirlo o agrégalo como producto nuevo y la próxima vez ya lo va a reconocer.</p>${items}`;
  const old = document.getElementById('avisoNoReconocidos'); if(old) old.remove();
  wrap.prepend(div);
  div.querySelectorAll('[data-agregar-nuevo]').forEach(b=> b.addEventListener('click', ()=>{
    const nombre = b.dataset.agregarNuevo;
    document.getElementById('nuevoProdNombre').value = nombre;
    showTab('productos');
    document.getElementById('nuevoProdNombre').focus();
  }));
  div.querySelectorAll('[data-corregir-a]').forEach(b=> b.addEventListener('click', ()=>{
    // Reemplaza el texto en el textarea y re-analiza
    const ta = document.getElementById('pedidoTexto') || document.querySelector('textarea');
    if(ta){ ta.value = ta.value.split(b.dataset.corregirDe).join(b.dataset.corregirA); const btn = document.getElementById('btnAnalizar'); if(btn) btn.click(); }
  }));
}
window.mostrarProductosNoReconocidos = mostrarProductosNoReconocidos;
// --- Agregar producto nuevo ---
function initAgregarProductoNuevo(){
  const btn = document.getElementById('btnAgregarProductoNuevo'); if(!btn) return;
  const unidadSel = document.getElementById('nuevoProdUnidad');
  if(unidadSel) unidadSel.addEventListener('change', ()=>{ document.getElementById('nuevoProdUnidadLabel').textContent = unidadSel.value; });
  btn.addEventListener('click', ()=>{
    const nombre = (document.getElementById('nuevoProdNombre').value||'').trim();
    const unidad = unidadSel.value||'kg';
    const precio = parseFloat(document.getElementById('nuevoProdPrecio').value||'0')||0;
    const alias = (document.getElementById('nuevoProdAlias').value||'').trim();
    const msg = document.getElementById('msgNuevoProducto');
    if(!nombre){ msg.textContent='Escribe el nombre del producto.'; msg.style.color='#B91C1C'; return; }
    let cat=[]; try{ cat=JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e){}
    if(cat.some(p=> normTxt(p.nombre||p.name)==normTxt(nombre))){ msg.textContent='Ese producto ya está en la lista.'; msg.style.color='#B91C1C'; return; }
    cat.push({ nombre, name:nombre, unidad, precio, alias });
    localStorage.setItem('castillo_catalogo', JSON.stringify(cat));
    // Tambien probar otras claves que use la app vieja
    try{ localStorage.setItem('catalogo', JSON.stringify(cat)); }catch(e){}
    msg.textContent = `✅ ${nombre} agregado. Ya lo puedes usar en el próximo pedido.`; msg.style.color='#14532D';
    document.getElementById('nuevoProdNombre').value=''; document.getElementById('nuevoProdPrecio').value=''; document.getElementById('nuevoProdAlias').value='';
    renderListaProductosConfig();
    if(typeof renderCatalogo==='function') renderCatalogo();
  });
  const busc = document.getElementById('buscarProductoNuevo');
  if(busc) busc.addEventListener('input', renderListaProductosConfig);
}
function renderListaProductosConfig(){
  const cont = document.getElementById('listaProductosConfig'); if(!cont) return;
  let cat=[]; try{ cat=JSON.parse(localStorage.getItem('castillo_catalogo')||'[]'); }catch(e){}
  const q = normTxt(document.getElementById('buscarProductoNuevo')?.value||'');
  const filtrados = q ? cat.filter(p=> normTxt(p.nombre||p.name).includes(q)) : cat;
  const c2 = document.getElementById('catCount2'); if(c2) c2.textContent = cat.length;
  const cOld = document.getElementById('catCount'); if(cOld) cOld.textContent = cat.length;
  if(!filtrados.length){ cont.innerHTML='<p style="color:#6B7280;font-size:13px;">Sin productos con ese nombre. Agrégalo arriba.</p>'; return; }
  cont.innerHTML = filtrados.slice(-50).reverse().map(p=>`<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid #F3F4F6;"><span><b>${p.nombre||p.name}</b> <span style="color:#6B7280;">· ${p.unidad||'kg'}</span></span><b>$${(p.precio||0).toLocaleString('es-CL')}</b></div>`).join('');
}
// --- Clientes automaticos desde pedidos ---
function obtenerClientesAutomaticos(){
  // Fuente 1: pedidos pendientes + historial guardado
  let pedidos=[];
  try{ pedidos = JSON.parse(localStorage.getItem('castillo_pedidos')||localStorage.getItem('pedidosPendientes')||'[]'); }catch(e){}
  try{ const hist = JSON.parse(localStorage.getItem('castillo_historial')||'[]'); if(Array.isArray(hist)) pedidos = pedidos.concat(hist); }catch(e){}
  // Fuente 2: si la app guarda clientes viejos, los mezcla sin duplicar
  let viejos=[]; try{ viejos = JSON.parse(localStorage.getItem('castillo_clientes')||'[]'); }catch(e){}
  const mapa = new Map();
  const agregar = (nombre, info)=>{
    if(!nombre) return; const key = normTxt(nombre);
    if(!mapa.has(key)) mapa.set(key, { nombre: nombre.trim(), pedidos:0, total:0, productos:{}, localidad:'', telefono:'', correo:'', ultima:'', semanas:new Set() });
    const c = mapa.get(key); c.pedidos++; c.total += (info.total||0);
    (info.productos||[]).forEach(pr=>{ const k=pr.nombre||pr.name||pr; c.productos[k]=(c.productos[k]||0)+(pr.kg||pr.cantidad||1); });
    if(info.localidad) c.localidad=info.localidad; if(info.telefono) c.telefono=info.telefono; if(info.correo) c.correo=info.correo;
    if(info.fecha){ c.ultima=info.fecha; const d=new Date(info.fecha); const lunes=new Date(d); lunes.setDate(d.getDate()-((d.getDay()+6)%7)); c.semanas.add(lunes.toISOString().slice(0,10)); }
  };
  pedidos.forEach(p=> agregar(p.cliente||p.nombre||p.clienteNombre, { total:p.total||p.monto||0, productos:p.productos||p.items||[], localidad:p.localidad||p.direccion||p.direc, telefono:p.telefono||p.fono, correo:p.correo||p.email, fecha:p.fecha||p.createdAt }));
  viejos.forEach(v=> agregar(v.nombre||v.name, { localidad:v.localidad||v.direccion, telefono:v.telefono||v.fono, correo:v.correo||v.email }));
  return [...mapa.values()].sort((a,b)=> b.pedidos - a.pedidos);
}
function renderClientesAutomaticos(){
  const cont = document.getElementById('listaClientesAuto'); if(!cont) return;
  let lista = obtenerClientesAutomaticos();
  const q = normTxt(document.getElementById('buscarCliente')?.value||'');
  if(q) lista = lista.filter(c=> normTxt(c.nombre).includes(q) || normTxt(c.localidad).includes(q));
  const filtro = document.querySelector('.chip-semana.activo')?.dataset.filtroSemana || 'todas';
  if(filtro!=='todas'){
    const hoy=new Date(); const lunes=new Date(hoy); lunes.setDate(hoy.getDate()-((hoy.getDay()+6)%7));
    const semanaEsta = lunes.toISOString().slice(0,10);
    const lunesAnt = new Date(lunes); lunesAnt.setDate(lunes.getDate()-7); const semanaAnt = lunesAnt.toISOString().slice(0,10);
    lista = lista.filter(c=> c.semanas.has(filtro==='esta'? semanaEsta : semanaAnt));
  }
  const msg = document.getElementById('msgClientesAuto');
  if(!lista.length){ cont.innerHTML=''; if(msg) msg.textContent = 'Aún no hay clientes. Pega un pedido en Inicio y acá va a aparecer solo.'; return; }
  if(msg) msg.textContent = `${lista.length} cliente(s) · Ordenados por los que más piden`;
  cont.innerHTML = lista.map(c=>{
    const top = Object.entries(c.productos).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([n,k])=> `${n} (${k} kg)`).join(' · ') || 'Sin detalle de productos todavía';
    const contacto = [c.localidad, c.telefono, c.correo].filter(Boolean).join(' · ');
    return `<article style="background:#fff;border:1px solid #E8EDE9;border-radius:16px;padding:14px;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;"><b style="font-size:16px;">${c.nombre}</b><span style="background:#F0FDF4;color:#14532D;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${c.pedidos} pedido(s)</span></div>
      ${contacto? `<p style="margin:6px 0 0;color:#4B5563;font-size:13px;">${contacto}</p>` : `<p style="margin:6px 0 0;color:#9CA3AF;font-size:13px;">Sin localidad / teléfono todavía — agrégalo cuando lo tengas</p>`}
      <p style="margin:8px 0 0;font-size:13px;"><span style="color:#6B7280;">Siempre lleva:</span> <b>${top}</b></p>
      <p style="margin:4px 0 0;font-size:13px;color:#6B7280;">Total: <b style="color:#111;">$${c.total.toLocaleString('es-CL')}</b> · Último: ${c.ultima? new Date(c.ultima).toLocaleDateString('es-CL') : '—'}</p>
      <button data-pedido-cliente="${c.nombre.replace(/"/g,'')}" style="margin-top:10px;padding:8px 14px;border:1px solid #E5E7EB;border-radius:999px;background:#fff;font-weight:700;font-size:13px;">＋ Nuevo pedido para ${c.nombre.split(' ')[0]}</button>
    </article>`;
  }).join('');
  cont.querySelectorAll('[data-pedido-cliente]').forEach(b=> b.addEventListener('click', ()=>{
    const input = document.getElementById('clienteNombre') || document.querySelector('input[placeholder*="cliente" i]');
    if(input) input.value = b.dataset.pedidoCliente;
    showTab('inicio');
  }));
}
function initClientesAutomaticos(){
  const busc = document.getElementById('buscarCliente'); if(busc) busc.addEventListener('input', renderClientesAutomaticos);
  document.querySelectorAll('.chip-semana').forEach(ch=> ch.addEventListener('click', ()=>{
    document.querySelectorAll('.chip-semana').forEach(x=>{ x.classList.remove('activo'); x.style.background='#fff'; x.style.color='#111'; x.style.borderColor='#E5E7EB'; });
    ch.classList.add('activo'); ch.style.background='#14532D'; ch.style.color='#fff'; ch.style.borderColor='#14532D';
    renderClientesAutomaticos();
  }));
  const chip0 = document.querySelector('.chip-semana'); if(chip0) chip0.classList.add('activo');
}
document.addEventListener('DOMContentLoaded', ()=>{ initAgregarProductoNuevo(); initClientesAutomaticos(); renderListaProductosConfig(); renderClientesAutomaticos(); });
