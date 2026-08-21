import React,{useEffect,useMemo,useState} from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { toWords } from 'number-to-words';
import logo from '../assets/logo.png';
import {customerApi,invoiceApi,settingsApi} from '../services/businessApi';
import './Pages.css';
const n=(v:any)=>Number(v)||0;const today=()=>new Date().toISOString().slice(0,10);const money=(v:any)=>`₹${n(v).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
type Row={oilType:string;choice:string;finishedProductTypeId:string;packingProfileId:string;batchNumber:string;qty:number;rateInclusiveTax:number};
const emptyRow=():Row=>({oilType:'',choice:'',finishedProductTypeId:'',packingProfileId:'',batchNumber:'',qty:0,rateInclusiveTax:0});
const InvoicePage:React.FC=()=>{
 const [invoices,setInvoices]=useState<any[]>([]),[options,setOptions]=useState<any>({oilTypes:[],finishedGoods:[],packingProfiles:[]}),[settings,setSettings]=useState<any>({company:{}}),[show,setShow]=useState(false),[error,setError]=useState(''),[saving,setSaving]=useState(false),[detail,setDetail]=useState<any>(null);
 const [customers,setCustomers]=useState<any[]>([]),[customerQuery,setCustomerQuery]=useState(''),[customer,setCustomer]=useState<any>(null),[saved,setSaved]=useState<any>(null),[calc,setCalc]=useState<any>(null);
 const [showQuickCustomer,setShowQuickCustomer]=useState(false);
 const [quickCustomer,setQuickCustomer]=useState<any>({customerName:'',contact:'',address:'',gstNo:'',stateName:'Maharashtra',stateCode:'27'});
 const [form,setForm]=useState<any>({invoiceNumber:'',invoiceDate:today(),destinationAddress:'',transportationCharge:0,note:''});const [rows,setRows]=useState<Row[]>([emptyRow()]);
 const companyAddress=useMemo(()=>{const a=settings.company?.address||{};return [a.line1,a.line2,a.city,a.state,a.pinCode].filter(Boolean).join(', ');},[settings]);
 const load=async()=>{const [i,o,s]=await Promise.all([invoiceApi.list(),invoiceApi.options(),settingsApi.get()]);setInvoices(i.data?.data||[]);setOptions(o.data?.data||{});setSettings(s.data?.data||{});};useEffect(()=>{load().catch(()=>setError('Failed to load invoices'));},[]);
 useEffect(()=>{if(customerQuery.trim().length<2){setCustomers([]);return;}const t=setTimeout(()=>customerApi.search(customerQuery).then(r=>setCustomers(r.data?.data||[])).catch(()=>setCustomers([])),250);return()=>clearTimeout(t);},[customerQuery]);
 const selectCustomer=(c:any)=>{setCustomer(c);setCustomerQuery(c.customerName);setForm((f:any)=>({...f,destinationAddress:c.address||''}));setCustomers([]);};
 const quickAddCustomer=async()=>{if(!quickCustomer.customerName.trim()){setError('Customer Name is required');return;}try{const r=await customerApi.create(quickCustomer);const c=r.data?.data;if(c){selectCustomer(c);setQuickCustomer({customerName:'',contact:'',address:'',gstNo:'',stateName:'Maharashtra',stateCode:'27'});setShowQuickCustomer(false);setError('');}}catch(e:any){setError(e?.error?.message||'Failed to add customer');}};
 const productChoices=(oilType:string)=>{const fg=(options.finishedGoods||[]).filter((x:any)=>x.oilType===oilType&&n(x.availableQuantity)>0);const uniq:any[]=[];const seen:any={};for(const f of fg){const packs=(options.packingProfiles||[]).filter((p:any)=>String(p.finishedProductTypeId)===String(f.productTypeId)&&p.active!==false);if(packs.length){for(const p of packs){const key=`${f.productTypeId}|${p._id}`;if(!seen[key]){seen[key]=1;uniq.push({key,productTypeId:String(f.productTypeId),packingProfileId:String(p._id),label:`${p.salesPackagingLabel} — ${f.productLabel}`,display:p.salesPackagingLabel,unitsPerPack:p.unitsPerPack});}}}else{const key=`${f.productTypeId}|`;if(!seen[key]){seen[key]=1;uniq.push({key,productTypeId:String(f.productTypeId),packingProfileId:'',label:f.productLabel,display:f.productLabel,unitsPerPack:1});}}}return uniq;};
 const batchChoices=(r:Row)=>(options.finishedGoods||[]).filter((x:any)=>x.oilType===r.oilType&&String(x.productTypeId)===String(r.finishedProductTypeId)&&n(x.availableQuantity)>0);
 const change=(i:number,k:keyof Row,v:any)=>{const a=rows.slice();let r={...a[i],[k]:v};if(k==='oilType')r={...r,choice:'',finishedProductTypeId:'',packingProfileId:'',batchNumber:''};if(k==='choice'){const c=productChoices(r.oilType).find(x=>x.key===v);r.finishedProductTypeId=c?.productTypeId||'';r.packingProfileId=c?.packingProfileId||'';r.batchNumber='';}a[i]=r;setRows(a);setCalc(null);};
 const payload=()=>({invoiceNumber:form.invoiceNumber||undefined,invoiceDate:form.invoiceDate,customerId:customer?._id,customerName:customer?.customerName||customerQuery,contact:customer?.contact,billingAddress:customer?.address,destinationAddress:form.destinationAddress,gstNo:customer?.gstNo,stateName:customer?.stateName||'Maharashtra',stateCode:customer?.stateCode||'',transportationCharge:n(form.transportationCharge),note:form.note,products:rows.filter(r=>r.oilType&&r.finishedProductTypeId&&r.batchNumber&&r.qty>0).map(r=>({oilType:r.oilType,finishedProductTypeId:r.finishedProductTypeId,packingProfileId:r.packingProfileId||undefined,batchNumber:r.batchNumber,qty:n(r.qty),rateInclusiveTax:n(r.rateInclusiveTax)}))});
 const calculate=async()=>{try{const r=await invoiceApi.calculate(payload());setCalc(r.data?.data||null);return r.data?.data;}catch(e:any){setError(e?.error?.message||'Unable to calculate invoice');return null;}};
 const save=async()=>{setError('');if(!customer?._id){setError('Select a customer from autocomplete list');return;}if(!payload().products.length){setError('Add at least one valid product line');return;}setSaving(true);try{await calculate();const r=await invoiceApi.create(payload());setSaved(r.data?.data);await load();}catch(e:any){setError(e?.error?.message||'Failed to save invoice');}finally{setSaving(false);}};
 const reset=()=>{setShow(false);setSaved(null);setCalc(null);setCustomer(null);setCustomerQuery('');setRows([emptyRow()]);setForm({invoiceNumber:'',invoiceDate:today(),destinationAddress:'',transportationCharge:0,note:''});setError('');};
 const convertToWords=(value:number)=>{
  if(!value)return'Zero Rupees';
  const rounded=Math.round(value*100)/100;
  const rupees=Math.floor(rounded);
  const paise=Math.round((rounded-rupees)*100);
  let words=`${toWords(rupees)} rupees`;
  if(paise>0)words+=` and ${toWords(paise)} paise`;
  return words.replace(/\b\w/g,(c:string)=>c.toUpperCase());
 };

 const getHSNCodeForOilType=(oilType:string)=>{
  const normalized=String(oilType||'').trim().toUpperCase();
  const configured=(settings.oilTypes||[]).find((x:any)=>
    String(x.code||'').toUpperCase()===normalized||
    String(x.label||'').toUpperCase()===normalized
  );
  return configured?.hsnCode||'-';
 };

 const fmt=(value:any)=>n(value).toLocaleString('en-IN',{
  minimumFractionDigits:2,
  maximumFractionDigits:2
 });

 const getLogoForPdf=async():Promise<string>=>{
  const configured=settings.company?.branding?.logoUrl;
  if(!configured)return logo;
  if(String(configured).startsWith('data:')||String(configured).startsWith('http')){
   try{
    const response=await fetch(configured);
    const blob=await response.blob();
    return await new Promise<string>((resolve,reject)=>{
     const reader=new FileReader();
     reader.onload=()=>resolve(String(reader.result||logo));
     reader.onerror=()=>reject(reader.error);
     reader.readAsDataURL(blob);
    });
   }catch{
    return logo;
   }
  }
  // Relative /uploads URL may belong to the backend rather than Vite dev server.
  // Keep the bundled logo as a safe fallback for preview/print.
  return logo;
 };

 const generateInvoicePdf=async(inv:any)=>{
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const company=settings.company||{};
  const companyTax=company.tax||{};
  const companyContact=company.contact||{};
  const companyBank=company.bank||{};
  const companyPayment=company.payment||{};
  const companyInvoice=company.invoice||{};
  const PW=210;
  const M=10;

  const companyName=company.legalName||company.companyName||'SWASHTYASHAKTI GOLD PRIVATE LIMITED';
  const buyerAddress=inv.billingAddress||inv.address||'-';
  const consigneeAddress=inv.destinationAddress||buyerAddress||'-';
  const dispatch=inv.dispatchAddress||companyAddress||'-';
  const invoiceDate=inv.invoiceDate||inv.date;
  const status=inv.status||'DRAFT';
  const taxMode=inv.taxMode||((String(inv.gstNo||'').startsWith('27'))?'INTRASTATE':'INTERSTATE');
  const transportation=n(inv.transportationCharge);
  const taxableTotal=n(inv.taxableTotal);
  const cgstTotal=n(inv.cgstTotal);
  const sgstTotal=n(inv.sgstTotal);
  const igstTotal=n(inv.igstTotal);
  const totalTax=cgstTotal+sgstTotal+igstTotal;
  const productGross=n(inv.productGrossTotal)||((inv.products||[]).reduce((s:number,p:any)=>s+n(p.grossLineTotal),0));
  const grandTotal=n(inv.grandTotal)||(productGross+transportation);

  const normal=(size=8)=>{doc.setFont('helvetica','normal');doc.setFontSize(size);};
  const bold=(size=8)=>{doc.setFont('helvetica','bold');doc.setFontSize(size);};

  // =========================
  // TAX INVOICE TITLE
  // =========================
  bold(15);
  doc.setTextColor(0,0,0);
  doc.text('TAX INVOICE',PW/2,10,{align:'center'});

  // Optional UPI QR, using the NEW Settings model.
  const upiId=companyPayment.upiId||'';
  if(upiId){
   try{
    const upi=`upi://pay?pa=${upiId}&pn=${encodeURIComponent(companyName)}&cu=INR`;
    const qrImage=await QRCode.toDataURL(upi);
    bold(7);
    doc.text('UPI Payment',182,5,{align:'center'});
    doc.rect(165,7,35,32);
    doc.addImage(qrImage,'PNG',168,9,29,28);
   }catch{}
  }

  // =========================
  // COMPANY + INVOICE DETAILS
  // Existing invoice visual structure, newer data.
  // =========================
  const sectionTop=18;
  const sectionX=10;
  const sectionW=190;
  const sectionEndX=200;
  const companyW=105;
  const companyEndX=115;
  const rightX=companyEndX;
  const rightMidX=155;
  const textX=45;
  const lineH=4;
  const smallLineH=3.8;

  const companyAddressLines=doc.splitTextToSize(companyAddress||'-',66);
  const buyerAddressLines=doc.splitTextToSize(buyerAddress||'-',88);
  const consigneeAddressLines=doc.splitTextToSize(consigneeAddress||'-',88);
  const invoiceNoLines=doc.splitTextToSize(inv.invoiceNumber||'-',36);

  const companyNameY=sectionTop+5;
  const companyAddressY=sectionTop+11;
  const companyGstY=companyAddressY+companyAddressLines.length*smallLineH+3;
  const companyPanY=companyGstY+4;
  const companyFssaiY=companyPanY+4;
  const companyPhoneY=companyFssaiY+4;
  const companyEmailY=companyPhoneY+4;

  const topRowHeight=Math.max(58,companyEmailY+5-sectionTop);
  const topRowBottom=sectionTop+topRowHeight;

  const getPartyBlockHeight=(addressLines:string[])=>(
   5+5+4+addressLines.length*lineH+2+5+5+5
  );

  const partyStartY=topRowBottom;
  const partyRowHeight=Math.max(
   42,
   getPartyBlockHeight(buyerAddressLines),
   getPartyBlockHeight(consigneeAddressLines)
  );
  const sectionBottom=partyStartY+partyRowHeight;
  const sectionHeight=sectionBottom-sectionTop;

  doc.setDrawColor(160,160,160);
  doc.rect(sectionX,sectionTop,sectionW,sectionHeight);
  doc.line(companyEndX,sectionTop,companyEndX,topRowBottom);
  doc.line(sectionX,topRowBottom,sectionEndX,topRowBottom);
  doc.line(105,partyStartY,105,sectionBottom);
  doc.line(rightMidX,sectionTop,rightMidX,topRowBottom);

  // 3 right-side rows, same visual style as old format.
  doc.line(rightX,sectionTop+18,sectionEndX,sectionTop+18);
  doc.line(rightX,sectionTop+36,sectionEndX,sectionTop+36);
  if(topRowBottom>sectionTop+54){
   doc.line(rightX,sectionTop+54,sectionEndX,sectionTop+54);
  }

  // Company logo: configurable logo with existing bundled logo fallback.
  try{
   const logoImage=await getLogoForPdf();
   doc.addImage(logoImage,'PNG',12,sectionTop+3,29,15);
  }catch{}

  bold(10.5);
  doc.text(companyName,textX,companyNameY);

  normal(7.5);
  doc.text(companyAddressLines,textX,companyAddressY);
  doc.text(`GSTIN: ${companyTax.gstNumber||'-'}`,textX,companyGstY);
  doc.text(`PAN: ${companyTax.panNumber||'-'}`,textX,companyPanY);
  doc.text(`FSSAI: ${companyTax.fssaiNumber||'-'}`,textX,companyFssaiY);
  doc.text(`Phone: ${companyContact.phone||'-'}`,textX,companyPhoneY);
  doc.text(companyContact.email||'-',textX,companyEmailY);

  // Right invoice details
  bold(8);
  doc.text('Invoice No.',rightX+2,sectionTop+5);
  normal(7);
  doc.text(invoiceNoLines,rightX+2,sectionTop+10);

  bold(8);
  doc.text('Dated',rightMidX+2,sectionTop+5);
  normal(8);
  doc.text(invoiceDate?new Date(invoiceDate).toLocaleDateString('en-IN'):'-',rightMidX+2,sectionTop+10);

  bold(8);
  doc.text('Invoice Status',rightX+2,sectionTop+23);
  normal(8);
  doc.text(status,rightX+2,sectionTop+28);

  bold(8);
  doc.text('Tax Mode',rightMidX+2,sectionTop+23);
  normal(8);
  doc.text(taxMode,rightMidX+2,sectionTop+28);

  bold(8);
  doc.text('Transportation',rightX+2,sectionTop+41);
  normal(8);
  doc.text(`Rs. ${fmt(transportation)}`,rightX+2,sectionTop+46);

  bold(8);
  doc.text('Place of Supply',rightMidX+2,sectionTop+41);
  normal(7.5);
  doc.text(`${inv.stateName||'-'} (${inv.stateCode||'-'})`,rightMidX+2,sectionTop+46);

  const drawPartyBlock=(
   title:string,
   x:number,
   yStart:number,
   name:string,
   addressLines:string[],
   gstNumber:string,
   state:string,
   contact:string
  )=>{
   let y=yStart+5;
   normal(8);
   doc.text(title,x+2,y);
   y+=5;
   bold(8);
   doc.text(name||'-',x+2,y);
   y+=5;
   normal(7.5);
   doc.text(addressLines,x+2,y);
   y+=addressLines.length*lineH+2;
   doc.text(`GSTIN/UIN : ${gstNumber||'-'}`,x+2,y);
   y+=5;
   doc.text(`State Name : ${state||'-'}`,x+2,y);
   y+=5;
   doc.text(`Contact : ${contact||'-'}`,x+2,y);
  };

  drawPartyBlock(
   'Buyer (Bill to) :',
   10,
   partyStartY,
   inv.customerName||'-',
   buyerAddressLines,
   inv.gstNo||'-',
   inv.stateName||'-',
   inv.contact||'-'
  );

  drawPartyBlock(
   'Consignee (Ship to) :',
   105,
   partyStartY,
   inv.customerName||'-',
   consigneeAddressLines,
   inv.gstNo||'-',
   inv.stateName||'-',
   inv.contact||'-'
  );

  // =========================
  // PRODUCT TABLE
  // =========================
  const productRows=(inv.products||[]).map((p:any)=>{
   const qty=n(p.qty);
   const total=n(p.grossLineTotal)||(n(p.rateInclusiveTax)*qty);
   const taxable=n(p.taxableValue)||(total/1.05);
   const taxableRate=qty>0?taxable/qty:0;
   const underlying=n(p.underlyingFinishedGoodsQuantity);
   const description=[
    p.finishedProductLabel||'-',
    p.displayPackagingType?`Packing: ${p.displayPackagingType}`:'',
    underlying&&underlying!==qty?`Underlying Qty: ${underlying}`:''
   ].filter(Boolean).join('\n');

   return[
    description,
    getHSNCodeForOilType(p.oilType),
    p.batchNumber||'-',
    qty,
    fmt(p.rateInclusiveTax),
    fmt(taxableRate),
    'Nos',
    fmt(taxable)
   ];
  });

  autoTable(doc,{
   startY:sectionBottom,
   startX:M,
   head:[[
    'Description of Goods',
    'HSN',
    'Batch',
    'Qty',
    'Inclusive Rate',
    'Taxable Rate',
    'per',
    'Taxable Value'
   ]],
   body:productRows,
   styles:{
    fontSize:6.3,
    cellPadding:1.4,
    valign:'middle',
    overflow:'linebreak',
    lineColor:[255,255,255],
    lineWidth:0
   },
   headStyles:{
    fillColor:[245,245,245],
    textColor:0,
    fontStyle:'bold',
    fontSize:6.7,
    halign:'center',
    valign:'middle',
    lineColor:[0,0,0],
    lineWidth:0.2
   },
   theme:'plain',
   tableWidth:'fixed',
   margin:{left:M,right:M},
   columnStyles:{
    0:{cellWidth:51,halign:'left'},
    1:{cellWidth:17,halign:'center'},
    2:{cellWidth:31,halign:'center'},
    3:{cellWidth:12,halign:'right'},
    4:{cellWidth:21,halign:'right'},
    5:{cellWidth:20,halign:'right'},
    6:{cellWidth:10,halign:'center'},
    7:{cellWidth:28,halign:'right'}
   }
  });

  const tableEndY=(doc as any).lastAutoTable.finalY;
  const tableStartY=sectionBottom;
  const fixedTableBottom=Math.max(195,tableEndY+32);

  // Existing-format vertical continuation below product rows.
  if(tableEndY<fixedTableBottom){
   doc.setDrawColor(0,0,0);
   doc.line(M,tableStartY,M,fixedTableBottom);
   doc.line(200,tableStartY,200,fixedTableBottom);
   let x=M;
   const widths=[51,17,31,12,21,20,10,28];
   for(let i=0;i<widths.length-1;i++){
    x+=widths[i];
    doc.line(x,tableStartY,x,fixedTableBottom);
   }
   doc.line(M,fixedTableBottom,200,fixedTableBottom);
  }

  // Tax values shown in the same area where the old invoice showed output tax.
  let taxY=tableEndY+7;
  bold(7.5);
  doc.text('Taxable Value',112,taxY);
  doc.text(fmt(taxableTotal),195,taxY,{align:'right'});

  if(cgstTotal>0){
   taxY+=6;
   doc.text(`Output CGST ${n(inv.products?.[0]?.cgstPercent)||2.5}%`,112,taxY);
   doc.text(fmt(cgstTotal),195,taxY,{align:'right'});
  }
  if(sgstTotal>0){
   taxY+=6;
   doc.text(`Output SGST ${n(inv.products?.[0]?.sgstPercent)||2.5}%`,112,taxY);
   doc.text(fmt(sgstTotal),195,taxY,{align:'right'});
  }
  if(igstTotal>0){
   taxY+=6;
   doc.text(`Output IGST ${n(inv.products?.[0]?.igstPercent)||5}%`,112,taxY);
   doc.text(fmt(igstTotal),195,taxY,{align:'right'});
  }
  if(transportation>0){
   taxY+=6;
   doc.text('Transportation Charge',112,taxY);
   doc.text(fmt(transportation),195,taxY,{align:'right'});
  }

  // =========================
  // TOTAL ROW
  // =========================
  const totalRowY=fixedTableBottom;
  doc.rect(M,totalRowY,190,8);
  bold(8);
  doc.text('Total',M+2,totalRowY+5);
  bold(10);
  doc.text(fmt(grandTotal),196,totalRowY+5,{align:'right'});

  let finalY=totalRowY+8;

  // Amount in words
  doc.rect(10,finalY,190,12);
  bold(7.5);
  doc.text('Amount Chargeable (in words)',12,finalY+4);
  bold(9);
  const amountWords=doc.splitTextToSize(`${convertToWords(grandTotal)} Only`,184);
  doc.text(amountWords,12,finalY+8);
  finalY+=12;

  // =========================
  // GST SUMMARY - newer CGST/SGST/IGST content
  // =========================
  const gstGroups:Record<string,any>={};
  for(const p of (inv.products||[])){
   const hsn=getHSNCodeForOilType(p.oilType);
   if(!gstGroups[hsn]){
    gstGroups[hsn]={
     taxable:0,cgst:0,sgst:0,igst:0,
     cgstRate:n(p.cgstPercent),
     sgstRate:n(p.sgstPercent),
     igstRate:n(p.igstPercent)
    };
   }
   gstGroups[hsn].taxable+=n(p.taxableValue);
   gstGroups[hsn].cgst+=n(p.cgstAmount);
   gstGroups[hsn].sgst+=n(p.sgstAmount);
   gstGroups[hsn].igst+=n(p.igstAmount);
  }

  const gstBody=Object.entries(gstGroups).map(([hsn,g]:any)=>[
   hsn,
   fmt(g.taxable),
   g.cgstRate?`${g.cgstRate}%`:'-',
   fmt(g.cgst),
   g.sgstRate?`${g.sgstRate}%`:'-',
   fmt(g.sgst),
   g.igstRate?`${g.igstRate}%`:'-',
   fmt(g.igst),
   fmt(g.cgst+g.sgst+g.igst)
  ]);

  autoTable(doc,{
   startY:finalY,
   startX:M,
   tableWidth:190,
   margin:{left:M,right:M},
   head:[
    [
     {content:'HSN/SAC',rowSpan:2},
     {content:'Taxable\nValue',rowSpan:2},
     {content:'Central Tax',colSpan:2},
     {content:'State Tax',colSpan:2},
     {content:'Integrated Tax',colSpan:2},
     {content:'Total\nTax',rowSpan:2}
    ],
    ['Rate','Amount','Rate','Amount','Rate','Amount']
   ],
   body:gstBody.length?gstBody:[['-',fmt(taxableTotal),'-',fmt(cgstTotal),'-',fmt(sgstTotal),'-',fmt(igstTotal),fmt(totalTax)]],
   foot:[[
    'Total',
    fmt(taxableTotal),
    '',
    fmt(cgstTotal),
    '',
    fmt(sgstTotal),
    '',
    fmt(igstTotal),
    fmt(totalTax)
   ]],
   theme:'grid',
   styles:{
    fontSize:6.2,
    cellPadding:0.7,
    lineColor:[0,0,0],
    lineWidth:0.2,
    textColor:0,
    valign:'middle'
   },
   headStyles:{
    fillColor:[255,255,255],
    textColor:0,
    fontStyle:'bold',
    halign:'center',
    valign:'middle',
    fontSize:6.2
   },
   footStyles:{
    fillColor:[255,255,255],
    textColor:0,
    fontStyle:'bold',
    fontSize:6.2
   },
   columnStyles:{
    0:{cellWidth:26},
    1:{cellWidth:32,halign:'right'},
    2:{cellWidth:14,halign:'center'},
    3:{cellWidth:22,halign:'right'},
    4:{cellWidth:14,halign:'center'},
    5:{cellWidth:22,halign:'right'},
    6:{cellWidth:14,halign:'center'},
    7:{cellWidth:22,halign:'right'},
    8:{cellWidth:24,halign:'right'}
   }
  });

  finalY=(doc as any).lastAutoTable.finalY;

  // =========================
  // DECLARATION / TERMS / BANK / SIGNATURE
  // =========================
  const availableHeight=282-finalY;
  const declarationHeight=Math.max(34,Math.min(48,availableHeight));
  const decY=finalY;
  doc.rect(10,decY,190,declarationHeight);
  doc.line(125,decY,125,decY+declarationHeight);

  bold(7.5);
  doc.text('Tax Amount (in words) :',12,decY+4);
  normal(7.2);
  doc.text(
   doc.splitTextToSize(totalTax>0?`${convertToWords(totalTax)} Only`:'Zero Rupees Only',78),
   45,
   decY+4
  );

  bold(7.5);
  doc.text('Remarks:',12,decY+10);
  normal(7.2);
  doc.text(doc.splitTextToSize(inv.note||'-',108),28,decY+10);

  bold(7.5);
  doc.text("Company's PAN :",12,decY+16);
  normal(7.2);
  doc.text(companyTax.panNumber||'-',39,decY+16);

  bold(8);
  doc.text('Declaration',12,decY+21);
  normal(6.8);
  const terms=Array.isArray(companyInvoice.termsAndConditions)
   ?companyInvoice.termsAndConditions
   :[companyInvoice.termsAndConditions].filter(Boolean);
  const termText=(terms.length?terms:['All claims are subject to company terms and conditions.'])
   .map((t:any,i:number)=>`${i+1}. ${t}`)
   .join('  ');
  doc.text(doc.splitTextToSize(termText,108),12,decY+25);

  // Right side: bank/payment + signature
  bold(7.5);
  doc.text('Bank / Payment Details',128,decY+5);
  normal(6.8);
  let bankY=decY+10;
  const bankLines=[
   companyBank.bankName?`Bank: ${companyBank.bankName}`:'',
   companyBank.accountNumber?`A/c: ${companyBank.accountNumber}`:'',
   companyBank.ifscCode?`IFSC: ${companyBank.ifscCode}`:'',
   companyPayment.upiId?`UPI: ${companyPayment.upiId}`:''
  ].filter(Boolean);
  for(const line of bankLines.slice(0,4)){
   doc.text(line,128,bankY);
   bankY+=4;
  }

  bold(8);
  doc.text(`for ${companyName}`,162,decY+declarationHeight-12,{align:'center'});
  normal(7);
  doc.text('Authorised Signatory',162,decY+declarationHeight-4,{align:'center'});

  // Footer
  normal(7);
  const jurisdiction=companyInvoice.jurisdictionText||'SUBJECT TO PUNE JURISDICTION';
  doc.text(jurisdiction,PW/2,286,{align:'center'});
  doc.setTextColor(120,120,120);
  doc.text('This is a Computer Generated Invoice',PW/2,290,{align:'center'});
  doc.setTextColor(0,0,0);

  return doc;
 };

 const preview=async(inv:any)=>{
  const w=window.open('','_blank');
  const d=await generateInvoicePdf(inv);
  const url=d.output('bloburl');
  if(w)w.location.href=String(url);
  else window.open(String(url),'_blank');
 };

 const download=async(inv:any)=>{
  const d=await generateInvoicePdf(inv);
  d.save(`Invoice_${inv.invoiceNumber}.pdf`);
 };

 const print=async(inv:any)=>{
  const w=window.open('','_blank');
  const d=await generateInvoicePdf(inv);
  const url=d.output('bloburl');
  if(w){
   w.location.href=String(url);
   setTimeout(()=>w.print(),900);
  }
 };

 const share=async(inv:any)=>{
  const d=await generateInvoicePdf(inv);
  const blob=d.output('blob');
  const file=new File([blob],`Invoice_${inv.invoiceNumber}.pdf`,{type:'application/pdf'});
  try{
   if(navigator.canShare?.({files:[file]})){
    await navigator.share({
     files:[file],
     title:`Invoice ${inv.invoiceNumber}`,
     text:`Invoice for ${inv.customerName}`
    });
   }else{
    d.save(`Invoice_${inv.invoiceNumber}.pdf`);
   }
  }catch{}
 };

 const complete=async(inv:any)=>{await invoiceApi.complete(inv._id);await load();};const cancel=async(inv:any)=>{const reason=window.prompt('Cancellation reason?');if(!reason)return;await invoiceApi.cancel(inv._id,reason);await load();};
 const createReturn=async(inv:any)=>{if(!inv.products?.length)return;const choices=inv.products.map((p:any,i:number)=>`${i+1}. ${p.finishedProductLabel} / ${p.displayPackagingType} / ${p.batchNumber}`).join('\n');const idx=n(window.prompt(`Select line number:\n${choices}`))-1;if(idx<0||!inv.products[idx])return;const q=n(window.prompt('Return invoice quantity (boxes/cans as invoiced):'));if(q<=0)return;const condition=(window.prompt('Condition: GOOD, DEFECTIVE, LEAKAGE, DAMAGED, EXPIRED','GOOD')||'GOOD').toUpperCase();const reason=window.prompt('Return reason?')||condition;await invoiceApi.createReturn(inv._id,{reason,lines:[{invoiceLineId:inv.products[idx]._id,returnQuantity:q,condition,reasonCode:reason}]});await load();};
 return <div className="module-page"><div className="module-header"><div><h1>Invoice Management</h1><p>Create tax-inclusive invoices with batch-wise stock deduction</p></div><button className="primary-button" onClick={()=>setShow(true)}>+ Create Invoice</button></div>{error&&<div className="error-message">{error}</div>}
 <div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Status</th><th>Grand Total</th><th>Actions</th></tr></thead><tbody>{invoices.map(inv=><React.Fragment key={inv._id}><tr><td>{inv.invoiceNumber}</td><td>{new Date(inv.invoiceDate||inv.date).toLocaleDateString()}</td><td>{inv.customerName}</td><td><b>{inv.status}</b></td><td>{money(inv.grandTotal||inv.productGrossTotal)}</td><td style={{display:'flex',gap:6,flexWrap:'wrap'}}><button className="secondary-button" onClick={()=>setDetail(detail?._id===inv._id?null:inv)}>Show Detail</button><button className="secondary-button" onClick={()=>preview(inv)}>Preview</button>{inv.status==='DRAFT'&&<button className="primary-button" onClick={()=>complete(inv)}>Complete</button>}{inv.status!=='CANCELLED'&&<button className="secondary-button" onClick={()=>createReturn(inv)}>Return</button>}{inv.status!=='CANCELLED'&&<button className="secondary-button" onClick={()=>cancel(inv)}>Cancel</button>}</td></tr>{detail?._id===inv._id&&<tr><td colSpan={6}><div style={{padding:12,background:'#f8f9fa'}}><table className="data-table"><thead><tr><th>Oil</th><th>Product</th><th>Packaging</th><th>Batch</th><th>Qty</th><th>Underlying Qty</th><th>Rate</th><th>Taxable</th><th>GST</th><th>Total</th></tr></thead><tbody>{(inv.products||[]).map((p:any)=><tr key={p._id}><td>{p.oilType}</td><td>{p.finishedProductLabel}</td><td>{p.displayPackagingType}</td><td>{p.batchNumber}</td><td>{p.qty}</td><td>{p.underlyingFinishedGoodsQuantity}</td><td>{money(p.rateInclusiveTax)}</td><td>{money(p.taxableValue)}</td><td>{money(n(p.cgstAmount)+n(p.sgstAmount)+n(p.igstAmount))}</td><td>{money(p.grossLineTotal)}</td></tr>)}</tbody></table></div></td></tr>}</React.Fragment>)}</tbody></table></div>
 {show&&<div className="modal"><div className="modal-content" style={{maxWidth:1120}}><div className="modal-header"><h3>Invoice Form</h3><button className="modal-close" onClick={reset}>×</button></div><div className="form-grid">
 <div className="form-group"><label>Invoice Number</label><input value={saved?.invoiceNumber||'Generated on Save'} readOnly/></div><div className="form-group"><label>Invoice Date *</label><input type="date" value={form.invoiceDate} onChange={e=>setForm({...form,invoiceDate:e.target.value})}/></div>
 <div className="form-group" style={{position:'relative'}}><label>Customer Name *</label><div style={{display:'flex',gap:6}}><input style={{flex:1}} value={customerQuery} onChange={e=>{setCustomerQuery(e.target.value);setCustomer(null)}} autoComplete="off" placeholder="Search customer"/><button type="button" className="secondary-button" onClick={()=>{setQuickCustomer({customerName:customerQuery,contact:'',address:'',gstNo:'',stateName:'Maharashtra',stateCode:'27'});setShowQuickCustomer(true)}}>+ Quick Add</button></div>{customers.length>0&&<div style={{position:'absolute',top:70,left:0,right:0,zIndex:20,background:'#fff',border:'1px solid #ddd',maxHeight:180,overflow:'auto'}}>{customers.map(c=><div key={c._id} onClick={()=>selectCustomer(c)} style={{padding:9,cursor:'pointer',borderBottom:'1px solid #eee'}}><b>{c.customerName}</b><br/><small>{c.contact} {c.gstNo}</small></div>)}</div>}</div>
 <div className="form-group"><label>Contact</label><input value={customer?.contact||''} readOnly/></div><div className="form-group"><label>Address</label><input value={customer?.address||''} readOnly/></div><div className="form-group"><label>GST No</label><input value={customer?.gstNo||''} readOnly/></div><div className="form-group"><label>State</label><input value={customer?.stateName||''} readOnly/></div><div className="form-group"><label>Transportation Charge</label><input type="number" min="0" value={form.transportationCharge} onChange={e=>{setForm({...form,transportationCharge:n(e.target.value)});setCalc(null)}}/></div>
 <div className="form-group" style={{gridColumn:'1/-1'}}><label>Dispatch Address</label><textarea rows={2} value={companyAddress} readOnly/></div><div className="form-group" style={{gridColumn:'1/-1'}}><label>Destination Address</label><textarea rows={2} value={form.destinationAddress} onChange={e=>setForm({...form,destinationAddress:e.target.value})}/></div></div>
 <h3>Product Details</h3><div style={{overflowX:'auto'}}><table className="data-table"><thead><tr><th>Oil Type</th><th>Packaging Type</th><th>Batch Number</th><th>Rate (incl. GST)</th><th>Qty</th><th>Total</th><th></th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td><select value={r.oilType} onChange={e=>change(i,'oilType',e.target.value)}><option value="">Select Oil</option>{(options.oilTypes||[]).map((x:string)=><option key={x}>{x}</option>)}</select></td><td><select value={r.choice} onChange={e=>change(i,'choice',e.target.value)}><option value="">Select Packaging</option>{productChoices(r.oilType).map(c=><option key={c.key} value={c.key}>{c.label}</option>)}</select></td><td><select value={r.batchNumber} onChange={e=>change(i,'batchNumber',e.target.value)}><option value="">Select Batch</option>{batchChoices(r).map((b:any)=><option key={b._id} value={b.batchNumber}>{b.batchNumber} ({b.availableQuantity} available)</option>)}</select></td><td><input type="number" min="0" value={r.rateInclusiveTax} onChange={e=>change(i,'rateInclusiveTax',n(e.target.value))}/></td><td><input type="number" min="0" value={r.qty} onChange={e=>change(i,'qty',n(e.target.value))}/></td><td>{money(n(r.rateInclusiveTax)*n(r.qty))}</td><td><button className="secondary-button" onClick={()=>setRows(rows.filter((_,idx)=>idx!==i))} disabled={rows.length===1}>×</button></td></tr>)}</tbody></table></div><button className="secondary-button" style={{marginTop:10}} onClick={()=>setRows([...rows,emptyRow()])}>+ Add Row</button>
 <div className="form-group" style={{marginTop:16}}><label>Note</label><textarea rows={3} value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></div>
 <div style={{marginTop:16,padding:14,background:'#f8f9fa',borderRadius:8}}><button className="secondary-button" onClick={calculate}>Calculate GST</button>{calc&&<span style={{marginLeft:16}}>Taxable {money(calc.totals?.taxableTotal)} | CGST {money(calc.totals?.cgstTotal)} | SGST {money(calc.totals?.sgstTotal)} | IGST {money(calc.totals?.igstTotal)} | <b>Grand Total {money(calc.totals?.grandTotal)}</b></span>}</div>
 <div className="modal-actions" style={{flexWrap:'wrap'}}><button className="primary-button" disabled={saving||!!saved} onClick={save}>{saving?'Saving...':'Save'}</button><button className="secondary-button" disabled={!saved} onClick={()=>saved&&preview(saved)}>Preview</button><button className="secondary-button" disabled={!saved} onClick={()=>saved&&share(saved)}>Share on WhatsApp</button><button className="secondary-button" disabled={!saved} onClick={()=>saved&&print(saved)}>Print</button><button className="secondary-button" disabled={!saved} onClick={()=>saved&&download(saved)}>Download</button><button className="secondary-button" onClick={reset}>Close</button></div>
 {showQuickCustomer&&<div className="modal" style={{zIndex:1200}}><div className="modal-content" style={{maxWidth:650}}><div className="modal-header"><h3>Quick Add Customer</h3><button className="modal-close" onClick={()=>setShowQuickCustomer(false)}>×</button></div><div className="form-grid" style={{padding:'1rem'}}><div className="form-group"><label>Customer Name *</label><input value={quickCustomer.customerName} onChange={e=>setQuickCustomer({...quickCustomer,customerName:e.target.value})}/></div><div className="form-group"><label>Contact</label><input value={quickCustomer.contact} onChange={e=>setQuickCustomer({...quickCustomer,contact:e.target.value.replace(/\D/g,'').slice(0,10)})}/></div><div className="form-group"><label>GSTIN</label><input value={quickCustomer.gstNo} onChange={e=>{const gst=e.target.value.toUpperCase();setQuickCustomer({...quickCustomer,gstNo:gst,stateCode:gst.length>=2?gst.slice(0,2):quickCustomer.stateCode})}}/></div><div className="form-group"><label>State</label><input value={quickCustomer.stateName} onChange={e=>setQuickCustomer({...quickCustomer,stateName:e.target.value})}/></div><div className="form-group"><label>State Code</label><input value={quickCustomer.stateCode} onChange={e=>setQuickCustomer({...quickCustomer,stateCode:e.target.value.slice(0,2)})}/></div><div className="form-group" style={{gridColumn:'1/-1'}}><label>Address</label><textarea rows={3} value={quickCustomer.address} onChange={e=>setQuickCustomer({...quickCustomer,address:e.target.value})}/></div></div><div className="modal-actions"><button className="primary-button" onClick={quickAddCustomer}>Save & Select Customer</button><button className="secondary-button" onClick={()=>setShowQuickCustomer(false)}>Cancel</button></div></div></div>}
 </div></div>}
 </div>;
};export default InvoicePage;
