import React, { useState, useEffect, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Edit, Plus, Check, FileText, Activity, Users, Settings, Clock, CheckCircle, ClipboardCheck, RotateCcw, ChevronDown, ChevronRight } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

import JobLogTable from '../components/JobLogTable';
import { fetchWithCache, invalidateCache, CACHE_KEYS } from '../utils/cache';
import Spinner from '../components/Spinner';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    ongoingJobs: 0,
    completedJobs: 0,
    activeAnalysts: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [statsLoading, setStatsLoading] = useState(
    () => !sessionStorage.getItem(CACHE_KEYS.JOBS) || !sessionStorage.getItem(CACHE_KEYS.INSTANCES)
  );

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [jobsRes, instancesRes, usersRes] = await Promise.all([
          axios.get('http://localhost:5000/api/jobs'),
          axios.get('http://localhost:5000/api/tests/instances'),
          axios.get('http://localhost:5000/api/users')
        ]);

        const dept = user?.department?.toLowerCase() || '';

        const ongoingJobs = jobsRes.data.filter(j => {
          const microDone = !j.distribution?.micro?.required || j.distribution.micro.status === 'COMPLETED';
          const macroDone = !j.distribution?.macro?.required || j.distribution.macro.status === 'COMPLETED';
          return !(microDone && macroDone);
        }).length;
        const completedJobs = jobsRes.data.filter(j => {
          const microDone = !j.distribution?.micro?.required || j.distribution.micro.status === 'COMPLETED';
          const macroDone = !j.distribution?.macro?.required || j.distribution.macro.status === 'COMPLETED';
          return microDone && macroDone;
        }).length;
        const activeAnalysts = new Set(
          instancesRes.data.filter(i => i.status === 'PENDING' && i.assignedTo).map(i => i.assignedTo._id || i.assignedTo)
        ).size;

        setStats({ ongoingJobs, completedJobs, activeAnalysts });

        // Get latest 5 activities in this department
        const sortedInstances = instancesRes.data
          .filter(i => i.createdBy?.department === user.department || i.assignedTo?.department === user.department)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
          .slice(0, 5);
        
        setRecentActivity(sortedInstances);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setStatsLoading(false);
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
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ marginBottom: '0.5rem', letterSpacing: '-0.025em' }}>Head Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
        <StatCard 
          icon={Activity} 
          title="Ongoing Jobs" 
          value={stats.ongoingJobs} 
          color="var(--color-primary)" 
          subtitle="Currently in progress" 
        />
        <StatCard 
          icon={CheckCircle} 
          title="Completed Jobs" 
          value={stats.completedJobs} 
          color="var(--color-success)" 
          subtitle="Fully completed" 
        />
        <StatCard 
          icon={Users} 
          title="Active Analysts" 
          value={stats.activeAnalysts} 
          color="#8B5CF6" 
          subtitle="Currently working on jobs" 
        />
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} /> Recent Pipeline Activity
          </h3>
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
              {statsLoading ? (
                <tr><td colSpan="4"><Spinner message="Fetching activity..." /></td></tr>
              ) : recentActivity.length === 0 ? (
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

function Assistants() {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const { user } = useContext(AuthContext); // to get department/branch
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [usersLoading, setUsersLoading] = useState(() => !sessionStorage.getItem(CACHE_KEYS.USERS));

  const fetchUsers = async () => {
    try {
      await fetchWithCache(
        'http://localhost:5000/api/users',
        CACHE_KEYS.USERS,
        setUsers
      );
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
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
        setSuccess('Assistant updated successfully.');
      } else {
        const res = await axios.post('http://localhost:5000/api/users', { ...formData, role: 'ASSISTANT', department: user.department, branch: user.branch });
        setSuccess(`Assistant created successfully. Password: ${res.data.temporaryPassword}`);
      }
      setFormData({ name: '', email: '', phone: '', password: '' });
      setEditUserId(null); setShowForm(false);
      invalidateCache(CACHE_KEYS.USERS);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (u) => {
    setFormData({ name: u.name, email: u.email, phone: u.phone, password: '' });
    setEditUserId(u._id); setShowForm(true); setError(''); setSuccess('');
  };

  const confirmDelete = (u) => setUserToDelete(u);

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await axios.delete(`http://localhost:5000/api/users/${userToDelete._id}`);
      setUserToDelete(null);
      invalidateCache(CACHE_KEYS.USERS);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete');
      setUserToDelete(null);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Assistants Management</h1>
        <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); if (showForm) setEditUserId(null); }}>
          {showForm ? 'Close Form' : '+ Create Assistant'}
        </button>
      </div>

      {error && <div style={{ marginBottom: '1rem', color: 'var(--color-danger)', backgroundColor: 'var(--color-danger-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>{editUserId ? 'Edit Assistant' : 'Create Assistant'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Full Name</label>
                <input type="text" value={formData.name} onChange={handleNameChange} required placeholder="Jane Doe" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required placeholder="jane@foodlab.com" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Phone Number</label>
                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              {!editUserId && (
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Password (Auto-generated)</label>
                  <input type="text" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                </div>
              )}
            </div>
            <div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>{editUserId ? 'Update Assistant' : 'Submit & Create'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table>
          <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
          </thead>
          <tbody>
            {usersLoading && users.length === 0 ? (
              <tr><td colSpan="4"><Spinner message="Loading assistants..." /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No assistants found</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id}>
                  <td style={{ fontWeight: 500 }}>{u.name}</td><td>{u.email}</td>
                  <td><span className="badge badge-success">{u.role}</span></td>
                  <td>
                    {userToDelete && userToDelete._id === u._id ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }}>Sure?</span>
                        <button onClick={handleDelete} className="btn-danger" style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: 'none', cursor: 'pointer' }}>Yes</button>
                        <button onClick={() => setUserToDelete(null)} style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem', borderRadius: '4px', border: '1px solid var(--color-border)', cursor: 'pointer' }}>No</button>
                      </div>
                    ) : (
                      <>
                        <button onClick={() => handleEdit(u)} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', marginRight: '1rem' }}><Edit size={18} /></button>
                        <button onClick={() => confirmDelete(u)} style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><Trash2 size={18} /></button>
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

// Blueprints section removed per requirement: Lab Head adds parameters directly.

function Dispatcher() {
  const [assistants, setAssistants] = useState([]);
  const [jobs, setJobs] = useState([]);
  const { user } = useContext(AuthContext);

  const [expandedJobId, setExpandedJobId] = useState(null);
  const [deadlines, setDeadlines] = useState({}); // jobId -> deadline
  const [assignments, setAssignments] = useState({}); // `${jobId}-${paramId}` -> assistantId
  const [success, setSuccess] = useState('');
  const [dispatchLoading, setDispatchLoading] = useState(true);
  const [submittingJobId, setSubmittingJobId] = useState(null);

  useEffect(() => {
    const dept = user?.department ? user.department.toLowerCase() : '';
    
    fetchWithCache('http://localhost:5000/api/users', CACHE_KEYS.USERS, 
      (data) => setAssistants(data.filter(u => u.role === 'ASSISTANT' && u.department === user.department))
    ).catch(console.error);

    fetchWithCache('http://localhost:5000/api/jobs', CACHE_KEYS.JOBS,
      (data) => setJobs(data.filter(j => j.distribution[dept === 'chemical' ? 'macro' : dept]?.status === 'PENDING'))
    ).catch(console.error).finally(() => setDispatchLoading(false));
  }, [user]);

  const getDeptParams = (job) => {
    return job?.parameters?.filter(p => {
      const d = user?.department ? user.department.toLowerCase() : '';
      const pt = p.type ? p.type.toLowerCase() : '';
      if ((d === 'macro' || d === 'chemical') && pt === 'chemical') return true;
      if (d === 'micro' && pt === 'micro') return true;
      return false;
    }) || [];
  };

  const handleAssign = (jobId, paramId, assistantId) => {
    setAssignments(prev => ({ ...prev, [`${jobId}-${paramId}`]: assistantId }));
  };

  const handleAssignAll = (jobId, assistantId, deptParams) => {
    if (!assistantId) return;
    const newAssignments = { ...assignments };
    deptParams.forEach(p => {
      newAssignments[`${jobId}-${p.parameterId._id}`] = assistantId;
    });
    setAssignments(newAssignments);
  };

  const handleSubmit = async (job) => {
    const deptParams = getDeptParams(job);
    const deadline = deadlines[job._id];

    // Validate all params assigned
    const allAssigned = deptParams.every(p => assignments[`${job._id}-${p.parameterId._id}`]);
    if (!allAssigned) return alert('Please assign all parameters to analysts');
    if (!deadline) return alert('Please set a submission deadline');

    setSubmittingJobId(job._id);
    try {
      const assignmentList = deptParams.map(p => ({
        parameterId: p.parameterId._id,
        name: p.name,
        type: p.type,
        unit: p.unit,
        assignedTo: assignments[`${job._id}-${p.parameterId._id}`]
      }));

      await axios.post('http://localhost:5000/api/tests/instances', {
        jobId: job._id,
        deadline,
        assignments: assignmentList
      });
      
      setSuccess(`Job ${job.jobCode} dispatched successfully!`);
      setExpandedJobId(null);
      setTimeout(() => setSuccess(''), 4000);

      // Refresh jobs list
      invalidateCache(CACHE_KEYS.JOBS);
      const dept = user?.department ? user.department.toLowerCase() : '';
      const res = await axios.get('http://localhost:5000/api/jobs');
      setJobs(res.data.filter(j => j.distribution[dept === 'chemical' ? 'macro' : dept]?.status === 'PENDING'));
    } catch (err) {
      console.error(err);
      alert('Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingJobId(null);
    }
  };

  const toggleExpand = (jobId) => {
    setExpandedJobId(prev => prev === jobId ? null : jobId);
  };

  return (
    <div>
      <h1 style={{ marginBottom: '1.5rem' }}>Job Dispatcher</h1>
      {success && <div style={{ marginBottom: '1rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 500 }}>{success}</div>}

      {dispatchLoading ? (
        <Spinner message="Loading pending jobs..." />
      ) : jobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          <CheckCircle size={40} style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No pending jobs to dispatch</p>
          <p style={{ fontSize: '0.85rem' }}>All jobs have been assigned. Check back later.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {jobs.map(job => {
            const deptParams = getDeptParams(job);
            const isExpanded = expandedJobId === job._id;
            const microCount = deptParams.filter(p => p.type?.toLowerCase() === 'micro').length;
            const chemCount = deptParams.filter(p => p.type?.toLowerCase() === 'chemical').length;

            return (
              <div key={job._id} className="card" style={{ padding: 0, overflow: 'hidden', border: isExpanded ? '2px solid var(--color-primary)' : '1px solid var(--color-border)', transition: 'border-color 0.2s' }}>
                {/* Card Header — always visible */}
                <div
                  onClick={() => toggleExpand(job._id)}
                  style={{
                    padding: '1.25rem 1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: isExpanded ? 'var(--color-surface-hover)' : 'var(--color-surface)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.5rem', backgroundColor: 'var(--color-primary)15', borderRadius: 'var(--radius-md)' }}>
                      <ClipboardCheck size={22} color="var(--color-primary)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-mono)' }}>{job.jobCode}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>{job.clientName}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{deptParams.length}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}> parameter{deptParams.length !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown size={20} color="var(--color-primary)" /> : <ChevronRight size={20} color="var(--color-text-muted)" />}
                  </div>
                </div>

                {/* Expanded Dispatch Form */}
                {isExpanded && (
                  <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
                    {deptParams.length === 0 ? (
                      <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '1rem' }}>No parameters for your department in this job.</p>
                    ) : (
                      <>
                        {/* Bulk assign */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Assign Analysts to Parameters ({deptParams.length})</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Bulk assign all to:</label>
                            <select
                              onChange={e => { handleAssignAll(job._id, e.target.value, deptParams); e.target.value = ''; }}
                              defaultValue=""
                              style={{ minWidth: '150px' }}
                            >
                              <option value="" disabled>Select analyst...</option>
                              {assistants.map(ast => <option key={ast._id} value={ast._id}>{ast.name}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Parameter rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                          {deptParams.map(p => (
                            <div key={p.parameterId._id} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              backgroundColor: 'var(--color-surface-hover)', padding: '0.6rem 1rem',
                              borderRadius: 'var(--radius-md)', gap: '1rem'
                            }}>
                              <div style={{ flex: 1 }}>
                                <span style={{ fontWeight: 600 }}>{p.name}</span>{' '}
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({p.unit})</span>
                              </div>
                              <select
                                value={assignments[`${job._id}-${p.parameterId._id}`] || ''}
                                onChange={e => handleAssign(job._id, p.parameterId._id, e.target.value)}
                                required
                                style={{ minWidth: '180px' }}
                              >
                                <option value="" disabled>Select Analyst...</option>
                                {assistants.map(ast => <option key={ast._id} value={ast._id}>{ast.name}</option>)}
                              </select>
                            </div>
                          ))}
                        </div>

                        {/* Deadline + Submit */}
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 250px' }}>
                            <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.4rem', fontWeight: 500 }}>Submission Deadline</label>
                            <input
                              type="datetime-local"
                              value={deadlines[job._id] || ''}
                              onChange={e => setDeadlines(prev => ({ ...prev, [job._id]: e.target.value }))}
                              required
                              style={{ width: '100%' }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSubmit(job)}
                            className="btn btn-primary"
                            disabled={submittingJobId === job._id}
                            style={{ flex: '0 0 auto', padding: '0.6rem 1.5rem', justifyContent: 'center' }}
                          >
                            {submittingJobId === job._id ? 'Dispatching...' : 'Dispatch Job'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewQueue() {
  const [instances, setInstances] = useState([]);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [reassignNote, setReassignNote] = useState('');
  const [showReassignForm, setShowReassignForm] = useState(null);
  const [success, setSuccess] = useState('');
  const [reviewLoading, setReviewLoading] = useState(() => !sessionStorage.getItem(CACHE_KEYS.INSTANCES));

  const fetchReviewItems = async () => {
    try {
      await fetchWithCache(
        'http://localhost:5000/api/tests/instances',
        CACHE_KEYS.INSTANCES,
        (data) => setInstances(data.filter(i => i.status === 'PENDING_HEAD_REVIEW'))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => { fetchReviewItems(); }, []);

  const handleApprove = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/tests/instances/${id}/review`, { action: 'APPROVE' });
      setSuccess('Approved and forwarded to Lab Head for final review.');
      invalidateCache(CACHE_KEYS.INSTANCES);
      fetchReviewItems();
      setSelectedInstance(null);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReassign = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/tests/instances/${id}/review`, {
        action: 'REASSIGN',
        note: reassignNote
      });
      setSuccess('Sent back to analyst for correction.');
      setReassignNote('');
      setShowReassignForm(null);
      invalidateCache(CACHE_KEYS.INSTANCES);
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
        <ClipboardCheck size={28} style={{ color: 'var(--color-primary)' }} /> Review Queue
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>Review analyst submissions before forwarding to Lab Head.</p>

      {success && (
        <div style={{ 
          position: 'fixed', top: '6rem', right: '2rem', zIndex: 1000,
          color: 'white', backgroundColor: 'var(--color-success)', 
          padding: '1rem 1.5rem', borderRadius: 'var(--radius-md)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <CheckCircle size={20} />
          <span style={{ fontWeight: 500 }}>{success}</span>
        </div>
      )}

      {reviewLoading && instances.length === 0 ? (
        <div className="card"><Spinner message="Loading review queue..." /></div>
      ) : instances.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          No submissions awaiting your review.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {instances.map(inst => (
            <div key={inst._id} className="card" style={{ borderLeft: '4px solid var(--color-warning)', padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', backgroundColor: selectedInstance === inst._id ? 'var(--color-surface-hover)' : 'transparent' }}
                onClick={() => setSelectedInstance(selectedInstance === inst._id ? null : inst._id)}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Analysis Results Review</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                    Code: <span style={{ fontFamily: 'monospace' }}>{inst.testCode}</span> · Analyst: {inst.assignedTo?.name} · Client: {inst.clientName}
                  </div>
                </div>
                <span className="badge badge-warning">Awaiting Review</span>
              </div>

              {/* Expanded detail */}
              {selectedInstance === inst._id && (
                <div style={{ padding: '1.5rem' }}>
                  {/* Review history */}
                  {inst.reviewHistory && inst.reviewHistory.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(241, 196, 15, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-warning)' }}>
                      <div style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--color-warning)' }}>Previous Review History</div>
                      {inst.reviewHistory.map((rh, i) => (
                        <div key={i} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                          <strong>{rh.role}</strong> — {rh.action} {rh.note && `("${rh.note}")`} — {new Date(rh.date).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Testing Period */}
                  {inst.testingPeriod && inst.testingPeriod.startDate && (
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                      <strong>Testing Period:</strong> {new Date(inst.testingPeriod.startDate).toLocaleDateString('en-IN')} to {new Date(inst.testingPeriod.endDate).toLocaleDateString('en-IN')}
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
                        <th>Test Method</th>
                        <th>Reference Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inst.results.map(r => (
                        <tr key={r.parameterId}>
                          <td style={{ fontWeight: 500 }}>{r.name}</td>
                          <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--color-primary)' }}>{r.value || '—'}</td>
                          <td>{r.unit}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r.testMethod || '—'}</td>
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
                      <button onClick={() => handleApprove(inst._id)} className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
                        <CheckCircle size={16} style={{ marginRight: '0.5rem' }} /> Approve & Forward to Lab Head
                      </button>
                      <button onClick={() => setShowReassignForm(inst._id)} className="btn" style={{ flex: 1, justifyContent: 'center', backgroundColor: 'var(--color-warning)', color: 'white', border: 'none' }}>
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

export default function HeadDashboard() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/assistants" element={<Assistants />} />
      <Route path="/dispatcher" element={<Dispatcher />} />
      <Route path="/review" element={<ReviewQueue />} />
      <Route path="/audit" element={<Audit />} />
    </Routes>
  );
}

function Audit() {
  const [instances, setInstances] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(
    () => !sessionStorage.getItem(CACHE_KEYS.INSTANCES) || !sessionStorage.getItem(CACHE_KEYS.JOBS)
  );

  const fetchData = async () => {
    try {
      const cachedInst = sessionStorage.getItem(CACHE_KEYS.INSTANCES);
      const cachedJobs = sessionStorage.getItem(CACHE_KEYS.JOBS);

      const processData = (allInstances, allJobs) => {
        const isJobFullyCompleted = (job) => {
          const microOk = !job.distribution?.micro?.required || job.distribution.micro.status === 'COMPLETED';
          const macroOk = !job.distribution?.macro?.required || job.distribution.macro.status === 'COMPLETED';
          return microOk && macroOk;
        };
        const fullyCompletedJobIds = new Set(allJobs.filter(j => isJobFullyCompleted(j)).map(j => j._id));
        setInstances(allInstances.filter(i => i.status === 'COMPLETED' && fullyCompletedJobIds.has(i.jobId)));
        setJobs(allJobs);
      };

      if (cachedInst && cachedJobs) {
        processData(JSON.parse(cachedInst), JSON.parse(cachedJobs));
      }

      const [resInst, resJobs] = await Promise.all([
        axios.get('http://localhost:5000/api/tests/instances'),
        axios.get('http://localhost:5000/api/jobs')
      ]);
      sessionStorage.setItem(CACHE_KEYS.INSTANCES, JSON.stringify(resInst.data));
      sessionStorage.setItem(CACHE_KEYS.JOBS, JSON.stringify(resJobs.data));
      processData(resInst.data, resJobs.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={28} style={{ color: 'var(--color-primary)' }} /> Department Job Logs
        </h1>
        <div style={{ 
          backgroundColor: 'var(--color-surface-hover)', 
          borderLeft: '4px solid var(--color-primary)', 
          padding: '1rem 1.5rem', 
          borderRadius: 'var(--radius-md)',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <Clock size={20} style={{ color: 'var(--color-primary)' }} />
          <div style={{ fontSize: '0.95rem', color: 'var(--color-text-main)', fontWeight: 500 }}>
            Click on any job row below to view its full lifecycle history, retest cycles, and download final reports.
          </div>
        </div>
        <JobLogTable jobs={jobs} title="Lifecycle Tracker" />
      </div>

      <div>
        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Completed Activity
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
              </tr>
            </thead>
            <tbody>
              {auditLoading && instances.length === 0 ? (
                <tr><td colSpan="5"><Spinner message="Loading completed tests..." /></td></tr>
              ) : instances.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>No completed tests in your department yet.</td></tr>
              ) : (
                instances.map(inst => (
                  <tr key={inst._id}>
                    <td style={{ fontFamily: 'monospace' }}>{inst.testCode}</td>
                    <td style={{ fontWeight: 500 }}>{inst.clientName}</td>
                    <td>{inst.blueprintId?.name}</td>
                    <td>{inst.assignedTo?.name}</td>
                    <td>{new Date(inst.completedAt).toLocaleDateString()}</td>
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
