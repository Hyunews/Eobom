import React, { useState } from 'react';
import { X, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('1234');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === '1234') {
      onLoginSuccess('관리자 (admin)');
      setErrorMessage('');
      onClose();
    } else {
      setErrorMessage('아이디(admin) 또는 비밀번호(1234)가 올바르지 않습니다.');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 3000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '100%',
        padding: '2.5rem 2rem',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.2rem',
            right: '1.2rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={24} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--secondary-color)',
            color: 'var(--primary-color)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem'
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ color: 'var(--primary-color)', fontSize: '1.5rem', fontWeight: 700 }}>데모 로그인</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            테스트 계정: <strong>admin / 1234</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>아이디</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="admin"
                required
              />
              <User size={18} style={{ position: 'absolute', left: '1rem', top: '16px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ fontSize: '0.9rem' }}>비밀번호</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="1234"
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '16px', color: 'var(--text-muted)' }} />
            </div>
          </div>

          {errorMessage && (
            <div style={{
              backgroundColor: '#FDE8E8',
              color: '#9B1C1C',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            로그인하기
          </button>
        </form>
      </div>
    </div>
  );
};
