(function(){
  var $=function(x){return document.getElementById(x)}, timer=null, curId=null;
  var BADGE={approved:['ok','Aprovado'],pending:['warn','Aguardando pagamento'],in_process:['warn','Em análise'],authorized:['warn','Em análise'],cancelled:['err','Cancelado/expirado'],rejected:['err','Recusado']};
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function abs(p){return location.origin+p}
  function copy(inp,btn){
    (navigator.clipboard?navigator.clipboard.writeText(inp.value):Promise.reject()).catch(function(){inp.select();document.execCommand('copy')}).then(function(){var o=btn.textContent;btn.textContent='Copiado!';setTimeout(function(){btn.textContent=o},1800)})}
  [].forEach.call(document.querySelectorAll('[data-copy]'),function(b){b.onclick=function(){copy($(b.dataset.copy),b)}});

  function showGate(){$('app').classList.add('hidden');$('gate').classList.remove('hidden');clearTimeout(timer);setTimeout(function(){$('pin').focus()},50)}
  function showApp(){$('gate').classList.add('hidden');$('app').classList.remove('hidden');loadList()}
  function badge(st){var b=BADGE[st]||['err',st];return el('span','badge '+b[0],b[1])}

  function loadList(){
    VS.api('pay/list').then(function(j){
      var body=$('list'); body.innerHTML=''; $('no-list').classList.toggle('hidden',j.payments.length>0);
      j.payments.forEach(function(p){
        var tr=el('tr'); tr.appendChild(el('td','',new Date(p.created_at).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'})));
        tr.appendChild(el('td','',p.description)); tr.appendChild(el('td','num',VS.money(p.amount_cents)));
        var td=el('td'); td.appendChild(badge(p.status)); tr.appendChild(td);
        var a=el('a','btn btn-light','Abrir'); a.href='/financeiro/pagar?id='+encodeURIComponent(p.id); a.target='_blank'; a.rel='noopener'; a.style.cssText='padding:6px 14px;font-size:.76rem';
        var t2=el('td'); t2.appendChild(a); tr.appendChild(t2); body.appendChild(tr);
      });
    },function(e){if(e.status===401)showGate()});
  }

  function poll(){
    clearTimeout(timer); if(!curId) return;
    VS.api('pay/status',{id:curId}).then(function(j){
      var p=j.payment, b=BADGE[p.status]||['err',p.status]; $('r-badge').className='badge '+b[0]; $('r-badge').textContent=VS.t(b[1]);
      if(p.status==='approved'){ $('r-qr').closest('.qr-box').style.opacity='.25'; loadList(); return }
      if(p.qr_code) timer=setTimeout(poll,4000); else loadList();
    },function(){timer=setTimeout(poll,8000)});
  }

  $('gate-form').onsubmit=function(e){e.preventDefault();
    VS.api('pay/auth',{pin:$('pin').value}).then(function(){$('pin').value='';$('gate-err').className='notice';showApp()},
      function(er){VS.notice($('gate-err'),er.message,false);$('pin').select()})};

  $('form').onsubmit=function(e){e.preventDefault(); var btn=$('go'); btn.disabled=true; $('err').className='notice';
    VS.api('pay/create',{amount:$('amount').value,description:$('desc').value}).then(function(j){
      var p=j.payment, link=abs(j.link); curId=p.id;
      $('r-amt').textContent=VS.money(p.amount_cents); $('r-desc').textContent=p.description;
      $('r-qr').src='data:image/png;base64,'+p.qr_base64; $('r-qr').closest('.qr-box').style.opacity='1';
      $('r-link').value=link; $('r-code').value=p.qr_code; $('r-open').href=link;
      $('r-badge').className='badge warn'; $('r-badge').textContent=VS.t('Aguardando pagamento');
      $('result').classList.remove('hidden'); $('result').scrollIntoView({behavior:'smooth',block:'start'});
      $('form').reset(); loadList(); timer=setTimeout(poll,4000);
    },function(er){if(er.status===401)return showGate();VS.notice($('err'),er.message,false)}).then(function(){btn.disabled=false})};

  $('r-new').onclick=function(){clearTimeout(timer);curId=null;$('result').classList.add('hidden');$('amount').focus()};
  $('out').onclick=function(){VS.api('pay/logout',{}).then(showGate,showGate)};

  VS.api('pay/list').then(showApp,function(e){if(e.status===401)showGate();else{showGate();VS.notice($('gate-err'),e.message,false)}});
})();
