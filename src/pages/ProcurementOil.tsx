import React, { useEffect, useMemo, useState } from 'react';
import DataTable from '../components/UI/DataTable';
import api from '../services/api';
import { settingsApi } from '../services/businessApi';
import './Pages.css';
const today = () => new Date().toISOString().slice(0, 10);
const empty = () => ({ bookingId: '', supplierName: '', supplierGstin: '', oilType: '', actualWeightKg: 0, bookingQuantityKg: 0, ratePerKg: 0, bookingTotalAmount: 0, invoiceNumber: '', invoiceDate: today(), deliveryDate: today(), cgstAmount: 0, sgstAmount: 0, igstAmount: 0, tankerTransportCharges: 0, brokerage: 0, extraCharges: 0, transporterName: '', vehicleNumber: '', ewayBillNumber: '', lrNumber: '', paymentMode: 'Cash', remarks: '' });
const ProcurementOil: React.FC = () => {
    const [rows, setRows] = useState<any[]>([]), [bookings, setBookings] = useState<any[]>([]), [oilTypes, setOilTypes] = useState<any[]>([]), [form, setForm] = useState<any>(empty()), [show, setShow] = useState(false), [loading, setLoading] = useState(false), [msg, setMsg] = useState('');
    const load = async () => { setLoading(true); try { const [p, b, o] = await Promise.all([api.get('/procurement/oil-purchases', { params: { limit: 100 } }), api.get('/bookings'), settingsApi.getOilTypes()]); setRows(p.data.data?.purchases || []); setBookings((b.data.data || []).filter((x: any) => ['BOOKED', 'PARTIALLY_PURCHASED'].includes(x.status))); setOilTypes((o.data.data || []).filter((x: any) => x.active)); } finally { setLoading(false) } };
    useEffect(() => { load() }, []);
    const cgst = Number(form.cgstAmount || 0);
    const sgst = Number(form.sgstAmount || 0);
    const igst = Number(form.igstAmount || 0);

    const gst = cgst + sgst + igst;

    const bookingTotalAmount =
        Number(form.bookingTotalAmount || 0);

    const transportCharges =
        Number(form.tankerTransportCharges || 0);

    const brokerage =
        Number(form.brokerage || 0);

    const extraCharges =
        Number(form.extraCharges || 0);

    // Booking amount already includes GST
    const taxableAmount =
        bookingTotalAmount - gst;

    // Cost excluding recoverable GST
    const purchaseCostBeforeTax =
        taxableAmount +
        transportCharges +
        brokerage +
        extraCharges;

    // Final payable invoice amount
    const invoiceNetAmount =
        bookingTotalAmount +
        transportCharges +
        brokerage +
        extraCharges;

    // Actual landed cost of oil
    const landedCostPerKg =
        Number(form.actualWeightKg || 0) > 0
            ? purchaseCostBeforeTax /
            Number(form.actualWeightKg)
            : 0;

    const hsn = useMemo(() => oilTypes.find(o => o.code === form.oilType)?.hsnCode || '', [oilTypes, form.oilType]);
    const selectBooking = (id: string) => {
        const b = bookings.find(x => x._id === id);
        setForm({
            ...form,
            bookingId: id,

            supplierName:
                b?.vendorName ||
                b?.supplierName ||
                '',

            supplierGstin:
                b?.vendorGstin ||
                b?.supplierGstin ||
                '',

            oilType: b?.oilType || '',

            bookingQuantityKg:
                Number(
                    b?.pendingQuantityKg ??
                    b?.tankerCapacityKg ??
                    0
                ),

            ratePerKg:
                Number(b?.ratePerKg || 0),

            bookingTotalAmount:
                Number(
                    b?.totalAmount ??
                    b?.bookingAmount ??
                    0
                )
        });
    };

    const save = async () => {
        setMsg('');

        try {
            await api.post('/procurement/oil-purchases', {
                ...form,
                hsnCode: hsn,

                taxableAmount,
                purchaseCostBeforeTax,
                invoiceNetAmount,
                landedCostPerKg,
                totalGstAmount: gst
            });

            setShow(false);
            setForm(empty());

            setMsg(
                'Oil purchase saved and Raw Oil Inventory updated.'
            );

            load();
        } catch (e: any) {
            setMsg(
                e?.error?.message ||
                e?.message ||
                'Failed to save oil purchase'
            );
        }
    };
    const cols = [{ key: 'purchaseNumber', title: 'Purchase No.' }, { key: 'batchNumber', title: 'Batch Number' }, { key: 'invoiceNumber', title: 'Invoice No.' }, { key: 'invoiceDate', title: 'Invoice Date', render: (v: string) => new Date(v).toLocaleDateString('en-IN') }, { key: 'supplierName', title: 'Supplier' }, { key: 'oilType', title: 'Oil Type' }, { key: 'actualWeightKg', title: 'Actual Weight (KG)', render: (v: number) => Number(v || 0).toLocaleString() }, { key: 'ratePerKg', title: 'Rate/KG', render: (v: number) => `₹${Number(v || 0).toFixed(2)}` }, { key: 'totalGstAmount', title: 'GST', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` }, { key: 'invoiceNetAmount', title: 'Net Amount', render: (v: number) => `₹${Number(v || 0).toLocaleString('en-IN')}` }];
    return <div className="module-page"><div className="module-header"><div><h1>Oil Purchase</h1><p>Record actual supplier invoice and tanker receipt.</p></div><button className="primary-button" onClick={() => { setForm(empty()); setShow(true) }}>+ New Oil Purchase</button></div>{msg && <div className={msg.includes('saved') ? 'success-message' : 'error-message'}>{msg}</div>}<DataTable data={rows} columns={cols} loading={loading} rowKey="_id" />
        {show && <div className="modal"><div className="modal-content" style={{ maxWidth: 900 }}><div className="modal-header"><h3>New Oil Purchase</h3><button className="modal-close" onClick={() => setShow(false)}>×</button></div><p className="help-text">Tip: selecting a booking will prefill supplier, oil type, booking quantity and rate.</p><div className="form-grid" style={{ padding: '1rem' }}>
            <div className="form-group"><label>Select Booking</label><select value={form.bookingId} onChange={e => selectBooking(e.target.value)}><option value="">-- Select Booking --</option>{bookings.map(b => <option key={b._id} value={b._id}>{b.bookingNumber} - {b.supplierName} - {b.pendingQuantityKg} KG</option>)}</select></div>
            <div className="form-group"><label>Supplier Name *</label><input value={form.supplierName} onChange={e => setForm({ ...form, supplierName: e.target.value })} /></div>
            <div className="form-group"><label>Supplier GSTIN *</label><input value={form.supplierGstin} onChange={e => setForm({ ...form, supplierGstin: e.target.value.toUpperCase() })} /></div>
            <div className="form-group"><label>Oil Type *</label><select value={form.oilType} onChange={e => setForm({ ...form, oilType: e.target.value })}><option value="">-- Select --</option>{oilTypes.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}</select></div>
            <div className="form-group"><label>Actual Weight (KG) *</label><input type="number" min="0.01" value={form.actualWeightKg} onChange={e => setForm({ ...form, actualWeightKg: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Booking Quantity (KG)</label><input value={form.bookingQuantityKg} disabled /></div>
            <div className="form-group"><label>Rate per KG (₹) *</label><input type="number" step="0.01" value={form.ratePerKg} onChange={e => setForm({ ...form, ratePerKg: Number(e.target.value) })} /></div>
            <div className="form-group"><label>HSN Code</label><input value={hsn} disabled /></div>
            <div className="form-group"><label>Invoice Number *</label><input value={form.invoiceNumber} onChange={e => setForm({ ...form, invoiceNumber: e.target.value })} /></div>
            <div className="form-group"><label>Invoice Date *</label><input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })} /></div>
            <div className="form-group"><label>Delivery Date *</label><input type="date" value={form.deliveryDate} onChange={e => setForm({ ...form, deliveryDate: e.target.value })} /></div>
            <div className="form-group"><label>Payment Mode *</label><select value={form.paymentMode} onChange={e => setForm({ ...form, paymentMode: e.target.value })}>{['Cash', 'Bank Transfer', 'Cheque', 'Credit'].map(v => <option key={v}>{v}</option>)}</select></div>
            <div className="form-group"><label>CGST Amount (₹)</label><input type="number" min="0" value={form.cgstAmount} onChange={e => setForm({ ...form, cgstAmount: Number(e.target.value) })} /></div>
            <div className="form-group"><label>SGST Amount (₹)</label><input type="number" min="0" value={form.sgstAmount} onChange={e => setForm({ ...form, sgstAmount: Number(e.target.value) })} /></div>
            <div className="form-group"><label>IGST Amount (₹)</label><input type="number" min="0" value={form.igstAmount} onChange={e => setForm({ ...form, igstAmount: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Tanker Transport Charges (₹) *</label><input type="number" min="0" value={form.tankerTransportCharges} onChange={e => setForm({ ...form, tankerTransportCharges: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Brokerage</label><input type="number" min="0" value={form.brokerage} onChange={e => setForm({ ...form, brokerage: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Extra Charges</label><input type="number" min="0" value={form.extraCharges} onChange={e => setForm({ ...form, extraCharges: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Transporter Name</label><input value={form.transporterName} onChange={e => setForm({ ...form, transporterName: e.target.value })} /></div><div className="form-group"><label>Vehicle Number</label><input value={form.vehicleNumber} onChange={e => setForm({ ...form, vehicleNumber: e.target.value.toUpperCase() })} /></div><div className="form-group"><label>E-Way Bill</label><input value={form.ewayBillNumber} onChange={e => setForm({ ...form, ewayBillNumber: e.target.value })} /></div><div className="form-group"><label>LR Number</label><input value={form.lrNumber} onChange={e => setForm({ ...form, lrNumber: e.target.value })} /></div>
            <div className="form-group">
                <label>Taxable Amount</label>
                <input
                    value={`₹${taxableAmount.toFixed(2)}`}
                    disabled
                />
            </div>

            <div className="form-group">
                <label>Purchase Cost Before Tax</label>
                <input
                    value={`₹${purchaseCostBeforeTax.toFixed(2)}`}
                    disabled
                />
            </div>

            <div className="form-group">
                <label>Invoice Net Amount</label>
                <input
                    value={`₹${invoiceNetAmount.toFixed(2)}`}
                    disabled
                />
            </div>

            <div className="form-group">
                <label>Landed Cost / KG</label>
                <input
                    value={`₹${landedCostPerKg.toFixed(2)}`}
                    disabled
                />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Remarks</label><textarea rows={3} value={form.remarks} onChange={e => setForm({ ...form, remarks: e.target.value })} /></div>
        </div><div className="modal-actions"><button className="primary-button" onClick={save}>Save Purchase</button><button className="secondary-button" onClick={() => setShow(false)}>Cancel</button></div></div></div>}
    </div>
};
export default ProcurementOil;
