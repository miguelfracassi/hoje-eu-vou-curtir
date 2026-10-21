/* Chat: cliente (qualquer conta logada) conversa com a equipe; admin vê todas as conversas.
   Sem websocket (a Vercel é serverless): consulta o servidor a cada poucos segundos enquanto a página está aberta. */
(function(){
  var $=function(x){return document.getElementById(x)}, t=VS.t, coarse=matchMedia('(pointer: coarse)').matches;
  function el(tag,c,x){var e=document.createElement(tag);if(c)e.className=c;if(x!==undefined)e.textContent=x;return e}
  function loc(){return {pt:'pt-BR',en:'en',es:'es'}[VS.lang()]||'pt-BR'}
  function fmt(d){var x=new Date(d),n=new Date(),hm=x.toLocaleTimeString(loc(),{hour:'2-digit',minute:'2-digit'});
    return x.toDateString()===n.toDateString()?hm:x.toLocaleDateString(loc(),{day:'2-digit',month:'2-digit'})+' '+hm}
  function note(m){VS.notice($('n-chat'),m,false)}

  /* uma conversa: lista de balões + atualização periódica + envio */
  function convo(box,form,o){ // o.load(after)->{messages}, o.send(text)->{message}, o.mine(m)->bool, o.empty
    var last=0, seen={}, timer=null, alive=true, ta=form.querySelector('textarea'), btn=form.querySelector('button'), emptyEl=el('div','chat-empty',t(o.empty));
    box.innerHTML=''; box.appendChild(emptyEl);
    function bubble(m){
      var b=el('div','bub '+(m.kind==='system'?'sys':o.mine(m)?'me':'them')); b.appendChild(el('p','',m.body)); b.appendChild(el('time','',fmt(m.created_at))); return b;
    }
    function add(list){
      var near=box.scrollHeight-box.scrollTop-box.clientHeight<90, first=!last, fresh=false;
      list.forEach(function(m){if(seen[m.id])return;seen[m.id]=1;last=Math.max(last,m.id);if(emptyEl.parentNode)box.removeChild(emptyEl);box.appendChild(bubble(m));fresh=true});
      if(fresh&&(near||first||list.some(o.mine))) box.scrollTop=box.scrollHeight;
      return fresh;
    }
    function tick(){
      clearTimeout(timer); if(!alive) return;
      o.load(last).then(function(r){if(alive)add(r.messages||[]);if(o.onLoad)o.onLoad(r)}).catch(function(){}).then(function(){if(alive)timer=setTimeout(tick,document.hidden?15000:3000)});
    }
    function send(){
      var text=ta.value.trim(); if(!text||btn.disabled) return;
      btn.disabled=true;
      o.send(text).then(function(r){ta.value='';grow();add([r.message]);if(o.onSent)o.onSent()}).catch(function(e){note(e.message)}).then(function(){btn.disabled=false;ta.focus()});
    }
    function grow(){ta.style.height='auto';ta.style.height=Math.min(ta.scrollHeight,140)+'px'}
    form.onsubmit=function(e){e.preventDefault();send()};
    ta.oninput=grow;
    ta.onkeydown=function(e){if(e.key==='Enter'&&!e.shiftKey&&!coarse){e.preventDefault();send()}};
    document.addEventListener('visibilitychange',function(){if(alive&&!document.hidden)tick()});
    tick();
    return {stop:function(){alive=false;clearTimeout(timer)},focus:function(){ta.focus()}};
  }

  /* ---- cliente ---- */
  function client(){
    $('client-view').classList.remove('hidden');
    convo($('c-box'),$('c-form'),{
      empty:'Mande sua primeira mensagem. A equipe responde por aqui.',
      mine:function(m){return !m.from_admin},
      load:function(after){return VS.api('chat?after='+after)},
      send:function(text){return VS.api('chat/send',{body:text})}
    });
  }

  /* ---- admin ---- */
  function admin(){
    $('wrap').classList.add('wide'); var view=$('admin-view'), list=$('a-threads'), cur=null, c=null, threads=[], results=null, tt=null;
    view.classList.remove('hidden');
    function row(u,sub,unread,on,fn){
      var b=el('button','thr'+(on?' on':'')); b.type='button';
      var h=el('span','thr-h'); h.appendChild(el('b','',u.name)); if(unread) h.appendChild(el('span','badge ok',String(unread))); b.appendChild(h);
      b.appendChild(el('small','',sub)); b.onclick=fn; return b;
    }
    function renderList(){
      list.innerHTML='';
      var src=results||threads;
      if(!src.length){list.appendChild(el('div','chat-empty',t(results?'Nenhum cliente encontrado.':'Nenhuma conversa ainda. Busque um cliente acima para começar.')));return}
      src.forEach(function(u){
        var sub=results?u.email:(u.last_from_admin?t('Você')+': ':'')+u.last_body.replace(/\s+/g,' ').slice(0,60);
        list.appendChild(row(u,sub,results?0:u.unread,cur===u.id,function(){open(u.id)}));
      });
    }
    function loadThreads(){return VS.api('admin/chat/threads').then(function(j){threads=j.threads||[];if(!results)renderList()}).catch(function(){})}
    function open(id){
      if(c)c.stop(); cur=id; view.classList.add('show-convo'); $('a-title').textContent='…'; renderList();
      try{history.replaceState(null,'','/chat/?u='+id)}catch(e){}
      c=convo($('a-box'),$('a-form'),{
        empty:'Sem mensagens ainda. Escreva abaixo para começar.',
        mine:function(m){return m.from_admin},
        load:function(after){return VS.api('admin/chat/messages?user_id='+id+'&after='+after)},
        send:function(text){return VS.api('admin/chat/send',{user_id:id,body:text})},
        onLoad:function(r){if(r.user&&cur===id)$('a-title').textContent=r.user.name+' · '+r.user.email},
        onSent:loadThreads
      });
      c.focus();
    }
    $('a-back').onclick=function(){view.classList.remove('show-convo');if(c){c.stop();c=null}cur=null;try{history.replaceState(null,'','/chat/')}catch(e){}loadThreads().then(renderList)};
    $('a-search').oninput=function(){
      var v=this.value.trim(); clearTimeout(tt);
      if(v.length<2){results=null;renderList();return}
      tt=setTimeout(function(){VS.api('admin/chat/users?s='+encodeURIComponent(v)).then(function(j){results=j.users||[];renderList()}).catch(function(){})},250);
    };
    VS.onLang.push(renderList);
    setInterval(function(){if(!document.hidden)loadThreads()},6000);
    var u=new URLSearchParams(location.search).get('u');
    loadThreads().then(function(){if(/^\d+$/.test(u||''))open(Number(u))});
  }

  VS.me().then(function(u){
    if(!u){location.replace('/my/?next='+encodeURIComponent(location.pathname+location.search));return new Promise(function(){})}
    $('loading').classList.add('hidden');
    $('lead').textContent=t(u.is_admin?'Conversas com os clientes.':'Converse com a equipe do Grupo Velluto.');
    if(u.is_admin) admin(); else client();
    VS.apply(document.body);
  });
})();
