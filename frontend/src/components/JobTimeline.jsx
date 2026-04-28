import React from 'react';
import { Circle, User, Calendar, CheckCircle, Clock, ClipboardCheck, AlertTriangle, History } from 'lucide-react';

export default function JobTimeline({ job }) {
  const instances = job.testInstances || [];
  
  // Find the best instance per department: prefer the latest active (non-REOPENED) one,
  // fall back to the most recent REOPENED if no active instance exists.
  const pickInstance = (deptHeadId) => {
    const deptInstances = instances.filter(i => String(i.createdBy) === String(deptHeadId));
    // First try: latest active instance
    const active = deptInstances.filter(i => i.status !== 'REOPENED').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (active.length > 0) return active[0];
    // Fallback: latest REOPENED
    const reopened = deptInstances.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return reopened[0] || null;
  };

  const microInstance = pickInstance(job.distribution?.micro?.assignedTo?._id);
  const macroInstance = pickInstance(job.distribution?.macro?.assignedTo?._id);

  const formatDate = (d) => new Date(d).toLocaleString();

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'completed': return <CheckCircle color="var(--color-success)" fill="white" size={24} />;
      case 'review': return <ClipboardCheck color="var(--color-primary)" fill="white" size={24} />;
      case 'warning': return <AlertTriangle color="var(--color-warning)" fill="white" size={24} />;
      case 'reopened': return <History color="var(--color-primary-dark)" fill="white" size={24} />;
      default: return <Clock color="var(--color-text-muted)" fill="white" size={24} />;
    }
  };

  const Step = ({ title, user, date, status = 'pending', isLast, badge }) => (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative', paddingBottom: isLast ? '0' : '2rem' }}>
      {!isLast && <div style={{ position: 'absolute', top: '24px', left: '11px', bottom: '0', width: '2px', backgroundColor: status === 'completed' ? 'var(--color-success)' : 'var(--color-border)' }} />}
      <div style={{ zIndex: 1 }}>
        <StatusIcon status={status} />
      </div>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <h4 style={{ margin: '0 0 0.25rem 0', color: status !== 'pending' ? 'var(--color-text-main)' : 'var(--color-text-muted)' }}>{title}</h4>
          {badge && <span className={`badge ${badge.className}`} style={{ fontSize: '0.7rem', ...badge.style }}>{badge.text}</span>}
        </div>
        {user && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}><User size={14}/> {user}</div>}
        {date && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}><Calendar size={14}/> {formatDate(date)}</div>}
      </div>
    </div>
  );

  const getInstanceStatus = (instance) => {
    if (!instance) return null;
    switch (instance.status) {
      case 'COMPLETED': return 'completed';
      case 'PENDING_HEAD_REVIEW': return 'review';
      case 'PENDING_LAB_HEAD_REVIEW': return 'review';
      case 'REOPENED': return 'reopened';
      default: return 'pending';
    }
  };

  const getInstanceBadge = (instance) => {
    if (!instance) return null;
    switch (instance.status) {
      case 'PENDING_HEAD_REVIEW': return { text: 'Awaiting HEAD Review', className: 'badge-warning' };
      case 'PENDING_LAB_HEAD_REVIEW': return { text: 'Awaiting Lab Head Review', className: 'badge-primary' };
      case 'COMPLETED': return { text: 'Approved', className: 'badge-success' };
      case 'REOPENED': return { text: 'Reopened Job', className: 'badge-warning' };
      default: return null;
    }
  };

  const DepartmentBranch = ({ deptName, distData, instance }) => {
    if (!distData?.required) return null;
    
    const isAssignedToHead = distData.assignedTo != null;
    const isDispatched = instance != null;
    const instStatus = getInstanceStatus(instance);
    const isCompleted = distData.status === 'COMPLETED' || instance?.status === 'COMPLETED';
    const isReopened = instance?.status === 'REOPENED';
    const isInReview = instance?.status === 'PENDING_HEAD_REVIEW' || instance?.status === 'PENDING_LAB_HEAD_REVIEW';
    const hasBeenReassigned = instance?.reviewHistory?.some(rh => rh.action === 'REASSIGN');

    return (
      <div style={{ flex: 1, borderTop: '2px solid var(--color-border)', paddingTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '1.5rem', color: 'var(--color-primary-dark)' }}>{deptName} Pipeline</h3>
        
        {/* Step 1: Lab Head Assigned to Domain Head */}
        <Step 
          title={`Forwarded to ${deptName} Head`} 
          user={distData.assignedTo?.name || 'Unassigned'} 
          date={job.createdAt} 
          status={isAssignedToHead ? 'completed' : 'pending'}
          isLast={false}
        />
        
        {/* Step 2: Domain Head Dispatching to Assistant */}
        <Step 
          title={isDispatched ? "Dispatched to Assistant" : "Dispatch Pending"} 
          user={instance?.assignedTo?.name || 'Waiting for Dispatch'} 
          date={instance?.createdAt} 
          status={isDispatched ? 'completed' : 'pending'}
          isLast={false}
        />

        {/* Step 3: Analysis Submitted / In Review */}
        <Step 
          title={isCompleted ? "Analysis Approved" : isInReview ? "Submitted — Under Review" : hasBeenReassigned ? "Reassigned for Correction" : "Analysis Pending"} 
          user={instance?.assignedTo?.name || (isDispatched ? 'Pending Analysis' : 'Waiting for Dispatch')} 
          date={instance?.completedAt || (isInReview ? instance?.updatedAt : null)} 
          status={isCompleted ? 'completed' : isInReview ? 'review' : hasBeenReassigned ? 'warning' : 'pending'}
          isLast={!isInReview && !isCompleted}
          badge={getInstanceBadge(instance)}
        />

        {/* Step 4: Final Approval (only show if in review, completed, or reopened) */}
        {(isInReview || isCompleted || isReopened) && (
          <Step 
            title={isCompleted ? "Report Generated" : isReopened ? "Report Archived (Job Reopened)" : "Final Approval Pending"} 
            date={isCompleted || isReopened ? instance?.completedAt : null} 
            status={isCompleted ? 'completed' : isReopened ? 'reopened' : 'pending'}
            isLast={true}
          />
        )}
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
        status="completed"
        isLast={!job.distribution?.micro?.required && !job.distribution?.macro?.required}
      />
      
      {/* Branching */}
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', paddingLeft: '2rem' }}>
        <DepartmentBranch deptName="MICRO" distData={job.distribution?.micro} instance={microInstance} />
        <DepartmentBranch deptName="CHEMICAL" distData={job.distribution?.macro} instance={macroInstance} />
      </div>
    </div>
  );
}
