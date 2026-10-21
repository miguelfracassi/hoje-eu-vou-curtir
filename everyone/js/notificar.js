(function(){
  var f=document.getElementById('nf'), m=document.getElementById('n-msg');
  VS.me().then(function(u){ if(!u||!u.is_admin) location.replace(u?'/my/':'/my/?next=/notificar/'); });
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var to=document.getElementById('n-to').value, label=to==='all'?'todos':to==='clients'?'os clientes':'os admins';
    if(!confirm('Enviar este aviso para '+label+'?')) return;
    VS.api('admin/notify',{title:document.getElementById('n-title').value,body:document.getElementById('n-body').value,to:to})
      .then(function(j){ m.className='notice ok'; m.textContent='Enviado para '+j.users+' conta(s) em '+j.devices+' aparelho(s).'; f.reset(); })
      .catch(function(err){ m.className='notice err'; m.textContent=err.message; });
  });
})();
