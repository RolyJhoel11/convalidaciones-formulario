(() => {
  'use strict';
  const LABELS=Object.freeze({old:'Informe 1',modern:'Informe 2',final:'INFORME FINAL'});
  const FIELDS={email:'studentEmail',name:'studentName',ci:'studentCi',ru:'studentRu',oldMention:'oldMentionSelect',career:'careerSelect'};
  const ledger=window.DownloadLedger.create({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)}),links=window.ReportFormLinks,config=window.REPORT_DELIVERY_CONFIG;
  let busy=false,confirmation=null,storageProblem='';
  function message(text,tone=''){ $('submissionStatus').textContent=text;$('submissionStatus').dataset.tone=tone; }
  function studentData(){return {email:links.normalizeEmail($('studentEmail').value),name:state.name.trim(),ci:state.ci.trim(),ru:state.ru.trim(),oldMention:state.oldMention,oldMentionName:OLD_MENTIONS[state.oldMention],career:state.career,careerName:DATA[state.career]?.name};}
  function setBusy(value){busy=value;document.querySelector('main').inert=value;document.querySelector('main').setAttribute('aria-busy',String(value));$('pdfButton').disabled=value;}
  function read(){try{return ledger.read();}catch(error){storageProblem=error.message;message(error.message,'error');return {profile:null,reports:{}};}}
  function canOpenFinalForm(){
    const data=read();
    if(storageProblem||!data.reports.final||!data.profile)return false;
    try{return Boolean(links.build(data.profile,config));}catch(_){return false;}
  }
  function openFinalForm(){
    if(busy||!canOpenFinalForm())return false;
    try{
      const data=read(),link=$('openFinalForm');link.href=links.build(data.profile,config);link.click();
      message('Puedes continuar la entrega en Google Forms. Adjunta cada PDF en su casilla y pulsa «Enviar». Si ya respondiste, Google te lo indicará según la configuración del formulario.');
      return true;
    }catch(error){message(error.message||'No se pudo abrir el formulario. Usa el enlace de entrega que aparece abajo.','error');return false;}
  }
  function refresh(){
    const data=read(),holder=$('downloadStates');holder.replaceChildren();
    for(const [type,label]of Object.entries(LABELS)){
      const record=data.reports[type],row=document.createElement('div');row.className='download-state';row.dataset.completed=String(Boolean(record));
      const title=document.createElement('strong'),description=document.createElement('span');title.textContent=label;
      description.textContent=record?'Descarga iniciada · No disponible para otra descarga':'Pendiente de descarga';row.append(title,description);holder.append(row);
    }
    if(data.profile){
      for(const [key,id]of Object.entries(FIELDS)){state[key]=data.profile[key];$(id).value=data.profile[key];$(id).disabled=true;}
      $('lockedDataNote').hidden=false;
    }
    const all=Object.keys(LABELS).every(type=>data.reports[type]);
    const reopen=canOpenFinalForm();
    $('pdfButton').disabled=busy||Boolean(storageProblem)||(all&&!reopen);
    $('pdfButton').textContent=reopen?'Abrir formulario de entrega':all?'Descargas completadas':'Generar y descargar PDF';
    $('finalDelivery').hidden=!data.reports.final;
    if(data.reports.final){
      try{$('openFinalForm').href=links.build(data.profile,config);}catch(error){message(error.message,'error');}
      $('finalDeliveryDescription').textContent='Usa los mismos tres PDF que descargaste del sistema. Tus datos se abrirán prellenados. En cada pregunta de Google Forms pulsa «Añadir archivo» y elige el informe correspondiente:';
    }
    window.dispatchEvent(new CustomEvent('downloads:updated'));
  }
  function closeConfirmation(accepted){
    const resolve=confirmation;if(!resolve)return;confirmation=null;
    if($('downloadConfirm').open)$('downloadConfirm').close();resolve(accepted);
  }
  function firstReportColumns(view){
    const table=view.querySelector('table');
    if(!table)throw new Error('No se pudo preparar la lista de materias. Vuelve a intentar antes de descargar.');
    // Recortar solo la copia para revisión/PDF; conservar las celdas combinadas.
    for(const section of [table.tHead,...table.tBodies]){
      let occupied=[];
      for(const [index,row]of [...section.rows].entries()){
        let column=0;
        for(const cell of [...row.cells]){
          while(occupied[column]>0)column++;
          const width=cell.colSpan||1,height=cell.rowSpan===0?section.rows.length-index:cell.rowSpan||1;
          for(let col=column;col<column+width;col++)occupied[col]=height;
          if(column>=4)cell.remove();else if(column+width>4)cell.colSpan=4-column;
          column+=width;
        }
        occupied=occupied.map(height=>Math.max(0,height-1));
      }
    }
    for(const col of [...table.querySelector('colgroup').children].slice(4))col.remove();
    view.classList.add('gestion-print');
    view.querySelector('.print-header div > p:last-child').textContent='Plan 1998 - Plan 2023';
  }
  function confirmReport(type,student,snapshot){
    const count=snapshot.count;
    const dialog=$('downloadConfirm'),fields=$('confirmStudentFields');fields.replaceChildren();
    for(const [label,value]of [['Informe',LABELS[type]],['Apellidos y nombres',student.name],['Correo FCPN',student.email],['CI',student.ci],['RU',student.ru],['Mención 1998',student.oldMentionName],['Mención de destino',student.careerName],['Materias convalidadas',count]]){
      const row=document.createElement('div'),term=document.createElement('dt'),description=document.createElement('dd');term.textContent=label;description.textContent=String(value);row.append(term,description);fields.append(row);
    }
    const original=snapshot.view.querySelector('table');
    if(!original)throw new Error('No se pudo preparar la lista de materias. Vuelve a intentar antes de descargar.');
    const table=original.cloneNode(true);
    for(const node of table.querySelectorAll('[id]'))node.removeAttribute('id');
    table.className='confirm-course-table';table.dataset.plans=table.querySelectorAll('col').length===4?'2':'3';$('confirmCourseTable').replaceChildren(table);
    $('confirmDownloadTitle').textContent='Revisa los datos de '+LABELS[type];$('confirmReviewed').checked=false;$('confirmDownloadButton').disabled=true;
    $('confirmDownloadWarning').open=false;$('confirmFinalNote').open=false;
    $('confirmFinalNote').hidden=type!=='final';
    if(typeof dialog.showModal!=='function'){
      const courses=[...original.rows].map(row=>[...row.cells].map(cell=>cell.textContent.trim()).join(' | ')).join('\n');
      const delivery=type==='final'?'\n\nEn Google Forms: primer informe → INFORME 1; segundo informe → INFORME 2; Informe Final → INFORME FINAL. Luego pulsa Enviar.':'';
      return Promise.resolve(window.confirm(LABELS[type]+'\n'+student.name+'\nCI: '+student.ci+' · RU: '+student.ru+'\n'+student.email+'\n'+student.oldMentionName+' → '+student.careerName+'\nMaterias convalidadas: '+count+'\n\n'+courses+'\n\nRevisa todo antes de continuar. Este es el PDF que debes subir al formulario. Al iniciar la descarga, no podrás corregirlo, rehacerlo ni descargarlo otra vez en este navegador. Guarda el archivo.'+delivery+'\n\n¿Confirmas que revisaste tus datos y materias?'));
    }
    return new Promise(resolve=>{confirmation=resolve;dialog.showModal();$('confirmScroll').scrollTop=0;$('confirmScroll').focus();});
  }
  function waitingWindow(){
    let popup=null;try{popup=window.open('about:blank','_blank');if(popup){popup.opener=null;popup.document.title='Preparando entrega de informes';popup.document.documentElement.lang='es';popup.document.body.textContent='Preparando el informe final. El formulario de entrega se abrirá con tus datos cuando empiece la descarga.';}}catch(_){}return popup;
  }
  function identifier(){
    if(crypto.randomUUID)return crypto.randomUUID();
    const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
    const hex=[...bytes].map(n=>n.toString(16).padStart(2,'0')).join('');return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
  }
  async function hash(bytes){
    if(!crypto.subtle?.digest)throw new Error('Abre el sistema desde su dirección HTTPS para generar el registro de integridad del PDF.');
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');
  }
  function startDownload(bytes,fileName){
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download=fileName;document.body.append(a);
    try{a.click();}finally{a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
  }
  async function withLock(fn){
    if(navigator.locks?.request)return navigator.locks.request('convalidaciones-descargas-v24',fn);
    return fn();
  }
  async function submit(type){
    if(busy||!Object.prototype.hasOwnProperty.call(LABELS,type))return;
    const problem=links.emailProblem($('studentEmail').value);$('studentEmail').setCustomValidity(problem);
    if(problem){$('studentEmail').reportValidity();$('studentEmail').focus();return;}
    let student,snapshot,popup=null,opened=false,started=false;
    try{
      if(storageProblem)throw new Error(storageProblem);
      ledger.ensure();student=studentData();ledger.check(type,student);
      if(!buildPrintView(type))return;
      snapshot=window.ReportPdf.capture(type,student);if(type==='old')firstReportColumns(snapshot.view);setBusy(true);
      const confirmed=await confirmReport(type,student,snapshot);if(!confirmed)return;
      // Esta llamada sigue al clic de confirmación, antes de esperas asíncronas.
      const formUrl=type==='final'?links.build(student,config):null;
      if(type==='final')popup=waitingWindow();
      await withLock(async()=>{
        ledger.check(type,student);message('Preparando '+LABELS[type]+'…');
        const id=identifier(),createdAt=Date.now();snapshot.issuance={id,createdAt};
        const pdf=await window.ReportPdf.create(snapshot),sha256=await hash(pdf.bytes);
        const fileName=pdf.fileName;
        // Persistir antes del clic. Cancelar el guardado en el navegador no puede detectarse.
        ledger.start(type,student,{id,createdAt,fileName,sha256,bytes:pdf.bytes.length,count:Number(snapshot.count)});
        try{startDownload(pdf.bytes,fileName);started=true;}
        catch(error){ledger.rollback(type,id);throw error;}
        saveState();refresh();
        if(type==='final'){
          try{if(popup&&!popup.closed){popup.location.replace(formUrl);opened=true;}}catch(_){}
          message(opened?'Descarga final iniciada. Se abrió la entrega: adjunta los tres PDF y pulsa «Enviar» en Google.':'Descarga final iniciada. Pulsa «Abrir formulario de entrega», adjunta los tres PDF y confirma en Google.');
        }else message('Descarga de '+LABELS[type]+' iniciada. Guarda el archivo: este informe quedó bloqueado en este navegador.');
        toast('Descarga iniciada. Conserva el PDF.');
      });
    }catch(error){message(error.message||'No se pudo iniciar la descarga. Vuelve a intentar.','error');toast(error.message||'No se pudo iniciar la descarga.');}
    finally{
      if(popup&&!opened){try{popup.close();}catch(_){}}
      if(!started&&snapshot)document.title=originalDocumentTitle;
      setBusy(false);refresh();document.title=originalDocumentTitle;
    }
  }
  $('confirmReviewed').addEventListener('change',()=>{$('confirmDownloadButton').disabled=!$('confirmReviewed').checked;});
  $('confirmDownloadButton').addEventListener('click',()=>{if($('confirmReviewed').checked)closeConfirmation(true);});
  $('cancelDownloadButton').addEventListener('click',()=>closeConfirmation(false));
  $('downloadConfirm').addEventListener('cancel',event=>{event.preventDefault();closeConfirmation(false);});
  $('downloadConfirm').addEventListener('close',()=>{if(confirmation)closeConfirmation(false);});
  $('studentEmail').addEventListener('input',()=>{state.email=links.normalizeEmail($('studentEmail').value);saveState();$('studentEmail').setCustomValidity('');});
  window.addEventListener('storage',event=>{if(event.key===ledger.key||event.key===null)refresh();});
  window.addEventListener('convalidaciones:rendered',()=>{const profile=read().profile;if(profile)for(const id of Object.values(FIELDS))$(id).disabled=true;});
  window.ReportSubmission=Object.freeze({submit,isDownloaded:type=>Boolean(read().reports[type]),canDownload:type=>{
    const data=read();return Object.prototype.hasOwnProperty.call(LABELS,type)&&!storageProblem&&!data.reports[type]&&(type!=='final'||Boolean(data.reports.old&&data.reports.modern));
  },lockedProfile:()=>read().profile,canOpenFinalForm,openFinalForm});
  refresh();if(read().profile){saveState();render();}
})();
