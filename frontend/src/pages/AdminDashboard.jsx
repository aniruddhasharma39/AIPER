import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, FileText, Search, ChevronDown, ChevronRight, Activity, Users as UsersIcon, Settings, Clock, CheckCircle } from 'lucide-react';
import ReportViewer from '../components/ReportViewer';
import JobLogTable from '../components/JobLogTable';
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
          <h1 style={{ marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Admin Command Center</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>Global System Intelligence</p>
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
          <Link to="/admin/audit" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>View Detailed Logs &rarr;</Link>
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

function StaffTable({ users, emptyMessage }) {
  if (users.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <table style={{ margin: 0 }}>
      <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
        <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th></tr>
      </thead>
      <tbody>
        {users.map(u => (
          <tr key={u._id}>
            <td style={{ fontWeight: 500 }}>{u.name}</td>
            <td>{u.email}</td>
            <td>
              <span className={`badge ${u.role === 'ADMIN' || u.role === 'LAB_HEAD' ? 'badge-primary' : u.role === 'HEAD' ? 'badge-warning' : 'badge-success'}`}>
                {u.role}
              </span>
            </td>
            <td>{u.department || 'All'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CollapsibleSection({ title, count, isOpen, onToggle, children }) {
  return (
    <div className="card" style={{ padding: 0, marginBottom: '1rem', overflow: 'hidden' }}>
      <div 
        onClick={onToggle}
        style={{ 
          padding: '1.25rem 1.5rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          cursor: 'pointer',
          backgroundColor: isOpen ? 'var(--color-surface-hover)' : 'white',
          transition: 'background-color 0.2s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          <h3 style={{ margin: 0 }}>{title}</h3>
          <span className="badge badge-secondary" style={{ marginLeft: '0.5rem' }}>{count}</span>
        </div>
      </div>
      {isOpen && (
        <div style={{ borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  const [expanded, setExpanded] = useState({
    management: true,
    heads: true,
    assistants: false
  });
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
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

  useEffect(() => { fetchUsers(); }, []);

  const toggleSection = (section) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const managementUsers = users.filter(u => u.role === 'ADMIN' || u.role === 'LAB_HEAD');
  const headUsers = users.filter(u => u.role === 'HEAD');
  const assistantUsers = users.filter(u => u.role === 'ASSISTANT');

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Staff Directory</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close Form' : '+ Create Lab Head'}
        </button>
      </div>

      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Create New Lab Head</h3>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <CollapsibleSection 
          title="Management" 
          count={managementUsers.length}
          isOpen={expanded.management}
          onToggle={() => toggleSection('management')}
        >
          <StaffTable users={managementUsers} emptyMessage="No management staff found" />
        </CollapsibleSection>

        <CollapsibleSection 
          title="Department Heads" 
          count={headUsers.length}
          isOpen={expanded.heads}
          onToggle={() => toggleSection('heads')}
        >
          <StaffTable users={headUsers} emptyMessage="No department heads found" />
        </CollapsibleSection>

        <CollapsibleSection 
          title="Lab Assistants" 
          count={assistantUsers.length}
          isOpen={expanded.assistants}
          onToggle={() => toggleSection('assistants')}
        >
          <StaffTable users={assistantUsers} emptyMessage="No lab assistants found" />
        </CollapsibleSection>
      </div>
    </div>
  );
}

function Audit() {
  const [instances, setInstances] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchData = async () => {
    try {
      const resInst = await axios.get('http://localhost:5000/api/tests/instances');
      setInstances(resInst.data.filter(i => i.status === 'COMPLETED'));
      const resJobs = await axios.get('http://localhost:5000/api/jobs');
      setJobs(resJobs.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (selectedReport) {
    return <ReportViewer report={selectedReport} onBack={() => setSelectedReport(null)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={28} style={{ color: 'var(--color-primary)' }} /> Super Admin Tracker
        </h1>
        <JobLogTable jobs={jobs} title="Global Job Lifecycle Logs" />
      </div>

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
                <th>Blueprint</th>
                <th>Analyst</th>
                <th>Date Completed</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {instances.length === 0 ? (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No completed tests yet.</td></tr>
              ) : (
                instances.map(inst => (
                  <tr key={inst._id}>
                    <td style={{ fontFamily: 'monospace' }}>{inst.testCode}</td>
                    <td style={{ fontWeight: 500 }}>{inst.clientName}</td>
                    <td>{inst.blueprintId?.name}</td>
                    <td>{inst.assignedTo?.name}</td>
                    <td>{new Date(inst.completedAt).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => setSelectedReport(inst)} className="btn btn-primary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}>View PDF</button>
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

export default function AdminDashboard() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/users" element={<Users />} />
      <Route path="/audit" element={<Audit />} />
    </Routes>
  );
}
