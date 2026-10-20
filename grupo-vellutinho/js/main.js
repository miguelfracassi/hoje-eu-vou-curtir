(function(){
  /* menu em tela cheia */
  var nav=document.getElementById('nav'), burger=document.getElementById('burger'), menu=document.getElementById('menu'), root=document.documentElement;
  function setMenu(open){
    nav.classList.toggle('open',open); root.classList.toggle('menu-open',open);
    burger.setAttribute('aria-expanded',open); burger.setAttribute('aria-label',open?'Fechar menu':'Abrir menu'); menu.setAttribute('aria-hidden',!open);
  }
  burger.addEventListener('click',function(){setMenu(!nav.classList.contains('open'))});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')setMenu(false)});
  /* barra ganha fundo ao rolar */
  function bar(){nav.classList.toggle('solid',window.scrollY>40)}
  bar(); window.addEventListener('scroll',bar,{passive:true});

  /* aparecer ao rolar */
  var els=document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}})},{threshold:.12});
    els.forEach(function(el){io.observe(el)});
  } else els.forEach(function(el){el.classList.add('in')});

  /* empresas */
  var list=window.TICORD_COMPANIES||[];
  var row=document.getElementById('logo-row');
  if(row) list.forEach(function(c){
    var d=document.createElement('div'); d.className='logo-item';
    var i=document.createElement('img'); i.src=c.mono; i.alt='Logo de empresa do grupo'; i.title=c.name; i.className='mono';
    d.appendChild(i); row.appendChild(d);
  });
  var grid=document.getElementById('company-grid');
  if(grid) list.forEach(function(c,n){
    var d=document.createElement('article'); d.className='card company reveal d'+(n%3+1);
    var b=document.createElement('div'); b.className='logo-box';
    var i=document.createElement('img'); i.src=c.logo; i.alt='Logo '+c.name; if(c.square) i.className='sq'; b.appendChild(i);
    var w=document.createElement('div');
    var h=document.createElement('h3'); h.textContent=c.name;
    var p=document.createElement('p'); p.textContent=c.desc;
    w.appendChild(h); w.appendChild(p);
    if(c.points){var u=document.createElement('ul'); c.points.forEach(function(x){var l=document.createElement('li'); l.textContent=x; u.appendChild(l)}); w.appendChild(u)}
    if(c.tag){var t=document.createElement('span'); t.className='tag'; t.textContent=c.tag; w.appendChild(t)}
    d.appendChild(b); d.appendChild(w); grid.appendChild(d);
    if(document.documentElement.classList.contains('js')) setTimeout(function(){d.classList.add('in')},60*n+80);
  });

  /* rolagem calma com o mouse */
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches && !matchMedia('(pointer: coarse)').matches){
    var target=0,current=0,raf=null;
    var max=function(){return document.documentElement.scrollHeight-window.innerHeight};
    var loop=function(){
      current+=(target-current)*0.085;
      if(Math.abs(target-current)<0.5){current=target;window.scrollTo({top:current,behavior:'instant'});raf=null;return}
      window.scrollTo({top:current,behavior:'instant'}); raf=requestAnimationFrame(loop);
    };
    window.addEventListener('wheel',function(e){
      if(e.ctrlKey||e.target.closest('textarea')) return;
      if(root.classList.contains('menu-open')){e.preventDefault();return}
      e.preventDefault();
      if(!raf){current=window.scrollY;target=current}
      var dy=e.deltaMode===1?e.deltaY*32:e.deltaY;
      target=Math.max(0,Math.min(max(),target+dy));
      if(!raf) raf=requestAnimationFrame(loop);
    },{passive:false});
    window.addEventListener('scroll',function(){if(!raf){current=target=window.scrollY}},{passive:true});
  }
})();
