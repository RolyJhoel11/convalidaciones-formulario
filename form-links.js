/* Prellenado real del formulario final. La cuenta, los adjuntos y el envío se confirman en Google. */
(() => {
  'use strict';
  const FIELDS=Object.freeze(['name','ci','ru','oldMentionName','careerName']);
  const normalizeEmail=value=>String(value||'').trim().toLowerCase();
  function emailProblem(value){
    const email=normalizeEmail(value),local=email.split('@')[0];
    return email.length>254||local.length>64||local.endsWith('.')||local.includes('..')||!/^[a-z0-9][a-z0-9._-]*@fcpn\.edu\.bo$/.test(email)
      ? 'Escribe tu correo institucional completo @fcpn.edu.bo.' : '';
  }
  function build(student,config){
    const problem=emailProblem(student.email);if(problem)throw new Error(problem);
    const definition=config?.finalForm;let url;
    try{url=new URL(definition.url);}catch(_){throw new Error('La dirección del formulario final no es válida.');}
    if(url.protocol!=='https:'||url.hostname!=='docs.google.com'||url.port||url.username||url.password||!/^\/forms\/d\/e\/[A-Za-z0-9_-]+\/viewform$/.test(url.pathname))throw new Error('El destino debe ser el formulario publicado de Google.');
    url.search='';url.hash='';const used=new Set();
    for(const field of FIELDS){
      const id=String(definition.fields?.[field]||'').replace(/^entry\./,'');
      if(!/^\d{1,30}$/.test(id)||used.has(id))throw new Error('Revisa los identificadores de las preguntas del formulario final.');
      const value=String(student[field]||'').trim();if(!value)throw new Error('Completa todos los datos del estudiante.');
      used.add(id);url.searchParams.set('entry.'+id,value);
    }
    url.searchParams.set('usp','pp_url');url.searchParams.set('authuser',normalizeEmail(student.email));
    return url.href;
  }
  window.ReportFormLinks=Object.freeze({normalizeEmail,emailProblem,build,FIELDS});
})();
