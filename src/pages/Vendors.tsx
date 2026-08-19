import React, { useEffect, useState } from 'react';
import { Vendor, vendorAPI } from '../services/api';
import './Pages.css';

const Vendors: React.FC = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const [formData, setFormData] = useState({
  vendorName: '',
  contactPerson: '',
  mobileNumber: '',
  alternateMobile: '',
  email: '',
  gstin: '',
  panNumber: '',
  address: '',
  city: '',
  state: '',
  stateCode: '',
  pinCode: '',
  vendorType: '',
  paymentTerms: '',
  bankName: '',
  accountNumber: '',
  ifscCode: '',
  openingBalance: 0,
  balanceType: 'Payable' as 'Payable' | 'Advance',
  status: 'Active' as 'Active' | 'Inactive',
  notes: '',
});

  const fetchVendors = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await vendorAPI.getAll();

      if (response.data.success) {
        setVendors(response.data.data || []);
      } else {
        setError(response.data.error?.message || 'Failed to fetch vendors');
      }
    } catch (err: any) {
      setError(err?.error?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [name]: name === 'openingBalance' ? Number(value) : value,
  }));
};

const handleView = (vendor: Vendor) => {
  setSelectedVendor(vendor);
  setShowViewModal(true);
};

const handleEdit = (vendor: Vendor) => {
  setEditingVendor(vendor);

  setFormData({
    vendorName: vendor.vendorName || '',
    contactPerson: vendor.contactPerson || '',
    mobileNumber: vendor.mobileNumber || '',
    alternateMobile: vendor.alternateMobile || '',
    email: vendor.email || '',
    gstin: vendor.gstin || '',
    panNumber: vendor.panNumber || '',
    address: vendor.address || '',
    city: vendor.city || '',
    state: vendor.state || '',
    stateCode: vendor.stateCode || '',
    pinCode: vendor.pinCode || '',
    vendorType: vendor.vendorType || '',
    paymentTerms: vendor.paymentTerms || '',
    bankName: vendor.bankName || '',
    accountNumber: vendor.accountNumber || '',
    ifscCode: vendor.ifscCode || '',
    openingBalance: vendor.openingBalance || 0,
    balanceType: vendor.balanceType || 'Payable',
    status: vendor.status || 'Active',
    notes: vendor.notes || '',
  });

  setShowForm(true);
};


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);

  try {
    if (editingVendor) {

      // UPDATE EXISTING VENDOR
      await vendorAPI.update(editingVendor._id, formData);

      alert('Vendor updated successfully');

      // Clear edit mode
      setEditingVendor(null);

      // Close form
      setShowForm(false);

      // Reload master vendor list
      await fetchVendors();

    } else {

      // CREATE NEW VENDOR
      await vendorAPI.create(formData);

      alert('Vendor created successfully');

      // Close form
      setShowForm(false);

      // Reload master vendor list
      await fetchVendors();
    }

    // Reset form
    setFormData({
      vendorName: '',
      contactPerson: '',
      mobileNumber: '',
      alternateMobile: '',
      email: '',
      gstin: '',
      panNumber: '',
      address: '',
      city: '',
      state: '',
      stateCode: '',
      pinCode: '',
      vendorType: '',
      paymentTerms: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      openingBalance: 0,
      balanceType: 'Payable',
      status: 'Active',
      notes: '',
    });

  } catch (error: any) {

    console.error('Vendor save error:', error);

    alert(
      error?.response?.data?.message ||
      'Failed to save vendor'
    );

  } finally {
    setSaving(false);
  }
};

  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <div className="page-container">

      {/* Header */}
      <div className="employee-management-header">
        <div>
          <h1>Vendor Management</h1>
          <p>Manage your oil and packaging suppliers.</p>
        </div>

        <button
          className="primary-button"
          onClick={() => setShowForm(true)}
        >
          + Add Vendor
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="loading-message">Loading vendors...</div>
      )}

      {/* Error */}
      {!loading && error && <div className="error-message">{error}</div>}

      {/* Vendor Table */}
      {!loading && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor ID</th>
                <th>Vendor Name</th>
                <th>Mobile</th>
                <th>GSTIN</th>
                <th>PAN</th>
                <th>Vendor Type</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {vendors.length === 0 ? (
                <tr>
                  <td colSpan={8} className="no-data">
                    No vendors found.
                  </td>
                </tr>
              ) : (
                vendors.map((vendor) => (
                  <tr key={vendor._id}>
                    <td>{vendor.vendorId}</td>
                    <td>{vendor.vendorName}</td>
                    <td>{vendor.mobileNumber}</td>
                    <td>{vendor.gstin}</td>
                    <td>{vendor.panNumber}</td>
                    <td>{vendor.vendorType}</td>
                    <td>
                      <span
                        className={
                          vendor.status === 'Active'
                            ? 'status-active'
                            : 'status-inactive'
                        }
                      >
                        {vendor.status}
                      </span>
                    </td>
                    <td>
                      <button className="action-button" onClick={() => handleView(vendor)}>
                        View
                      </button>

                      <button className="action-button" onClick={() => handleEdit(vendor)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
  <div className="vendor-modal-overlay">
    <div className="vendor-modal">

      <div className="vendor-modal-header">
        <h2>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</h2>

        <button
          type="button"
          className="vendor-close-button"
          onClick={() => setShowForm(false)}
        >
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Basic Information */}
        <div className="vendor-form-section">
          <h3>Basic Information</h3>

          <div className="vendor-form-grid">

            <div className="form-group">
              <label>Vendor Name *</label>
              <input
                type="text"
                name="vendorName"
                value={formData.vendorName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Person</label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Alternate Mobile</label>
              <input
                type="text"
                name="alternateMobile"
                value={formData.alternateMobile}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>GSTIN *</label>
              <input
                type="text"
                name="gstin"
                value={formData.gstin}
                onChange={handleChange}
                required
              />
            </div>

          </div>
        </div>

        {/* Address & Tax */}
        <div className="vendor-form-section">
          <h3>Address & Tax Information</h3>

          <div className="vendor-form-grid">

            <div className="form-group">
              <label>PAN Number *</label>
              <input
                type="text"
                name="panNumber"
                value={formData.panNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>PIN Code *</label>
              <input
                type="text"
                name="pinCode"
                value={formData.pinCode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group vendor-full-width">
              <label>Address *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={2}
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>State Code</label>
              <input
                type="text"
                name="stateCode"
                value={formData.stateCode}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Vendor Type *</label>
              <select
                name="vendorType"
                value={formData.vendorType}
                onChange={handleChange}
                required
              >
                <option value="">Select Vendor Type</option>
                <option value="Oil Supplier">Oil Supplier</option>
                <option value="Packaging Supplier">
                  Packaging Supplier
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>Payment Terms</label>
              <input
                type="text"
                name="paymentTerms"
                placeholder="15 Days / Cash"
                value={formData.paymentTerms}
                onChange={handleChange}
              />
            </div>

          </div>
        </div>

        {/* Bank Details */}
        <div className="vendor-form-section">
          <h3>Bank Details</h3>

          <div className="vendor-form-grid">

            <div className="form-group">
              <label>Bank Name *</label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>IFSC Code *</label>
              <input
                type="text"
                name="ifscCode"
                value={formData.ifscCode}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Opening Balance</label>
              <input
                type="number"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label>Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="form-group vendor-full-width">
              <label>Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
              />
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="vendor-form-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Vendor'}
          </button>

        </div>

      </form>
    </div>
  </div>

      )}

      {showViewModal && selectedVendor && (
  <div className="vendor-modal-overlay">
    <div className="vendor-modal vendor-details-modal">

      <div className="vendor-modal-header">
        <h2>Vendor Details</h2>

        <button
          type="button"
          className="vendor-close-button"
          onClick={() => {
            setShowViewModal(false);
            setSelectedVendor(null);
          }}
        >
          ×
        </button>
      </div>

      <div className="vendor-details-content">

        <div className="vendor-details-section">
          <h3>Basic Information</h3>

          <div className="vendor-details-grid">

            <div>
              <span>Vendor ID</span>
              <strong>{selectedVendor.vendorId || '-'}</strong>
            </div>

            <div>
              <span>Vendor Name</span>
              <strong>{selectedVendor.vendorName || '-'}</strong>
            </div>

            <div>
              <span>Contact Person</span>
              <strong>{selectedVendor.contactPerson || '-'}</strong>
            </div>

            <div>
              <span>Mobile Number</span>
              <strong>{selectedVendor.mobileNumber || '-'}</strong>
            </div>

            <div>
              <span>Alternate Mobile</span>
              <strong>{selectedVendor.alternateMobile || '-'}</strong>
            </div>

            <div>
              <span>Email</span>
              <strong>{selectedVendor.email || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Vendor Information</h3>

          <div className="vendor-details-grid">

            <div>
              <span>Vendor Type</span>
              <strong>{selectedVendor.vendorType || '-'}</strong>
            </div>

            <div>
              <span>Status</span>
              <strong>{selectedVendor.status || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Tax Information</h3>

          <div className="vendor-details-grid">

            <div>
              <span>GSTIN</span>
              <strong>{selectedVendor.gstin || '-'}</strong>
            </div>

            <div>
              <span>PAN Number</span>
              <strong>{selectedVendor.panNumber || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Address</h3>

          <div className="vendor-details-grid">

            <div className="vendor-details-full-width">
              <span>Address</span>
              <strong>{selectedVendor.address || '-'}</strong>
            </div>

            <div>
              <span>City</span>
              <strong>{selectedVendor.city || '-'}</strong>
            </div>

            <div>
              <span>State</span>
              <strong>{selectedVendor.state || '-'}</strong>
            </div>

            <div>
              <span>State Code</span>
              <strong>{selectedVendor.stateCode || '-'}</strong>
            </div>

            <div>
              <span>Pincode</span>
              <strong>{selectedVendor.pinCode || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Bank Details</h3>

          <div className="vendor-details-grid">

            <div>
              <span>Bank Name</span>
              <strong>{selectedVendor.bankName || '-'}</strong>
            </div>

            <div>
              <span>Account Number</span>
              <strong>
                {selectedVendor.accountNumber
                  ? `********${selectedVendor.accountNumber.slice(-4)}`
                  : '-'}
              </strong>
            </div>

            <div>
              <span>IFSC Code</span>
              <strong>{selectedVendor.ifscCode || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Payment Information</h3>

          <div className="vendor-details-grid">

            <div>
              <span>Payment Terms</span>
              <strong>{selectedVendor.paymentTerms || '-'}</strong>
            </div>

            <div>
              <span>Opening Balance</span>
              <strong>
                ₹{Number(selectedVendor.openingBalance || 0).toLocaleString('en-IN')}
              </strong>
            </div>

            <div>
              <span>Balance Type</span>
              <strong>{selectedVendor.balanceType || '-'}</strong>
            </div>

          </div>
        </div>

        <div className="vendor-details-section">
          <h3>Notes</h3>

          <div className="vendor-details-notes">
            {selectedVendor.notes || '-'}
          </div>
        </div>

      </div>

      <div className="vendor-form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setShowViewModal(false);
            setSelectedVendor(null);
          }}
        >
          Close
        </button>
      </div>

    </div>
  </div>
)}

    </div>
  );
};

export default Vendors;