import React, {useEffect, useState } from 'react';
import { customerAPI } from '../services/api';

const CustomerManagement: React.FC = () => {
  const [showForm, setShowForm] = useState(false);

  const [customers, setCustomers] = useState<any[]>([]);

const fetchCustomers = async () => {
  try {
    const response = await customerAPI.getAll();

    if (response.data.success) {
      setCustomers(response.data.data || []);
    }
  } catch (error) {
    console.error('Failed to fetch customers:', error);
  }
};

useEffect(() => {
  fetchCustomers();
}, []);

  const [formData, setFormData] = useState({
    customerName: '',
    contact: '',
    alternateContact: '',
    email: '',
    gstNo: '',
    panNo: '',
    address: '',
    destinationAddress: '',
    stateName: '',
    stateCode: '',
    city: '',
    pinCode: '',
    customerType: 'Retailer',
    creditLimit: '',
    creditDays: '',
    notes: '',
    isActive: true
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await customerAPI.create(formData);

    await fetchCustomers();

    alert('Customer created successfully');

    setShowForm(false);

    setFormData({
      customerName: '',
      contact: '',
      alternateContact: '',
      email: '',
      gstNo: '',
      panNo: '',
      address: '',
      destinationAddress: '',
      stateName: '',
      stateCode: '',
      city: '',
      pinCode: '',
      customerType: 'Retailer',
      creditLimit: '',
      creditDays: '',
      notes: '',
      isActive: true
    });

  } catch (error: any) {
    console.error('Create customer error:', error);
    alert(error.message || 'Failed to create customer');
  }
};

  return (
    <div className="page-container">

      <div className="page-header">
        <div>
          <h1>Customer Management</h1>
          <p>Manage your customers</p>
        </div>

       <button
  type="button"
  className="add-customer-btn"
  onClick={() => setShowForm(true)}
>
  + Add Customer
</button>

      </div>

      <div className="customer-list">
  <h2>Customer List</h2>

  {customers.length === 0 ? (
    <p>No customers found.</p>
  ) : (
    <table>
      <thead>
        <tr>
          <th>Customer Name</th>
          <th>Contact</th>
          <th>Email</th>
          <th>Customer Type</th>
          <th>City</th>
          <th>State</th>
          <th>Status</th>
        </tr>
      </thead>

      <tbody>
        {customers.map((customer) => (
          <tr key={customer._id || customer.id}>
            <td>{customer.customerName}</td>
            <td>{customer.contact}</td>
            <td>{customer.email || '-'}</td>
            <td>{customer.customerType}</td>
            <td>{customer.city || '-'}</td>
            <td>{customer.stateName || '-'}</td>
            <td>
              {customer.isActive ? 'Active' : 'Inactive'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )}
</div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">

            <div className="modal-header">
              <h2>Add Customer</h2>

             <button
  type="button"
  className="modal-close-btn"
  onClick={() => setShowForm(false)}
>
  ×
</button>
              
            </div>

            <form onSubmit={handleSubmit} >

              <div className="form-grid">
                <div className="form-group">
                  <label>Customer Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Contact *</label>
                  <input
                    type="text"
                    name="contact"
                    value={formData.contact}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Alternate Contact</label>
                  <input
                    type="text"
                    name="alternateContact"
                    value={formData.alternateContact}
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
                  <label>GST No</label>
                  <input
                    type="text"
                    name="gstNo"
                    value={formData.gstNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>PAN No</label>
                  <input
                    type="text"
                    name="panNo"
                    value={formData.panNo}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Destination Address</label>
                  <textarea
                    name="destinationAddress"
                    value={formData.destinationAddress}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>State Name *</label>
                  <input
                    type="text"
                    name="stateName"
                    value={formData.stateName}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>State Code *</label>
                  <input
                    type="text"
                    name="stateCode"
                    value={formData.stateCode}
                    onChange={handleChange}
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
                  <label>PIN Code</label>
                  <input
                    type="text"
                    name="pinCode"
                    value={formData.pinCode}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Type</label>
                  <select
                    name="customerType"
                    value={formData.customerType}
                    onChange={handleChange}
                  >
                    <option value="Retailer">Retailer</option>
                    <option value="Distributor">Distributor</option>
                    <option value="Wholesaler">Wholesaler</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Credit Limit</label>
                  <input
                    type="number"
                    name="creditLimit"
                    value={formData.creditLimit}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group">
                  <label>Credit Days</label>
                  <input
                    type="number"
                    name="creditDays"
                    value={formData.creditDays}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                  />
                </div>

                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    Active Customer
                  </label>
                </div>

              </div>

              <div className="modal-footer">

               <button
  type="button"
  className="cancel-btn"
  onClick={() => setShowForm(false)}
>
  Cancel
</button>

<button type="submit" className="save-customer-btn">
  Save Customer
</button>

              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerManagement;