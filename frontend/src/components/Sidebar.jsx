import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, Users, FileText, LayoutDashboard, Settings, ClipboardCheck } from 'lucide-react';

export default function Sidebar() {
  const { user } = useContext(AuthContext);

  const getLinks = () => {
    switch(user?.role) {
      case 'ADMIN':
        return [
          { to: '/admin', icon: <LayoutDashboard size={20} />, label: 'Super Admin Tracker' },
          { to: '/admin/users', icon: <Users size={20} />, label: 'Staff Directory' },
          { to: '/admin/audit', icon: <FileText size={20} />, label: 'Audit Logs' },
        ];
      case 'LAB_HEAD':
        return [
          { to: '/lab-head', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/lab-head/review', icon: <ClipboardCheck size={20} />, label: 'Review Queue' },
          { to: '/lab-head/jobs', icon: <Activity size={20} />, label: 'Job Distributor' },
          { to: '/lab-head/blueprints', icon: <Settings size={20} />, label: 'Test Blueprints' },
          { to: '/lab-head/users', icon: <Users size={20} />, label: 'User Management' },
          { to: '/lab-head/audit', icon: <FileText size={20} />, label: 'Audit Logs' },
        ];
      case 'HEAD':
        return [
          { to: '/head', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
          { to: '/head/review', icon: <ClipboardCheck size={20} />, label: 'Review Queue' },
          { to: '/head/assistants', icon: <Users size={20} />, label: 'Assistants' },
          { to: '/head/blueprints', icon: <Settings size={20} />, label: 'Test Blueprints' },
          { to: '/head/dispatcher', icon: <Activity size={20} />, label: 'Job Dispatcher' },
          { to: '/head/audit', icon: <FileText size={20} />, label: 'Audit Logs' },
        ];
      case 'ASSISTANT':
        return [
          { to: '/assistant', icon: <Activity size={20} />, label: 'Task Queue' },
        ];
      default: return [];
    }
  };

  return (
    <div style={{
      width: '260px',
      backgroundColor: 'var(--color-primary-dark)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 10
    }}>
      <div style={{ padding: '2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', borderBottom: '1px solid var(--color-primary-light)'}}>
        <div style={{ width: '32px', height: '32px', background: 'var(--color-success)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Activity size={20} color="white" />
        </div>
        <div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '1.25rem' }}>FoodLab</h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Scientific OS</span>
        </div>
      </div>
      
      <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
        {getLinks().map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/lab-head' || link.to === '/head' || link.to === '/assistant'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'white' : 'var(--color-text-muted)',
              backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
              textDecoration: 'none',
              transition: 'all 0.2s'
            })}
          >
            {link.icon}
            <span style={{ fontWeight: 500 }}>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-primary-light)' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Logged in as <b>{user?.role}</b><br/>
          {user?.department && <span>Dept: {user.department}</span>}
        </div>
      </div>
    </div>
  );
}
