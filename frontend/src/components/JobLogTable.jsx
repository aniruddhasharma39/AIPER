import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import JobTimeline from './JobTimeline';

export default function JobLogTable({ jobs, title = "Job Logs" }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedJobId, setExpandedJobId] = useState(null);

  // Helper to determine a simple global status for a job
  const getJobStatus = (job) => {
    let statuses = [];
    if (job.distribution?.micro?.required) statuses.push(job.distribution.micro.status);
    if (job.distribution?.macro?.required) statuses.push(job.distribution.macro.status);
    
    if (statuses.length === 0) return 'PENDING';
    if (statuses.every(s => s === 'COMPLETED')) return 'COMPLETED';
    if (statuses.some(s => s === 'ASSIGNED_TO_ASSISTANT')) return 'IN_PROGRESS';
    return 'PENDING';
  };

  const filteredJobs = jobs.filter(j => {
    const term = searchTerm.toLowerCase();
    const matchSearch = j.jobCode.toLowerCase().includes(term) || j.clientName.toLowerCase().includes(term);
    const jobStatus = getJobStatus(j);
    const matchStatus = statusFilter === 'ALL' || jobStatus === statusFilter;
    return matchSearch && matchStatus;
  });

  const toggleExpand = (id) => {
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const StatusBadge = ({ status }) => {
    switch(status) {
      case 'COMPLETED': return <span className="badge badge-success">Completed</span>;
      case 'IN_PROGRESS': return <span className="badge badge-warning">In Progress</span>;
      default: return <span className="badge" style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text-main)' }}>Pending</span>;
    }
  };

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--color-surface)' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search Client or Code..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              style={{ paddingLeft: '2.2rem', paddingRight: '1rem', paddingBottom: '0.4rem', paddingTop: '0.4rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Filter size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              style={{ paddingLeft: '2.2rem', appearance: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', paddingBottom: '0.4rem', paddingTop: '0.4rem' }}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: 'var(--color-surface-hover)' }}>
          <tr>
            <th style={{ width: '50px' }}></th>
            <th>Job Code</th>
            <th>Client Name</th>
            <th>Date Created</th>
            <th>Overall Status</th>
          </tr>
        </thead>
        <tbody>
          {filteredJobs.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No jobs match your filters.</td></tr>
          ) : (
            filteredJobs.map(job => (
              <React.Fragment key={job._id}>
                <tr style={{ cursor: 'pointer', borderBottom: expandedJobId === job._id ? 'none' : '1px solid var(--color-border)' }} onClick={() => toggleExpand(job._id)}>
                  <td style={{ textAlign: 'center' }}>
                    {expandedJobId === job._id ? <ChevronDown size={20} color="var(--color-primary)" /> : <ChevronRight size={20} color="var(--color-text-muted)" />}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{job.jobCode}</td>
                  <td>{job.clientName}</td>
                  <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                  <td><StatusBadge status={getJobStatus(job)} /></td>
                </tr>
                {expandedJobId === job._id && (
                  <tr>
                    <td colSpan="5" style={{ padding: '0', backgroundColor: 'var(--color-surface-hover)' }}>
                      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                        <JobTimeline job={job} />
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
