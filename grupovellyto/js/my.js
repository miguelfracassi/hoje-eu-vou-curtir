(function(){
  var $=function(i){return document.getElementById(i)}, t=VS.t, show=function(e,on){$(e).classList.toggle('hidden',!on)};
  var lead=$('lead'), user=null, pending=null;
  function setLead(k){lead.textContent=t(k)}
  function digits(s){return String(s||'').replace(/\D/g,'')}
  function validEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}
  function busy(f,on){[].forEach.call(f.querySelectorAll('button[type=submit]'),function(b){b.disabled=on;b.style.opacity=on?.6:1})}
  function val(i){return $(i).value}

  /* ---- visitante ---- */
  function guest(){
    user=null; show('loading',false); show('account',false); show('guest',true);
    lead.textContent=t('Entre ou crie sua conta para continuar.'); VS.apply(document.body);
  }
  function tab(reg){
    $('tab-login').setAttribute('aria-selected',!reg); $('tab-reg').setAttribute('aria-selected',reg);
    show('f-login',!reg); show('f-reg',reg);
  }
  $('tab-login').onclick=function(){tab(false)}; $('tab-reg').onclick=function(){tab(true)};

  function enter(u){
    VS.setUser(u); if(window.VSPWA)VSPWA.resync(true);
    var next=VS.safeNext(); if(next){location.href=next;return}
    account(u);
  }
  $('f-login').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-login'); show('react',false);
    var email=val('l-email').trim(), pass=val('l-pass');
    if(!validEmail(email)||!pass){VS.notice(n,t('Informe e-mail e senha.'));return}
    pending={email:email,password:pass}; busy(this,true);
    VS.api('login',pending).then(function(j){enter(j.user)}).catch(function(er){
      VS.notice(n,er.message); if(er.code==='deactivated') show('react',true)
    }).then(function(){busy($('f-login'),false)});
  });
  $('btn-react').onclick=function(){
    if(!pending)return; VS.api('login',{email:pending.email,password:pending.password,reactivate:true}).then(function(j){enter(j.user)}).catch(function(er){VS.notice($('n-login'),er.message)});
  };
  $('f-reg').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-reg');
    var name=val('r-name').trim(), email=val('r-email').trim(), phone=val('r-phone').trim(), p=val('r-pass'), c=val('r-conf');
    if(name.length<2) return VS.notice(n,t('Informe seu nome.'));
    if(!validEmail(email)) return VS.notice(n,t('E-mail inválido.'));
    if(digits(phone).length<10||digits(phone).length>13) return VS.notice(n,t('Telefone inválido. Use DDD + número.'));
    if(p.length<8) return VS.notice(n,t('A senha precisa ter pelo menos 8 caracteres.'));
    if(p!==c) return VS.notice(n,t('As senhas não conferem.'));
    busy(this,true);
    VS.api('register',{name:name,email:email,phone:phone,password:p,confirm:c,theme:VS.theme(),lang:VS.lang()})
      .then(function(j){enter(j.user)}).catch(function(er){VS.notice(n,er.message)}).then(function(){busy($('f-reg'),false)});
  });

  /* ---- conta ---- */
  function account(u){
    user=u; show('loading',false); show('guest',false); show('account',true);
    lead.textContent=t('Gerencie seus dados e a segurança da sua conta.');
    fill();
  }
  function fill(){
    var u=user; if(!u)return;
    $('av').textContent=(u.name||'?').trim().charAt(0).toUpperCase();
    $('a-name').textContent=t('Olá, {n}',{n:u.name.split(' ')[0]}); $('a-mail').textContent=u.email;
    var bc=$('b-client'); bc.textContent=u.is_client?t('Cliente'):t('Não cliente'); bc.className='badge '+(u.is_client?'ok':'');
    show('b-admin',!!u.is_admin);
    $('p-name').value=u.name; $('p-email').value=u.email; $('p-phone').value=u.phone;
    var sc=$('shortcuts'); sc.innerHTML='';
    var items=[['/accessibility/','Acessibilidade','Idioma e aparência','M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v6l4 2']];
    if(VS.canClient(u)){
      items.push(['/cliente/','Área do cliente','Seus projetos','M3 7h18v13H3zM8 7V4h8v3']);
    }
    items.push(['/financial/','Financeiro',VS.canClient(u)?'Faturas e pagamentos':'Seus apoios por mês','M3 6h18v12H3zM3 10h18M7 15h3']);
    items.push(['/chat/','Chat',u.is_admin?'Conversas com os clientes':'Fale com a equipe','M4 5h16v11H9l-5 4z']);
    if(u.is_admin) items.push(['/admin/','Admin','Contas e clientes','M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z']);
    items.forEach(function(it){
      var a=document.createElement('a'); a.className='info'; a.href=it[0];
      a.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+it[3]+'"/></svg><span><b></b></span>';
      var sp=a.querySelector('span'), b=a.querySelector('b'); b.textContent=t(it[1]); sp.appendChild(document.createTextNode(t(it[2]))); sc.appendChild(a);
    });
  }
  VS.onLang.push(function(){if(user){fill();lead.textContent=t('Gerencie seus dados e a segurança da sua conta.')}});

  function detach(){return window.VSPWA?VSPWA.detach():Promise.resolve()}
  $('logout').onclick=function(){detach().then(function(){return VS.api('logout',{})}).then(function(){VS.setUser(null);guest()})};
  $('f-prof').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-prof');
    var name=val('p-name').trim(), email=val('p-email').trim(), phone=val('p-phone').trim();
    if(name.length<2) return VS.notice(n,t('Informe seu nome.'));
    if(!validEmail(email)) return VS.notice(n,t('E-mail inválido.'));
    if(digits(phone).length<10||digits(phone).length>13) return VS.notice(n,t('Telefone inválido. Use DDD + número.'));
    busy(this,true);
    VS.api('profile',{name:name,email:email,phone:phone}).then(function(j){user=j.user;VS.setUser(j.user);fill();VS.notice(n,t('Dados salvos.'),true)})
      .catch(function(er){VS.notice(n,er.message)}).then(function(){busy($('f-prof'),false)});
  });
  $('f-pass').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-pass'), c=val('s-cur'), p=val('s-new'), k=val('s-conf');
    if(!c) return VS.notice(n,t('Digite sua senha atual.'));
    if(p.length<8) return VS.notice(n,t('A senha precisa ter pelo menos 8 caracteres.'));
    if(p!==k) return VS.notice(n,t('As senhas não conferem.'));
    busy(this,true);
    VS.api('password',{current:c,password:p,confirm:k}).then(function(){$('f-pass').reset();VS.notice(n,t('Senha alterada.'),true)})
      .catch(function(er){VS.notice(n,er.message)}).then(function(){busy($('f-pass'),false)});
  });
  $('f-deact').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-deact'), p=val('d-pass'); if(!p) return VS.notice(n,t('Digite sua senha para confirmar.'));
    if(!confirm(t('Desativar sua conta agora?'))) return;
    detach().then(function(){return VS.api('deactivate',{password:p})}).then(function(){VS.setUser(null);$('f-deact').reset();guest();VS.notice($('n-login'),t('Conta desativada. Para voltar, entre e escolha reativar.'),true)})
      .catch(function(er){VS.notice(n,er.message)});
  });
  $('f-del').addEventListener('submit',function(e){
    e.preventDefault(); var n=$('n-del'), p=val('x-pass'); if(!p) return VS.notice(n,t('Digite sua senha para confirmar.'));
    if(!confirm(t('Apagar sua conta para sempre? Não dá para desfazer.'))) return;
    VS.api('delete',{password:p}).then(function(){VS.setUser(null);$('f-del').reset();guest();VS.notice($('n-login'),t('Conta apagada.'),true)})
      .catch(function(er){VS.notice(n,er.message)});
  });

  VS.me().then(function(u){u?account(u):guest()});
})();
