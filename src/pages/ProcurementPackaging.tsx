import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { settingsApi } from '../services/businessApi';
import './Pages.css';

const today = () => new Date().toISOString().slice(0, 10);
const n = (v: any) => Number(v) || 0;

type Item = { materialType: string; materialVariant: string; subtypeCode: string; subtypeLabel: string; description: string; hsnCode: string; invoiceQuantity: number; purchaseUnit: string };
const emptyItem = (): Item => ({ materialType: '', materialVariant: '', subtypeCode: '', subtypeLabel: '', description: '', hsnCode: '', invoiceQuantity: 0, purchaseUnit: '' });

const ProcurementPackaging: React.FC = () => {
  const [rows, setRows] = useState<any[]>([]); const [show, setShow] = useState(false); const [saving, setSaving] = useState(false); const [message, setMessage] = useState('');
  const [settings, setSettings] = useState<any>({ packagingTypes: [], packagingSubtypes: [], polytheneSubtypes: [] });
  const [form, setForm] = useState<any>({ supplierName: '', supplierGSTIN: '', invoiceNumber: '', invoiceDate: today(), deliveryDate: '', paymentMode: 'Cash', cgstAmount: 0, sgstAmount: 0, igstAmount: 0, invoiceTotal: 0, ewayBillNumber: '', transportCharges: 0 });
  const [items, setItems] = useState<Item[]>([emptyItem()]);
  const load = async () => { const [p, s] = await Promise.all([api.get('/procurement/packaging-purchases'), settingsApi.get()]); setRows(p.data?.data?.purchases || []); setSettings(s.data?.data || {}); };
  useEffect(() => { load().catch(() => setMessage('Failed to load packaging purchases')); }, []);
  const activeTypes = useMemo(() => ((settings.packagingTypes || []).filter((x: any) => x.active)), [settings]);
  const variants = (item: Item) => { const parent = activeTypes.find((x: any) => x.label === item.materialType); if (!parent) return []; if (parent.code === 'POLYTHENE_BUNDLE') return (settings.polytheneSubtypes || []).filter((x: any) => x.active && x.purchaseDropdownVisible).map((x: any) => ({ code: x.code, label: x.finishedProductLabel || x.label, unitsPerBundle: x.unitsPerBundle })); return (settings.packagingSubtypes || []).filter((x: any) => x.active && x.parentPackagingCode === parent.code).map((x: any) => ({ code: x.code, label: x.label })); };
  const updateItem = (i: number, k: keyof Item, v: any) => {
    const a = items.slice();
    let x = { ...a[i], [k]: v };
    if (k === 'materialType') {
      const parent = activeTypes.find((p: any) => p.label === v);
      x.materialVariant = parent?.code === 'POLYTHENE_BUNDLE' ? 'Polythene Bundle' : (parent?.hasSubtypes ? '' : v);
      x.subtypeCode = ''; x.subtypeLabel = ''; x.purchaseUnit = parent?.purchaseUnit || '';
    }
    if (k === 'subtypeCode') {
      const opt = variants(x).find(
        (o: any) => o.code === v
      );

      const parent = activeTypes.find(
        (p: any) => p.label === x.materialType
      );

      x.subtypeCode = v;
      x.subtypeLabel = opt?.label || '';

      if (parent?.code === 'POLYTHENE_BUNDLE') {
        x.materialVariant = 'Polythene Bundle';
      } else {
        x.materialVariant = opt?.label || '';
      }
    }
    a[i] = x; setItems(a);
  };
  const save = async () => { setMessage(''); if (!form.supplierName || !form.supplierGSTIN || !form.invoiceNumber || !form.invoiceDate) { setMessage('Supplier Name, GSTIN, Invoice Number and Invoice Date are required'); return; } setSaving(true); try { await api.post('/procurement/packaging-purchases', { ...form, packagingItems: items.filter(x => x.materialType && n(x.invoiceQuantity) > 0) }); setShow(false); setForm({ supplierName: '', supplierGSTIN: '', invoiceNumber: '', invoiceDate: today(), deliveryDate: '', paymentMode: 'Cash', cgstAmount: 0, sgstAmount: 0, igstAmount: 0, invoiceTotal: 0, ewayBillNumber: '', transportCharges: 0 }); setItems([emptyItem()]); await load(); } catch (e: any) { setMessage(e?.error?.message || 'Failed to save purchase'); } finally { setSaving(false); } };
  return <div className="module-page">
    <div className="module-header"><div><h1>Packaging Purchases</h1><p>Purchase primary and secondary packaging materials</p></div><button className="primary-button" onClick={() => setShow(true)}>+ New Packaging Purchase</button></div>
    {message && <div className="error-message">{message}</div>}
    <div style={{ overflowX: 'auto' }}><table className="data-table"><thead><tr><th>Invoice</th><th>Date</th><th>Supplier</th><th>GSTIN</th><th>Items</th><th>GST</th><th>Total</th></tr></thead><tbody>{rows.map(r => <tr key={r._id}><td>{r.invoiceNumber}</td><td>{r.invoiceDate ? new Date(r.invoiceDate).toLocaleDateString() : '-'}</td><td>{r.supplierName}</td><td>{r.supplierGSTIN}</td><td>{(r.packagingItems || []).map((x: any) => x.subtypeLabel || x.materialVariant).join(', ') || '-'}</td><td>₹{n(r.cgstAmount) + n(r.sgstAmount) + n(r.igstAmount)}</td><td>₹{n(r.invoiceTotal).toLocaleString('en-IN')}</td></tr>)}</tbody></table></div>
    {show && <div className="modal"><div className="modal-content" style={{ maxWidth: 1000 }}><div className="modal-header"><h3>📦 New Packaging Purchase</h3><button className="modal-close" onClick={() => setShow(false)}>×</button></div>
      <h4>📋 Invoice & Supplier Details</h4><div className="form-grid">
        {[['supplierName', 'Supplier Name *', 'text'], ['supplierGSTIN', 'Supplier GSTIN *', 'text'], ['invoiceNumber', 'Invoice Number *', 'text'], ['invoiceDate', 'Invoice Date *', 'date'], ['deliveryDate', 'Delivery Date', 'date']].map(([k, l, t]) => <div className="form-group" key={k}><label>{l}</label><input type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></div>)}
        <div className="form-group"><label>Payment Mode</label><select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>{['Cash', 'Bank Transfer', 'Cheque', 'Credit', 'To Pay'].map(x => <option key={x}>{x}</option>)}</select></div>
      </div>
      <h4 style={{ marginTop: 24 }}>📦 Packaging Items</h4>{items.map((it, i) => <div key={i} className="form-grid" style={{ padding: '12px', border: '1px solid #e4e8ec', borderRadius: 8, marginBottom: 12 }}>
        <div className="form-group"><label>Packaging Type</label><select value={it.materialType} onChange={e => updateItem(i, 'materialType', e.target.value)}><option value="">-- Select Type --</option>{activeTypes.map((x: any) => <option key={x.code} value={x.label}>{x.label}</option>)}</select></div>
        {variants(it).length > 0 && 
        <div className="form-group">
          <label>Subtype / Variant</label>
          <select value={it.subtypeCode || ''}
          onChange={e => updateItem(i, 'subtypeCode', e.target.value)}>
            <option value="">-- Select --</option>
            {
            variants(it).map((x: any) => 
            <option key={x.code} value={x.code}>{x.label}
            {x.unitsPerBundle ? ` (${x.unitsPerBundle}/bundle)` : ''}
            </option>)}
            </select>
            </div>
            }
        <div className="form-group"><label>Description</label><input value={it.description} onChange={e => updateItem(i, 'description', e.target.value)} /></div><div className="form-group"><label>HSN Code</label><input value={it.hsnCode} onChange={e => updateItem(i, 'hsnCode', e.target.value)} /></div>
        <div className="form-group"><label>Invoice Qty</label><input type="number" min="0" value={it.invoiceQuantity} onChange={e => updateItem(i, 'invoiceQuantity', e.target.value)} /></div><div className="form-group"><label>Purchase Unit</label><input value={it.purchaseUnit} readOnly /></div>
        <div><button className="secondary-button" onClick={() => setItems(items.filter((_, idx) => idx !== i))} disabled={items.length === 1}>Remove</button></div>
      </div>)}<button className="secondary-button" onClick={() => setItems([...items, emptyItem()])}>+ Add Item</button>
      <h4 style={{ marginTop: 24 }}>GST Details</h4><div className="form-grid">{[['cgstAmount', 'CGST Amount *'], ['sgstAmount', 'SGST Amount *'], ['igstAmount', 'IGST Amount *'], ['invoiceTotal', 'Invoice Total *'], ['transportCharges', 'Transport Charges'], ['ewayBillNumber', 'E-Way Bill']].map(([k, l]) => <div className="form-group" key={k}><label>{l}</label><input type={k === 'ewayBillNumber' ? 'text' : 'number'} min="0" value={form[k]} onChange={e => setForm({ ...form, [k]: k === 'ewayBillNumber' ? e.target.value : n(e.target.value) })} /></div>)}</div>
      <div className="modal-actions"><button className="primary-button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save Purchase'}</button><button className="secondary-button" onClick={() => setShow(false)}>Cancel</button></div>
    </div></div>}
  </div>;
};
export default ProcurementPackaging;
