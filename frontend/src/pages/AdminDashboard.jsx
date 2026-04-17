import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, FileText, Search } from 'lucide-react';
import ReportViewer from '../components/ReportViewer';

function Dashboard() {
  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    // Optionally fetch users to get real count
    axios.get('http://localhost:5000/api/users')
      .then(res => setUsersCount(res.data.length))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Admin Command Center</h1>
      <div className="card">
        <h3>System Overview</h3>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>View macro-level laboratory health and active users here.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Active Tests</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>124</div>
          </div>
          <div style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Department Heads</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-success)' }}>{usersCount}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null); // Custom confirm state
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', department: 'Micro', branch: 'Main Branch', password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const firstName = newName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev,
      name: newName,
      password: editUserId ? prev.password : (firstName ? `${firstName}123` : '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      if (editUserId) {
        await axios.put(`http://localhost:5000/api/users/${editUserId}`, formData);
        setSuccess('User updated successfully.');
      } else {
        const res = await axios.post('http://localhost:5000/api/users', { ...formData, role: 'HEAD' });
        setSuccess(`User created successfully. Temporary password is: ${res.data.temporaryPassword}`);
      }
      setFormData({ name: '', email: '', phone: '', department: 'Micro', branch: 'Main Branch', password: '' });
      setEditUserId(null);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || err.message || 'Operation failed');
    }
  };

  const handleEdit = (u) => {
    setFormData({ name: u.name, email: u.email, phone: u.phone, department: u.department, branch: u.branch, password: '' });
    setEditUserId(u._id);
    setShowForm(true);
    setError('');
    setSuccess('');
  };

  const confirmDelete = (u) => {
    setUserToDelete(u);
  };

  const handleDelete = async () => {
    if(!userToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`);
      setUserToDelete(null);
      fetchUsers();
    } catch(err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to delete user');
      setUserToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => {
          setShowForm(!showForm);
          if(showForm) setEditUserId(null); // Reset edit state when closing
        }}>
          {showForm ? 'Close Form' : '+ Create HEAD User'}
        </button>
      </div>

      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editUserId ? 'Edit Department Head' : 'Create Department Head'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" value={formData.name} onChange={handleNameChange} required placeholder="John Doe" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required placeholder="john@foodlab.com" />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="+1234567890" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Department</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                  <option value="Micro">Micro</option>
                  <option value="Macro">Macro</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Branch</label>
                <input type="text" value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} required />
              </div>
            </div>

            {!editUserId && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Password (Auto-generated)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>
              </div>
            )}
            
            <div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{editUserId ? 'Update User' : 'Submit & Create User'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Branch</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem' }}>No users found</td>
              </tr>
            ) : (
             users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-warning">{u.role}</span></td>
                <td>{u.department || 'N/A'}</td>
                <td>{u.branch || 'N/A'}</td>
                <td>
                  {userToDelete && userToDelete._id === u._id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Sure?</span>
                      <button onClick={handleDelete} className="btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Yes</button>
                      <button onClick={() => setUserToDelete(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>No</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '1rem' }}><Edit size={18}/></button>
                      <button onClick={() => confirmDelete(u)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
                    </>
                  )}
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Audit() {
  const [instances, setInstances] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchInstances = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tests/instances');
      // Only show COMPLETED ones for the Audit Log
      setInstances(res.data.filter(i => i.status === 'COMPLETED'));
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchInstances(); }, []);

  if (selectedReport) {
    return <ReportViewer report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div>
       <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <FileText size={28} style={{ color: 'var(--color-primary)' }}/> Master Audit Log
       </h1>
       <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr>
              <th>Test Code</th>
              <th>Client Name</th>
              <th>Blueprint</th>
              <th>Analyst</th>
              <th>Date Completed</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {instances.length === 0 ? (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No completed tests found yet.</td></tr>
            ) : (
              instances.map(inst => (
                <tr key={inst._id}>
                  <td style={{ fontFamily: 'monospace' }}>{inst.testCode}</td>
                  <td style={{ fontWeight: 500 }}>{inst.clientName}</td>
                  <td>{inst.blueprintId?.name}</td>
                  <td>{inst.assignedTo?.name}</td>
                  <td>{new Date(inst.completedAt).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => setSelectedReport(inst)} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>View PDF Report</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
       </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/audit" element={<Audit />} />
    </Routes>
  );
}
