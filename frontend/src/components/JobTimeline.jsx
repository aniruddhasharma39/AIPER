import React from 'react';
import { Circle, User, Calendar, CheckCircle, Clock } from 'lucide-react';

export default function JobTimeline({ job }) {
  const instances = job.testInstances || [];
  
  // Find instances for each department based on the assignedTo id
  const microInstance = instances.find(i => String(i.createdBy) === String(job.distribution?.micro?.assignedTo?._id));
  const macroInstance = instances.find(i => String(i.createdBy) === String(job.distribution?.macro?.assignedTo?._id));

  const formatDate = (d) => new Date(d).toLocaleString();

  const Step = ({ title, user, date, completed, isLast }) => (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative', paddingBottom: isLast ? '0' : '2rem' }}>
      {!isLast && <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '0', width: '2px', backgroundColor: completed ? 'var(--color-success)' : 'var(--color-border)' }} />}
      <div style={{ zIndex: 1 }}>
        {completed ? <CheckCircle color="var(--color-success)" fill="white" size={24} /> : <Clock color="var(--color-warning)" fill="white" size={24} />}
      </div>
      <div>
        <h4 style={{ margin: '0 0 0.25rem 0', color: completed ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{title}</h4>
        {user && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}><User size={14}/> {user}</div>}
        {date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Calendar size={14}/> {formatDate(date)}</div>}
      </div>
    </div>
  );

  const DepartmentBranch = ({ deptName, distData, instance }) => {
    if (!distData?.required) return null;
    
    // Determine milestone state
    const isAssignedToHead = distData.assignedTo != null;
    const isDispatched = instance != null;
    const isCompleted = distData.status === 'COMPLETED' || instance?.status === 'COMPLETED';

    return (
      <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>{deptName} Pipeline</h3>
        
        {/* Step 1: Lab Head Assigned to Domain Head */}
        <Step 
          title={`Forwarded to ${deptName} Head`} 
          user={distData.assignedTo?.name || 'Unassigned'} 
          date={job.createdAt} 
          completed={isAssignedToHead}
          isLast={false}
        />
        
        {/* Step 2: Domain Head Dispatching to Assistant */}
        <Step 
          title="Dispatched to Assistant" 
          user={instance?.assignedTo?.name || 'Waiting for Dispatch'} 
          date={instance?.createdAt} 
          completed={isDispatched}
          isLast={false}
        />

        {/* Step 3: Analysis Completed */}
        <Step 
          title="Analysis Completed" 
          user={instance?.assignedTo?.name} 
          date={instance?.completedAt} 
          completed={isCompleted}
          isLast={true}
        />
      </div>
    );
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>Lifecycle Timeline</h3>
      
      {/* Genesis Node */}
      <Step 
        title="Job Sample Logged" 
        user={job.createdBy?.name || 'Admin/Lab Head'} 
        date={job.createdAt} 
        completed={true}
        isLast={!job.distribution?.micro?.required && !job.distribution?.macro?.required}
      />
      
      {/* Branching */}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingLeft: '2rem' }}>
        <DepartmentBranch deptName="MICRO" distData={job.distribution?.micro} instance={microInstance} />
        <DepartmentBranch deptName="MACRO" distData={job.distribution?.macro} instance={macroInstance} />
      </div>
    </div>
  );
}
