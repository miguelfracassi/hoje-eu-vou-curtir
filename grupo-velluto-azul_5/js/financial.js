(function(){
  var body=document.getElementById('inv'), none=document.getElementById('no-inv'), data=[];
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function late(i){return !i.paid&&i.due_date&&new Date(String(i.due_date).slice(0,10)+'T23:59:59')<new Date()}
  function render(){
    var open=0,paid=0,next=null; body.innerHTML=''; none.classList.toggle('hidden',data.length>0);
    data.forEach(function(i){
      if(i.paid) paid+=i.amount_cents; else {open+=i.amount_cents; if(i.due_date&&!late(i)&&(!next||i.due_date<next)) next=i.due_date}
      var tr=el('tr'); tr.appendChild(el('td','',i.description)); tr.appendChild(el('td','',VS.date(i.due_date))); tr.appendChild(el('td','num',VS.money(i.amount_cents)));
      var td=el('td'), s=i.paid?['ok','Pago']:late(i)?['err','Vencida']:['warn','Em aberto']; td.appendChild(el('span','badge '+s[0],VS.t(s[1]))); tr.appendChild(td); body.appendChild(tr);
    });
    document.getElementById('s-open').textContent=VS.money(open); document.getElementById('s-paid').textContent=VS.money(paid);
    document.getElementById('s-next').textContent=next?VS.date(next):'—';
  }

  var MESES=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'], PER={daily:'Diário',monthly:'Mensal',yearly:'Anual'};
  function supports(list){
    if(!list.length) return; document.getElementById('sup-panel').classList.remove('hidden');
    var box=document.getElementById('sup'); box.innerHTML=''; var groups={}, order=[];
    list.forEach(function(x){var d=new Date(x.created_at),k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); if(!groups[k]){groups[k]={d:d,items:[],sum:0};order.push(k)} groups[k].items.push(x); if(x.status==='approved')groups[k].sum+=x.amount_cents});
    order.forEach(function(k){var g=groups[k], h=el('h3','',MESES[g.d.getMonth()]+' de '+g.d.getFullYear()+' · '+VS.money(g.sum)); h.style.cssText='font-size:1rem;margin:18px 0 8px';
      box.appendChild(h); var w=el('div','tbl-wrap'), t=el('table','tbl'), tb=el('tbody'); t.style.minWidth='0'; t.style.fontSize='.85rem';
      g.items.forEach(function(x){var tr=el('tr'); tr.appendChild(el('td','',new Date(x.created_at).toLocaleDateString('pt-BR'))); tr.appendChild(el('td','',PER[x.period]||'Apoio')); tr.appendChild(el('td','num',VS.money(x.amount_cents)));
        var td=el('td'),s=x.status==='approved'?['ok','Aprovado']:(x.status==='pending'||x.status==='in_process')?['warn','Aguardando']:['err','Não concluído']; td.appendChild(el('span','badge '+s[0],s[1])); tr.appendChild(td);
        if(s[0]==='warn'){var a=el('a','btn btn-light','Pagar'); a.href='/financeiro/pagar?id='+encodeURIComponent(x.id); a.style.cssText='padding:6px 14px;font-size:.76rem'; var t2=el('td'); t2.appendChild(a); tr.appendChild(t2)} else tr.appendChild(el('td'));
        tb.appendChild(tr)}); t.appendChild(tb); w.appendChild(t); box.appendChild(w)});
  }
  VS.onLang.push(render);
  VS.me().then(function(u){if(!u){location.replace('/my/?next=/financial/');return new Promise(function(){})}return VS.api('financial')}).then(function(j){data=j.invoices||[];if(j.client===false){[].forEach.call(document.querySelectorAll('.stats,#no-inv'),function(x){x.classList.add('hidden')});document.getElementById('inv').closest('.panel').classList.add('hidden');document.getElementById('lead').textContent='Seus apoios ao grupo.'}render();VS.apply(document.body);VS.api('support/mine').then(function(r){supports(r.supports||[])},function(){})})
    .catch(function(){location.replace('/my/')});
})();
