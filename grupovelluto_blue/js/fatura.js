(function(){
  var id=new URLSearchParams(location.search).get('id')||'', $=function(x){return document.getElementById(x)}, t=VS.t, inv=null, cust=null;
  function pad(n){return String(n).padStart(2,'0')}
  function late(i){var d=new Date(),h=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());return !i.paid&&i.due_date&&String(i.due_date).slice(0,10)<h}
  function status(i){return i.paid?['ok','Pago']:i.cancel_status==='cancelled'?['','Cancelada']:i.cancel_status==='requested'?['info','Cancelamento solicitado']:late(i)?['err','Vencida']:['warn','Em aberto']}
  function render(){
    if(!inv) return;
    $('loading').classList.add('hidden'); $('view').classList.remove('hidden');
    $('f-num').textContent=t('Fatura')+' #'+String(inv.id).padStart(6,'0');
    var s=status(inv), b=$('f-status'); b.className='badge '+s[0]; b.textContent=t(s[1]);
    $('f-cli').textContent=cust.name+' · '+cust.email; $('f-desc').textContent=inv.description;
    $('f-created').textContent=VS.date(inv.created_at); $('f-due').textContent=VS.date(inv.due_date); $('f-amt').textContent=VS.money(inv.amount_cents);
    $('f-cancel').classList.toggle('hidden',!(!inv.paid&&!inv.cancel_status));
    document.title=t('Fatura')+' #'+String(inv.id).padStart(6,'0')+' | Grupo Velluto';
  }
  $('f-print').onclick=function(){window.print()};
  $('f-cancel').onclick=function(){
    if(!confirm(t('Pedir o cancelamento desta fatura? A equipe analisa o pedido e avisa você.'))) return;
    VS.api('invoice/cancel',{id:inv.id}).then(function(j){inv.cancel_status=j.status;render();VS.notice($('f-err'),t('Pedido enviado. A equipe vai analisar e avisar você.'),true)})
      .catch(function(e){VS.notice($('f-err'),e.message)});
  };
  VS.onLang.push(render);
  if(!/^\d+$/.test(id)){$('loading').classList.add('hidden');VS.notice($('f-err'),t('Link inválido.'));return}
  VS.me().then(function(u){
    if(!u){location.replace('/my/?next='+encodeURIComponent(location.pathname+location.search));return new Promise(function(){})}
    return VS.api('invoice?id='+id);
  }).then(function(j){inv=j.invoice;cust=j.customer;render();VS.apply(document.body)})
    .catch(function(e){$('loading').classList.add('hidden');VS.notice($('f-err'),e.message)});
})();
