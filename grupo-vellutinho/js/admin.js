(function(){
  var box=document.getElementById('users'), q=document.getElementById('q'), db={users:[],invoices:[],projects:[]}, openId=null;
  var t=VS.t;
  function el(tag,c,x){var e=document.createElement(tag);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function inp(ph,type,w){var i=el('input');i.placeholder=t(ph);i.setAttribute('aria-label',t(ph));i.type=type||'text';if(w)i.style.width=w;return i}
  function load(){return VS.api('admin/users').then(function(j){db=j;render()})}
  function act(path,body){return VS.api(path,body).then(load).catch(function(e){alert(e.message)})}

  function render(){
    var f=q.value.trim().toLowerCase(); box.innerHTML='';
    var us=db.users.filter(function(u){return !f||(u.name+' '+u.email).toLowerCase().indexOf(f)>-1});
    if(!us.length){box.appendChild(el('div','empty',t('Nenhuma conta encontrada.')));return}
    us.forEach(function(u){
      var d=el('details','adm-user'); if(openId===u.id)d.open=true; d.addEventListener('toggle',function(){if(d.open)openId=u.id});
      var s=el('summary'); var l=el('span'); l.appendChild(el('b','',u.name)); l.appendChild(el('div','',u.email+' · '+u.phone));
      var r=el('span'); r.style.display='flex';r.style.gap='8px';r.style.flexWrap='wrap';
      if(u.status!=='active') r.appendChild(el('span','badge warn',t('Desativada')));
      if(u.is_admin) r.appendChild(el('span','badge info','Admin'));
      r.appendChild(el('span','badge '+(u.is_client?'ok':''),u.is_client?t('Cliente'):t('Não cliente')));
      s.appendChild(l); s.appendChild(r); d.appendChild(s);
      var c=el('div','in');
      var sw=el('label','switch'); var cb=el('input'); cb.type='checkbox'; cb.checked=u.is_client; cb.onchange=function(){act('admin/client',{id:u.id,is_client:cb.checked})};
      sw.appendChild(cb); sw.appendChild(document.createTextNode(t('É cliente'))); sw.style.marginTop='14px'; c.appendChild(sw);

      c.appendChild(el('h4','',t('Faturas')));
      db.invoices.filter(function(i){return i.user_id===u.id}).forEach(function(i){
        var ln=el('div','adm-line'); ln.appendChild(el('span','',i.description+' · '+VS.money(i.amount_cents)+' · '+VS.date(i.due_date)));
        var b=el('span'); var p=el('button','btn btn-light',i.paid?t('Marcar em aberto'):t('Marcar como paga')); p.onclick=function(){act('admin/invoice-paid',{id:i.id,paid:!i.paid})};
        var x=el('button','btn btn-light',t('Excluir')); x.style.marginLeft='6px'; x.onclick=function(){if(confirm(t('Excluir?')))act('admin/remove',{kind:'invoice',id:i.id})};
        b.appendChild(p);b.appendChild(x);ln.appendChild(b);c.appendChild(ln);
      });
      var fr=el('div','adm-line'); var d1=inp('Descrição'),a1=inp('Valor (R$)','text','120px'),v1=inp('Vencimento','date','150px'); d1.style.flex='1';
      var ab=el('button','btn btn-dark',t('Adicionar fatura')); ab.onclick=function(){act('admin/invoice',{user_id:u.id,description:d1.value,amount:a1.value,due_date:v1.value})};
      [d1,a1,v1,ab].forEach(function(n){fr.appendChild(n)}); c.appendChild(fr);

      c.appendChild(el('h4','',t('Projetos')));
      db.projects.filter(function(p){return p.user_id===u.id}).forEach(function(p){
        var ln=el('div','adm-line'); ln.appendChild(el('span','',p.title+' · '+p.status));
        var x=el('button','btn btn-light',t('Excluir')); x.onclick=function(){if(confirm(t('Excluir?')))act('admin/remove',{kind:'project',id:p.id})}; ln.appendChild(x); c.appendChild(ln);
      });
      var pr=el('div','adm-line'); var t1=inp('Título'),s1=inp('Status (ex.: Em andamento)','text','200px'),n1=inp('Observação'); t1.style.flex='1'; n1.style.flex='1';
      var pb=el('button','btn btn-dark',t('Adicionar projeto')); pb.onclick=function(){act('admin/project',{user_id:u.id,title:t1.value,status:s1.value,note:n1.value})};
      [t1,s1,n1,pb].forEach(function(n){pr.appendChild(n)}); c.appendChild(pr);
      d.appendChild(c); box.appendChild(d);
    });
  }
  q.addEventListener('input',render); VS.onLang.push(render);
  VS.me().then(function(u){
    if(!u||!u.is_admin){location.replace(u?'/my/':'/my/?next=/admin/');return}
    return load();
  });
})();
