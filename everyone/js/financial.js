(function(){
  var $=function(x){return document.getElementById(x)}, t=VS.t, body=$('inv'), data=[], sups=[], isClient=true;
  function el(tag,c,x){var e=document.createElement(tag);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function pad(n){return String(n).padStart(2,'0')}
  function today(){var d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
  function ymd(d){return String(d).slice(0,10)}
  function diff(due){return Math.round((new Date(ymd(due)+'T12:00:00')-new Date(today()+'T12:00:00'))/864e5)}
  function late(i){return !i.paid&&!!i.due_date&&diff(i.due_date)<0}
  function status(i){return i.paid?['ok','Pago']:i.cancel_status==='cancelled'?['','Cancelada']:i.cancel_status==='requested'?['info','Cancelamento solicitado']:late(i)?['err','Vencida']:['warn','Em aberto']}
  function canCancel(i){return !i.paid&&!i.cancel_status}
  function link(href,label){var a=el('a','btn btn-light sm',t(label));a.href=href;return a}
  function btn(label,fn){var b=el('button','btn btn-light sm',t(label));b.type='button';b.onclick=fn;return b}
  function note(msg,ok){VS.notice($('n-fin'),msg,ok);if(ok!==undefined)$('n-fin').scrollIntoView({behavior:'smooth',block:'nearest'})}

  /* ---- pedir cancelamento de fatura / cancelar apoio ---- */
  function cancelInvoice(i){
    if(!confirm(t('Pedir o cancelamento desta fatura? A equipe analisa o pedido e avisa você.')))return;
    VS.api('invoice/cancel',{id:i.id}).then(function(){return load()}).then(function(){note(t('Pedido enviado. A equipe vai analisar e avisar você.'),true)}).catch(function(e){note(e.message,false)});
  }
  function cancelSupport(x){
    if(!confirm(t('Cancelar este apoio? O QR Code deixa de valer.')))return;
    VS.api('support/cancel',{id:x.id}).then(function(){return load()}).then(function(){note(t('Apoio cancelado.'),true)}).catch(function(e){note(e.message,false);load()});
  }

  /* ---- compras futuras ---- */
  function when(i){
    if(!i.due_date) return {b:null,s:t('Sem data de vencimento')};
    var n=diff(i.due_date);
    if(n===0) return {b:['err','Vence hoje'],s:VS.date(i.due_date)};
    if(n===1) return {b:['warn','Vence amanhã'],s:VS.date(i.due_date)};
    return {b:null,s:t('em {n} dias',{n:n})+' · '+VS.date(i.due_date)};
  }
  function future(){
    var box=$('fut'); box.innerHTML='';
    var list=data.filter(function(i){return !i.paid&&i.cancel_status!=='cancelled'&&(!i.due_date||diff(i.due_date)>=0)})
      .sort(function(a,b){return a.due_date?(b.due_date?(ymd(a.due_date)<ymd(b.due_date)?-1:ymd(a.due_date)>ymd(b.due_date)?1:0):-1):(b.due_date?1:0)});
    $('no-fut').classList.toggle('hidden',list.length>0);
    list.forEach(function(i){
      var w=when(i), row=el('div','fut-item'), l=el('div'), top=el('div'); top.appendChild(el('b','',i.description));
      if(w.b){var bd=el('span','badge '+w.b[0],t(w.b[1]));bd.style.marginLeft='8px';top.appendChild(bd)}
      if(i.cancel_status==='requested'){var cb=el('span','badge info',t('Cancelamento solicitado'));cb.style.marginLeft='8px';top.appendChild(cb)}
      l.appendChild(top); l.appendChild(el('small','',w.s)); row.appendChild(l);
      var r=el('div','acts'); r.appendChild(el('span','amt',VS.money(i.amount_cents))); r.appendChild(link('/financeiro/fatura?id='+i.id,'Ver'));
      if(canCancel(i)) r.appendChild(btn('Cancelar',function(){cancelInvoice(i)}));
      row.appendChild(r); box.appendChild(row);
    });
  }

  /* ---- faturas ---- */
  function render(){
    var open=0,paid=0,next=null; body.innerHTML=''; $('no-inv').classList.toggle('hidden',data.length>0);
    $('lead').textContent=t(isClient?'Faturas, compras futuras e pagamentos da sua conta.':'Seus apoios ao grupo.');
    data.forEach(function(i){
      if(i.paid) paid+=i.amount_cents;
      else if(i.cancel_status!=='cancelled'){open+=i.amount_cents; if(i.due_date&&diff(i.due_date)>=0&&(!next||ymd(i.due_date)<ymd(next))) next=i.due_date}
      var tr=el('tr'); tr.appendChild(el('td','',i.description)); tr.appendChild(el('td','',VS.date(i.due_date))); tr.appendChild(el('td','num',VS.money(i.amount_cents)));
      var td=el('td'), s=status(i); td.appendChild(el('span','badge '+s[0],t(s[1]))); tr.appendChild(td);
      var ac=el('td'), w=el('div','acts'); w.appendChild(link('/financeiro/fatura?id='+i.id,'Ver')); if(canCancel(i)) w.appendChild(btn('Cancelar',function(){cancelInvoice(i)})); ac.appendChild(w); tr.appendChild(ac);
      body.appendChild(tr);
    });
    $('s-open').textContent=VS.money(open); $('s-paid').textContent=VS.money(paid); $('s-next').textContent=next?VS.date(next):'—';
    future();
  }

  /* ---- apoios por mês ---- */
  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'], PER={once:'Única',daily:'Diário',monthly:'Mensal',yearly:'Anual'};
  function supports(){
    var box=$('sup'); box.innerHTML=''; $('sup-panel').classList.toggle('hidden',!sups.length); if(!sups.length) return;
    var groups={}, order=[];
    sups.forEach(function(x){var d=new Date(x.created_at),k=d.getFullYear()+'-'+pad(d.getMonth()+1); if(!groups[k]){groups[k]={d:d,items:[],sum:0};order.push(k)} groups[k].items.push(x); if(x.status==='approved')groups[k].sum+=x.amount_cents});
    order.forEach(function(k){var g=groups[k], h=el('h3','',t(MESES[g.d.getMonth()])+' · '+g.d.getFullYear()+' · '+VS.money(g.sum)); h.style.cssText='font-size:1rem;margin:18px 0 8px';
      box.appendChild(h); var w=el('div','tbl-wrap'), tb0=el('table','tbl'), tb=el('tbody'); tb0.style.minWidth='0'; tb0.style.fontSize='.85rem';
      g.items.forEach(function(x){var tr=el('tr'); tr.appendChild(el('td','',new Date(x.created_at).toLocaleDateString(VS.lang()==='pt'?'pt-BR':VS.lang()))); tr.appendChild(el('td','',t(PER[x.period]||'Apoio'))); tr.appendChild(el('td','num',VS.money(x.amount_cents)));
        var td=el('td'),s=x.status==='approved'?['ok','Aprovado']:x.status==='cancelled'?['','Cancelado']:(x.status==='pending'||x.status==='in_process')?['warn','Aguardando']:['err','Não concluído']; td.appendChild(el('span','badge '+s[0],t(s[1]))); tr.appendChild(td);
        var ac=el('td'); if(s[1]==='Aguardando'){var w2=el('div','acts'),a=link('/financeiro/pagar?id='+encodeURIComponent(x.id),'Pagar'); w2.appendChild(a); w2.appendChild(btn('Cancelar',function(){cancelSupport(x)})); ac.appendChild(w2)} tr.appendChild(ac);
        tb.appendChild(tr)}); tb0.appendChild(tb); w.appendChild(tb0); box.appendChild(w)});
  }

  function load(){
    return VS.api('financial').then(function(j){
      data=j.invoices||[]; isClient=j.client!==false;
      [].forEach.call(document.querySelectorAll('.stats,#fut-panel,#inv-panel'),function(x){x.classList.toggle('hidden',!isClient)});
      render();
      return VS.api('support/mine').then(function(r){sups=r.supports||[];supports()},function(){});
    });
  }
  VS.onLang.push(function(){render();supports()});
  VS.me().then(function(u){if(!u){location.replace('/my/?next=/financial/');return new Promise(function(){})}return load()})
    .then(function(){VS.apply(document.body)}).catch(function(){location.replace('/my/')});
})();
