import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, Activity, Users as UsersIcon, Settings, Clock, CheckCircle, FileText, ClipboardCheck, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import JobLogTable from '../components/JobLogTable';
import ReportViewer from '../components/ReportViewer';
import { AuthContext } from '../context/AuthContext';
function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    pendingDispatch: 0,
    inProgress: 0,
    completed: 0,
    totalAssistants: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jobsRes, instancesRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/jobs'),
          axios.get('http://localhost:5000/api/tests/instances'),
          axios.get('http://localhost:5000/api/users')
        ]);

        // Lab Head oversees all departments
        let pending = 0;
        jobsRes.data.forEach(j => {
          if (j.distribution?.micro?.status === 'PENDING') pending++;
          if (j.distribution?.macro?.status === 'PENDING') pending++;
        });

        setStats({
          pendingDispatch: pending,
          inProgress: instancesRes.data.filter(i => i.status === 'PENDING' && i.assignedTo != null).length,
          completed: instancesRes.data.filter(i => i.status === 'COMPLETED').length,
          totalAssistants: usersRes.data.filter(u => u.role === 'ASSISTANT').length
        });

        // Get latest 5 activities overall
        const sortedInstances = instancesRes.data
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
        
        setRecentActivity(sortedInstances);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    fetchStats();
  }, [user]);

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="card" style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid ${color}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ padding: '0.6rem', backgroundColor: `${color}15`, color: color, borderRadius: 'var(--radius-md)' }}>
          <Icon size={20} />
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{value}</div>
      </div>
      <div>
        <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>{title}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Lab Head Command Center</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Global Laboratory Intelligence</p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>
          Real-time Telemetry Active <div style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', marginLeft: '0.5rem' }}></div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <StatCard 
          icon={Clock} 
          title="Awaiting Dispatch" 
          value={stats.pendingDispatch} 
          color="var(--color-warning)" 
          subtitle="New samples to assign" 
        />
        <StatCard 
          icon={Activity} 
          title="Live Analysis" 
          value={stats.inProgress} 
          color="var(--color-primary)" 
          subtitle="Processing in lab" 
        />
        <StatCard 
          icon={CheckCircle} 
          title="Archive Ready" 
          value={stats.completed} 
          color="var(--color-success)" 
          subtitle="Completed reports" 
        />
        <StatCard 
          icon={UsersIcon} 
          title="Active Analysts" 
          value={stats.totalAssistants} 
          color="#8B5CF6" 
          subtitle="Available for tasks" 
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Recent Pipeline Activity
          </h3>
          <Link to="/lab-head/audit" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>View Detailed Logs &rarr;</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
              <tr>
                <th style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID / Code</th>
                <th style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</th>
                <th style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Analyst</th>
                <th style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--color-text-muted)' }}>No recent activity detected.</td></tr>
              ) : (
                recentActivity.map(inst => (
                  <tr key={inst._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{inst.testCode}</td>
                    <td style={{ fontWeight: 500 }}>{inst.clientName}</td>
                    <td>{inst.assignedTo?.name || <span style={{ color: 'var(--color-text-muted)' }}>Unassigned</span>}</td>
                    <td>
                      <span className={`badge ${inst.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                        {inst.status === 'COMPLETED' ? 'Finished' : 'In Progress'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UserSection({ title, users, onEdit, onDelete, userToDelete, setUserToDelete, onConfirmDelete }) {
  return (
    <div style={{ marginBottom: '2.5rem' }}>
      <h3 style={{ 
        marginBottom: '1rem', 
        color: 'var(--color-text-main)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem' 
      }}>
        <div style={{ width: '4px', height: '1.5rem', backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-full)' }}></div>
        {title}
        <span className="badge badge-secondary" style={{ fontSize: '0.8rem', marginLeft: '0.5rem' }}>{users.length}</span>
      </h3>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {users.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            No {title.toLowerCase()} currently registered in the system.
          </div>
        ) : (
          <table>
            <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${u.role === 'HEAD' ? 'badge-warning' : 'badge-success'}`}>{u.role}</span></td>
                  <td>{u.department || 'N/A'}</td>
                  <td>
                    {userToDelete && userToDelete._id === u._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Sure?</span>
                        <button onClick={async () => { await onConfirmDelete(u._id); setUserToDelete(null); }} className="btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setUserToDelete(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => onEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '1rem' }}><Edit size={18}/></button>
                        <button onClick={() => setUserToDelete(u)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={18}/></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function UsersPage() {
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

  const confirmDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError('Failed to delete user');
    }
  };

  const headUsers = users.filter(u => u.role === 'HEAD');
  const assistantUsers = users.filter(u => u.role === 'ASSISTANT');

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
        <div className="card" style={{ marginBottom: '2.5rem' }}>
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
                  <option value="Macro">Chemical</option>
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

      <UserSection 
        title="Department Heads" 
        users={headUsers} 
        onEdit={handleEdit} 
        onConfirmDelete={confirmDelete} 
        userToDelete={userToDelete} 
        setUserToDelete={setUserToDelete} 
      />

      <UserSection 
        title="Lab Assistants" 
        users={assistantUsers} 
        onEdit={handleEdit} 
        onConfirmDelete={confirmDelete} 
        userToDelete={userToDelete} 
        setUserToDelete={setUserToDelete} 
      />
    </div>
  );
}

const BLANK_FORM = {
  // Customer
  customer_name: '', customer_address: '', contact_person: '',
  mobile_number: '', email: '', customer_reference_no: '',
  // Sample
  sample_name: '', sample_id: '', sample_quantity: '', sample_quantity_unit: 'ml',
  sample_quantity_custom_unit: '', sample_description: '', condition_on_receipt: '',
  packing_details: '', marking_seal: '', sample_source: '',
  received_date: '', received_mode: '', sampling_details: '',
  test_parameters: [], test_param_input: '',
  // Compliance
  statement_of_conformity: '', decision_rule: '', accreditation_scope: '',
  disclaimer_notes: '', special_handling_instructions: '',
  // Distribution
  microRequired: false, microVolume: '', microAssignedTo: '',
  macroRequired: false, macroVolume: '', macroAssignedTo: ''
};

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ...BLANK_FORM });
  const [sections, setSections] = useState({ customer: true, sample: false, compliance: false, parameters: false });

  // Parameter search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedParams, setSelectedParams] = useState([]);
  const [showAddParam, setShowAddParam] = useState(false);
  const [newParam, setNewParam] = useState({ name: '', type: 'Micro', unit: 'mg/L' });

  const toggleSection = (s) => setSections(prev => ({ ...prev, [s]: !prev[s] }));
  const setField = (key, val) => setFormData(prev => ({ ...prev, [key]: val }));

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs');
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchJobs(); }, []);

  // Parameter search debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          const res = await axios.get(`http://localhost:5000/api/parameters?search=${searchTerm}`);
          setSearchResults(res.data);
        } catch (err) { console.error(err); }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddExistingParam = (param) => {
    if (!selectedParams.find(p => p._id === param._id)) {
      setSelectedParams([...selectedParams, param]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleAddNewParam = async (e) => {
    e.preventDefault();
    if (!newParam.name || !newParam.unit) return alert('Name and Unit are required');
    try {
      const res = await axios.post('http://localhost:5000/api/parameters', newParam);
      setSelectedParams([...selectedParams, res.data]);
      setShowAddParam(false);
      setNewParam({ name: '', type: 'Micro', unit: 'mg/L' });
      setSearchTerm('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding parameter');
    }
  };

  const removeParam = (index) => {
    setSelectedParams(selectedParams.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedParams.length === 0) return alert('Select at least one parameter');
    try {
      const parameters = selectedParams.map(p => ({
        parameterId: p._id,
        name: p.name,
        type: p.type,
        unit: p.unit
      }));

      const unit = formData.sample_quantity_unit === 'custom' ? formData.sample_quantity_custom_unit : formData.sample_quantity_unit;

      await axios.post('http://localhost:5000/api/jobs', {
        customer: {
          customer_name: formData.customer_name,
          customer_address: formData.customer_address,
          contact_person: formData.contact_person,
          mobile_number: formData.mobile_number,
          email: formData.email,
          customer_reference_no: formData.customer_reference_no
        },
        sample: {
          sample_name: formData.sample_name,
          sample_id: formData.sample_id,
          sample_quantity: `${formData.sample_quantity} ${unit}`.trim(),
          sample_description: formData.sample_description,
          condition_on_receipt: formData.condition_on_receipt,
          packing_details: formData.packing_details,
          marking_seal: formData.marking_seal,
          sample_source: formData.sample_source,
          received_date: formData.received_date,
          received_mode: formData.received_mode,
          sampling_details: formData.sampling_details,
          test_parameters: []
        },
        compliance: {
          statement_of_conformity: formData.statement_of_conformity,
          decision_rule: formData.decision_rule,
          accreditation_scope: formData.accreditation_scope,
          disclaimer_notes: formData.disclaimer_notes,
          special_handling_instructions: formData.special_handling_instructions
        },
        parameters
      });
      setShowForm(false);
      setFormData({ ...BLANK_FORM });
      setSelectedParams([]);
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
        <div className="card" style={{ marginBottom: '2rem', overflow: 'visible' }}>
          <h3 style={{ marginBottom: '1.5rem' }}>Log New Sample & Distribute</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* ── CUSTOMER INFORMATION ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div onClick={() => toggleSection('customer')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: sections.customer ? 'var(--color-surface-hover)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sections.customer ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  <span style={{ fontWeight: 600 }}>Customer Information</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Required</span>
              </div>
              {sections.customer && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Customer Name <span style={{color:'var(--color-danger)'}}>*</span></label><input value={formData.customer_name} onChange={e => setField('customer_name', e.target.value)} required /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Mobile Number <span style={{color:'var(--color-danger)'}}>*</span></label><input value={formData.mobile_number} onChange={e => setField('mobile_number', e.target.value)} required /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Customer Address <span style={{color:'var(--color-danger)'}}>*</span></label><textarea rows={2} value={formData.customer_address} onChange={e => setField('customer_address', e.target.value)} required style={{ width: '100%', resize: 'vertical' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Contact Person <span style={{color:'var(--color-text-muted)', fontSize:'0.8rem'}}>(optional)</span></label><input value={formData.contact_person} onChange={e => setField('contact_person', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Email <span style={{color:'var(--color-text-muted)', fontSize:'0.8rem'}}>(optional)</span></label><input type="email" value={formData.email} onChange={e => setField('email', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Customer Reference No. <span style={{color:'var(--color-text-muted)', fontSize:'0.8rem'}}>(optional)</span></label><input value={formData.customer_reference_no} onChange={e => setField('customer_reference_no', e.target.value)} /></div>
                </div>
              )}
            </div>

            {/* ── SAMPLE INFORMATION ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div onClick={() => toggleSection('sample')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: sections.sample ? 'var(--color-surface-hover)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sections.sample ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  <span style={{ fontWeight: 600 }}>Sample Information</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>Required</span>
              </div>
              {sections.sample && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sample Name <span style={{color:'var(--color-danger)'}}>*</span></label><input value={formData.sample_name} onChange={e => setField('sample_name', e.target.value)} required /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sample ID <span style={{color:'var(--color-danger)'}}>*</span></label><input value={formData.sample_id} onChange={e => setField('sample_id', e.target.value)} required /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sample Quantity <span style={{color:'var(--color-danger)'}}>*</span></label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="number" step="0.01" value={formData.sample_quantity} onChange={e => setField('sample_quantity', e.target.value)} required style={{ flex: 1 }} />
                      <select value={formData.sample_quantity_unit} onChange={e => setField('sample_quantity_unit', e.target.value)} style={{ width: '90px' }}>
                        <option value="ml">ml</option><option value="L">L</option><option value="g">g</option>
                        <option value="kg">kg</option><option value="mg">mg</option><option value="custom">Custom...</option>
                      </select>
                    </div>
                    {formData.sample_quantity_unit === 'custom' && (
                      <input placeholder="Enter unit" value={formData.sample_quantity_custom_unit} onChange={e => setField('sample_quantity_custom_unit', e.target.value)} required style={{ marginTop: '0.5rem' }} />
                    )}
                  </div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Received Date <span style={{color:'var(--color-danger)'}}>*</span></label><input type="date" value={formData.received_date} onChange={e => setField('received_date', e.target.value)} required /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sample Description <span style={{color:'var(--color-danger)'}}>*</span></label><textarea rows={2} value={formData.sample_description} onChange={e => setField('sample_description', e.target.value)} required style={{ width: '100%', resize: 'vertical' }} /></div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Condition on Receipt <span style={{color:'var(--color-danger)'}}>*</span></label><input value={formData.condition_on_receipt} onChange={e => setField('condition_on_receipt', e.target.value)} required /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Packing Details</label><input value={formData.packing_details} onChange={e => setField('packing_details', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Marking / Seal</label><input value={formData.marking_seal} onChange={e => setField('marking_seal', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sample Source</label><input value={formData.sample_source} onChange={e => setField('sample_source', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Received Mode</label>
                    <select value={formData.received_mode} onChange={e => setField('received_mode', e.target.value)}>
                      <option value="">Select...</option>
                      <option>Courier</option><option>Hand Delivery</option><option>Post</option><option>Other</option>
                    </select>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Sampling Details</label><textarea rows={2} value={formData.sampling_details} onChange={e => setField('sampling_details', e.target.value)} style={{ width: '100%', resize: 'vertical' }} /></div>
                </div>
              )}
            </div>

            {/* ── COMPLIANCE & LEGAL ── */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div onClick={() => toggleSection('compliance')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: sections.compliance ? 'var(--color-surface-hover)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sections.compliance ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  <span style={{ fontWeight: 600 }}>Compliance & Legal Information</span>
                </div>
                <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>Important</span>
              </div>
              {sections.compliance && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Statement of Conformity</label><textarea rows={2} value={formData.statement_of_conformity} onChange={e => setField('statement_of_conformity', e.target.value)} style={{ width: '100%', resize: 'vertical' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Accreditation Scope</label><input value={formData.accreditation_scope} onChange={e => setField('accreditation_scope', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Disclaimer Notes</label><textarea rows={2} value={formData.disclaimer_notes} onChange={e => setField('disclaimer_notes', e.target.value)} style={{ width: '100%', resize: 'vertical' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Decision Rule <span style={{color:'var(--color-text-muted)', fontSize:'0.8rem'}}>(optional)</span></label><input value={formData.decision_rule} onChange={e => setField('decision_rule', e.target.value)} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.9rem' }}>Special Handling Instructions <span style={{color:'var(--color-text-muted)', fontSize:'0.8rem'}}>(optional)</span></label><textarea rows={2} value={formData.special_handling_instructions} onChange={e => setField('special_handling_instructions', e.target.value)} style={{ width: '100%', resize: 'vertical' }} /></div>
                </div>
              )}
            </div>

            {/* ── PARAMETERS (our system) ── */}
            <div className="card" style={{ padding: 0, overflow: 'visible' }}>
              <div onClick={() => toggleSection('parameters')} style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', backgroundColor: sections.parameters ? 'var(--color-surface-hover)' : 'transparent' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {sections.parameters ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
                  <span style={{ fontWeight: 600 }}>Test Parameters</span>
                </div>
                <span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{selectedParams.length} selected</span>
              </div>
              {sections.parameters && (
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'visible' }}>
                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Search & Add Parameters</label>
                    <input type="text" placeholder="Type to search parameters..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', maxWidth: '420px' }} />
                    {searchTerm && !showAddParam && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', maxWidth: '420px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', zIndex: 20, boxShadow: 'var(--shadow-md)', maxHeight: '200px', overflowY: 'auto' }}>
                        {searchResults.map(p => (
                          <div key={p._id} onClick={() => handleAddExistingParam(p)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{p.name}</span>
                            <span style={{ fontSize: '0.8rem', color: p.type === 'Micro' ? 'var(--color-success)' : 'var(--color-info)' }}>{p.type} · {p.unit}</span>
                          </div>
                        ))}
                        {searchResults.length === 0 && (
                          <div style={{ padding: '0.75rem 1rem', color: 'var(--color-text-muted)' }}>No parameters found.</div>
                        )}
                        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-hover)', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 500 }} onClick={() => { setShowAddParam(true); setNewParam({ ...newParam, name: searchTerm }); }}>
                          + Add New Parameter "{searchTerm}"
                        </div>
                      </div>
                    )}
                  </div>

                  {/* New param form */}
                  {showAddParam && (
                    <div style={{ padding: '1rem', border: '1px dashed var(--color-primary)', borderRadius: 'var(--radius-md)', maxWidth: '500px' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>Add New Parameter to Library</h4>
                      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                        <input style={{ flex: 2 }} type="text" value={newParam.name} onChange={e => setNewParam({ ...newParam, name: e.target.value })} placeholder="Parameter Name" required />
                        <select style={{ flex: 1 }} value={newParam.type} onChange={e => setNewParam({ ...newParam, type: e.target.value })}>
                          <option value="Micro">Micro</option>
                          <option value="Chemical">Chemical</option>
                        </select>
                        <input style={{ flex: 1 }} type="text" value={newParam.unit} onChange={e => setNewParam({ ...newParam, unit: e.target.value })} placeholder="Unit" required />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button type="button" onClick={handleAddNewParam} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}>Save & Select</button>
                        <button type="button" onClick={() => setShowAddParam(false)} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* Selected parameters pills */}
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Selected Parameters</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {selectedParams.length === 0 ? <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>None selected</span> : null}
                      {selectedParams.map((p, index) => (
                        <div key={index} style={{
                          display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 500,
                          backgroundColor: p.type === 'Micro' ? '#dcfce7' : '#e0f2fe',
                          color: p.type === 'Micro' ? '#166534' : '#075985',
                          border: `1px solid ${p.type === 'Micro' ? '#bbf7d0' : '#bae6fd'}`
                        }}>
                          {p.name} ({p.unit})
                          <button type="button" onClick={() => removeParam(index)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                    {selectedParams.length > 0 && (
                      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {selectedParams.filter(p => p.type === 'Micro').length} Micro · {selectedParams.filter(p => p.type === 'Chemical').length} Chemical — departments auto-assigned from parameter types
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={selectedParams.length === 0}>
              Create Job & Dispatch to Departments
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

  const fetchJobs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/jobs');
      setJobs(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim()) {
        try {
          const res = await axios.get(`http://localhost:5000/api/parameters?search=${searchTerm}`);
          setSearchResults(res.data);
        } catch (err) { console.error(err); }
      } else {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleAddExistingParam = (param) => {
    if (!selectedParams.find(p => p._id === param._id)) {
      setSelectedParams([...selectedParams, param]);
    }
    setSearchTerm('');
    setSearchResults([]);
  };

  const handleAddNewParam = async (e) => {
    e.preventDefault();
    if (!newParam.name || !newParam.unit) return alert('Name and Unit are required');
    try {
      const res = await axios.post('http://localhost:5000/api/parameters', newParam);
      setSelectedParams([...selectedParams, res.data]);
      setShowAddParam(false);
      setNewParam({ name: '', type: 'Micro', unit: 'mg/L' });
      setSearchTerm('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding parameter');
    }
  };

  const removeParam = (index) => {
    setSelectedParams(selectedParams.filter((_, i) => i !== index));
  };




function Audit() {
  const [instances, setInstances] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reopenTarget, setReopenTarget] = useState(null);
  const [reopenNote, setReopenNote] = useState('');
  const [reopenHeadId, setReopenHeadId] = useState('');
  const [heads, setHeads] = useState([]);
  const [success, setSuccess] = useState('');
  const [historyTarget, setHistoryTarget] = useState(null);
  const [versionHistory, setVersionHistory] = useState([]);

  const fetchData = async () => {
    try {
      const [resInst, resJobs, resUsers] = await Promise.all([
        axios.get('http://localhost:5000/api/tests/instances'),
        axios.get('http://localhost:5000/api/jobs'),
        axios.get('http://localhost:5000/api/users')
      ]);

      const allInstances = resInst.data;
      const allJobs = resJobs.data;

      // Helper: check if a pipeline has ever been completed (current COMPLETED or was REOPENED)
      const isJobAuditReady = (job) => {
        const jobInsts = allInstances.filter(i => i.jobId === job._id);

        const microOk = !job.distribution?.micro?.required ||
          job.distribution.micro.status === 'COMPLETED' ||
          jobInsts.some(i => (i.status === 'COMPLETED' || i.status === 'REOPENED') && i.createdBy?.department?.toUpperCase() === 'MICRO');

        const macroOk = !job.distribution?.macro?.required ||
          job.distribution.macro.status === 'COMPLETED' ||
          jobInsts.some(i => (i.status === 'COMPLETED' || i.status === 'REOPENED') && i.createdBy?.department?.toUpperCase() === 'MACRO');

        return microOk && macroOk;
      };

      // Build a set of audit-ready job IDs
      const auditReadyJobIds = new Set(
        allJobs.filter(j => isJobAuditReady(j)).map(j => j._id)
      );

      // Show COMPLETED/REOPENED instances from audit-ready jobs
      setInstances(
        allInstances.filter(i =>
          (i.status === 'COMPLETED' || i.status === 'REOPENED') &&
          auditReadyJobIds.has(i.jobId)
        )
      );
      setJobs(allJobs);
      setHeads(resUsers.data.filter(u => u.role === 'HEAD'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleReopen = async () => {
    if (!reopenNote.trim()) return;
    try {
      await axios.post(`http://localhost:5000/api/tests/instances/${reopenTarget._id}/reopen`, {
        reopenNote,
        assignedHeadId: reopenHeadId || undefined
      });
      setSuccess('Job reopened successfully. The HEAD will re-dispatch it.');
      setReopenTarget(null);
      setReopenNote('');
      setReopenHeadId('');
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async (instanceId) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/tests/instances/${instanceId}/history`);
      setVersionHistory(res.data);
      setHistoryTarget(instanceId);
    } catch (err) {
      console.error(err);
    }
  };

  if (selectedReport) {
    return <ReportViewer report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={28} style={{ color: 'var(--color-primary)' }} /> Global Job Logs
        </h1>
        <JobLogTable jobs={jobs} title="Lifecycle Tracker" />
      </div>

      {success && <div style={{ color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {/* Reopen Modal */}
      {reopenTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '2rem' }}>
            <h2 style={{ marginBottom: '0.5rem' }}>Reopen Job</h2>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Test: <strong>{reopenTarget.testCode}</strong> — {reopenTarget.blueprintId?.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Reason for Reopening *</label>
                <textarea
                  value={reopenNote}
                  onChange={e => setReopenNote(e.target.value)}
                  placeholder="e.g. Client requested additional pH testing..."
                  style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Reassign to HEAD (optional)</label>
                <select value={reopenHeadId} onChange={e => setReopenHeadId(e.target.value)} style={{ width: '100%' }}>
                  <option value="">Keep current HEAD</option>
                  {heads.filter(h => h.department?.toUpperCase() === reopenTarget.createdBy?.department?.toUpperCase()).map(h => <option key={h._id} value={h._id}>{h.name} ({h.department === 'Macro' || h.department === 'macro' ? 'Chemical' : h.department})</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <button onClick={handleReopen} className="btn" style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--color-warning)', color: 'white', border: 'none' }} disabled={!reopenNote.trim()}>
                  <RotateCcw size={16} style={{ marginRight: '0.5rem' }} /> Reopen Job
                </button>
                <button onClick={() => { setReopenTarget(null); setReopenNote(''); setReopenHeadId(''); }} className="btn" style={{ flex: 1, justifyContent: 'center', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Panel */}
      {historyTarget && versionHistory.length > 0 && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Version History</h3>
            <button onClick={() => { setHistoryTarget(null); setVersionHistory([]); }} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}>Close</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {versionHistory.map(v => (
              <div key={v._id} style={{ padding: '1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>v{v.version}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{v.testCode}</span>
                    <span className={`badge ${v.status === 'COMPLETED' ? 'badge-success' : v.status === 'REOPENED' ? 'badge-warning' : ''}`} style={{ fontSize: '0.7rem' }}>{v.status}</span>
                  </div>
                  {v.status === 'COMPLETED' && (
                    <button onClick={() => setSelectedReport(v)} className="btn btn-primary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}>View PDF</button>
                  )}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Blueprint: {v.blueprintId?.name} · Analyst: {v.assignedTo?.name}
                  {v.completedAt && ` · Completed: ${new Date(v.completedAt).toLocaleDateString()}`}
                </div>
                {v.reopenNote && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                    Reopen reason: "{v.reopenNote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          PDF Reports & Completed Audit
        </h2>
        <div className="card glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <table>
            <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
              <tr>
                <th>Test Code</th>
                <th>Client Name</th>
                <th>Parameters</th>
                <th>Department</th>
                <th>Status</th>
                <th>Date Completed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {instances.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No completed tests yet.</td></tr>
              ) : (
                instances.map(inst => (
                  <tr key={inst._id} style={{ opacity: inst.status === 'REOPENED' ? 0.6 : 1 }}>
                    <td style={{ fontFamily: 'monospace' }}>{inst.testCode}</td>
                    <td style={{ fontWeight: 500 }}>{inst.clientName}</td>
                    <td>{inst.results?.length || 0} params</td>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>
                      {inst.createdBy?.department?.toUpperCase() === 'MACRO' ? 'CHEMICAL' : inst.createdBy?.department?.toUpperCase() || '—'}
                    </td>
                    <td>
                      {inst.status === 'COMPLETED' ? (
                        <span className="badge badge-success">Completed</span>
                      ) : (
                        <span className="badge badge-warning">Reopened</span>
                      )}
                    </td>
                    <td>{inst.completedAt ? new Date(inst.completedAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {inst.status === 'COMPLETED' && (
                          <>
                            <button onClick={() => setSelectedReport(inst)} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>View PDF</button>
                            <button onClick={() => setReopenTarget(inst)} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', backgroundColor: 'var(--color-warning)', color: 'white', border: 'none' }}>Reopen</button>
                          </>
                        )}
                        {(inst.version > 1 || inst.status === 'REOPENED') && (
                          <button onClick={() => fetchHistory(inst._id)} className="btn" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}>History</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LabReviewQueue() {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [reassignNote, setReassignNote] = useState('');
  const [showReassignForm, setShowReassignForm] = useState(null);
  const [success, setSuccess] = useState('');

  const fetchReviewItems = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tests/instances');
      setInstances(res.data.filter(i => i.status === 'PENDING_LAB_HEAD_REVIEW'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchReviewItems(); }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/tests/instances/${id}/lab-review`, { action: 'APPROVE' });
      setSuccess('Approved! Report has been generated and job marked as completed.');
      fetchReviewItems();
      setSelectedInstance(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassign = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/tests/instances/${id}/lab-review`, {
        action: 'REASSIGN',
        note: reassignNote
      });
      setSuccess('Sent back to analyst for correction.');
      setReassignNote('');
      setShowReassignForm(null);
      fetchReviewItems();
      setSelectedInstance(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ClipboardCheck size={28} style={{ color: 'var(--color-primary)' }} /> Final Review Queue
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>These submissions have been approved by the Department Head. Review and approve to generate the final report.</p>

      {success && <div style={{ marginBottom: '1.5rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {instances.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No submissions awaiting your final review.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {instances.map(inst => (
            <div key={inst._id} className="card" style={{ borderLeft: '4px solid var(--color-primary)', padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: selectedInstance === inst._id ? 'var(--color-surface-hover)' : 'transparent' }}
                onClick={() => setSelectedInstance(selectedInstance === inst._id ? null : inst._id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Test {inst.testCode}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Analyst: {inst.assignedTo?.name} · Client: {inst.clientName}
                  </div>
                </div>
                <span className="badge badge-primary">HEAD Approved — Awaiting Final Review</span>
              </div>

              {/* Expanded detail */}
              {selectedInstance === inst._id && (
                <div style={{ padding: '1.5rem' }}>
                  {/* Review history */}
                  {inst.reviewHistory && inst.reviewHistory.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(64, 158, 255, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-primary)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-primary)' }}>Review History</div>
                      {inst.reviewHistory.map((rh, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                          <strong>{rh.role}</strong> — {rh.action} {rh.note && `("${rh.note}")`} — {new Date(rh.date).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Results table */}
                  <h4 style={{ marginBottom: '0.75rem' }}>Submitted Results</h4>
                  <table style={{ marginBottom: '1.5rem' }}>
                    <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
                      <tr>
                        <th>Parameter</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inst.results.map(r => (
                        <tr key={r.parameterId}>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{r.value || '—'}</td>
                          <td>{r.unit}</td>
                          <td style={{ color: 'var(--color-text-muted)' }}>{r.referenceRange}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Actions */}
                  {showReassignForm === inst._id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontWeight: 500, marginBottom: '0.4rem', fontSize: '0.9rem' }}>Reason for Reassignment</label>
                        <textarea
                          value={reassignNote}
                          onChange={e => setReassignNote(e.target.value)}
                          placeholder="Describe what needs to be corrected..."
                          style={{ width: '100%', minHeight: '80px', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', resize: 'vertical', fontFamily: 'inherit' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button onClick={() => handleReassign(inst._id)} className="btn" style={{ backgroundColor: 'var(--color-danger)', color: 'white', border: 'none' }}>
                          <RotateCcw size={16} style={{ marginRight: '0.5rem' }} /> Confirm Reassignment
                        </button>
                        <button onClick={() => { setShowReassignForm(null); setReassignNote(''); }} className="btn" style={{ border: '1px solid var(--color-border)', backgroundColor: 'transparent' }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(inst._id); }} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                        <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Approve & Generate Report
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setShowReassignForm(inst._id); }} className="btn" style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--color-warning)', color: 'white', border: 'none' }}>
                        <RotateCcw size={16} style={{ marginRight: '0.5rem' }} /> Reassign to Analyst
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LabHeadDashboard() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/review" element={<LabReviewQueue />} />
      <Route path="/jobs" element={<Jobs />} />
      <Route path="/users" element={<UsersPage />} />
      <Route path="/audit" element={<Audit />} />
    </Routes>
  );
}
