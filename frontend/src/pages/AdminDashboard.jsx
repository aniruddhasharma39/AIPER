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
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      // Admin sees everyone, but maybe let's just display everyone read-only.
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const firstName = newName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev, name: newName, password: firstName ? `${firstName}123` : ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      const res = await axios.post('http://localhost:5000/api/users', { ...formData, role: 'LAB_HEAD' });
      setSuccess(`Lab Head created successfully. Temporary password is: ${res.data.temporaryPassword}`);
      setFormData({ name: '', email: '', phone: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Users Overview</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '+ Create Lab Head'}
        </button>
      </div>

      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create Lab Head</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" value={formData.name} onChange={handleNameChange} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Password (Auto-generated)</label>
                <input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>
            
            <div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>Submit & Create Lab Head</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No users found</td></tr>
            ) : (
             users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-warning">{u.role}</span></td>
                <td>{u.department || 'N/A'}</td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import JobLogTable from '../components/JobLogTable';

function Audit() {
  const [jobs, setJobs] = useState([]);

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs');
      setJobs(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  return (
    <div>
       <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
         <FileText size={28} style={{ color: 'var(--color-primary)' }}/> Super Admin Tracker
       </h1>
       <JobLogTable jobs={jobs} title="Global Job Lifecycle Logs" />
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
