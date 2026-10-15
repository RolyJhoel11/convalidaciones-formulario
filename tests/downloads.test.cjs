// Pruebas locales: no contactan Google ni envían respuestas.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {webcrypto}=require('node:crypto');
const root=path.resolve(__dirname,'..');
const student={email:'estudiante@fcpn.edu.bo',name:'QUISPE ÁLVAREZ & PRUEBA',ci:'12345678',ru:'1836661',oldMention:'sistemas_informaticos',oldMentionName:'Ingeniería de Sistemas Informáticos',career:'sistemas',careerName:'Ingeniería de Sistemas'};
const key='convalidaciones-descargas-v24';
function storage(initial){
  const data=initial||new Map();
  return {data,options:{},getItem(name){if(this.options.failRead)throw new Error('blocked');return data.get(name)||null;},setItem(name,value){if(this.options.failWrite||this.options.failRecord&&Object.keys(JSON.parse(value).reports).length)throw new Error('quota');data.set(name,value);}};
}
function environment(options={}){
  const store=options.storage||storage(),nodes=new Map(),downloads=[],popups=[],events=new Map(),log=[];
  let continuePdf;
  class Element{
    constructor(id='',tag='div'){this.id=id;this.tag=tag;this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.checked=false;this.open=false;this.dataset={};this.attrs={};this.children=[];this.listeners=new Map();}
    addEventListener(name,fn){if(!this.listeners.has(name))this.listeners.set(name,[]);this.listeners.get(name).push(fn);}
    fire(name,event={}){for(const fn of this.listeners.get(name)||[])fn(event);}
    setAttribute(k,v){this.attrs[k]=v;}setCustomValidity(value){this.validity=value;}reportValidity(){this.reported=true;}focus(){this.focused=true;}
    replaceChildren(){this.children=[];}append(...values){this.children.push(...values);}remove(){}
    showModal(){this.open=true;}close(){this.open=false;this.fire('close');}
    click(){if(this.disabled)return;if(this.tag==='a'&&this.download){if(options.downloadFail)throw new Error('No se pudo iniciar el guardado');downloads.push({href:this.href,fileName:this.download});}else this.fire('click');}
  }
  const $=id=>{if(!nodes.has(id))nodes.set(id,new Element(id,/Select$/.test(id)?'select':/^student/.test(id)?'input':'button'));return nodes.get(id);};
  const main=new Element('main'),body=new Element('body');
  const document={title:'Sistema',body,querySelector:()=>main,createElement:tag=>new Element('',tag)};
  const window={addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent:event=>{for(const fn of events.get(event.type)||[])fn(event);},confirm:()=>options.fallbackAccept!==false,
    open:()=>{log.push('open');if(options.popupBlocked)return null;const popup={closed:false,opener:{},document:{documentElement:{},body:{}},location:{replace:url=>{popup.url=url;}},close(){this.closed=true;}};popups.push(popup);return popup;}};
  window.ReportPdf={capture:(type,value)=>({type,student:{...value},count:'2'}),create:async snapshot=>{
    log.push('pdf');if(options.deferred)await new Promise(resolve=>{continuePdf=resolve;});if(options.pdfFail)throw new Error('No se pudo generar el PDF');
    return {bytes:new Uint8Array(Buffer.from('%PDF-1.7\n'+snapshot.type+'\n'+snapshot.issuance.id+'\n%%EOF'))};
  }};
  const URLClass=class extends URL{};URLClass.createObjectURL=()=> 'blob:test';URLClass.revokeObjectURL=()=>{};
  const state={...student};for(const [field,id]of Object.entries({email:'studentEmail',name:'studentName',ci:'studentCi',ru:'studentRu',oldMention:'oldMentionSelect',career:'careerSelect'}))$(id).value=state[field];
  if(options.fallbackDialog)$('downloadConfirm').showModal=undefined;
  const context=vm.createContext({window,document,$,state,localStorage:store,crypto:options.noCrypto?{getRandomValues:array=>webcrypto.getRandomValues(array)}:webcrypto,navigator:{locks:options.locks},URL:URLClass,Blob,Uint8Array,Intl,Date,
    OLD_MENTIONS:{sistemas_informaticos:student.oldMentionName},DATA:{sistemas:{name:student.careerName}},originalDocumentTitle:'Sistema',
    buildPrintView:()=>!options.invalidData,saveState:()=>{},render:()=>window.dispatchEvent({type:'convalidaciones:rendered'}),toast:()=>{},CustomEvent:class{constructor(type){this.type=type;}},setTimeout:()=>1});
  for(const file of ['envios-config.js','form-links.js','download-ledger.js','envios.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
  return {window,$,state,store,downloads,popups,main,log,options,continuePdf:()=>continuePdf?.(),context};
}
async function attempt(h,type,accept=true){const promise=h.window.ReportSubmission.submit(type);if(h.$('downloadConfirm').open){if(accept){h.$('confirmReviewed').checked=true;h.$('confirmReviewed').fire('change');h.$('confirmDownloadButton').click();}else h.$('cancelDownloadButton').click();}await promise;}
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));
function lockManager(){let pending=Promise.resolve();return {request:(_name,fn)=>{const current=pending.then(fn);pending=current.catch(()=>{});return current;}};}
(async()=>{
  let count=0;const test=async(name,fn)=>{await fn();count++;console.log('✓ '+name);};
  await test('Solo correo FCPN exacto y datos válidos antes de confirmar',async()=>{
    for(const value of ['', 'x@umsa.bo','x@gmail.com','x@fcpn.edu.bo.evil.com','x..y@fcpn.edu.bo','x+otro@fcpn.edu.bo']){
      const h=environment();h.$('studentEmail').value=value;await attempt(h,'old');assert.equal(h.log.length,0);assert.ok(h.$('studentEmail').validity);assert.equal(h.$('downloadConfirm').open,false);
    }
    const h=environment({invalidData:true});await attempt(h,'old');assert.equal(h.downloads.length,0);assert.equal(h.$('downloadConfirm').open,false);
  });
  await test('Prellenado usa las cinco preguntas reales, acentos y cuenta FCPN',()=>{
    const h=environment(),url=new URL(h.window.ReportFormLinks.build(student,h.window.REPORT_DELIVERY_CONFIG));
    const fields={'1422839057':student.name,'1963355893':student.ci,'1922283312':student.ru,'994095876':student.oldMentionName,'1806387132':student.careerName};
    for(const [id,value]of Object.entries(fields))assert.equal(url.searchParams.get('entry.'+id),value);
    assert.equal(url.searchParams.get('authuser'),student.email);assert.equal(url.hostname,'docs.google.com');assert.match(url.pathname,/1FAIpQLSdO2TsIhxj4BjCj8ZT2zgdxVNSQGAAJ1AfPXQXlXcWMXoR1BA/);
    for(const destination of ['https://evil.example/form','javascript:alert(1)','https://docs.google.com@evil.example/forms/d/e/ID/viewform'])assert.throws(()=>h.window.ReportFormLinks.build(student,{finalForm:{url:destination,fields:h.window.REPORT_DELIVERY_CONFIG.finalForm.fields}}));
    assert.throws(()=>h.window.ReportFormLinks.build(student,{finalForm:{url:url.href,fields:{}}}));
  });
  await test('Confirmación muestra datos; el botón requiere revisión y cancelar no bloquea',async()=>{
    const h=environment(),promise=h.window.ReportSubmission.submit('old');assert.ok(h.$('downloadConfirm').open);assert.equal(h.$('confirmDownloadButton').disabled,true);
    assert.equal(h.$('confirmStudentFields').children.length,8);assert.equal(h.$('confirmStudentFields').children[1].children[1].textContent,student.name);
    h.$('confirmDownloadButton').click();assert.equal(h.log.length,0);h.$('cancelDownloadButton').click();await promise;
    assert.equal(h.downloads.length,0);assert.equal(h.window.ReportSubmission.isDownloaded('old'),false);assert.equal(h.main.inert,false);
    await attempt(h,'old');assert.equal(h.downloads.length,1);
  });
  await test('Escape cancela el diálogo y no genera PDF',async()=>{
    const h=environment(),promise=h.window.ReportSubmission.submit('old');let prevented=false;h.$('downloadConfirm').fire('cancel',{preventDefault:()=>{prevented=true;}});await promise;
    assert.ok(prevented);assert.equal(h.downloads.length,0);assert.equal(h.log.length,0);
  });
  await test('Informes 1 y 2 descargan una vez y no abren formularios',async()=>{
    const h=environment();await attempt(h,'old');await attempt(h,'modern');
    assert.equal(h.downloads.length,2);assert.equal(h.popups.length,0);assert.equal(h.$('finalDelivery').hidden,true);
    assert.ok(h.window.ReportSubmission.isDownloaded('old'));assert.ok(h.window.ReportSubmission.isDownloaded('modern'));
    const ledger=JSON.parse(h.store.data.get(key));for(const type of ['old','modern']){assert.match(ledger.reports[type].sha256,/^[a-f0-9]{64}$/);assert.match(ledger.reports[type].id,/^[a-f0-9-]{36}$/);}
    assert.equal(h.window.ReportSubmission.canDownload('old'),false);assert.equal(h.window.ReportSubmission.canDownload('modern'),false);
    await attempt(h,'old');await attempt(h,'modern');assert.equal(h.downloads.length,2);
  });
  await test('Final exige los dos primeros y abre solo el formulario final prellenado',async()=>{
    const h=environment();await attempt(h,'final');assert.equal(h.log.length,0);assert.match(h.$('submissionStatus').textContent,/primero/);
    await attempt(h,'old');await attempt(h,'final');assert.equal(h.popups.length,0);
    await attempt(h,'modern');await attempt(h,'final');assert.equal(h.downloads.length,3);assert.equal(h.popups.length,1);assert.equal(h.popups[0].closed,false);
    assert.equal(h.popups[0].url,h.$('openFinalForm').href);assert.equal(h.$('finalDelivery').hidden,false);assert.equal(h.$('pdfButton').disabled,true);
    assert.equal(h.$('pdfButton').textContent,'Descargas completadas');assert.match(h.$('submissionStatus').textContent,/adjunta los tres PDF/);assert.doesNotMatch(h.$('submissionStatus').textContent,/enviado|recibido/i);
    await attempt(h,'final');assert.equal(h.downloads.length,3);assert.equal(h.popups.length,1);
  });
  await test('Se puede volver a abrir Forms sin volver a descargar; ventanas bloqueadas no pierden el enlace',async()=>{
    const h=environment({popupBlocked:true});for(const type of ['old','modern','final'])await attempt(h,type);
    assert.equal(h.downloads.length,3);assert.equal(h.popups.length,0);assert.match(h.$('openFinalForm').href,/entry\.1422839057=/);assert.match(h.$('submissionStatus').textContent,/Abrir formulario de entrega/);
    const loaded=environment({storage:h.store});assert.equal(loaded.$('finalDelivery').hidden,false);assert.equal(loaded.$('openFinalForm').href,h.$('openFinalForm').href);assert.equal(loaded.$('pdfButton').disabled,true);assert.equal(loaded.downloads.length,0);
  });
  await test('Recargar conserva bloqueos y los datos fijados del estudiante',async()=>{
    const h=environment();await attempt(h,'old');const loaded=environment({storage:h.store});
    assert.ok(loaded.window.ReportSubmission.isDownloaded('old'));assert.equal(loaded.$('studentEmail').disabled,true);assert.equal(loaded.$('studentName').disabled,true);assert.equal(loaded.$('careerSelect').disabled,true);assert.equal(loaded.$('lockedDataNote').hidden,false);
    loaded.state.name='OTRO';await attempt(loaded,'modern');assert.equal(loaded.downloads.length,0);assert.match(loaded.$('submissionStatus').textContent,/datos que quedaron registrados/);
  });
  await test('Error del generador no bloquea y permite reintentar',async()=>{
    const h=environment({pdfFail:true});await attempt(h,'old');assert.equal(h.window.ReportSubmission.isDownloaded('old'),false);assert.equal(h.downloads.length,0);
    h.options.pdfFail=false;await attempt(h,'old');assert.equal(h.downloads.length,1);
  });
  await test('Error del PDF final cierra la ventana pendiente y deja el final sin bloquear',async()=>{
    const h=environment();await attempt(h,'old');await attempt(h,'modern');h.options.pdfFail=true;await attempt(h,'final');
    assert.equal(h.popups.length,1);assert.equal(h.popups[0].closed,true);assert.equal(h.window.ReportSubmission.isDownloaded('final'),false);assert.equal(h.downloads.length,2);
  });
  await test('Almacenamiento deshabilitado o lleno no permite una descarga sin registro',async()=>{
    const blocked=storage();blocked.options.failRead=true;const h=environment({storage:blocked});assert.equal(h.$('pdfButton').disabled,true);await attempt(h,'old');assert.equal(h.downloads.length,0);
    const full=storage();full.options.failRecord=true;const second=environment({storage:full});await attempt(second,'old');assert.equal(second.downloads.length,0);assert.equal(second.window.ReportSubmission.isDownloaded('old'),false);assert.match(second.$('submissionStatus').textContent,/No se pudo guardar/);
  });
  await test('Registro corrupto falla sin habilitar una nueva descarga',async()=>{
    for(const raw of ['{','null','{"version":1,"profile":null,"reports":{"old":null}}','{"version":1,"profile":"fake","reports":{}}']){
      const store=storage(new Map([[key,raw]])),h=environment({storage:store});assert.equal(h.$('pdfButton').disabled,true);await attempt(h,'old');assert.equal(h.downloads.length,0);assert.equal(store.data.get(key),raw);
    }
  });
  await test('Fallo síncrono al iniciar la descarga revierte solo esa reserva',async()=>{
    const h=environment({downloadFail:true});await attempt(h,'old');assert.equal(h.window.ReportSubmission.isDownloaded('old'),false);assert.equal(h.window.ReportSubmission.lockedProfile(),null);
    h.options.downloadFail=false;await attempt(h,'old');h.options.downloadFail=true;await attempt(h,'modern');assert.ok(h.window.ReportSubmission.isDownloaded('old'));assert.equal(h.window.ReportSubmission.isDownloaded('modern'),false);
  });
  await test('Doble clic durante la generación produce un PDF y una descarga',async()=>{
    const h=environment({deferred:true}),promise=h.window.ReportSubmission.submit('old');h.$('confirmReviewed').checked=true;h.$('confirmReviewed').fire('change');h.$('confirmDownloadButton').click();await nextTick();
    await h.window.ReportSubmission.submit('old');assert.equal(h.log.filter(value=>value==='pdf').length,1);h.continuePdf();await promise;assert.equal(h.downloads.length,1);
  });
  await test('Dos pestañas con Web Locks comparten una única descarga',async()=>{
    const shared=storage(),locks=lockManager(),a=environment({storage:shared,locks,deferred:true}),b=environment({storage:shared,locks});
    const first=attempt(a,'old');await nextTick();const second=attempt(b,'old');await nextTick();assert.equal(b.log.filter(value=>value==='pdf').length,0);
    a.continuePdf();await Promise.all([first,second]);assert.equal(a.downloads.length+b.downloads.length,1);assert.ok(b.window.ReportSubmission.isDownloaded('old'));
  });
  await test('SHA-256 ausente falla antes de descargar y no deja un bloqueo falso',async()=>{
    const h=environment({noCrypto:true});await attempt(h,'old');assert.equal(h.downloads.length,0);assert.equal(h.window.ReportSubmission.isDownloaded('old'),false);assert.match(h.$('submissionStatus').textContent,/HTTPS/);
  });
  await test('Compatibilidad sin dialog conserva la confirmación y permite cancelar',async()=>{
    const h=environment({fallbackDialog:true,fallbackAccept:false});await attempt(h,'old');assert.equal(h.downloads.length,0);h.options.fallbackAccept=true;await attempt(h,'old');assert.equal(h.downloads.length,1);
  });
  await test('La página estudiantil no contiene validador, activación ni descargas repetidas',()=>{
    const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),js=fs.readFileSync(path.join(root,'envios.js'),'utf8'),config=fs.readFileSync(path.join(root,'envios-config.js'),'utf8');
    assert.doesNotMatch(html+js+config,/kardex debe activar|webAppUrl|script\.google\.com|verificar\.html|lector-integridad|enviar c[oó]digo|@umsa\.bo/i);
    assert.match(html,/downloadConfirm/);assert.match(html,/Cancelar|cancelaste/);assert.doesNotMatch(html,/downloadPreparedPdf|preparedReport/);
    assert.match(fs.readFileSync(path.join(root,'envios.css'),'utf8'),/button:disabled\{opacity:\.4/);
  });
  console.log(count+' pruebas de descargas completadas.');
})().catch(error=>{console.error(error);process.exitCode=1;});
