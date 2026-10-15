// Ejecuta app.js y gestion.js reales sin red. El DOM solo conserva sus salidas.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const compiled=new Map();
function script(root,name){const file=path.join(root,name);if(!compiled.has(file))compiled.set(file,new vm.Script(fs.readFileSync(file,'utf8'),{filename:name}));return compiled.get(file);}
function create(root,input={}){
  const nodes=new Map(),events=new Map();
  class Element{
    constructor(id=''){
      this.id=id;this.textContent='';this.innerHTML='';this.value='';this.hidden=false;this.disabled=false;this.dataset={};this.attrs={};this.listeners={};const classes=new Set();
      this.classList={toggle:(name,force)=>{const active=force===undefined?!classes.has(name):force;active?classes.add(name):classes.delete(name);return active;},add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name)};
    }
    addEventListener(name,fn){this.listeners[name]=fn;}setAttribute(name,value){this.attrs[name]=value;}getAttribute(name){return this.attrs[name];}
    querySelector(selector){return get(this.id+' '+selector);}querySelectorAll(){return [];}before(node){if(node.id)nodes.set(node.id,node);}focus(){}append(){}scrollIntoView(){}
  }
  const get=id=>{if(!nodes.has(id))nodes.set(id,new Element(id));return nodes.get(id);};
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),originalHead=html.match(/<thead>([\s\S]*?)<\/thead>/)[1];
  get('table-thead').innerHTML=originalHead;get('table-colgroup').innerHTML='<col class="code-col"><col class="name-col">'.repeat(3);
  get('.print-header div > p:last-child').textContent='Plan 1998 - Plan 2023 - Plan 2023 ajustado';
  const document={title:'Sistema',documentElement:{dataset:{}},getElementById:get,addEventListener(){},createElement:()=>new Element(),querySelector:selector=>get(selector)};
  get('#printView table').querySelector=selector=>get('table-'+selector);
  const window={matchMedia:()=>({matches:false,addEventListener(){}}),addEventListener:(name,fn)=>{if(!events.has(name))events.set(name,[]);events.get(name).push(fn);},dispatchEvent:event=>{for(const fn of events.get(event.type)||[])fn(event);}};
  const stored=new Map();
  if(input.career){stored.set('convalidaciones-umsa-gestion-2023-v1',JSON.stringify({[input.career]:input.modern||[]}));stored.set('convalidaciones-umsa-gestion-2023-v1-semestres',JSON.stringify({[input.career]:input.semesters||{}}));}
  const context=vm.createContext({window,document,localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,value)=>stored.set(key,value)},setTimeout:()=>0,clearTimeout(){},confirm:()=>true,Intl,Date,CustomEvent:class{constructor(type){this.type=type;}},__input:input});
  for(const name of ['data.js','gestion-data.js','app.js','gestion.js'])script(root,name).runInContext(context);
  if(input.career)vm.runInContext('state.name="PRUEBA QUISPE ÁLVAREZ";state.ci="12345678";state.ru="1836661";state.email="estudiante@fcpn.edu.bo";state.oldMention=__input.oldMention||"sistemas_informaticos";state.career=__input.career;state.selectedByCareer[state.career]=new Set(__input.old||[]);state.electiveChoices[state.career]={...(__input.choices||{})};render();',context);
  function report(type){
    const ok=vm.runInContext('buildPrintView('+JSON.stringify(type)+')',context);
    const state=JSON.parse(vm.runInContext('JSON.stringify({old:[...selectedSet()].sort(),choices:choiceMap(),completed:[...convalidatedElectiveCodes()].sort()})',context));
    return {ok,body:ok?get('printRows').innerHTML:'',head:ok?(type==='old'?originalHead.replace(/<b id="([^"]+)"><\/b>/g,(_all,id)=>get(id).textContent):get('table-thead').innerHTML):'',count:ok?String(get('printCount').textContent):'',dense:get('printView').classList.contains('dense'),...state};
  }
  return {context,get,window,document,report,run:code=>vm.runInContext(code,context)};
}
module.exports={create};
