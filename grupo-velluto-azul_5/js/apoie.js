(function(){
  var $=function(x){return document.getElementById(x)}, period='monthly';
  var SUG={daily:['1,00','2,00','5,00'],monthly:['5,00','10,00','20,00'],yearly:['5,00','20,00','50,00']};
  function chips(){var c=$('chips');c.innerHTML='';SUG[period].forEach(function(v){var b=document.createElement('button');b.type='button';b.className='chip';b.textContent='R$ '+v;b.onclick=function(){$('amount').value=v};c.appendChild(b)})}
  [].forEach.call(document.querySelectorAll('#seg button'),function(b){b.onclick=function(){
    period=b.dataset.p;[].forEach.call(document.querySelectorAll('#seg button'),function(x){x.setAttribute('aria-checked',x===b?'true':'false')});chips()}});
  $('form').onsubmit=function(e){e.preventDefault();var btn=$('go');btn.disabled=true;$('err').className='notice';
    VS.api('support/create',{period:period,amount:$('amount').value}).then(function(j){location.href=j.link},
      function(er){if(er.status===401)return location.reload();VS.notice($('err'),er.message,false);btn.disabled=false})};
  chips();
  VS.me().then(function(u){$(u?'app':'need').classList.remove('hidden');VS.apply(document.body)});
})();
