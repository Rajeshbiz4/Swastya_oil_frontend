import React, { useState, useEffect } from 'react';
import { useAppSelector } from '../store';
import { UserRole } from '../types';
import api from '../services/api';
import './UserManagement.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

interface CreateUserForm {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAppSelector((state) => state.auth);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [createForm, setCreateForm] = useState<CreateUserForm>({
    username: '',
    email: '',
    password: '',
    role: UserRole.USER
  });

  // Only admin can access this page
  if (currentUser?.role !== UserRole.ADMIN) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Only administrators can access user management.</p>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data || []);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/users', createForm);
      if (response.data.success) {
        setUsers([response.data.data.user, ...users]);
        setCreateForm({ username: '', email: '', password: '', role: UserRole.USER });
        setShowCreateForm(false);
        setError(null);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to create user');
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const response = await api.put(`/users/${userId}`, { role: newRole });
      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
        setError(null);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update user role');
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await api.put(`/users/${userId}`, { isActive });
      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isActive } : user
        ));
        setError(null);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await api.delete(`/users/${userId}`);
      if (response.data.success) {
        setUsers(users.filter(user => user.id !== userId));
        setError(null);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to delete user');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setCreateForm({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role
    });
    setShowCreateForm(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const updateData: any = {
        email: createForm.email,
        role: createForm.role
      };

      if (createForm.password) {
        updateData.password = createForm.password;
      }

      const response = await api.put(`/users/${editingUser.id}`, updateData);
      if (response.data.success) {
        setUsers(users.map(user => 
          user.id === editingUser.id ? response.data.data.user : user
        ));
        setCreateForm({ username: '', email: '', password: '', role: UserRole.USER });
        setShowCreateForm(false);
        setEditingUser(null);
        setError(null);
      }
    } catch (err: any) {
      setError(err.error?.message || 'Failed to update user');
    }
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setCreateForm({ username: '', email: '', password: '', role: UserRole.USER });
    setShowCreateForm(false);
    setError(null);
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="user-management">
      <div className="page-header">
        <h1>User Management</h1>
        <button 
          onClick={() => setShowCreateForm(true)} 
          className="btn-primary"
          disabled={showCreateForm}
        >
          Create New User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="create-user-form">
          <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
          <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
            <div className="form-group">
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                required
                disabled={!!editingUser} // Username cannot be changed
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required={!editingUser}
                placeholder={editingUser ? 'Leave blank to keep current password' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Role:</label>
              <select
                id="role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                required
              >
                <option value={UserRole.ADMIN}>Admin</option>
                <option value={UserRole.USER}>User</option>
                <option value={UserRole.SALES_PERSON}>Sales Person</option>
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button type="button" onClick={cancelEdit} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>
                  <select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={user.id === currentUser?.id} // Can't change own role
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.USER}>User</option>
                    <option value={UserRole.SALES_PERSON}>Sales Person</option>
                  </select>
                </td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="actions">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="btn-edit"
                    disabled={showCreateForm}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(user.id, !user.isActive)}
                    disabled={user.id === currentUser?.id} // Can't deactivate self
                    className={user.isActive ? 'btn-danger' : 'btn-success'}
                  >
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.id} // Can't delete self
                    className="btn-danger"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;