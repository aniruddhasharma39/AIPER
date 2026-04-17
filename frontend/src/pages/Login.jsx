import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [requiresChange, setRequiresChange] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' or 'OTP'
  const { login, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const u = await login(email, password);
      if (u.requiresPasswordChange) {
        setRequiresChange(true);
      } else {
        redirectRole(u.role);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://localhost:5000/api/auth/change-password', { newPassword });
      // Update local storage user flag
      const updatedUser = { ...JSON.parse(localStorage.getItem('user')), requiresPasswordChange: false };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      redirectRole(updatedUser.role);
    } catch (err) {
      setError('Failed to update password');
    }
  };

  const redirectRole = (role) => {
    if (role === 'ADMIN') navigate('/admin');
    else if (role === 'HEAD') navigate('/head');
    else if (role === 'ASSISTANT') navigate('/assistant');
  };

  return (
    <div className="flex-center" style={{ height: '100vh', backgroundColor: 'var(--color-primary-dark)' }}>
      <div className="card glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="flex-center" style={{ margin: '0 auto 1rem', width: '56px', height: '56px', backgroundColor: 'var(--color-primary)', borderRadius: 'var(--radius-lg)' }}>
            <Shield color="white" size={32} />
          </div>
          <h2 style={{ color: 'var(--color-primary-dark)' }}>FoodLab Portal</h2>
          <p style={{ color: 'var(--color-primary-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Secure Scientific OS Access</p>
        </div>

        {error && <div style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)', padding: '0.75rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        {requiresChange ? (
          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Mandatory Password Change</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="Enter new password" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Update & Continue <ArrowRight size={18} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: 'var(--color-text-main)' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="email" 
                  placeholder="admin@foodlab.com" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>Password</label>
                <button type="button" onClick={() => alert('OTP Flow mocked.')} style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', cursor: 'pointer' }}>Forgot? Use OTP</button>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  style={{ paddingLeft: '2.5rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Authenticate <ArrowRight size={18} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
