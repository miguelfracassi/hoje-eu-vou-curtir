(function(){
  var T=function(x){return window.VS?VS.t(x):x}, form=document.getElementById('contact-form'), note=document.getElementById('notice');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var f=new FormData(form);
    var entry={
      id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),
      name:(f.get('name')||'').trim(), email:(f.get('email')||'').trim(),
      phone:(f.get('phone')||'').trim(), subject:(f.get('subject')||'').trim(),
      message:(f.get('message')||'').trim(), date:new Date().toISOString(), read:false
    };
    if(!entry.name||!entry.email||!entry.message){note.className='notice err';note.textContent=T('Preencha nome, e-mail e mensagem.');return}
    try{
      var all=JSON.parse(localStorage.getItem('ticord_inbox')||'[]');
      all.push(entry); localStorage.setItem('ticord_inbox',JSON.stringify(all));
      form.reset(); note.className='notice ok'; note.textContent=T('Mensagem enviada! Obrigado pelo contato, responderemos em breve.');
    }catch(err){
      note.className='notice err'; note.textContent=T('Não foi possível enviar agora. Fale conosco pelo WhatsApp ou e-mail.');
    }
  });
})();
