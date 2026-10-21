/* Painel "Aplicativo e notificações" da página Minha conta */
(function(){
  var P=window.VSPWA, $=function(x){return document.getElementById(x)}, t=VS.t;
  if(!P||!$('app-panel')) return;
  function show(id,on){$(id).classList.toggle('hidden',!on)}
  function render(){
    P.state().then(function(s){
      var is=$('app-state');
      if(s.standalone){is.textContent=t('Instalado neste aparelho.');show('app-install',false)}
      else if(s.installable){is.textContent=t('Abra como um app, direto da tela inicial.');show('app-install',true)}
      else if(s.ios){is.textContent=t('No iPhone ou iPad, instale pelo Safari (veja abaixo).');show('app-install',false)}
      else{is.textContent=t('No menu do navegador, escolha “Instalar app” ou “Adicionar à tela inicial”.');show('app-install',false)}
      show('ios-help',s.ios&&!s.standalone);
      var ps=$('push-state'), pb=$('push-toggle');
      pb.dataset.on=s.subscribed?'1':'';
      if(!s.canPush){ps.textContent=s.ios&&!s.standalone?t('No iPhone, as notificações só funcionam depois de instalar o app na tela inicial.'):t('Este navegador não aceita notificações.');show('push-toggle',false);show('push-test',false)}
      else if(s.permission==='denied'){ps.textContent=t('Bloqueadas neste navegador. Libere nas configurações do site.');show('push-toggle',false);show('push-test',false)}
      else if(s.subscribed){ps.textContent=t('Ativas neste aparelho.');pb.textContent=t('Desativar notificações');pb.className='btn btn-light';show('push-test',true)}
      else{ps.textContent=t('Receba avisos de fatura, como “vence hoje”, e respostas do chat.');pb.textContent=t('Ativar notificações');pb.className='btn btn-dark';show('push-test',false)}
      if(s.canPush&&s.permission!=='denied') show('push-toggle',true);
    });
  }
  $('app-install').onclick=function(){P.install()};
  $('push-toggle').onclick=function(){
    var b=this, was=!!b.dataset.on; b.disabled=true;
    (was?P.disable():P.enable()).then(function(){VS.notice($('n-app'),t(was?'Notificações desativadas neste aparelho.':'Notificações ativadas!'),true)})
      .catch(function(e){VS.notice($('n-app'),e.message)}).then(function(){b.disabled=false;render()});
  };
  $('push-test').onclick=function(){
    var b=this; b.disabled=true;
    VS.api('push/test',{}).then(function(){VS.notice($('n-app'),t('Notificação enviada. Ela deve chegar em instantes.'),true)})
      .catch(function(e){VS.notice($('n-app'),e.message)}).then(function(){b.disabled=false});
  };
  P.onChange(render); VS.onLang.push(render); render();
  if(location.hash==='#app-panel'){var n=0,iv=setInterval(function(){if(!$('account').classList.contains('hidden')){clearInterval(iv);$('app-panel').scrollIntoView({behavior:'smooth',block:'start'})}else if(++n>20)clearInterval(iv)},250)}
})();
