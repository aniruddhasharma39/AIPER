import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Play, Check, Clock, AlertTriangle, RotateCcw } from 'lucide-react';

export default function AssistantDashboard() {
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [resultsData, setResultsData] = useState([]);
  const [success, setSuccess] = useState('');

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tests/instances');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const openTask = (task) => {
    setActiveTask(task);
    // Always initialize with empty values — assistant must re-enter
    setResultsData(task.results.map(r => ({ ...r, value: '' })));
  };

  const closeTask = () => {
    setActiveTask(null);
    setResultsData([]);
  };

  const handleResultChange = (index, val) => {
    const updated = [...resultsData];
    updated[index].value = val;
    setResultsData(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/tests/instances/${activeTask._id}/results`, {
        results: resultsData
      });
      setSuccess(`Task ${activeTask.testCode} submitted for review!`);
      closeTask();
      fetchTasks();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Check if a task has been reassigned (has review history with a REASSIGN action)
  const isReassigned = (task) => {
    return task.reviewHistory && task.reviewHistory.some(rh => rh.action === 'REASSIGN');
  };

  // Get the latest rejection note
  const getLatestNote = (task) => {
    if (!task.reviewHistory) return null;
    const reassigns = task.reviewHistory.filter(rh => rh.action === 'REASSIGN');
    return reassigns.length > 0 ? reassigns[reassigns.length - 1] : null;
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={28} style={{ color: 'var(--color-primary)' }}/> Task Queue
      </h1>
      
      {success && <div style={{ marginBottom: '1.5rem', color: 'var(--color-success)', backgroundColor: 'var(--color-success-light)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>{success}</div>}

      {activeTask ? (
        <div className="card" style={{ marginBottom: '2rem', borderTop: `4px solid ${isReassigned(activeTask) ? 'var(--color-danger)' : 'var(--color-primary)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <h2 style={{ margin: 0 }}>{activeTask.blueprintId?.name || 'Custom Sample Analysis'}</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>Test Code: {activeTask.testCode}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.9rem' }}>Target: {new Date(activeTask.deadline).toLocaleString()}</span>
              <p style={{ color: 'var(--color-text-muted)', margin: '0.3rem 0 0 0', fontSize: '0.8rem' }}>Client: {activeTask.clientName}</p>
            </div>
          </div>

          {/* Rejection note banner */}
          {(() => {
            const latestNote = getLatestNote(activeTask);
            if (!latestNote) return null;
            return (
              <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', backgroundColor: 'rgba(231, 76, 60, 0.08)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-danger)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--color-danger)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                    Reassigned by {latestNote.role} — Please correct and resubmit
                  </div>
                  {latestNote.note && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-main)' }}>
                      "{latestNote.note}"
                    </div>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.3rem' }}>
                    {new Date(latestNote.date).toLocaleString()}
                  </div>
                </div>
              </div>
            );
          })()}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {resultsData.map((resItem, i) => {
                // Find matching previous value for reference
                const prevResult = activeTask.previousResults?.find(pr => pr.parameterId === resItem.parameterId);
                return (
                  <div key={resItem.parameterId} style={{ display: 'flex', alignItems: 'stretch', gap: '1rem', padding: '1rem', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                    <div style={{ flex: 1.5 }}>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{resItem.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Ref: {resItem.referenceRange}</div>
                      {/* Show previous value as reference */}
                      {prevResult && prevResult.value && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '0.3rem', fontStyle: 'italic' }}>
                          Previous: {prevResult.value} {prevResult.unit}
                        </div>
                      )}
                    </div>
                    
                    <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={resItem.value} 
                        onChange={e => handleResultChange(i, e.target.value)} 
                        required 
                        placeholder="Enter value..."
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', width: '60px' }}>{resItem.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button type="submit" className="btn btn-success" style={{ flex: 2, justifyContent: 'center' }}>
                <Check size={18} style={{ marginRight: '0.5rem' }}/> Submit for Review
              </button>
              <button type="button" className="btn" onClick={closeTask} style={{ flex: 1, justifyContent: 'center', backgroundColor: 'transparent', border: '1px solid var(--color-border)' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {tasks.length === 0 ? (
            <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
              No pending tasks in your queue.
            </div>
          ) : (
            tasks.map(task => (
              <div key={task._id} className="card glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: isReassigned(task) ? '4px solid var(--color-danger)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {isReassigned(task) ? (
                    <span className="badge" style={{ backgroundColor: 'rgba(231, 76, 60, 0.1)', color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <RotateCcw size={12} /> Reassigned
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ backgroundColor: 'rgba(241, 196, 15, 0.1)', color: '#d35400' }}>Pending</span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(task.deadline).toLocaleDateString()}</span>
                </div>
                
                <div>
                  <h3 style={{ margin: '0 0 0.3rem 0', color: 'var(--color-primary-dark)' }}>{task.blueprintId?.name || 'Custom Sample Analysis'}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Code: {task.testCode}</span>
                    <span>Params: {task.results.length}</span>
                  </div>
                </div>

                {/* Show latest rejection note preview on card */}
                {(() => {
                  const latestNote = getLatestNote(task);
                  if (!latestNote || !latestNote.note) return null;
                  return (
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', backgroundColor: 'rgba(231, 76, 60, 0.05)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', fontStyle: 'italic' }}>
                      "{latestNote.note.length > 80 ? latestNote.note.substring(0, 80) + '...' : latestNote.note}"
                    </div>
                  );
                })()}

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                  <button onClick={() => openTask(task)} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    <Play size={16} /> {isReassigned(task) ? 'Revise & Resubmit' : 'Run Analysis'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
