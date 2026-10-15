// Ejecutar solo al mantener el proyecto: node tools/build-report-assets.cjs
// Empaqueta las fuentes originales; el estudiante no necesita ejecutar este script.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const styles=['styles.css','print.css','gestion.css','print-additions.css'];
const logos=['assets/logo-kardex-transparente.png','assets/logo-informatica-transparente.png'];

// Separa reglas respetando comentarios, cadenas y bloques anidados. No reescribe
// selectores ni declaraciones: conserva el orden de cascada de las hojas originales.
function rules(text){
  const output=[];let start=0,depth=0,quote='',comment=false;
  for(let i=0;i<text.length;i++){
    const char=text[i],next=text[i+1];
    if(comment){if(char==='*'&&next==='/'){comment=false;i++;}continue;}
    if(quote){if(char==='\\')i++;else if(char===quote)quote='';continue;}
    if(char==='/'&&next==='*'){comment=true;i++;continue;}
    if(char==='"'||char==="'"){quote=char;continue;}
    if(char==='{')depth++;
    else if(char==='}'){
      if(--depth<0)throw new Error('Llaves CSS no balanceadas.');
      if(depth===0){output.push(text.slice(start,i+1));start=i+1;}
    }else if(char===';'&&depth===0){output.push(text.slice(start,i+1));start=i+1;}
  }
  if(depth||quote||comment)throw new Error('Hoja CSS incompleta.');
  if(text.slice(start).replace(/\/\*[\s\S]*?\*\//g,'').trim())throw new Error('Regla CSS incompleta.');
  return output;
}
function printStyles(text){
  return rules(text).map(rule=>{
    const clean=rule.replace(/\/\*[\s\S]*?\*\//g,'').trim();
    if(/^@media\b/i.test(clean)){
      const open=clean.indexOf('{'),condition=clean.slice(6,open).trim();
      return /^print$/i.test(condition)?printStyles(clean.slice(open+1,-1)):'';
    }
    if(/^@page\b/i.test(clean))return '';
    if(/^@/i.test(clean))throw new Error('Regla CSS no contemplada: '+clean.slice(0,50));
    return rule.trim();
  }).filter(Boolean).join('\n');
}
function build(){
  const manifest={},images={};
  const read=file=>{const bytes=fs.readFileSync(path.join(root,file));manifest[file]=crypto.createHash('sha256').update(bytes).digest('hex');return bytes;};
  const css=styles.map(file=>printStyles(read(file).toString('utf8'))).join('\n');
  if(/url\s*\(|@import/i.test(css))throw new Error('Los estilos del PDF deben ser autocontenidos.');
  for(const file of logos)images[file]='data:image/png;base64,'+read(file).toString('base64');
  return {version:27,css,images,manifest};
}
if(require.main===module){
  const data=build(),script='/* Generado desde los CSS y PNG originales. No editar a mano. */\n'+
    'window.ReportAssets=Object.freeze('+JSON.stringify(data)+');\n'+
    'Object.freeze(window.ReportAssets.images);Object.freeze(window.ReportAssets.manifest);\n';
  fs.writeFileSync(path.join(root,'report-assets.js'),script);
  console.log('Recursos del PDF actualizados: '+styles.length+' hojas y '+logos.length+' logos.');
}
module.exports={rules,printStyles,build};
