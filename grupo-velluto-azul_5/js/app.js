/* Núcleo do site: API, usuário, tema, idioma e itens do menu */
(function(){
  var D=window.VS_DICT||{}, root=document.documentElement;
  var LANGS={pt:'pt-BR',en:'en',es:'es'};
  function store(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  function lang(){var l=store('vs_lang');return LANGS[l]?l:'pt'}
  function theme(){var t=store('vs_theme');return t==='dark'||t==='auto'?t:'light'}

  /* ---- tradução: o texto em português é a chave ---- */
  function t(s,vars){
    var l=lang(), e=D[s], r=(l==='pt'||!e)?s:(e[l==='en'?0:1]||s);
    if(vars) r=r.replace(/\{(\w+)\}/g,function(_,k){return vars[k]!==undefined?vars[k]:''});
    return r;
  }
  var ATTRS=['placeholder','aria-label','title','alt'];
  function apply(scope){
    scope=scope||document.body; var l=lang();
    var w=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentNode; if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName)||p.closest('[data-no-i18n]'))return 2; return 1}});
    var n; while((n=w.nextNode())){
      if(n.__pt===undefined){var s=n.nodeValue.trim(); n.__pt=(s&&(s in D))?s:null}
      if(n.__pt!==null) n.nodeValue=n.nodeValue.replace(/\S[\s\S]*\S|\S/,t(n.__pt));
    }
    var els=scope.querySelectorAll?scope.querySelectorAll('[placeholder],[aria-label],[title],[alt]'):[];
    for(var i=0;i<els.length;i++){var el=els[i]; if(el.closest('[data-no-i18n]'))continue; el.__pa=el.__pa||{};
      ATTRS.forEach(function(a){ if(!el.hasAttribute(a))return; if(el.__pa[a]===undefined){var v=el.getAttribute(a); el.__pa[a]=(v in D)?v:null}
        if(el.__pa[a]!==null) el.setAttribute(a,t(el.__pa[a])) }) }
    if(scope===document.body){
      root.lang=LANGS[l];
      if(document.__title===undefined){var parts=document.title.split(' | '); document.__title=parts[0]; document.__suffix=parts[1]||''}
      document.title=(document.__title in D?t(document.__title):document.__title)+(document.__suffix?' | '+document.__suffix:'');
    }
  }

  /* ---- tema ---- */
  function applyTheme(x){
    var e=x==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):x;
    root.setAttribute('data-theme',e);
    var m=document.querySelector('meta[name=theme-color]'); if(m) m.content=e==='dark'?'#06141d':'#04222a';
  }

  /* ---- API ---- */
  function api(path,body){
    var o={method:body===undefined?'GET':'POST',credentials:'same-origin',headers:{}};
    if(body!==undefined){o.headers['Content-Type']='application/json';o.body=JSON.stringify(body)}
    return fetch('/api/app?r='+encodeURIComponent(path),o).then(function(r){
      return r.json().catch(function(){return{}}).then(function(j){
        if(!r.ok){var e=new Error(j.message?t(j.message):t('Erro de conexão. Tente de novo.')+' ('+r.status+')');e.code=j.error||'server';e.status=r.status;throw e}
        return j});
    },function(){var e=new Error(t('Erro de conexão. Tente de novo.'));e.code='network';throw e});
  }

  function langChanged(){(window.VS&&VS.onLang||[]).forEach(function(f){try{f()}catch(e){}})}
  var cached;
  function me(force){
    if(!cached||force) cached=api('me').then(function(j){var u=j.user; sync(u); return u}).catch(function(){return null});
    return cached;
  }
  function sync(u){ /* conta manda: aplica as preferências salvas dela */
    if(!u)return; var ch=false;
    if(u.theme!==theme()){store('vs_theme',u.theme);applyTheme(u.theme);ch=true}
    if(u.lang!==lang()){store('vs_lang',u.lang);ch=true;apply();langChanged()}
  }
  function setUser(u){cached=Promise.resolve(u);if(u)sync(u);menuItems(u)}
  function setPrefs(p){
    if(p.theme){store('vs_theme',p.theme);applyTheme(p.theme)}
    if(p.lang){store('vs_lang',p.lang);apply();langChanged()}
    return me().then(function(u){return u?api('prefs',p).then(function(j){cached=Promise.resolve(j.user)}).catch(function(){}):null});
  }
  var canClient=function(u){return !!u&&(u.is_client||u.is_admin)};

  /* ---- itens do menu que só aparecem para quem tem acesso ---- */
  function menuItems(u){
    var ul=document.querySelector('.menu-links'); if(!ul)return;
    [].forEach.call(ul.querySelectorAll('[data-dyn]'),function(x){x.remove()});
    if(!u)return;
    var items=[];
    if(canClient(u)) items.push(['/cliente/','Cliente','Sua área de cliente']);
    items.push(['/financial/','Financeiro',canClient(u)?'Faturas e pagamentos':'Seus apoios por mês']);
    if(u.is_admin) items.push(['/admin/','Admin','Gerenciar contas e clientes']);
    items.forEach(function(it){
      var li=document.createElement('li'); li.setAttribute('data-dyn','1');
      var a=document.createElement('a'); a.href=it[0]; a.className='mi'+((location.pathname+'/').replace(/\/+$/,'/').indexOf(it[0])===0?' active':'');
      var b=document.createElement('b'); b.textContent=it[1]; var s=document.createElement('small'); s.textContent=it[2];
      a.appendChild(b); a.appendChild(s); li.appendChild(a); ul.appendChild(li);
    });
    apply(ul);
  }

  /* ---- utilitários para as páginas ---- */
  function notice(el,msg,ok){el.className='notice '+(ok?'ok':'err');el.textContent=msg}
  function safeNext(){var n=new URLSearchParams(location.search).get('next');return n&&/^\/[a-z]/i.test(n)&&n.indexOf('//')<0?n:null}
  function money(c){return new Intl.NumberFormat(LANGS[lang()],{style:'currency',currency:'BRL'}).format(c/100)}
  function date(d){return d?new Date(String(d).slice(0,10)+'T12:00:00').toLocaleDateString(LANGS[lang()]):'—'}
  function guard(){ /* páginas só para clientes */
    return me().then(function(u){
      if(!u){location.replace('/my/?next='+encodeURIComponent(location.pathname));return new Promise(function(){})}
      if(!canClient(u)){location.replace('/my/');return new Promise(function(){})}
      return u});
  }

  window.VS={t:t,apply:apply,api:api,me:me,setUser:setUser,setPrefs:setPrefs,lang:lang,theme:theme,notice:notice,safeNext:safeNext,money:money,date:date,guard:guard,canClient:canClient,onLang:[]};

  document.addEventListener('DOMContentLoaded',function(){
    apply(); me().then(menuItems);
  });
})();
