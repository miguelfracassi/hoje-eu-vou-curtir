(function(){
  var KEY='ticord_inbox', gate=document.getElementById('gate'), panel=document.getElementById('panel');
  var pass=document.getElementById('pass'), err=document.getElementById('gate-err'), listEl=document.getElementById('msgs');
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function save(a){localStorage.setItem(KEY,JSON.stringify(a))}
  function show(){gate.classList.add('hidden');panel.classList.remove('hidden');render()}
  function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function render(){
    var all=load().sort(function(a,b){return b.date.localeCompare(a.date)});
    document.getElementById('count').textContent=all.length+(all.length===1?' mensagem':' mensagens');
    listEl.innerHTML='';
    if(!all.length){listEl.appendChild(el('div','empty','Nenhuma mensagem por aqui ainda.'));return}
    all.forEach(function(m){
      var box=el('article','msg'+(m.read?'':' unread'));
      var h=el('header'); h.appendChild(el('h3','',(m.subject||'Sem assunto')+' · '+m.name));
      h.appendChild(el('time','',new Date(m.date).toLocaleString('pt-BR')));
      box.appendChild(h);
      box.appendChild(el('div','meta',m.email+(m.phone?' · '+m.phone:'')));
      box.appendChild(el('div','body',m.message));
      var a=el('div','acts');
      var r=el('a','btn btn-dark','Responder por e-mail'); r.href='mailto:'+encodeURIComponent(m.email)+'?subject='+encodeURIComponent('Re: '+(m.subject||'Contato Grupo Velluto'));
      var rd=el('button','btn btn-light',m.read?'Marcar como não lida':'Marcar como lida');
      rd.onclick=function(){var x=load();x.forEach(function(i){if(i.id===m.id)i.read=!i.read});save(x);render()};
      var d=el('button','btn btn-light','Excluir');
      d.onclick=function(){if(confirm('Excluir esta mensagem?')){save(load().filter(function(i){return i.id!==m.id}));render()}};
      a.appendChild(r);a.appendChild(rd);a.appendChild(d);box.appendChild(a);listEl.appendChild(box);
    });
  }
  document.getElementById('gate-form').addEventListener('submit',function(e){
    e.preventDefault();
    if(pass.value==='2015'){sessionStorage.setItem('ticord_auth','1');err.textContent='';show()}
    else{err.textContent='Senha incorreta.';pass.value='';pass.focus()}
  });
  document.getElementById('logout').onclick=function(){sessionStorage.removeItem('ticord_auth');location.reload()};
  document.getElementById('clear').onclick=function(){if(confirm('Apagar todas as mensagens?')){save([]);render()}};
  if(sessionStorage.getItem('ticord_auth')==='1') show();
})();
