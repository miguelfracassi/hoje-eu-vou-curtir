(function(){
  var id=new URLSearchParams(location.search).get('id')||'', timer=null;
  var $=function(x){return document.getElementById(x)};
  function fail(m){$('loading').classList.add('hidden');VS.notice($('p-err'),m,false)}
  function render(p){
    $('loading').classList.add('hidden'); $('view').classList.remove('hidden'); $('p-err').className='notice';
    $('p-desc').textContent=p.description||''; $('p-amt').textContent=VS.money(p.amount_cents);
    var st=$('p-state'), open=!!p.qr_code; $('p-open').classList.toggle('hidden',!open); st.innerHTML='';
    if(p.status==='approved'){
      st.innerHTML='<div class="pay-done"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.5l3 3 6-6.5"/></svg><b>Pagamento aprovado</b><span class="hint">Obrigado! Já recebemos o seu pagamento.</span></div>';
    } else if(open){
      st.innerHTML='<span class="badge warn">Aguardando pagamento</span>';
      if(!$('p-qr').src||$('p-qr').dataset.k!==p.id){$('p-qr').src='data:image/png;base64,'+p.qr_base64;$('p-qr').dataset.k=p.id}
      $('p-code').value=p.qr_code;
    } else {
      st.innerHTML='<span class="badge err">'+(p.status==='cancelled'?'Cobrança cancelada ou expirada':'Pagamento não concluído')+'</span>';
    }
    clearTimeout(timer); if(open) timer=setTimeout(load,4000);
  }
  function load(){VS.api('pay/status',{id:id}).then(function(j){render(j.payment)},function(e){fail(e.message);if(e.code==='network'||e.status>=500)timer=setTimeout(load,8000)})}
  $('p-copy').onclick=function(){var b=this,c=$('p-code');
    (navigator.clipboard?navigator.clipboard.writeText(c.value):Promise.reject()).catch(function(){c.select();document.execCommand('copy')}).then(function(){b.textContent=VS.t('Copiado!');setTimeout(function(){b.textContent=VS.t('Copiar código')},1800)})};
  if(!id) fail('Link inválido.'); else load();
})();
