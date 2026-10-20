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
  VS.onLang.push(render);
  VS.guard().then(function(){return VS.api('financial')}).then(function(j){data=j.invoices||[];render();VS.apply(document.body)})
    .catch(function(){location.replace('/my/')});
})();
