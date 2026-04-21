import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, Activity, Users as UsersIcon, Settings } from 'lucide-react';
import JobLogTable from '../components/JobLogTable';

function Dashboard() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/jobs')
      .then(res => setJobs(res.data))
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1 style={{ marginBottom: '1rem' }}>Lab Head Dashboard</h1>
      <div className="card">
        <h3>Overview</h3>
        <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Monitor lab volume and operations.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <div style={{ flex: 1, padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Total Jobs Created</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>{jobs.length}</div>
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
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', role: 'HEAD', department: 'Micro', branch: 'Main Branch', password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data.filter(u => u.role !== 'ADMIN' && u.role !== 'LAB_HEAD'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    const firstName = newName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({
      ...prev, name: newName, password: editUserId ? prev.password : (firstName ? `${firstName}123` : '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      if (editUserId) {
        await axios.put(`http://localhost:5000/api/users/${editUserId}`, formData);
        setSuccess('User updated successfully.');
      } else {
        const res = await axios.post('http://localhost:5000/api/users', formData);
        setSuccess(`User created successfully. Temporary password is: ${res.data.temporaryPassword}`);
      }
      setFormData({ name: '', email: '', phone: '', role: 'HEAD', department: 'Micro', branch: 'Main Branch', password: '' });
      setEditUserId(null); setShowForm(false); fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (u) => {
    setFormData({ name: u.name, email: u.email, phone: u.phone, role: u.role, department: u.department, branch: u.branch, password: '' });
    setEditUserId(u._id); setShowForm(true); setError(''); setSuccess('');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if(showForm) setEditUserId(null); }}>
          {showForm ? 'Close Form' : '+ Create User'}
        </button>
      </div>

      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editUserId ? 'Edit User' : 'Create User'}</h3>
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
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Role</label>
                <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} required>
                  <option value="HEAD">Department Head</option>
                  <option value="ASSISTANT">Lab Assistant</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Department</label>
                <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} required>
                  <option value="Micro">Micro</option>
                  <option value="Macro">Macro</option>
                </select>
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
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{editUserId ? 'Update User' : 'Submit & Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Action</th></tr>
          </thead>
          <tbody>
             {users.map(u => (
              <tr key={u._id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td><span className="badge badge-warning">{u.role}</span></td>
                <td>{u.department || 'N/A'}</td>
                <td>
                  {userToDelete && userToDelete._id === u._id ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Sure?</span>
                      <button onClick={async () => { await axios.delete(`http://localhost:5000/api/users/${u._id}`); setUserToDelete(null); fetchUsers(); }} className="btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Yes</button>
                      <button onClick={() => setUserToDelete(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>No</button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '1rem' }}><Edit size={18}/></button>
                      <button onClick={() => setUserToDelete(u)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [heads, setHeads] = useState([]);
  const [formData, setFormData] = useState({
    clientName: '', totalSampleVolume: '',
    microRequired: false, microVolume: '', microAssignedTo: '',
    macroRequired: false, macroVolume: '', macroAssignedTo: ''
  });

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs');
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchHeads = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setHeads(res.data.filter(u => u.role === 'HEAD'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchJobs(); fetchHeads(); }, []);

  const handleTotalChange = (val) => {
    const total = parseFloat(val);
    setFormData(prev => {
      let next = { ...prev, totalSampleVolume: val };
      if (!isNaN(total)) {
        if (prev.microRequired && !prev.macroRequired) next.microVolume = total;
        else if (prev.macroRequired && !prev.microRequired) next.macroVolume = total;
        else if (prev.microRequired && prev.macroRequired && prev.microVolume !== '') {
          const m = parseFloat(prev.microVolume);
          if (!isNaN(m)) next.macroVolume = total - m;
        }
      }
      return next;
    });
  };

  const handleMicroChange = (val) => {
    const micro = parseFloat(val);
    const total = parseFloat(formData.totalSampleVolume);
    setFormData(prev => {
      let next = { ...prev, microVolume: val };
      if (prev.macroRequired && !isNaN(total) && !isNaN(micro)) {
        next.macroVolume = total - micro;
      }
      return next;
    });
  };

  const handleMacroChange = (val) => {
    const macro = parseFloat(val);
    const total = parseFloat(formData.totalSampleVolume);
    setFormData(prev => {
      let next = { ...prev, macroVolume: val };
      if (prev.microRequired && !isNaN(total) && !isNaN(macro)) {
        next.microVolume = total - macro;
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const distribution = {
        micro: {
          required: formData.microRequired,
          volume: formData.microVolume ? parseFloat(formData.microVolume) : 0,
          assignedTo: formData.microAssignedTo || undefined
        },
        macro: {
          required: formData.macroRequired,
          volume: formData.macroVolume ? parseFloat(formData.macroVolume) : 0,
          assignedTo: formData.macroAssignedTo || undefined
        }
      };

      await axios.post('http://localhost:5000/api/jobs', {
        clientName: formData.clientName,
        totalSampleVolume: parseFloat(formData.totalSampleVolume),
        distribution
      });
      setShowForm(false);
      setFormData({
        clientName: '', totalSampleVolume: '',
        microRequired: false, microVolume: '', microAssignedTo: '',
        macroRequired: false, macroVolume: '', macroAssignedTo: ''
      });
      fetchJobs();
    } catch (err) {
      console.error(err);
      alert('Error creating job');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Activity size={28} style={{ color: 'var(--color-primary)' }}/> Job Distributor</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '+ New Client Sample Job'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Log New Sample & Distribute</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Client Name</label>
                <input type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} required />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Total Sample Volume (ml/g)</label>
                <input type="number" step="0.01" value={formData.totalSampleVolume} onChange={e => handleTotalChange(e.target.value)} required />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem' }}>
              {/* MICRO SECTION */}
              <div style={{ flex: 1, padding: '1rem', border: formData.microRequired ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                  <input type="checkbox" checked={formData.microRequired} onChange={e => setFormData({ ...formData, microRequired: e.target.checked })} />
                  Distribute to MICRO
                </label>
                {formData.microRequired && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Micro Volume</label>
                      <input type="number" step="0.01" value={formData.microVolume} onChange={e => handleMicroChange(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Assign To Head</label>
                      <select value={formData.microAssignedTo} onChange={e => setFormData({ ...formData, microAssignedTo: e.target.value })} required>
                        <option value="">Select Head...</option>
                        {heads.filter(h => h.department === 'Micro').map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* MACRO SECTION */}
              <div style={{ flex: 1, padding: '1rem', border: formData.macroRequired ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                  <input type="checkbox" checked={formData.macroRequired} onChange={e => setFormData({ ...formData, macroRequired: e.target.checked })} />
                  Distribute to MACRO
                </label>
                {formData.macroRequired && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Macro Volume</label>
                      <input type="number" step="0.01" value={formData.macroVolume} onChange={e => handleMacroChange(e.target.value)} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Assign To Head</label>
                      <select value={formData.macroAssignedTo} onChange={e => setFormData({ ...formData, macroAssignedTo: e.target.value })} required>
                        <option value="">Select Head...</option>
                        {heads.filter(h => h.department === 'Macro').map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!formData.microRequired && !formData.macroRequired}>
              Submit Job & Dispatch
            </button>
          </form>
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <JobLogTable jobs={jobs} title="All Client Sample Jobs" />
      </div>
    </div>
  );
}

// Blueprint UI can be very similar to Domain Head
function Blueprints() {
  const [blueprints, setBlueprints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', department: 'Micro', parameters: [] });

  const fetchBlueprints = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tests/blueprints');
      setBlueprints(res.data);
    } catch(err) { console.error(err); }
  };

  useEffect(() => { fetchBlueprints(); }, []);

  const addParam = () => setFormData(p => ({ ...p, parameters: [...p.parameters, { name: '', unit: '', referenceRange: '' }] }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/tests/blueprints', formData);
      setShowForm(false);
      setFormData({ name: '', department: 'Micro', parameters: [] });
      fetchBlueprints();
    } catch (err) { alert('Error creating blueprint'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Test Blueprints</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ New Blueprint'}</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3>Create Test Blueprint</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <input style={{ flex: 2 }} type="text" placeholder="Blueprint Name (e.g. Complete Blood Count)" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
              <select style={{ flex: 1 }} value={formData.department} onChange={e => setFormData(p => ({ ...p, department: e.target.value }))}>
                <option value="Micro">Micro</option>
                <option value="Macro">Macro</option>
              </select>
            </div>
            <h4>Parameters</h4>
            {formData.parameters.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem' }}>
                <input style={{ flex: 2 }} type="text" placeholder="Parameter Name" value={p.name} onChange={e => { const newParams = [...formData.parameters]; newParams[i].name = e.target.value; setFormData(prev => ({ ...prev, parameters: newParams })); }} required />
                <input style={{ flex: 1 }} type="text" placeholder="Unit" value={p.unit} onChange={e => { const newParams = [...formData.parameters]; newParams[i].unit = e.target.value; setFormData(prev => ({ ...prev, parameters: newParams })); }} required />
                <input style={{ flex: 1 }} type="text" placeholder="Range" value={p.referenceRange} onChange={e => { const newParams = [...formData.parameters]; newParams[i].referenceRange = e.target.value; setFormData(prev => ({ ...prev, parameters: newParams })); }} required />
              </div>
            ))}
            <button type="button" onClick={addParam} className="btn" style={{ border: '1px solid var(--color-border)', alignSelf: 'flex-start' }}>+ Add Parameter</button>
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>Save Blueprint</button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr><th>Name</th><th>Department</th><th>Parameters count</th></tr>
          </thead>
          <tbody>
            {blueprints.map(b => (
              <tr key={b._id}>
                <td style={{ fontWeight: 500 }}>{b.name}</td>
                <td>{b.department}</td>
                <td>{b.parameters.length} params</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default function LabHeadDashboard() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/blueprints" element={<Blueprints />} />
      <Route path="/users" element={<Users />} />
    </Routes>
  );
}
