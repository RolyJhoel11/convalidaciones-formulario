const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),nodes=new Map(),events=new Map(),tools=new Map(),done=new Set();
class Element{
  constructor(id=''){this.id=id;this.textContent='';this.innerHTML='';this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.classList={toggle(){},add(){},remove(){}};this.attrs={};this.listeners={};}
  addEventListener(type,fn){this.listeners[type]=fn;}setAttribute(k,v){this.attrs[k]=v;}getAttribute(k){return this.attrs[k];}
  querySelector(selector){return get(this.id+' '+selector);}querySelectorAll(){return [];}before(node){if(node.id)nodes.set(node.id,node);}focus(){}append(){}scrollIntoView(){}
}
function get(id){if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);}
const document={title:'Sistema',documentElement:{dataset:{}},getElementById:get,addEventListener(){},createElement:()=>new Element(),querySelector:selector=>get(selector),modelContext:{registerTool:tool=>tools.set(tool.name,tool)}};
get('#printView table').querySelector=selector=>get('table-'+selector);
const window={matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(type,fn)=>{if(!events.has(type))events.set(type,[]);events.get(type).push(fn);},dispatchEvent:event=>{for(const fn of events.get(event.type)||[])fn(event);}};
const stored=new Map(),context=vm.createContext({window,document,localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,Intl,Date,CustomEvent:class{constructor(type){this.type=type;}}});
for(const file of ['data.js','gestion-data.js','app.js','gestion.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
let profile=null,reopened=0,submitted=0;
window.ReportSubmission={isDownloaded:type=>done.has(type),canDownload:type=>!done.has(type)&&(type!=='final'||done.has('old')&&done.has('modern')),lockedProfile:()=>profile,canOpenFinalForm:()=>done.has('final'),openFinalForm:()=>{reopened++;},submit:()=>{submitted++;}};
vm.runInContext('state.name="Quispe Álvarez";state.ci="12345678";state.ru="1836661";state.oldMention="sistemas_informaticos";state.career="sistemas";render();',context);
assert.equal(get('pdfButton').disabled,false);assert.equal((get('gestionPdfMenu').innerHTML.match(/data-report=/g)||[]).length,1);
done.add('old');window.dispatchEvent({type:'downloads:updated'});assert.equal(get('pdfButton').disabled,true);assert.equal(get('pdfButton').textContent,'Informe 1 descargado');assert.match(get('gestionPdfMenu').innerHTML,/data-report="old" disabled/);
get('gestionNextButton').listeners.click();assert.equal(get('pdfButton').disabled,false);assert.equal((get('gestionPdfMenu').innerHTML.match(/data-report=/g)||[]).length,3);assert.match(get('gestionPdfMenu').innerHTML,/data-report="final" disabled/);
done.add('modern');window.dispatchEvent({type:'downloads:updated'});assert.equal(get('pdfButton').disabled,false);assert.match(get('gestionPdfMenu').innerHTML,/data-report="modern" disabled/);assert.doesNotMatch(get('gestionPdfMenu').innerHTML,/data-report="final" disabled/);
done.add('final');window.dispatchEvent({type:'downloads:updated'});assert.equal(get('pdfButton').disabled,false);assert.equal(get('pdfButton').textContent,'Abrir formulario de entrega');
assert.match(get('gestionPdfMenu').innerHTML,/data-report="old" disabled/);assert.match(get('gestionPdfMenu').innerHTML,/data-report="modern" disabled/);
assert.match(get('gestionPdfMenu').innerHTML,/data-report="final" data-action="open-form">Abrir formulario de entrega/);
get('pdfButton').listeners.click({stopImmediatePropagation(){}});assert.equal(reopened,1);assert.equal(get('gestionPdfMenu').hidden,true);
get('gestionPdfMenu').listeners.click({target:{closest:()=>({disabled:false,dataset:{report:'final',action:'open-form'}})}});assert.equal(reopened,2);assert.equal(submitted,0);
get('gestionNextButton').listeners.click();assert.equal(get('pdfButton').disabled,false);assert.equal(get('pdfButton').textContent,'Abrir formulario de entrega');
get('pdfButton').listeners.click({stopImmediatePropagation(){}});assert.equal(reopened,3);assert.equal(submitted,0);
console.log('✓ Menú real: descargas bloqueadas; el final y el botón principal reabren Forms, incluso al volver al paso 1.');
profile={name:'Quispe Álvarez',ci:'12345678',ru:'1836661',oldMention:'sistemas_informaticos',career:'sistemas'};
window.ConvalidationImportApi.apply({name:'OTRO ESTUDIANTE',ci:'9999',ru:'8888',rowIds:[]});assert.equal(vm.runInContext('state.name',context),profile.name);assert.equal(get('studentRu').value,profile.ru);
console.log('✓ El lector del historial conserva la identidad fijada, incluidas las mayúsculas originales.');
assert.throws(()=>tools.get('configure_student').execute({...profile,name:'OTRO ESTUDIANTE'}),/fijados/);assert.equal(vm.runInContext('state.name',context),profile.name);
console.log('✓ La configuración asistida también respeta el bloqueo de identidad.');
