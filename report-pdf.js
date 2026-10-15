/* Descarga directa de la vista ORIGINAL: mismo HTML, CSS, fuente del navegador y logos. */
(() => {
  'use strict';
  const LABELS=Object.freeze({old:'INFORME 1',modern:'INFORME 2',final:'INFORME FINAL'});
  const MM=96/25.4,WIDTH=287*MM,HEIGHT=200*MM,SCALE=300/96;
  function fileName(type,name,id){
    if(!Object.prototype.hasOwnProperty.call(LABELS,type)||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(id))throw new Error('No se pudo identificar el informe.');
    let clean=String(name||'').normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
    if(!clean)throw new Error('Completa el nombre del estudiante.');
    const prefix=LABELS[type]+' - ',suffix=' - '+id+'.pdf',encoder=new TextEncoder();
    while(encoder.encode(prefix+clean+suffix).length>240)clean=Array.from(clean).slice(0,-1).join('').trim();
    return prefix+clean+suffix;
  }
  function printStyles(){
    const assets=window.ReportAssets;
    if(assets?.version!==27||!assets.css||!assets.images)throw new Error('Falta report-assets.js de esta actualización. Copia todos los archivos del ZIP y recarga la página.');
    return assets.css;
  }
  function capture(type,student){
    const view=document.getElementById('printView');
    return {type,label:LABELS[type],student:{...student},count:document.getElementById('printCount').textContent,
      view:view.cloneNode(true),css:printStyles()};
  }
  function imageData(src){
    const path=new URL(src,document.baseURI).pathname;
    for(const [file,data]of Object.entries(window.ReportAssets.images))if(path.endsWith('/'+file))return data;
    throw new Error('Falta un logotipo original en los recursos del PDF. Copia todos los archivos de esta actualización.');
  }
  // Las lecturas de geometría fuerzan el layout; no depender de rAF en un iframe oculto.
  const frameTick=()=>Promise.resolve();
  async function makeStage(snapshot){
    const frame=document.createElement('iframe');frame.title='Preparación del PDF';frame.setAttribute('aria-hidden','true');frame.tabIndex=-1;
    frame.style.cssText=`position:fixed;left:-100000px;top:0;width:${WIDTH}px;height:${HEIGHT}px;border:0;pointer-events:none;`;
    document.body.append(frame);
    try{
      const doc=frame.contentDocument;doc.open();doc.write('<!doctype html><html lang="es"><head><meta charset="utf-8"></head><body></body></html>');doc.close();
      const style=doc.createElement('style');style.textContent=snapshot.css+`\nhtml,body{margin:0!important;padding:0!important;width:${WIDTH}px!important;background:white!important} .print-export-page{display:block!important;width:${WIDTH}px!important;max-width:none!important;margin:0!important;padding:0!important}`;doc.head.append(style);
      const source=doc.importNode(snapshot.view,true);source.classList.add('print-export-page');
      source.querySelector('#printEmail').textContent=snapshot.student.email;
      source.querySelector('#printEmission').textContent='Emisión: '+snapshot.issuance.id;
      for(const image of source.querySelectorAll('img'))image.src=imageData(image.getAttribute('src'));
      doc.body.append(source);
      await Promise.all([...source.querySelectorAll('img')].map(async image=>{await image.decode();if(!image.naturalWidth)throw new Error('No se pudo preparar un logotipo.');}));
      if(doc.fonts?.ready)await doc.fonts.ready;await frameTick(frame.contentWindow);
      return {frame,doc,source,css:style.textContent};
    }catch(error){frame.remove();throw error;}
  }
  function paginate(source){
    const table=source.querySelector('table'),rows=[...table.tBodies[0].rows];
    if(!rows.length)throw new Error('No hay materias para generar el PDF.');
    const origin=source.getBoundingClientRect(),firstTop=rows[0].getBoundingClientRect().top-origin.top;
    const nextTop=table.tHead.getBoundingClientRect().height;
    const closing=origin.bottom-rows[rows.length-1].getBoundingClientRect().bottom;
    const blocks=[];
    for(let start=0;start<rows.length;){
      let end=start+1;
      for(let r=start;r<end;r++)for(const cell of rows[r].cells)end=Math.max(end,r+(cell.rowSpan||1));
      if(end>rows.length)throw new Error('La tabla del informe no es válida.');
      blocks.push({start,end,height:rows[end-1].getBoundingClientRect().bottom-rows[start].getBoundingClientRect().top,
        semester:Boolean(rows[start].querySelector('.print-semester'))});start=end;
    }
    const groups=[];let current=[],used=firstTop;
    for(let i=0;i<blocks.length;i++){
      const block=blocks[i],last=i===blocks.length-1,tail=last?closing:0;
      const next=block.semester&&blocks[i+1]?blocks[i+1].height:0;
      if(current.length&&used+block.height+next+tail>HEIGHT-.5){groups.push(current);current=[];used=nextTop;}
      if(used+block.height+tail>HEIGHT+.5)throw new Error('Una fila del informe excede el tamaño de la página.');
      current.push(block);used+=block.height;
    }
    if(current.length)groups.push(current);
    return groups.map((blocks,index)=>{
      const page=source.cloneNode(true),tbody=page.querySelector('tbody');tbody.replaceChildren();
      for(const block of blocks)for(let i=block.start;i<block.end;i++)tbody.append(rows[i].cloneNode(true));
      if(index>0)page.querySelectorAll('.print-header,.print-meta').forEach(node=>node.remove());
      if(index<groups.length-1)page.querySelectorAll('.print-count,.print-note,.print-emission').forEach(node=>node.remove());
      return page;
    });
  }
  async function raster(page,css,doc){
    const ns='http://www.w3.org/2000/svg',html='http://www.w3.org/1999/xhtml';
    const svg=doc.createElementNS(ns,'svg');svg.setAttribute('width',String(WIDTH));svg.setAttribute('height',String(HEIGHT));svg.setAttribute('viewBox',`0 0 ${WIDTH} ${HEIGHT}`);
    const foreign=doc.createElementNS(ns,'foreignObject');foreign.setAttribute('width','100%');foreign.setAttribute('height','100%');
    const wrapper=doc.createElementNS(html,'div');wrapper.style.cssText=`width:${WIDTH}px;height:${HEIGHT}px;margin:0;padding:0;background:white;color:black;font-family:Arial,sans-serif;font-size:16px;line-height:1.45;`;
    const style=doc.createElementNS(html,'style');style.textContent=css;wrapper.append(style,page.cloneNode(true));foreign.append(wrapper);svg.append(foreign);
    const serialized=new XMLSerializer().serializeToString(svg),image=new Image();image.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(serialized);await image.decode();
    const canvas=document.createElement('canvas');canvas.width=Math.ceil(WIDTH*SCALE);canvas.height=Math.ceil(HEIGHT*SCALE);
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('El navegador no pudo preparar la imagen del PDF.');
    ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.scale(SCALE,SCALE);ctx.drawImage(image,0,0,WIDTH,HEIGHT);
    const probe=document.createElement('canvas');probe.width=160;probe.height=120;const probeContext=probe.getContext('2d');
    function hasContent(){
      if(!probeContext)throw new Error('No se pudo comprobar la imagen del PDF.');
      probeContext.drawImage(canvas,0,0,160,120);const pixels=probeContext.getImageData(0,0,160,120).data;let marked=0;
      for(let i=0;i<pixels.length;i+=4)if(pixels[i]<240||pixels[i+1]<240||pixels[i+2]<240)marked++;
      return marked>20;
    }
    if(!hasContent()){
      await new Promise(resolve=>setTimeout(resolve,50));ctx.drawImage(image,0,0,WIDTH,HEIGHT);
      if(!hasContent())throw new Error('El navegador devolvió una página vacía. No se inició la descarga. Actualiza el navegador y vuelve a intentar.');
    }
    return canvas.toDataURL('image/png');
  }
  function searchableText(page,pdfPage,fonts,stage){
    const rect=page.getBoundingClientRect(),walker=stage.doc.createTreeWalker(page,NodeFilter.SHOW_TEXT);let node;
    while((node=walker.nextNode())){
      if(!node.textContent.trim()||node.parentElement.closest('style,script'))continue;
      const style=stage.frame.contentWindow.getComputedStyle(node.parentElement),size=parseFloat(style.fontSize)*.75;
      if(!Number.isFinite(size)||size<=0)continue;
      const bold=Number(style.fontWeight)>=600||style.fontWeight==='bold',italic=/italic|oblique/.test(style.fontStyle),font=fonts[bold?(italic?'boldItalic':'bold'):(italic?'italic':'regular')];
      for(const match of node.textContent.matchAll(/\S+[ \t]*/g)){
        const range=stage.doc.createRange();range.setStart(node,match.index);range.setEnd(node,match.index+match[0].length);
        const box=range.getBoundingClientRect();if(!box.width||!box.height)continue;
        let value='';for(const char of match[0]){try{font.encodeText(char);value+=char;}catch(_){}}
        if(!value.trim())continue;
        // Capa invisible para buscar y copiar; el aspecto visible procede del HTML original.
        pdfPage.drawText(value,{x:5*72/25.4+(box.left-rect.left)*.75,y:210*72/25.4-5*72/25.4-(box.bottom-rect.top)*.75+size*.2,size,font,opacity:0});
      }
    }
  }
  async function create(snapshot){
    if(!window.PDFLib)throw new Error('No se pudo cargar el generador de PDF. Recarga la página.');
    const name=fileName(snapshot.type,snapshot.student.name,snapshot.issuance?.id||'');
    const {PDFDocument,StandardFonts}=window.PDFLib,doc=await PDFDocument.create(),fonts={};
    for(const [key,value]of Object.entries({regular:StandardFonts.Helvetica,bold:StandardFonts.HelveticaBold,italic:StandardFonts.HelveticaOblique,boldItalic:StandardFonts.HelveticaBoldOblique}))fonts[key]=await doc.embedFont(value);
    const stage=await makeStage(snapshot);
    try{
      const pages=paginate(stage.source);stage.source.remove();
      for(const page of pages){
        stage.doc.body.append(page);await frameTick(stage.frame.contentWindow);
        if(page.getBoundingClientRect().height>HEIGHT+1)throw new Error('El contenido no cabe en la página del informe.');
        const png=await doc.embedPng(await raster(page,stage.css,stage.doc)),pdfPage=doc.addPage([297*72/25.4,210*72/25.4]);
        pdfPage.drawImage(png,{x:5*72/25.4,y:5*72/25.4,width:WIDTH*.75,height:HEIGHT*.75});
        searchableText(page,pdfPage,fonts,stage);page.remove();
      }
      doc.setTitle(name.slice(0,-4));doc.setAuthor('Sistema de Convalidaciones - Kardex Informática');doc.setSubject('Emisión '+snapshot.issuance.id);doc.setKeywords(['convalidaciones',snapshot.type,snapshot.issuance.id]);
      doc.setCreationDate(new Date(snapshot.issuance.createdAt));doc.setModificationDate(new Date(snapshot.issuance.createdAt));
      return {bytes:await doc.save(),fileName:name};
    }finally{stage.frame.remove();}
  }
  window.ReportPdf=Object.freeze({LABELS,capture,create,fileName});
})();
