import React,{useEffect,useMemo,useState} from 'react';
import DataTable from '../components/UI/DataTable';
import api from '../services/api';
import {settingsApi,vendorApi} from '../services/businessApi';
import './Pages.css';

const today=()=>new Date().toISOString().slice(0,10);
const empty=()=>({bookingDate:today(),vendorId:'',tankerCapacityKg:0,oilType:'',ratePerKg:0,advancePaid:0,remarks:''});
const Booking:React.FC=()=>{
 const [rows,setRows]=useState<any[]>([]),[show,setShow]=useState(false),[form,setForm]=useState<any>(empty()),[oilTypes,setOilTypes]=useState<any[]>([]),[vendors,setVendors]=useState<any[]>([]),[loading,setLoading]=useState(false),[msg,setMsg]=useState('');
 const load=async()=>{setLoading(true);try{const [r,o,v]=await Promise.all([api.get('/bookings'),settingsApi.getOilTypes(),vendorApi.list()]);setRows(r.data.data||[]);setOilTypes((o.data.data||[]).filter((x:any)=>x.active));setVendors((v.data.data||[]).filter((x:any)=>x.isActive!==false));}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const selectedVendor=useMemo(()=>vendors.find(v=>String(v._id)===String(form.vendorId)),[vendors,form.vendorId]);
 const bookingAmount=useMemo(()=>Number(form.tankerCapacityKg||0)*Number(form.ratePerKg||0),[form.tankerCapacityKg,form.ratePerKg]);
 const pending=Math.max(0,bookingAmount-Number(form.advancePaid||0));
 const save=async()=>{setMsg('');if(!form.vendorId){setMsg('Vendor is required');return;}try{await api.post('/bookings',{...form,bookingAmount});setShow(false);setForm(empty());setMsg('Booking created successfully.');load();}catch(e:any){setMsg(e?.error?.message||'Failed to create booking')}};
 const columns=[{key:'bookingNumber',title:'Booking Number'},{key:'bookingDate',title:'Booking Date',render:(v:string)=>new Date(v).toLocaleDateString('en-IN')},{key:'vendorName',title:'Vendor',render:(v:string,r:any)=>v||r.supplierName||'-'},{key:'oilType',title:'Oil Type'},{key:'tankerCapacityKg',title:'Tanker Capacity (KG)',render:(v:number)=>Number(v||0).toLocaleString()},{key:'ratePerKg',title:'Rate/KG',render:(v:number)=>`₹${Number(v||0).toFixed(2)}`},{key:'bookingAmount',title:'Booking Amount',render:(v:number)=>`₹${Number(v||0).toLocaleString('en-IN')}`},{key:'pendingQuantityKg',title:'Pending Qty'},{key:'pendingAmount',title:'Pending Amount',render:(v:number)=>`₹${Number(v||0).toLocaleString('en-IN')}`},{key:'status',title:'Status'}];
 return <div className="module-page"><div className="module-header"><div><h1>Oil Booking</h1><p>Plan raw-oil purchase using an active Vendor.</p></div><button className="primary-button" onClick={()=>{setForm(empty());setShow(true)}}>+ New Booking</button></div>{msg&&<div className={msg.includes('success')?'success-message':'error-message'}>{msg}</div>}<DataTable data={rows} columns={columns} loading={loading} rowKey="_id"/>
 {show&&<div className="modal" role="dialog"><div className="modal-content"><div className="modal-header"><h3>New Oil Booking</h3><button className="modal-close" onClick={()=>setShow(false)}>×</button></div><div className="form-grid" style={{padding:'1rem'}}>
  <div className="form-group"><label>Booking Number</label><input value="Auto-generated on save" disabled/></div>
  <div className="form-group"><label>Booking Date *</label><input type="date" value={form.bookingDate} onChange={e=>setForm({...form,bookingDate:e.target.value})}/></div>
  <div className="form-group"><label>Vendor *</label><select value={form.vendorId} onChange={e=>setForm({...form,vendorId:e.target.value})}><option value="">-- Select Vendor --</option>{vendors.map(v=><option key={v._id} value={v._id}>{v.vendorName}{v.gstNo?` - ${v.gstNo}`:''}</option>)}</select></div>
  <div className="form-group"><label>Vendor GSTIN</label><input value={selectedVendor?.gstNo||''} disabled/></div>
  <div className="form-group"><label>Tanker Capacity (KG) *</label><input type="number" min="1" value={form.tankerCapacityKg} onChange={e=>setForm({...form,tankerCapacityKg:Number(e.target.value)})}/></div>
  <div className="form-group"><label>Oil Type *</label><select value={form.oilType} onChange={e=>setForm({...form,oilType:e.target.value})}><option value="">-- Select --</option>{oilTypes.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}</select></div>
  <div className="form-group"><label>Rate per KG (₹) *</label><input type="number" step="0.01" value={form.ratePerKg} onChange={e=>setForm({...form,ratePerKg:Number(e.target.value)})}/></div>
  <div className="form-group"><label>Booking Amount (₹)</label><input value={bookingAmount.toFixed(2)} disabled/></div>
  <div className="form-group"><label>Advance Paid (₹)</label><input type="number" min="0" max={bookingAmount} value={form.advancePaid} onChange={e=>setForm({...form,advancePaid:Number(e.target.value)})}/></div>
  <div className="form-group"><label>Pending Amount</label><input value={`₹${pending.toFixed(2)}`} disabled/></div>
  <div className="form-group" style={{gridColumn:'1 / -1'}}><label>Remarks</label><textarea rows={3} value={form.remarks} onChange={e=>setForm({...form,remarks:e.target.value})}/></div>
 </div><div className="modal-actions"><button className="primary-button" onClick={save}>Save Booking</button><button className="secondary-button" onClick={()=>setShow(false)}>Cancel</button></div></div></div>}
 </div>
};
export default Booking;
