// El Castillo - v0.9.6 Tabs independientes
// Este archivo NO depende de app.js. Carga antes que app.js.
// Aunque app.js se caiga, las pestanas siguen funcionando.
// Sin inline: cumple CSP estricta (script-src 'self').
(function(){
  function showTab(tab){
    if(!tab) return;
    var pages = document.querySelectorAll('.tab-page');
    for(var i=0;i<pages.length;i++) pages[i].classList.remove('active');
    var page = document.getElementById('tab-'+tab);
    if(page) page.classList.add('active');
    var btns = document.querySelectorAll('.nav-item');
    for(var j=0;j<btns.length;j++){
      var on = btns[j].getAttribute('data-nav')===tab;
      btns[j].classList.toggle('active', on);
      btns[j].style.background = on ? '#F0FDF4' : 'none';
      btns[j].style.color = on ? '#14532D' : '#9CA3AF';
    }
    window.scrollTo(0,0);
    try{ localStorage.setItem('castillo_tab_activa', tab); }catch(e){}
    // Avisar a app.js si esta vivo, sin romperse si no esta
    try{
      if(tab==='clientes' && typeof window.renderClientesAutomaticos==='function') window.renderClientesAutomaticos();
      if(tab==='productos' && typeof window.renderListaProductosConfig==='function') window.renderListaProductosConfig();
      if(tab==='pedidos' && typeof window.renderPedidosPendientes==='function') window.renderPedidosPendientes();
    }catch(e){}
  }
  window.showTab = showTab;
  window.showTabFallback = showTab;
  // Delegacion: un solo listener en document
  document.addEventListener('click', function(e){
    var t = e.target;
    if(!t || !t.closest) return;
    var b = t.closest('.nav-item');
    if(b && b.getAttribute('data-nav')){ showTab(b.getAttribute('data-nav')); return; }
    var cart = t.closest('#btnCarrito');
    if(cart){ showTab('pedidos'); }
  });
  // Al cargar: mostrar tab guardada o Inicio
  function init(){
    var saved='inicio';
    try{ saved = localStorage.getItem('castillo_tab_activa') || 'inicio'; }catch(e){}
    if(['inicio','pedidos','clientes','productos'].indexOf(saved)===-1) saved='inicio';
    showTab(saved);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
