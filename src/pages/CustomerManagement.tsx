import React,{useEffect,useState} from 'react';
import DataTable from '../components/UI/DataTable';
import {customerApi} from '../services/businessApi';
import './Pages.css';

const empty=()=>({customerName:'',contact:'',address:'',gstNo:'',stateName:'Maharashtra',stateCode:'27',isActive:true});
const CustomerManagement:React.FC=()=>{
 const [rows,setRows]=useState<any[]>([]),[show,setShow]=useState(false),[form,setForm]=useState<any>(empty()),[editing,setEditing]=useState<any>(null),[loading,setLoading]=useState(false),[msg,setMsg]=useState('');
 const load=async()=>{setLoading(true);try{const r=await customerApi.list(true);setRows(r.data?.data||[]);}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const openNew=()=>{setEditing(null);setForm(empty());setMsg('');setShow(true)};
 const openEdit=(r:any)=>{setEditing(r);setForm({...empty(),...r});setMsg('');setShow(true)};
 const save=async()=>{setMsg('');if(!form.customerName.trim()){setMsg('Customer Name is required');return;}try{if(editing)await customerApi.update(editing._id,form);else await customerApi.create(form);setShow(false);setMsg(editing?'Customer updated successfully.':'Customer created successfully.');await load();}catch(e:any){setMsg(e?.error?.message||'Failed to save customer')}};
 const deactivate=async(r:any)=>{if(!window.confirm(`Deactivate customer ${r.customerName}?`))return;await customerApi.remove(r._id);await load();};
 const cols=[{key:'customerName',title:'Customer Name',sortable:true},{key:'contact',title:'Contact'},{key:'gstNo',title:'GSTIN'},{key:'stateName',title:'State'},{key:'isActive',title:'Status',render:(v:boolean)=>v?'Active':'Inactive'},{key:'actions',title:'Actions',render:(_:any,r:any)=><div style={{display:'flex',gap:6}}><button className="secondary-button" onClick={()=>openEdit(r)}>Edit</button>{r.isActive&&<button className="secondary-button" onClick={()=>deactivate(r)}>Deactivate</button>}</div>}];
 return <div className="module-page"><div className="module-header"><div><h1>Customer Management</h1><p>Maintain customers used by Invoice autocomplete and quick-add.</p></div><button className="primary-button" onClick={openNew}>+ Add Customer</button></div>{msg&&<div className={msg.includes('success')?'success-message':'error-message'}>{msg}</div>}<DataTable data={rows} columns={cols} loading={loading} rowKey="_id"/>
 {show&&<div className="modal"><div className="modal-content" style={{maxWidth:760}}><div className="modal-header"><h3>{editing?'Edit Customer':'Add Customer'}</h3><button className="modal-close" onClick={()=>setShow(false)}>×</button></div><div className="form-grid" style={{padding:'1rem'}}>
  <div className="form-group"><label>Customer Name *</label><input value={form.customerName} onChange={e=>setForm({...form,customerName:e.target.value})}/></div>
  <div className="form-group"><label>Contact</label><input value={form.contact||''} onChange={e=>setForm({...form,contact:e.target.value.replace(/\D/g,'').slice(0,10)})}/></div>
  <div className="form-group"><label>GSTIN</label><input value={form.gstNo||''} onChange={e=>{const gst=e.target.value.toUpperCase();setForm({...form,gstNo:gst,stateCode:gst.length>=2?gst.slice(0,2):form.stateCode})}}/></div>
  <div className="form-group"><label>State</label><input value={form.stateName||''} onChange={e=>setForm({...form,stateName:e.target.value})}/></div>
  <div className="form-group"><label>State Code</label><input value={form.stateCode||''} onChange={e=>setForm({...form,stateCode:e.target.value.slice(0,2)})}/></div>
  <div className="form-group"><label>Status</label><select value={String(form.isActive)} onChange={e=>setForm({...form,isActive:e.target.value==='true'})}><option value="true">Active</option><option value="false">Inactive</option></select></div>
  <div className="form-group" style={{gridColumn:'1/-1'}}><label>Address</label><textarea rows={3} value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
 </div><div className="modal-actions"><button className="primary-button" onClick={save}>Save Customer</button><button className="secondary-button" onClick={()=>setShow(false)}>Cancel</button></div></div></div>}
 </div>;
};
export default CustomerManagement;
