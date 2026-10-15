/* Exportación local con las medidas y estilos del print.css original (A4 horizontal). */
(() => {
  'use strict';
  const LABELS=Object.freeze({old:'INFORME 1',modern:'INFORME 2',final:'INFORME FINAL'});
  const TITLE='TABLA DE CONVALIDACIÓN DE PLANES DE ESTUDIO';
  const NOTE='Documento generado por el Sistema de Convalidaciones. Será revisado y validado por la Unidad de Kardex de la Carrera de Informática.';
  function cellText(cell){
    const copy=cell.cloneNode(true);copy.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
    return copy.textContent.replace(/[ \t]+/g,' ').trim();
  }
  function capture(type,student){
    const view=document.getElementById('printView'),table=view.querySelector('table');
    const rows=section=>[...section.rows].map(row=>[...row.cells].map(cell=>({text:cellText(cell),rowSpan:cell.rowSpan||1,colSpan:cell.colSpan||1,classes:cell.className})));
    return {type,label:LABELS[type],student:{...student},
      date:new Intl.DateTimeFormat('es-BO',{timeZone:'America/La_Paz'}).format(new Date()),
      title:view.querySelector('.print-header h1').textContent,
      subtitle:view.querySelector('.print-header div > p:last-child').textContent,
      note:view.querySelector('.print-note').textContent,
      count:document.getElementById('printCount').textContent,
      dense:view.classList.contains('dense'),columns:table.querySelectorAll('col').length,
      head:rows(table.tHead),body:rows(table.tBodies[0]),logos:[...view.querySelectorAll('.print-logo')]};
  }
  async function create(snapshot){
    if(!window.PDFLib)throw new Error('No se pudo cargar el generador de PDF. Recarga la página.');
    if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(snapshot.issuance?.id||'')||!Number.isFinite(snapshot.issuance?.createdAt))throw new Error('No se pudo identificar esta emisión del informe. Intenta nuevamente.');
    if(![4,6].includes(snapshot.columns)||!snapshot.head?.length||!snapshot.body?.length)throw new Error('La tabla del informe no es válida.');
    const {PDFDocument,StandardFonts,rgb}=window.PDFLib,doc=await PDFDocument.create();
    const regular=await doc.embedFont(StandardFonts.Helvetica),bold=await doc.embedFont(StandardFonts.HelveticaBold),boldItalic=await doc.embedFont(StandardFonts.HelveticaBoldOblique);
    const black=rgb(0,0,0),white=rgb(1,1,1),border=rgb(34/255,34/255,34/255);
    const mm=72/25.4,pageWidth=297*mm,pageHeight=210*mm,margin=5*mm,contentWidth=pageWidth-2*margin;
    const dense=snapshot.dense===undefined?snapshot.body.length>42:Boolean(snapshot.dense);
    // print.css: celdas 6.5 pt / 5.25 pt (dense), borde .6 px; 1 px = .75 pt.
    const paddingX=dense?.975:1.5,paddingY=dense?.525:.9,borderWidth=.45;
    const columns=Array.from({length:snapshot.columns},(_,i)=>contentWidth*(snapshot.columns===4?(i%2?.3875:.1125):(i%2?1/3-.075:.075)));
    function safe(value){
      return [...String(value??'').replace(/→/g,' - ').replace(/[\r\t]/g,' ')].map(char=>{
        if(char==='\n')return char;
        try{regular.encodeText(char);return char;}catch(_){
          const plain=char.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
          try{regular.encodeText(plain);return plain;}catch(_){return '?';}
        }
      }).join('');
    }
    function wrap(value,font,size,width){
      const result=[];
      for(const paragraph of safe(value).split('\n')){
        let line='';
        for(const word of paragraph.split(/\s+/).filter(Boolean)){
          const candidate=line?line+' '+word:word;
          if(font.widthOfTextAtSize(candidate,size)<=width){line=candidate;continue;}
          if(line){result.push(line);line='';}
          for(const char of word){
            if(line&&font.widthOfTextAtSize(line+char,size)>width){result.push(line);line='';}
            line+=char;
          }
        }
        result.push(line);
      }
      return result.length?result:[''];
    }
    function styleFor(cell,heading){
      const semester=cell.classes.includes('print-semester'),code=cell.classes.includes('print-code'),pending=cell.classes.includes('print-pending');
      const plan=heading&&cell.r===0;
      const size=heading?(plan?(dense?6.2:7.2):(dense?5.1:6)):(semester?(dense?5.1:6.1):(code?(dense?5.1:6):(dense?5.25:6.5)));
      return {font:heading?boldItalic:(semester||pending?bold:regular),size,lineHeight:size*(dense?1:1.08),
        paddingX:plan?(dense?1.5:2.25):(semester&&!dense?.75:paddingX),
        paddingY:plan?(dense?1.125:2.25):(semester&&!dense?.75:paddingY)};
    }
    function layout(source,heading){
      const occupied=[],cells=[],heights=source.map(()=>0);
      source.forEach((row,r)=>{
        let c=0;
        for(const original of row){
          while(occupied[r]?.[c])c++;
          const cell={...original,r,c};
          if(!Number.isInteger(cell.rowSpan)||cell.rowSpan<1||!Number.isInteger(cell.colSpan)||cell.colSpan<1||c+cell.colSpan>columns.length||r+cell.rowSpan>source.length)throw new Error('La tabla del informe no es válida.');
          for(let rr=r;rr<r+cell.rowSpan;rr++){
            occupied[rr]||=[];
            for(let cc=c;cc<c+cell.colSpan;cc++){if(occupied[rr][cc])throw new Error('La tabla del informe no es válida.');occupied[rr][cc]=true;}
          }
          Object.assign(cell,styleFor(cell,heading));cell.width=columns.slice(c,c+cell.colSpan).reduce((a,b)=>a+b,0);
          cell.lines=[];
          for(const [index,line]of safe(cell.text).split('\n').entries()){
            const size=heading&&r===0&&index>0?(dense?5.1:6.4):cell.size;
            cell.lines.push(...wrap(line,cell.font,size,cell.width-2*cell.paddingX-borderWidth).map(text=>({text,size})));
          }
          cell.requiredHeight=cell.lines.length*cell.lineHeight+2*cell.paddingY+borderWidth;
          if(cell.rowSpan===1)heights[r]=Math.max(heights[r],cell.requiredHeight);
          cells.push(cell);c+=cell.colSpan;
        }
      });
      for(const cell of cells.filter(cell=>cell.rowSpan>1)){
        const available=heights.slice(cell.r,cell.r+cell.rowSpan).reduce((a,b)=>a+b,0);
        if(available<cell.requiredHeight)heights[cell.r+cell.rowSpan-1]+=cell.requiredHeight-available;
      }
      // Una celda combinada no se corta entre páginas.
      const blocks=[];
      for(let start=0;start<source.length;){
        let end=start+1;
        for(let row=start;row<end;row++)for(const cell of cells.filter(cell=>cell.r===row))end=Math.max(end,cell.r+cell.rowSpan);
        blocks.push({start,end,height:heights.slice(start,end).reduce((a,b)=>a+b,0)});start=end;
      }
      return {cells,heights,blocks,heading};
    }
    const head=layout(snapshot.head,true),body=layout(snapshot.body,false),headHeight=head.heights.reduce((a,b)=>a+b,0);
    const logoImages=await Promise.all(snapshot.logos.map(async element=>{
      try{
        await element.decode();const canvas=document.createElement('canvas'),scale=Math.min(1,160/Math.max(element.naturalWidth,element.naturalHeight));
        canvas.width=Math.round(element.naturalWidth*scale);canvas.height=Math.round(element.naturalHeight*scale);
        canvas.getContext('2d').drawImage(element,0,0,canvas.width,canvas.height);return await doc.embedPng(canvas.toDataURL('image/png'));
      }catch(_){return null;}
    }));
    let page,cursor;
    function text(value,x,y,size=6.5,font=regular){page.drawText(safe(value),{x,y,size,font,color:black});}
    function centered(value,y,size,font=bold){const encoded=safe(value);text(encoded,margin+(contentWidth-font.widthOfTextAtSize(encoded,size))/2,y,size,font);}
    function drawRows(table,start,end,top){
      for(const cell of table.cells.filter(cell=>cell.r>=start&&cell.r<end)){
        const x=margin+columns.slice(0,cell.c).reduce((a,b)=>a+b,0),yTop=top-table.heights.slice(start,cell.r).reduce((a,b)=>a+b,0),height=table.heights.slice(cell.r,cell.r+cell.rowSpan).reduce((a,b)=>a+b,0);
        const semester=cell.classes.includes('print-semester');let fill=white,color=black;
        if(table.heading&&cell.r===1){fill=rgb(119/255,119/255,119/255);color=white;}
        if(semester)fill=rgb(217/255,219/255,226/255);
        if(cell.classes.includes('print-highlight'))fill=rgb(1,1,0);
        if(cell.classes.includes('print-from-2023'))fill=rgb(182/255,238/255,231/255);
        if(cell.classes.includes('print-pending')){fill=rgb(1,240/255,240/255);color=rgb(176/255,0,32/255);}
        const plan=table.heading&&cell.r===0;
        page.drawRectangle({x,y:yTop-height,width:cell.width,height,color:fill,...(plan?{}:{borderColor:border,borderWidth})});
        if(plan){
          for(const [start,end]of [[{x,y:yTop},{x,y:yTop-height}],[{x:x+cell.width,y:yTop},{x:x+cell.width,y:yTop-height}],[{x,y:yTop-height},{x:x+cell.width,y:yTop-height}]])page.drawLine({start,end,thickness:borderWidth,color:border});
        }
        const topOfLines=yTop-(height-cell.lines.length*cell.lineHeight)/2;
        cell.lines.forEach((line,index)=>{
          const center=table.heading||semester,tx=center?x+(cell.width-cell.font.widthOfTextAtSize(line.text,line.size))/2:x+cell.paddingX+borderWidth/2;
          // El bloque de texto queda centrado dentro de la altura original de la celda.
          const ascent=cell.font.heightAtSize(line.size,{descender:false}),descent=cell.font.heightAtSize(line.size)-ascent;
          const baseline=topOfLines-index*cell.lineHeight-(cell.lineHeight-ascent-descent)/2-ascent;
          page.drawText(line.text,{x:tx,y:baseline,font:cell.font,size:line.size,color});
        });
      }
    }
    function metadata(){
      const student=snapshot.student,parts=[['Estudiante:',student.name],['CI:',student.ci],['RU:',student.ru],['Mención:',student.careerName],['Fecha:',snapshot.date]],weights=[1.25,.55,.55,1.45,.55];
      const gap=4.5,available=contentWidth-gap*4,top=cursor-3,lineHeight=6.5*1.45;let x=margin,height=lineHeight;
      for(let i=0;i<parts.length;i++){
        const [label,value]=parts[i],width=available*weights[i]/4.35,labelWidth=bold.widthOfTextAtSize(label,6.5),lines=wrap(value,regular,6.5,width-labelWidth-2.25);
        text(label,x,top-6.5,6.5,bold);lines.forEach((line,j)=>text(line,x+labelWidth+2.25,top-6.5-j*lineHeight,6.5));
        height=Math.max(height,lines.length*lineHeight);x+=width+gap;
      }
      cursor=top-height;
      const label='Correo institucional:',labelWidth=bold.widthOfTextAtSize(label,6.5),lines=wrap(student.email,regular,6.5,contentWidth-labelWidth-2.25);
      text(label,margin,cursor-6.5,6.5,bold);lines.forEach((line,index)=>text(line,margin+labelWidth+2.25,cursor-6.5-index*lineHeight,6.5));
      cursor-=lines.length*lineHeight+3;
    }
    function newPage(first=false){
      page=doc.addPage([pageWidth,pageHeight]);cursor=pageHeight-margin;
      if(first){
        // print.css: logos de 46 px, cabecera de 7 / 9 / 6.5 pt y línea inferior.
        const top=cursor,headerHeight=34.5;
        logoImages.forEach((logo,index)=>{if(!logo)return;const size=logo.scaleToFit(34.5,34.5);page.drawImage(logo,{x:index?pageWidth-margin-size.width:margin,y:top-(headerHeight+size.height)/2,width:size.width,height:size.height});});
        centered('KARDEX - CARRERA DE INFORMÁTICA',top-7.2,7);
        centered(snapshot.title||TITLE,top-19,9);
        centered(snapshot.subtitle,top-29.5,6.5,regular);
        cursor=top-headerHeight-2.25;
        page.drawLine({start:{x:margin,y:cursor},end:{x:pageWidth-margin,y:cursor},thickness:.75,color:border});
        metadata();
      }
      // Como el thead original, solo la cabecera de la tabla se repite al continuar.
      drawRows(head,0,snapshot.head.length,cursor);cursor-=headHeight;
    }
    newPage(true);
    const countSize=dense?6:7,countGap=dense?1.5:3,noteSize=5.5,noteLines=wrap(snapshot.note||NOTE,regular,noteSize,contentWidth);
    const closingHeight=countGap+countSize*1.45+2.25+noteLines.length*noteSize*1.45;
    for(let b=0;b<body.blocks.length;b++){
      const block=body.blocks[b],isSection=body.cells.some(cell=>cell.r===block.start&&cell.classes.includes('print-semester'));
      const nextHeight=isSection&&body.blocks[b+1]?body.blocks[b+1].height:0,closing=b===body.blocks.length-1?closingHeight:0;
      if(cursor-block.height-nextHeight-closing<margin)newPage();
      if(cursor-block.height<margin)throw new Error('Una fila del informe es demasiado larga para el PDF.');
      drawRows(body,block.start,block.end,cursor);cursor-=block.height;
    }
    if(cursor-closingHeight<margin)newPage();
    const label='Número de materias convalidadas: ';cursor-=countGap+countSize;
    text(label,margin,cursor,countSize);text(String(snapshot.count),margin+regular.widthOfTextAtSize(label,countSize),cursor,countSize,bold);
    cursor-=countSize*.45+2.25+noteSize;
    for(const line of noteLines){text(line,margin,cursor,noteSize);cursor-=noteSize*1.45;}
    // Único añadido al pie: el identificador de emisión de esta descarga.
    doc.getPages().forEach(current=>current.drawText(`Emisión: ${snapshot.issuance.id}`,{x:margin,y:6,size:5.5,font:regular,color:black}));
    doc.setTitle(safe(`${snapshot.label} - ${snapshot.student.name}`));doc.setAuthor('Sistema de Convalidaciones - Kardex Informática');
    doc.setSubject(safe(`${snapshot.subtitle} · Emisión ${snapshot.issuance.id}`));doc.setKeywords(['convalidaciones',snapshot.type,snapshot.issuance.id]);
    doc.setCreationDate(new Date(snapshot.issuance.createdAt));doc.setModificationDate(new Date(snapshot.issuance.createdAt));
    const bytes=await doc.save(),studentName=snapshot.student.name.replace(/[\\/:*?"<>|]+/g,' ').replace(/\s+/g,' ').trim();
    return {bytes,fileName:`${snapshot.label.replace(/ /g,'_')}_${snapshot.student.ru}_${studentName}.pdf`};
  }
  window.ReportPdf=Object.freeze({LABELS,capture,create});
})();
