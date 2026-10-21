(function(){
  var note=document.getElementById('acc-note'), logged=false;
  function mark(){
    [].forEach.call(document.querySelectorAll('#seg-lang button'),function(b){b.setAttribute('aria-pressed',b.dataset.v===VS.lang())});
    [].forEach.call(document.querySelectorAll('#seg-theme button'),function(b){b.setAttribute('aria-pressed',b.dataset.v===VS.theme())});
    note.textContent=VS.t(logged?'Suas preferências ficam salvas na sua conta.':'Entre na sua conta para guardar suas preferências em todos os aparelhos.');
  }
  document.getElementById('seg-lang').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;VS.setPrefs({lang:b.dataset.v});mark()});
  document.getElementById('seg-theme').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;VS.setPrefs({theme:b.dataset.v});mark()});
  VS.onLang.push(mark);
  mark(); VS.me().then(function(u){logged=!!u;mark()});
})();
