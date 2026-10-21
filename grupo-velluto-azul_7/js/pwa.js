/* App instalável (PWA) + notificações push. Expõe window.VSPWA */
(function(){
  var deferred=null, listeners=[], ua=navigator.userAgent||'';
  var ios=/iphone|ipad|ipod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var hasSW='serviceWorker' in navigator;
  var canPush=hasSW&&'PushManager' in window&&'Notification' in window;
  function standalone(){return (window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true}
  function fire(){menuBtn();listeners.forEach(function(f){try{f()}catch(e){}})}

  function reg(){return hasSW?navigator.serviceWorker.ready:Promise.reject(new Error('sw'))}
  function sub(){return reg().then(function(r){return r.pushManager.getSubscription()}).catch(function(){return null})}
  function key(s){var p='='.repeat((4-s.length%4)%4),r=atob((s+p).replace(/-/g,'+').replace(/_/g,'/')),o=new Uint8Array(r.length);for(var i=0;i<r.length;i++)o[i]=r.charCodeAt(i);return o}

  /* cria (ou reaproveita) a assinatura do aparelho e entrega ao servidor, ligada à conta logada */
  function subscribe(){
    return VS.api('push/key').then(function(k){
      if(!k.enabled) throw new Error(VS.t('Notificações ainda não configuradas no servidor.'));
      return reg().then(function(r){return r.pushManager.getSubscription().then(function(s){return s||r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key(k.key)})})});
    }).then(function(s){return VS.api('push/subscribe',{subscription:s.toJSON()}).then(function(){return s})});
  }
  function enable(){
    if(!canPush) return Promise.reject(new Error(VS.t('Este navegador não aceita notificações.')));
    return Notification.requestPermission().then(function(p){
      if(p!=='granted') throw new Error(VS.t(p==='denied'?'Bloqueadas neste navegador. Libere nas configurações do site.':'Permissão não concedida.'));
      return subscribe();
    }).then(fire);
  }
  function disable(){
    return sub().then(function(s){if(!s)return;return VS.api('push/unsubscribe',{endpoint:s.endpoint}).catch(function(){}).then(function(){return s.unsubscribe()})}).then(fire);
  }
  /* ao sair da conta: o aparelho para de receber os avisos dela (a permissão do navegador continua) */
  function detach(){
    try{Object.keys(sessionStorage).forEach(function(k){if(k.indexOf('vs_push_')===0)sessionStorage.removeItem(k)})}catch(e){}
    return sub().then(function(s){return s?VS.api('push/unsubscribe',{endpoint:s.endpoint}).catch(function(){}):null}).catch(function(){});
  }
  /* já tem permissão: garante que o servidor conhece este aparelho (uma vez por aba e conta) */
  function resync(force){
    if(!canPush||Notification.permission!=='granted') return;
    VS.me().then(function(u){
      if(!u) return; var k='vs_push_'+u.id;
      try{if(!force&&sessionStorage.getItem(k))return;sessionStorage.setItem(k,'1')}catch(e){}
      return subscribe().then(fire);
    }).catch(function(){});
  }
  function state(){
    return sub().then(function(s){return{hasSW:hasSW,canPush:canPush,ios:ios,standalone:standalone(),installable:!!deferred,
      permission:canPush?Notification.permission:'unsupported',subscribed:!!s&&canPush&&Notification.permission==='granted'}});
  }
  function install(){
    if(!deferred) return Promise.resolve(false);
    var d=deferred; deferred=null; d.prompt();
    return d.userChoice.then(function(c){fire();return c.outcome==='accepted'});
  }

  /* botão "Instalar aplicativo" no menu (só aparece quando dá para instalar) */
  function menuBtn(){
    var foot=document.querySelector('.menu-foot'); if(!foot) return;
    var b=foot.querySelector('[data-install]'), show=!standalone()&&(!!deferred||ios);
    if(!show){if(b)b.remove();return}
    if(b) return;
    b=document.createElement('button'); b.type='button'; b.className='btn btn-light'; b.setAttribute('data-install','1'); b.textContent=VS.t('Instalar aplicativo');
    b.onclick=function(){if(deferred)install();else location.href='/my/#app-panel'};
    foot.appendChild(b);
  }
  VS.onLang.push(function(){var b=document.querySelector('[data-install]');if(b)b.textContent=VS.t('Instalar aplicativo')});

  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();deferred=e;fire()});
  window.addEventListener('appinstalled',function(){deferred=null;fire()});
  if(hasSW){
    navigator.serviceWorker.register('/sw.js').then(function(){resync()}).catch(function(){});
    navigator.serviceWorker.addEventListener('message',function(e){if(e.data&&e.data.type==='resubscribe')resync(true)});
  }
  menuBtn();

  window.VSPWA={state:state,install:install,enable:enable,disable:disable,detach:detach,resync:resync,onChange:function(f){listeners.push(f)}};
})();
