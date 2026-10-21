(function(){
  var list=document.getElementById('projects'), none=document.getElementById('no-proj'), data=[], user;
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function render(){
    document.getElementById('c-hello').textContent=VS.t('Olá, {n}',{n:user.name.split(' ')[0]});
    list.innerHTML=''; none.classList.toggle('hidden',data.length>0);
    data.forEach(function(p){
      var b=el('article','proj'), h=el('header'); h.appendChild(el('h3','',p.title));
      var s=el('span','badge info',VS.t(p.status)); h.appendChild(s); b.appendChild(h);
      if(p.note) b.appendChild(el('p','',p.note)); list.appendChild(b);
    });
  }
  VS.onLang.push(function(){if(user)render()});
  VS.guard().then(function(u){user=u;return VS.api('cliente')}).then(function(j){data=j.projects||[];render();VS.apply(document.body)})
    .catch(function(){location.replace('/my/')});
})();
