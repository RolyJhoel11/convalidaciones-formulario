/* Bloqueo de descargas en ESTE navegador/origen. No sustituye una base de datos. */
(() => {
  'use strict';
  const KEY='convalidaciones-descargas-v24',TYPES=Object.freeze(['old','modern','final']);
  const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
  function validProfile(profile){
    return profile&&typeof profile==='object'&&!Array.isArray(profile)&&
      ['email','name','ci','ru','oldMention','oldMentionName','career','careerName'].every(key=>typeof profile[key]==='string'&&profile[key].trim())&&
      /^[a-z0-9][a-z0-9._-]*@fcpn\.edu\.bo$/.test(profile.email);
  }
  function validRecord(type,record){
    return record&&record.type===type&&record.status==='INICIADA'&&/^[a-f0-9]{64}$/.test(record.sha256)&&UUID.test(record.id)&&
      Number.isFinite(record.createdAt)&&typeof record.fileName==='string'&&record.fileName.endsWith('.pdf')&&
      Number.isSafeInteger(record.bytes)&&record.bytes>0&&Number.isSafeInteger(record.count)&&record.count>=0;
  }
  function create(storage){
    function read(){
      let raw;try{raw=storage.getItem(KEY);}catch(_){throw new Error('El navegador no permite guardar el bloqueo de descargas. Habilita el almacenamiento del sitio antes de continuar.');}
      if(!raw)return {version:1,profile:null,reports:{}};
      try{
        const data=JSON.parse(raw);
        if(data?.version!==1||!data.reports||typeof data.reports!=='object'||Array.isArray(data.reports))throw new Error();
        if(data.profile!==null&&!validProfile(data.profile))throw new Error();
        if(Boolean(data.profile)!==Boolean(Object.keys(data.reports).length))throw new Error();
        for(const [type,record]of Object.entries(data.reports)){
          if(!TYPES.includes(type)||!validRecord(type,record))throw new Error();
        }
        if(data.reports.final&&(!data.reports.old||!data.reports.modern))throw new Error();
        return data;
      }catch(_){throw new Error('No se puede leer el registro de descargas guardado. Contacta a Kardex antes de iniciar otra descarga.');}
    }
    function write(data){
      const value=JSON.stringify(data);
      try{storage.setItem(KEY,value);if(storage.getItem(KEY)!==value)throw new Error();}
      catch(_){throw new Error('No se pudo guardar el bloqueo en este navegador. No se inició la descarga.');}
    }
    function sameProfile(a,b){
      return ['email','name','ci','oldMention','career'].every(key=>String(a[key])===String(b[key]))&&String(a.ru).replace(/^0+(?=\d)/,'')===String(b.ru).replace(/^0+(?=\d)/,'');
    }
    function check(type,student){
      if(!TYPES.includes(type))throw new Error('El informe no es válido.');
      const data=read();
      if(data.reports[type])throw new Error('La descarga de este informe ya se inició en este navegador. No se puede repetir.');
      if(data.profile&&!sameProfile(data.profile,student))throw new Error('Usa los datos que quedaron registrados al iniciar la primera descarga.');
      if(type==='final'&&(!data.reports.old||!data.reports.modern))throw new Error('Descarga primero el Informe 1 y el Informe 2. Después podrás descargar el informe final y abrir la entrega.');
      return data;
    }
    function start(type,student,record){
      const data=check(type,student),saved={...record,type,status:'INICIADA'};
      if(!validProfile(student)||!validRecord(type,saved))throw new Error('No se puede guardar el registro de esta descarga.');
      data.profile||={...student};data.reports[type]=saved;write(data);return saved;
    }
    function rollback(type,id){
      const data=read();if(data.reports[type]?.id!==id)return;
      delete data.reports[type];if(!Object.keys(data.reports).length)data.profile=null;write(data);
    }
    function ensure(){const data=read();write(data);return data;}
    return Object.freeze({read,check,start,rollback,ensure,sameProfile,key:KEY});
  }
  window.DownloadLedger=Object.freeze({create,KEY,TYPES});
})();
