// Uso: node tests/academic-equivalence.test.cjs /ruta/al/ORIGINAL/descomprimido
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createHash}=require('node:crypto');
const {create}=require('./academic-harness.cjs');
const current=path.resolve(__dirname,'..'),original=process.argv[2]&&path.resolve(process.argv[2]);
if(!original||!fs.existsSync(path.join(original,'app.js')))throw new Error('Indica la carpeta original que contiene app.js para comparar los dos sistemas.');
const hash=value=>createHash('sha256').update(value).digest('hex');
const reference=create(original),data=reference.window.CONVALIDATION_DATA,modern=reference.window.GESTION_2023_DATA;
const hashes={};
for(const name of ['data.js','gestion-data.js','print.css','gestion.css','styles.css','history-reader.mjs','scripts/build_data.py']){
  const a=fs.readFileSync(path.join(original,name)),b=fs.readFileSync(path.join(current,name));assert.ok(a.equals(b),name+' debe conservarse idéntico');hashes[name]=hash(a);
}
const next=create(current),functions=['selectedSet','choiceMap','isGenericElective','groupKey','requirements','groupComplete','selectedElective','convalidatedElectiveCodes','pruneElectiveChoices','electiveCell','resultCell','printSectionRank','printSectionKey','printSectionLabel','printSectionKeyRank','printCourseEntry','printEquivalenceGroups','printPlanCells','buildPrintView'];
for(const name of functions)assert.equal(next.run(name+'.toString()'),reference.run(name+'.toString()'),'Regla modificada: '+name);
const oldGestion=fs.readFileSync(path.join(original,'gestion.js'),'utf8'),newGestion=fs.readFileSync(path.join(current,'gestion.js'),'utf8');
assert.equal(newGestion.slice(0,newGestion.indexOf('  const matrix =')),oldGestion.slice(0,oldGestion.indexOf('  const matrix =')),'Se modificó la herencia, importación, gestión o prioridad de 64 horas.');
assert.equal(newGestion.slice(newGestion.indexOf('  const printTable =')),oldGestion.slice(oldGestion.indexOf('  const printTable =')),'Se modificaron las tablas o la selección de materias para informes.');
let scenarios=0,reports=0,rejected=0;const byCareer={},cases=[];
for(const [career,plan]of Object.entries(data)){
  const rows=plan.rows,normal=rows.filter(row=>row.finalCode),generic=rows.filter(row=>!row.finalCode&&row.finalName.toLocaleLowerCase('es').startsWith('electiva del plan')),catalog=modern[career];
  const add=(name,input)=>cases.push({career,name,...input});
  add('sin selección',{old:[]});
  add('todas las materias normales',{old:normal.map(row=>row.id)});
  add('todos los planes / I-2023',{old:normal.map(row=>row.id),modern:catalog.map(row=>row.id),semesters:Object.fromEntries(catalog.map(row=>[row.id,'I/2023']))});
  for(const row of rows)if(!generic.includes(row))add('1998 '+row.id,{old:[row.id]});
  for(const course of catalog)add('2023 '+course.id,{old:[],modern:[course.id],semesters:{[course.id]:'I/2024'}});
  for(const code of ['INF-111','INF-121','INF-131'])for(const semester of ['I/2023','II/2023','I/2024','II/2024','I/2025','VERANO/2023','INVIERNO/2024',''])add('64 horas '+code+' '+semester,{old:normal.map(row=>row.id),modern:[code],semesters:{[code]:semester}});
  for(const row of generic){
    add('electiva pendiente '+row.id,{old:[row.id]});
    for(const elective of plan.electives){
      add('electiva '+row.id+' '+elective.finalCode,{old:[row.id],choices:{[row.id]:elective.finalCode}});
      const source=normal.find(item=>item.finalCode===elective.finalCode);
      if(source)add('electiva ocupada '+row.id+' '+elective.finalCode,{old:[row.id,source.id],choices:{[row.id]:elective.finalCode}});
    }
  }
  add('mención de computación',{oldMention:'ciencias_computacion',old:normal.filter((_,i)=>i%2===0).map(row=>row.id)});
}
for(const input of cases){
  const a=create(original,input),b=create(current,input);
  for(const type of ['old','modern','final']){
    const before=a.report(type),after=b.report(type);assert.deepEqual(after,before,input.career+' · '+input.name+' · '+type);reports++;if(!after.ok)rejected++;
  }
  scenarios++;byCareer[input.career]=(byCareer[input.career]||0)+1;
}
const result={date:'2026-10-15',scenarios,reports,rejected,byCareer,identicalRuleFunctions:functions.length,identicalFilesSHA256:hashes,result:'Todos los resultados académicos coinciden con el ORIGINAL suministrado.'};
const destination=process.env.CONVALIDACIONES_AUDIT_OUTPUT;
if(destination)fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');
console.log(scenarios+' escenarios y '+reports+' comparaciones de informes: coinciden con el ORIGINAL.');
console.log(functions.length+' funciones de cálculo y los bloques de gestión/64 horas idénticos; '+Object.keys(hashes).length+' archivos idénticos byte por byte.');
