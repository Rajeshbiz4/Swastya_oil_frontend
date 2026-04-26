import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { fetchWorkers, createWorker, updateWorker, deactivateWorker } from '../store/slices/workerSlice';
import './Pages.css';

interface EmployeeFormData {
  // Basic Details
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  mobile: string;
  email: string;
  address: string;

  // Job Details
  department: string;
  designation: string;
  joiningDate: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  status: 'Active' | 'Inactive' | 'Deleted';

  // Salary Reference
  salaryTemplateId?: string;

  // ID Proof
  aadhaarNumber: string;
  panNumber: string;

  // Document Files
  aadhaarCard?: File;
  panCard?: File;
  photo?: File;
  otherDocuments?: FileList;
}

const EmployeeCRUD: React.FC = () => {
  const dispatch = useAppDispatch();
  const { workers, loading, error } = useAppSelector((state) => state.worker);
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  // Check authentication
  if (!isAuthenticated || !token) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1>👥 Employee Management</h1>
          <p>Manage your workforce efficiently</p>
        </div>
        <div className="error-message" style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>🔐 Authentication Required</h3>
          <p>Please log in to access employee management features.</p>
        </div>
      </div>
    );
  }

  // State Management
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeletedEmployees, setShowDeletedEmployees] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    mobile: '',
    email: '',
    address: '',
    department: '',
    designation: '',
    joiningDate: '',
    employmentType: 'Full-time',
    status: 'Active',
    salaryTemplateId: '',
    aadhaarNumber: '',
    panNumber: '',
    aadhaarCard: undefined,
    panCard: undefined,
    photo: undefined,
    otherDocuments: undefined
  });

  // Load all employees on mount
  useEffect(() => {
    dispatch(fetchWorkers({}));
  }, [dispatch]);

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: '',
      dob: '',
      mobile: '',
      email: '',
      address: '',
      department: '',
      designation: '',
      joiningDate: '',
      employmentType: 'Full-time',
      status: 'Active',
      salaryTemplateId: '',
      aadhaarNumber: '',
      panNumber: '',
      aadhaarCard: undefined,
      panCard: undefined,
      photo: undefined,
      otherDocuments: undefined
    });
  };

  // Handle form input changes
  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input changes
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files.length > 0) {
      if (name === 'otherDocuments') {
        setFormData((prev) => ({
          ...prev,
          [name]: files
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: files[0]
        }));
      }
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (formLoading) {
      console.log('Form already submitting, ignoring...');
      return;
    }

    setFormLoading(true);
    console.log('Starting form submission...');

    try {
      const formDataToSend = new FormData();

      // Add basic employee data
      const employeeData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        gender: formData.gender,
        dob: formData.dob,
        mobile: formData.mobile,
        email: formData.email,
        address: formData.address,
        department: formData.department,
        designation: formData.designation,
        joiningDate: formData.joiningDate,
        employmentType: formData.employmentType,
        status: formData.status,
        salaryTemplateId: formData.salaryTemplateId,
        aadhaarNumber: formData.aadhaarNumber,
        panNumber: formData.panNumber,
        phone: formData.mobile,
        employeeId: editingEmployee?.employeeId || `EMP-${Date.now()}`
      };

      // Add JSON data
      Object.entries(employeeData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      // Add files if they exist
      if (formData.aadhaarCard) {
        formDataToSend.append('aadhaarCard', formData.aadhaarCard);
      }
      if (formData.panCard) {
        formDataToSend.append('panCard', formData.panCard);
      }
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo);
      }
      if (formData.otherDocuments) {
        Array.from(formData.otherDocuments).forEach((file, index) => {
          formDataToSend.append('otherDocuments', file);
        });
      }

      if (editingEmployee) {
        // For updates, first update the employee data, then upload documents separately
        const updateData = { ...employeeData };
        delete updateData.employeeId; // Don't update employeeId

        await dispatch(
          updateWorker({
            id: editingEmployee._id,
            data: updateData
          })
        );

        // If there are files to upload, upload them separately
        if (formData.aadhaarCard || formData.panCard || formData.photo || formData.otherDocuments) {
          const documentFormData = new FormData();
          if (formData.aadhaarCard) documentFormData.append('aadhaarCard', formData.aadhaarCard);
          if (formData.panCard) documentFormData.append('panCard', formData.panCard);
          if (formData.photo) documentFormData.append('photo', formData.photo);
          if (formData.otherDocuments) {
            Array.from(formData.otherDocuments).forEach((file) => {
              documentFormData.append('otherDocuments', file);
            });
          }

          // Upload documents
          await fetch(`/api/workers/${editingEmployee._id}/documents`, {
            method: 'POST',
            body: documentFormData,
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
        }

        alert('Employee updated successfully');
      } else {
        // For new employees, check if files are being uploaded
        const hasFiles = formData.aadhaarCard || formData.panCard || formData.photo || formData.otherDocuments;
        const endpoint = hasFiles ? '/api/workers/upload' : '/api/workers';

        // For new employees, use the appropriate endpoint
        const response = await fetch(endpoint, {
          method: 'POST',
          body: hasFiles ? formDataToSend : JSON.stringify(employeeData),
          headers: hasFiles ? {
            'Authorization': `Bearer ${token}`
          } : {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Failed to create employee');
        }

        alert('Employee created successfully');
      }

      resetForm();
      setEditingEmployee(null);
      setShowForm(false);
      dispatch(fetchWorkers({}));
    } catch (error: any) {
      console.error('Error submitting form:', error);

      // Show specific error message from backend
      const errorMessage = error?.response?.data?.error?.message ||
                          error?.message ||
                          'Error saving employee';

      alert(`Error: ${errorMessage}`);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (employee: any) => {
    const [firstName, ...lastNameParts] = employee.name.split(' ');
    setEditingEmployee(employee);
    setFormData({
      firstName: firstName || '',
      lastName: lastNameParts.join(' ') || '',
      gender: employee.gender || '',
      dob: employee.dob ? employee.dob.split('T')[0] : '',
      mobile: employee.phone || '',
      email: employee.email || '',
      address: employee.address || '',
      department: employee.department || '',
      designation: employee.designation || '',
      joiningDate: employee.joiningDate ? employee.joiningDate.split('T')[0] : '',
      employmentType: employee.employmentType || 'Full-time',
      status: employee.isActive ? 'Active' : 'Inactive',
      salaryTemplateId: employee.salaryTemplateId || '',
      aadhaarNumber: employee.aadhaarNumber || '',
      panNumber: employee.panNumber || ''
    });
    setShowForm(true);
  };

  // Handle soft delete
  const handleDelete = async (employeeId: string, employeeName: string) => {
    if (
      confirm(
        `Are you sure? This will deactivate "${employeeName}". This action is reversible.`
      )
    ) {
      try {
        await dispatch(deactivateWorker(employeeId));
        alert('Employee has been deactivated');
        dispatch(fetchWorkers({}));
      } catch (error) {
        console.error('Delete error:', error);
        alert('Error deactivating employee');
      }
    }
  };

  // Filter employees
  const filteredEmployees = workers.filter((emp: any) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      emp.name.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower) ||
      emp.email?.toLowerCase().includes(searchLower);

    // Filter based on showDeletedEmployees checkbox
    const matchesDeleteStatus = showDeletedEmployees ? true : !emp.isDeleted;

    return matchesSearch && matchesDeleteStatus;
  });

  return (
    <div className="page-container employee-crud-container">
      
      {error && <div className="error-message">⚠️ {error}</div>}

      {/* Header Controls */}
      <div className="section-header employee-crud-controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showDeletedEmployees}
            onChange={(e) => setShowDeletedEmployees(e.target.checked)}
          />
          📋 Show Deleted Employees
        </label> */}

        {!showForm && (
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setEditingEmployee(null);
              setShowForm(true);
            }}
          >
            ➕ Add New Employee
          </button>
        )}
      </div>

      {/* Add/Edit Employee Form */}
      {showForm && (
        <div className="form-section employee-form-section">
          <h2>{editingEmployee ? '✏️ Edit Employee' : '➕ Add New Employee'}</h2>
          <p className="form-subtitle">Fill all employee details in the form below and submit</p>

          <form onSubmit={handleFormSubmit} className="employee-form">
            {/* ===== BASIC DETAILS SECTION ===== */}
            <div className="form-section-divider">
              <h3>👤 Basic Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                  placeholder="Enter first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleFormChange}
                  disabled={formLoading}
                >
                  <option value="">-- Select --</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="dob">Date of Birth</label>
                <input
                  id="dob"
                  name="dob"
                  type="date"
                  value={formData.dob}
                  onChange={handleFormChange}
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mobile">Mobile Number *</label>
                <input
                  id="mobile"
                  name="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                  placeholder="Enter mobile number"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email ID</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  placeholder="Enter email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleFormChange}
                disabled={formLoading}
                placeholder="Enter full address"
                rows={3}
              />
            </div>

            {/* ===== JOB DETAILS SECTION ===== */}
            <div className="form-section-divider">
              <h3>💼 Job Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                >
                  <option value="">-- Select Department --</option>
                  <option value="Production">Production</option>
                  <option value="Quality">Quality</option>
                  <option value="Sales">Sales</option>
                  <option value="HR">HR</option>
                  <option value="Admin">Admin</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="designation">Designation *</label>
                <input
                  id="designation"
                  name="designation"
                  type="text"
                  value={formData.designation}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                  placeholder="e.g., Supervisor, Operator"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="joiningDate">Joining Date *</label>
                <input
                  id="joiningDate"
                  name="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="employmentType">Employment Type *</label>
                <select
                  id="employmentType"
                  name="employmentType"
                  value={formData.employmentType}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status *</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleFormChange}
                  required
                  disabled={formLoading}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Deleted">Deleted</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="salaryTemplateId">Salary Template ID (Optional)</label>
                <input
                  id="salaryTemplateId"
                  name="salaryTemplateId"
                  type="text"
                  value={formData.salaryTemplateId}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  placeholder="Reference only"
                />
              </div>
            </div>

            {/* ===== ID & DOCUMENTS SECTION ===== */}
            <div className="form-section-divider">
              <h3>📄 ID & Documents</h3>
            </div>

            <div className="info-box">
              📄 <strong>Document Upload:</strong> Document storage integration to be added
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="aadhaarNumber">Aadhaar Number</label>
                <input
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  type="text"
                  value={formData.aadhaarNumber}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  placeholder="12-digit Aadhaar number"
                  pattern="\d{12}"
                />
              </div>
              <div className="form-group">
                <label htmlFor="panNumber">PAN Number</label>
                <input
                  id="panNumber"
                  name="panNumber"
                  type="text"
                  value={formData.panNumber}
                  onChange={handleFormChange}
                  disabled={formLoading}
                  placeholder="e.g., AAAAA0000A"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                />
              </div>
            </div>

            <div className="document-upload-section">
              <h3>📎 Document Upload</h3>
              <div className="document-uploads-grid">
                <div className="form-group">
                  <label htmlFor="aadhaarCard">Aadhaar Card</label>
                  <input
                    id="aadhaarCard"
                    name="aadhaarCard"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    disabled={formLoading}
                  />
                  <small className="file-hint">Upload Aadhaar card (JPG, PNG, PDF, max 5MB)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="panCard">PAN Card</label>
                  <input
                    id="panCard"
                    name="panCard"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    disabled={formLoading}
                  />
                  <small className="file-hint">Upload PAN card (JPG, PNG, PDF, max 5MB)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="photo">Photo</label>
                  <input
                    id="photo"
                    name="photo"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                    disabled={formLoading}
                  />
                  <small className="file-hint">Upload employee photo (JPG, PNG, max 5MB)</small>
                </div>

                <div className="form-group">
                  <label htmlFor="otherDocuments">Other Documents</label>
                  <input
                    id="otherDocuments"
                    name="otherDocuments"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    multiple
                    onChange={handleFileChange}
                    disabled={formLoading}
                  />
                  <small className="file-hint">Upload additional documents (max 5 files, 5MB each)</small>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              <button type="submit" disabled={formLoading} className="btn btn-primary">
                {formLoading ? '⏳ Saving...' : editingEmployee ? '💾 Update Employee' : '➕ Create Employee'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={formLoading}
                className="btn btn-secondary"
              >
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee Profile View Modal */}
      {viewingEmployee && (
        <div className="modal-overlay" onClick={() => setViewingEmployee(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Employee Profile</h2>
              <button
                className="modal-close"
                onClick={() => setViewingEmployee(null)}
              >
                ✕
              </button>
            </div>

            <div className="profile-section">
              <h3>Basic Information</h3>
              <div className="profile-grid">
                <div>
                  <strong>Name:</strong> {viewingEmployee.name}
                </div>
                <div>
                  <strong>Employee ID:</strong> {viewingEmployee.employeeId}
                </div>
                <div>
                  <strong>Email:</strong> {viewingEmployee.email || 'N/A'}
                </div>
                <div>
                  <strong>Mobile:</strong> {viewingEmployee.phone}
                </div>
                <div>
                  <strong>Address:</strong> {viewingEmployee.address || 'N/A'}
                </div>
                <div>
                  <strong>DOB:</strong> {viewingEmployee.dob ? new Date(viewingEmployee.dob).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Job Information</h3>
              <div className="profile-grid">
                <div>
                  <strong>Department:</strong> {viewingEmployee.department || 'N/A'}
                </div>
                <div>
                  <strong>Designation:</strong> {viewingEmployee.designation || 'N/A'}
                </div>
                <div>
                  <strong>Joining Date:</strong>{' '}
                  {viewingEmployee.joiningDate
                    ? new Date(viewingEmployee.joiningDate).toLocaleDateString()
                    : 'N/A'}
                </div>
                <div>
                  <strong>Employment Type:</strong> {viewingEmployee.employmentType || 'N/A'}
                </div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`status-badge ${viewingEmployee.isActive ? 'active' : 'inactive'}`}>
                    {viewingEmployee.isActive ? '✓ Active' : '✗ Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>ID Information</h3>
              <div className="profile-grid">
                <div>
                  <strong>Aadhaar:</strong> {viewingEmployee.aadhaarNumber || 'N/A'}
                </div>
                <div>
                  <strong>PAN:</strong> {viewingEmployee.panNumber || 'N/A'}
                </div>
              </div>
            </div>

            <div className="profile-actions">
              <button className="btn btn-primary" onClick={() => {
                handleEdit(viewingEmployee);
                setViewingEmployee(null);
              }}>
                ✏️ Edit Employee
              </button>
              <button className="btn btn-secondary" onClick={() => setViewingEmployee(null)}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employees List Table */}
      <div className="table-section">
        {/* <div className="table-header">
          <h2>
            👥 {showDeletedEmployees ? '🗑️ All Employees' : '✓ Active Employees'} ({filteredEmployees.length})
          </h2>
          <p className="table-subtitle">
            {showDeletedEmployees
              ? 'Showing both active and deleted employees'
              : 'Showing only active employees. Check "Show Deleted Employees" to view all.'
            }
          </p>
        </div> */}

        {loading ? (
          <div className="loading">⏳ Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <p>📭 No employees found</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Mobile</th>
                  <th>Status</th>
                  <th>Joining Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp: any) => (
                  <tr key={emp._id} className={!emp.isActive ? 'deleted-row' : ''}>
                    <td>
                      <strong>{emp.employeeId || 'N/A'}</strong>
                    </td>
                    <td>{emp.name}</td>
                    <td>{emp.department || 'N/A'}</td>
                    <td>{emp.designation || 'N/A'}</td>
                    <td>{emp.phone}</td>
                    <td>
                      <span className={`status-badge ${emp.isActive ? 'active' : 'inactive'}`}>
                        {emp.isActive ? '✓ Active' : '✗ Deleted'}
                      </span>
                    </td>
                    <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'N/A'}</td>
                    <td className="action-cell">
                      <button
                        className="btn btn-sm btn-info"
                        onClick={() => setViewingEmployee(emp)}
                        title="View full profile"
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleEdit(emp)}
                        disabled={formLoading}
                      >
                        ✏️ Edit
                      </button>
                      {emp.isActive && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(emp._id, emp.name)}
                          disabled={formLoading}
                          title="Soft delete - data is preserved"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EmployeeCRUD;

