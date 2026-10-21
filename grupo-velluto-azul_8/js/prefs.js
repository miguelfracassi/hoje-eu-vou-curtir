/* roda no <head>: aplica tema e idioma antes de a página aparecer (evita "piscar") */
(function(){
  var d=document.documentElement,t='light',l='pt';
  try{t=localStorage.getItem('vs_theme')||'light';l=localStorage.getItem('vs_lang')||'pt'}catch(e){}
  function eff(x){return x==='auto'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):x}
  d.setAttribute('data-theme',eff(t));
  d.lang={pt:'pt-BR',en:'en',es:'es'}[l]||'pt-BR';
  var m=document.querySelector('meta[name=theme-color]'); if(m&&eff(t)==='dark') m.content='#06141d';
  matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',function(){
    try{if((localStorage.getItem('vs_theme')||'light')==='auto') d.setAttribute('data-theme',matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light')}catch(e){}
  });
})();
