import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldAlert } from 'lucide-react';
import { auth } from '@/modules/shared/config/firebase';
import { signInWithCustomToken } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/modules/shared/utils/api';

const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem 0.875rem 3rem',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '1rem',
    fontSize: '1rem',
    fontWeight: 600,
    outline: 'none',
};
const iconStyle = { position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };

// Management portal login: ONE credential only (ADMIN_EMAIL / ADMIN_PASSWORD on the server).
// No Google and no phone/OTP sign-in.
export default function AdminLoginModal({ isOpen, onClose }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) {
            setEmail('');
            setPassword('');
            setShowPassword(false);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Please enter the admin email and password.');
            return;
        }

        setLoading(true);
        try {
            const response = await authFetch('/auth/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success || data.role !== 'ADMIN' || !data.customToken) {
                setError(data.message || 'Admin login failed.');
                return;
            }

            // Sign in to Firebase with the token from the server so every admin
            // request carries a verified ID token.
            await signInWithCustomToken(auth, data.customToken);

            const userData = {
                uid: data.uid,
                role: data.role,
                email: data.email,
                fullName: data.fullName || 'Admin',
                status: data.status || 'AUTHORIZED',
            };
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('userName', userData.fullName);
            window.dispatchEvent(new CustomEvent('userDataChanged', { detail: userData }));

            navigate('/admin');
            onClose();
        } catch (err) {
            console.error('Admin Login Error:', err);
            setError('Could not sign in. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="auth-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="auth-modal-content"
                        style={{ width: '100%', maxWidth: '400px', border: '2px solid var(--primary)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button className="auth-close-btn" onClick={onClose}><X size={20} /></button>

                        <div className="auth-header">
                            <div className="auth-icon-container" style={{ background: 'var(--primary)' }}>
                                <ShieldCheck color="white" size={24} />
                            </div>
                            <h2>Management <span className="gradient-text">Portal</span></h2>
                            <p>Authorized access only. Sign in with the admin email and password.</p>
                        </div>

                        {error && <div className="auth-error-msg" style={{ background: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>{error}</div>}

                        <form onSubmit={handleLogin} className="auth-form">
                            <div style={{ position: 'relative', marginBottom: '1rem' }}>
                                <Mail size={18} style={iconStyle} />
                                <input
                                    type="email"
                                    placeholder="Admin email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                    style={inputStyle}
                                />
                            </div>
                            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                                <Lock size={18} style={iconStyle} />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    style={{ ...inputStyle, paddingRight: '3rem' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex' }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <button type="submit" className="auth-submit-btn" disabled={loading} style={{ background: 'var(--primary)', color: 'white' }}>
                                {loading ? 'Signing in...' : (
                                    <>Sign in to Dashboard <ArrowRight size={18} /></>
                                )}
                            </button>
                        </form>

                        <div className="auth-form-footer" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                            <p className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                <ShieldAlert size={14} /> Unauthorized access is strictly prohibited.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
            <style>{`
                .auth-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1.5rem;
                    z-index: 9999;
                }
                .auth-modal-content {
                    background: white;
                    border-radius: 2rem;
                    padding: 2.5rem;
                    position: relative;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                }
                .auth-close-btn {
                    position: absolute;
                    top: 1.25rem;
                    right: 1.25rem;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: #f1f5f9;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .auth-close-btn:hover { background: #e2e8f0; color: #ef4444; }
                .auth-header { text-align: center; margin-bottom: 2rem; }
                .auth-icon-container {
                    width: 56px;
                    height: 56px;
                    border-radius: 1.25rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.25rem;
                }
                .auth-header h2 { font-size: 1.75rem; font-weight: 900; letter-spacing: -0.025em; margin-bottom: 0.5rem; }
                .auth-header p { color: #64748b; font-size: 0.95rem; }
                .auth-form { display: flex; flex-direction: column; }
                
                .auth-submit-btn {
                    padding: 1rem;
                    border-radius: 1rem;
                    border: none;
                    font-weight: 700;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: 0.2s;
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                }
                .auth-submit-btn:hover:not(:disabled) { transform: translateY(-2px); opacity: 0.9; }
                .auth-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
            `}</style>
        </AnimatePresence>
    );
}
