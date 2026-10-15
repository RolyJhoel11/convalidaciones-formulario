const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'report-pdf.js'),'utf8');
const {build,printStyles}=require('../tools/build-report-assets.cjs');
const document={baseURI:'file:///carpeta%20del%20estudiante/index.html',
  querySelectorAll(){throw new Error('SecurityError: acceso a hojas CSS bloqueado');},
  getElementById:id=>id==='printCount'?{textContent:'4'}:{cloneNode:()=>({originalView:true})}};
const context=vm.createContext({window:{},TextEncoder,URL,document,fetch(){throw new Error('No se permiten peticiones para generar el PDF.');}});
vm.runInContext(fs.readFileSync(path.join(root,'report-assets.js'),'utf8'),context);
// Solo en esta prueba se exponen los helpers internos; no cambia la aplicación publicada.
vm.runInContext(source.replace('Object.freeze({LABELS,capture,create,fileName})','Object.freeze({LABELS,capture,create,fileName,printStyles,paginate,imageData})'),context);
const api=context.window.ReportPdf,id='11111111-1111-4111-8111-111111111111';
for(const [type,title]of Object.entries({old:'INFORME 1',modern:'INFORME 2',final:'INFORME FINAL'}))assert.equal(api.fileName(type,'  Quispe   Álvarez  ',id),title+' - Quispe Álvarez - '+id+'.pdf');
assert.equal(api.fileName('old','Nombre / Apellido:*?',id),'INFORME 1 - Nombre Apellido - '+id+'.pdf');
assert.ok(new TextEncoder().encode(api.fileName('old','Ñ'.repeat(150),id)).length<=240);
assert.throws(()=>api.fileName('toString','Nombre',id));assert.throws(()=>api.fileName('old','',id));assert.throws(()=>api.fileName('old','Nombre','123'));
console.log('✓ Nombres de los tres PDF con nombre completo, acentos y código; sin RU ni nombres temporales.');
const bundled=context.window.ReportAssets,expected=build();
assert.deepEqual(JSON.parse(JSON.stringify(bundled)),expected,'Los CSS o PNG cambiaron sin actualizar report-assets.js.');
const css=api.printStyles();assert.match(css,/font-family:Arial/);assert.match(css,/width:46px/);assert.match(css,/font-size:5\.25pt/);
assert.doesNotMatch(css,/@media|@page|data-theme|color-scheme:dark|@import|url\s*\(/i);
assert.equal(printStyles('/* { } */ .base{content:"}"} @media screen{.no{color:red}} @media print{.yes{font-family:Arial}@page{margin:5mm}}'),
  '/* { } */ .base{content:"}"}\n.yes{font-family:Arial}');
assert.throws(()=>printStyles('.bad{color:red'),/incompleta/);
console.log('✓ Recursos empaquetados idénticos a sus CSS/PNG de origen; solo estilos originales de impresión.');
for(const type of ['old','modern','final']){
  const student={name:'Nombre Apellido',email:'estudiante@fcpn.edu.bo'},snapshot=api.capture(type,student);
  assert.equal(snapshot.css,css);assert.equal(snapshot.count,'4');assert.equal(snapshot.view.originalView,true);
  student.name='MODIFICADO';assert.equal(snapshot.student.name,'Nombre Apellido');
}
assert.doesNotMatch(source,/\.sheet\b|cssRules|CSSRule|\bfetch\s*\(|FileReader/);
console.log('✓ Regresión de la captura: los tres informes se preparan aunque el navegador bloquee leer hojas CSS.');
for(const base of ['file:///C:/carpeta%20estudiante/index.html','https://usuario.github.io/convalidaciones/index.html','https://convalidaciones.example/index.html']){
  document.baseURI=base;
  for(const file of Object.keys(expected.images)){
    const data=api.imageData(file+'?v=27.0');assert.equal(data,expected.images[file]);
    assert.ok(Buffer.from(data.split(',')[1],'base64').equals(fs.readFileSync(path.join(root,file))));
  }
}
assert.throws(()=>api.imageData('https://otro.example/logo.png'),/Falta un logotipo/);
console.log('✓ Ambos logos íntegros en rutas locales, GitHub Pages y Vercel, sin fetch ni permisos de archivo.');
context.window.ReportAssets=undefined;assert.throws(()=>api.capture('old',{name:'Prueba'}),/Falta report-assets\.js/);context.window.ReportAssets=bundled;
console.log('✓ Una actualización incompleta muestra el archivo faltante antes de iniciar la descarga.');
function fakeSource(count=100,rowHeight=9){
 const rows=Array.from({length:count},(_,i)=>({index:i,cells:[{rowSpan:i===68?4:1}],getBoundingClientRect:()=>({top:140+i*rowHeight,bottom:140+(i+1)*rowHeight}),querySelector:()=>null,cloneNode(){return this;}}));
 const copies=[];return {copies,querySelector:()=>({tBodies:[{rows}],tHead:{getBoundingClientRect:()=>({height:30})}}),getBoundingClientRect:()=>({top:20,bottom:140+count*rowHeight+50}),cloneNode(){
  const copy={kept:[],removed:[],querySelector:()=>({replaceChildren(){copy.kept=[];},append:row=>copy.kept.push(row.index)}),querySelectorAll:selector=>[{remove:()=>copy.removed.push(selector)}]};copies.push(copy);return copy;
 }};
}
const table=fakeSource(),pages=api.paginate(table);assert.ok(pages.length>1);assert.deepEqual(Array.from(pages.flatMap(page=>page.kept)),Array.from({length:100},(_,i)=>i));
const spanPage=pages.find(page=>page.kept.includes(68));assert.ok([69,70,71].every(index=>spanPage.kept.includes(index)));
assert.ok(pages[0].removed.includes('.print-count,.print-note,.print-emission'));assert.ok(pages[1].removed.includes('.print-header,.print-meta'));
assert.throws(()=>api.paginate(fakeSource(1,1000)),/excede/);
console.log('✓ Paginación conserva todas las filas, celdas combinadas, cabeceras y cierre final.');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),envios=fs.readFileSync(path.join(root,'envios.js'),'utf8');
assert.doesNotMatch(source+envios,/window\.print\s*\(/);assert.match(envios,/const fileName=pdf\.fileName/);assert.match(html,/report-pdf\.js\?v=27\.0/);
assert.ok(html.indexOf('report-assets.js?v=27.0')<html.indexOf('report-pdf.js?v=27.0'));
assert.match(source,/SCALE=300\/96/);assert.match(source,/drawImage\(png/);assert.match(source,/opacity:0/);assert.doesNotMatch(source,/scaleToFit|embedFont\(StandardFonts/);
console.log('✓ Descarga directa: vista original a 300 ppp y capa de búsqueda; sin diálogo de impresión.');
