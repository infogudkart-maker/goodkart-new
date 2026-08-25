import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, ShieldCheck, User as UserIcon, Mail } from 'lucide-react';
import { auth } from '@/modules/shared/config/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { authFetch } from '@/modules/shared/utils/api';
import PhoneOtpForm from './PhoneOtpForm';
import EmailAuthForm from './EmailAuthForm';
import './AuthModal.css';

const TEST_CREDENTIALS = {
    '+917483743936': { otp: '123456', role: 'ADMIN' },
    '+919876543210': { otp: '123456', role: 'CONSUMER' },
    '+917676879059': { otp: '123456', role: 'CONSUMER' },
    '+919353469036': { otp: '741852', role: 'SELLER' },
    '+916366151635': { otp: '123456', role: 'SELLER' },
    '+919480290587': { otp: '123456', role: 'SELLER' },
};

/** Redirects user based on role/status after a successful auth response */
function redirectByRole(data, navigate, isSellerLogin = false) {
    if (isSellerLogin) {
        // Seller Page LOGIN flow
        sessionStorage.setItem('loginContext', 'SELLER');
        if (data.role === 'ADMIN') {
            navigate('/admin');
        } else if (data.role === 'SELLER' && (data.status === 'APPROVED' || data.sellerStatus === 'APPROVED')) {
            navigate('/seller/dashboard');
        } else if (data.role === 'SELLER' && (data.status === 'PENDING' || data.sellerStatus === 'PENDING')) {
            alert(`⏳ Your seller application for "${data.shopName || 'your shop'}" is pending admin approval.`);
            navigate('/seller');
        } else {
            // Not a seller or pending, but logged in from seller page
            navigate('/');
        }
        return;
    }

    // HOME PAGE login flow: All users (even admin/seller) stay on Home Page
    sessionStorage.setItem('loginContext', 'CONSUMER');
    navigate('/');
}

/** Stores user data to localStorage and dispatches userDataChanged event */
function persistUser(data, extras = {}, forceIsSeller = null) {
    const isSeller = forceIsSeller !== null ? forceIsSeller : (sessionStorage.getItem('loginContext') === 'SELLER');
    const key = isSeller ? 'seller_user' : 'user';
    const userData = { uid: data.uid, role: data.role, ...extras };
    localStorage.setItem(key, JSON.stringify(userData));
    if (extras.fullName) localStorage.setItem(isSeller ? 'seller_userName' : 'userName', extras.fullName);
    if (extras.dob) localStorage.setItem(isSeller ? 'seller_dob' : 'dob', extras.dob);
    window.dispatchEvent(new CustomEvent('userDataChanged', { detail: { ...userData, context: isSeller ? 'SELLER' : 'CONSUMER' } }));
}

export default function AuthModal({ isOpen, onClose, onSuccess, hideRegister, sellerLogin = false, startSellingFlow = false }) {
    const [step, setStep] = useState('phone');
    const [isRegistering, setIsRegistering] = useState(false);
    const [isEmailSignup, setIsEmailSignup] = useState(false);
    const [isEmailLogin, setIsEmailLogin] = useState(false);
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [emailOtpStep, setEmailOtpStep] = useState('details'); // 'details' | 'otp'
    const [emailOtp, setEmailOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [isTestNumber, setIsTestNumber] = useState(false);
    const [formData, setFormData] = useState({ fullName: '', dob: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [dobFocused, setDobFocused] = useState(false);
    const [isGoogleRegistration, setIsGoogleRegistration] = useState(false);
    const [googleIdToken, setGoogleIdToken] = useState(null);
    const navigate = useNavigate();

    const checkRoleAllowed = async (data) => {
        if (!data || !data.success) return true;

        const linkStyle = { color: 'var(--primary)', textDecoration: 'underline', fontWeight: 600, display: 'inline-block', marginTop: '4px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 };

        // Start Selling flow — special handling (Only for Login, not Register)
        if (startSellingFlow && !isRegistering) {
            // If the account doesn't exist yet, let the flow proceed to registration
            if (data.requiresRegistration) return true;

            if (data.role === 'SELLER') {
                // Already a seller → persist and redirect to dashboard
                persistUser(data, { fullName: data.fullName, status: data.status, sellerStatus: data.sellerStatus, shopName: data.shopName }, true);
                sessionStorage.setItem('loginContext', 'SELLER');
                if (data.status === 'APPROVED' || data.sellerStatus === 'APPROVED') {
                    navigate('/seller/dashboard');
                } else {
                    alert('⏳ Your seller application is pending admin approval.');
                    navigate('/seller');
                }
                handleClose();
                return false;
            }
            if (data.role === 'ADMIN') {
                setError('Admins cannot register as sellers.');
                return false;
            }
            // CONSUMER → show "already a customer" message with options
            // Skip for NEW_USER or REGISTERED status (fresh credentials)
            if (data.status === 'NEW_USER' || data.status === 'REGISTERED') {
                persistUser(data, { fullName: data.fullName, status: data.status }, true);
                navigate('/seller/register');
                handleClose();
                return false;
            }

            setError(
                <span>
                    You are already a registered customer. Would you like to continue with the same credentials to become a seller?<br />
                    <button style={{ ...linkStyle, marginTop: '8px', padding: '6px 16px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }} onClick={() => {
                        persistUser(data, { fullName: data.fullName, status: data.status }, true);
                        handleClose();
                        navigate('/seller/register');
                    }}>Continue with existing credentials</button>
                    <br />
                    <span style={{ fontSize: '12px', color: '#6B7280', marginTop: '6px', display: 'inline-block' }}>
                        Or register as a new user
                    </span>
                </span>
            );
            // Don't sign out — keep auth active for "Continue"
            return false;
        }

        // Block consumers and admins from seller login
        if (sellerLogin && data.role !== 'SELLER') {
            // If it's a new user or consumer trying to login on seller page, offer to register as seller
            if (data.role === 'CONSUMER' && !isRegistering) {
                setError(
                    <span>
                        You don't have a seller account yet. Would you like to register as a seller?<br />
                        <button style={{ ...linkStyle, marginTop: '8px', padding: '6px 16px', background: 'var(--primary)', color: '#fff', borderRadius: '6px', textDecoration: 'none' }} onClick={() => {
                            persistUser(data, { fullName: data.fullName, email: data.email, status: data.status }, true);
                            handleClose();
                            navigate('/seller/register');
                        }}>Register as Seller</button>
                        <br />
                        <button style={linkStyle} onClick={() => { handleClose(); navigate('/'); setTimeout(() => window.dispatchEvent(new Event('openLoginModal')), 300); }}>Or login as a consumer</button>
                    </span>
                );
                return false;
            }
            
            // Block admins from seller login
            if (data.role === 'ADMIN') {
                setError(
                    <span>
                        Admins cannot login here.<br />
                        <button style={linkStyle} onClick={() => { handleClose(); navigate('/admin'); }}>Go to Admin Dashboard</button>
                    </span>
                );
                return false;
            }
            
            setError(
                <span>
                    Only sellers are allowed to login here.<br />
                    <button style={linkStyle} onClick={() => { handleClose(); navigate('/'); setTimeout(() => window.dispatchEvent(new Event('openLoginModal')), 300); }}>To login as a user click here</button>
                </span>
            );
            return false;
        }
        // Block sellers and admins from consumer login
        if (!sellerLogin && (data.role === 'SELLER' || data.role === 'ADMIN')) {
            setError(
                <span>
                    Only users are allowed to login here.<br />
                    <button style={linkStyle} onClick={() => { handleClose(); window.open(`${window.location.origin}${window.location.pathname}#/seller?login=true`, '_blank'); }}>To login as seller click here</button>
                </span>
            );
            return false;
        }
        return true;
    };

    const cleanupRecaptcha = () => {
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (_) { }
            window.recaptchaVerifier = null;
        }
        const container = document.getElementById('recaptcha-container');
        if (container) container.innerHTML = '';
    };

    const handleClose = () => {
        setStep('phone'); setPhone(''); setOtp(''); setError('');
        setConfirmationResult(null); setIsTestNumber(false); setIsRegistering(false);
        setIsEmailSignup(false); setIsEmailLogin(false);
        setEmailOtpStep('details'); setEmailOtp('');
        setFormData({ fullName: '', dob: '', email: '', password: '', confirmPassword: '' });
        cleanupRecaptcha();
        onClose();
    };

    useEffect(() => { return () => cleanupRecaptcha(); }, []);
    useEffect(() => { setError(''); }, [isRegistering, isEmailLogin, isEmailSignup]);
    useEffect(() => {
        if (!isOpen) handleClose();

        // Lock body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Optional: add padding to prevent layout shift if needed
            // document.body.style.paddingRight = 'var(--scrollbar-width, 15px)';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    const setupRecaptcha = () => {
        cleanupRecaptcha();
        setTimeout(() => {
            try {
                if (!document.getElementById('recaptcha-container')) return;
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    size: 'invisible',
                    callback: () => { },
                    'expired-callback': () => cleanupRecaptcha(),
                });
            } catch (e) { console.error('Recaptcha error:', e); cleanupRecaptcha(); }
        }, 100);
    };

    const handleSendOTP = async (e) => {
        if (e) e.preventDefault();

        // 1. Basic phone validation
        if (phone.length < 10) { setError('Please enter a valid 10-digit phone number'); return; }

        // 2. Registration fields validation (if on regular phone registration flow)
        if (isRegistering && !isEmailSignup && !isGoogleRegistration) {
            if (!formData.email.trim() || !formData.password.trim()) {
                setError('Please fill in email and password');
                return;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return;
            }
        }

        const phoneNumber = `+91${phone}`;
        setError('');

        // 3. Test Numbers Check
        if (TEST_CREDENTIALS[phoneNumber]) {
            setIsTestNumber(true);
            setStep('otp');
            setConfirmationResult({ isTestMode: true });
            return;
        }

        setIsTestNumber(false);
        setLoading(true);
        try {
            await new Promise(r => { setupRecaptcha(); setTimeout(r, 200); });
            if (!window.recaptchaVerifier) throw new Error('reCAPTCHA initialization failed');
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmation);
            setStep('otp');
        } catch (err) {
            console.error('OTP Send Error:', err);
            const msg = err.code === 'auth/too-many-requests'
                ? 'Too many attempts. Please try later.'
                : err.code === 'auth/invalid-phone-number'
                    ? 'The phone number provided is invalid.'
                    : 'Failed to send OTP. Please check your connection or try again later.';
            setError(msg);
            cleanupRecaptcha();
        } finally { setLoading(false); }
    };

    const handleVerifyOrRegister = async (e) => {
        e.preventDefault();
        if (otp.length !== 6) { setError('Please enter a valid 6-digit OTP'); return; }
        setLoading(true); setError('');
        try {
            const phoneNumber = `+91${phone}`;
            let idToken = null;
            if (!isTestNumber || !confirmationResult?.isTestMode) {
                const result = await confirmationResult.confirm(otp);
                idToken = await result.user.getIdToken();
            }
            const endpoint = isRegistering ? '/auth/register' : '/auth/login';
            const payload = isRegistering
                ? { idToken, phone: phoneNumber, email: formData.email, password: formData.password, isTest: isTestNumber, otp: isTestNumber ? otp : undefined }
                : (isTestNumber ? { phone: phoneNumber, otp, isTest: true } : { idToken });
            const response = await authFetch(endpoint, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...payload, fullName: formData.fullName, dob: formData.dob }),
            });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                if (!isRegistering) {
                    const allowed = await checkRoleAllowed(data);
                    if (!allowed) {
                        setLoading(false);
                        return;
                    }
                }
                const isSellerSession = sellerLogin || startSellingFlow;
                sessionStorage.setItem('loginContext', isSellerSession ? 'SELLER' : 'CONSUMER');
                persistUser(data, { 
                    phone: phoneNumber, 
                    status: data.status, 
                    sellerStatus: data.sellerStatus, 
                    shopName: data.shopName, 
                    fullName: formData.fullName || data.fullName, 
                    dob: formData.dob 
                }, isSellerSession);
                
                // Check if there's a pending Buy Now - redirect to checkout immediately
                const pendingBuyNow = localStorage.getItem('pendingBuyNow');
                if (pendingBuyNow && !sellerLogin && !startSellingFlow) {
                    try {
                        const buyNowItem = JSON.parse(pendingBuyNow);
                        localStorage.removeItem('pendingBuyNow');
                        if (onSuccess) onSuccess(data);
                        handleClose();
                        // Navigate after modal closes
                        setTimeout(() => {
                            navigate('/checkout', { state: { buyNowProduct: buyNowItem } });
                        }, 100);
                        return;
                    } catch (error) {
                        console.error('Error parsing pending Buy Now:', error);
                        localStorage.removeItem('pendingBuyNow');
                    }
                }
                
                // Normal flow - no pending Buy Now
                if (isRegistering && !startSellingFlow) {
                    navigate('/');
                } else {
                    redirectByRole(data, navigate, isSellerSession);
                }
                
                if (onSuccess) onSuccess(data);
                handleClose();
            } else {
                setError(data.message || 'Verification failed');
            }
        } catch (err) { 
            console.error('Verification Error:', err);
            setError(err.message || 'Verification failed. Please try again.'); 
        }
        finally { setLoading(false); }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true); setError('');
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const idToken = await result.user.getIdToken();
            const response = await authFetch('/auth/google-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken }) });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                const allowed = await checkRoleAllowed(data);
                if (!allowed) {
                    setLoading(false);
                    // Don't sign out - keep the user authenticated so they can use the "Register as Seller" button
                    return;
                }
                const isSellerSession = sellerLogin || startSellingFlow;
                persistUser(data, { email: data.email, fullName: data.fullName, status: data.status, sellerStatus: data.sellerStatus, shopName: data.shopName }, isSellerSession);
                // Check if there's a pending Buy Now - redirect to checkout immediately
                const pendingBuyNow = localStorage.getItem('pendingBuyNow');
                if (pendingBuyNow && !sellerLogin && !startSellingFlow) {
                    try {
                        const buyNowItem = JSON.parse(pendingBuyNow);
                        localStorage.removeItem('pendingBuyNow');
                        if (onSuccess) onSuccess(data);
                        handleClose();
                        // Navigate after modal closes
                        setTimeout(() => {
                            navigate('/checkout', { state: { buyNowProduct: buyNowItem } });
                        }, 100);
                        return;
                    } catch (error) {
                        console.error('Error parsing pending Buy Now:', error);
                        localStorage.removeItem('pendingBuyNow');
                    }
                }
                
                // Normal flow - no pending Buy Now
                redirectByRole(data, navigate, isSellerSession);
                
                if (onSuccess) onSuccess(data);
                handleClose();
            } else {
                setError(data.message || 'Google authentication failed');
            }
        } catch (err) {
            console.error('Google Sign-In Error:', err);
            const msgs = { 
                'auth/popup-closed-by-user': 'Authentication cancelled.', 
                'auth/popup-blocked': 'Popup blocked. Allow popups for this site.', 
                'auth/network-request-failed': 'Network error. Check your connection.',
                'auth/internal-error': 'Authentication error. Please try again.'
            };
            setError(msgs[err.code] || err.message || 'Google authentication failed. Please try again.');
        } finally { setLoading(false); }
    };

    const handleEmailLogin = async (e) => {
        if (e) e.preventDefault();
        setError('');

        // Only require email/password for login; registration fields are handled in handleRegisterDirectly
        if (!formData.email.trim() || !formData.password.trim()) {
            setError('Please enter both email and password');
            return;
        }
        setLoading(true);
        try {
            let idToken = null, isTestMode = false;
            try {
                const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                idToken = await cred.user.getIdToken();
            } catch (loginErr) {
                if (loginErr.code === 'auth/user-not-found' || loginErr.code === 'auth/invalid-credential') {
                    try { const reg = await createUserWithEmailAndPassword(auth, formData.email, formData.password); idToken = await reg.user.getIdToken(); }
                    catch (regErr) { if (regErr.code === 'auth/operation-not-allowed') isTestMode = true; else throw regErr; }
                } else if (loginErr.code === 'auth/operation-not-allowed') isTestMode = true;
                else throw loginErr;
            }
            const response = await authFetch('/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken, isTest: isTestMode, email: formData.email, password: formData.password }) });
            
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }
            
            const data = await response.json();
            if (data.success) {
                const allowed = await checkRoleAllowed(data);
                if (!allowed) {
                    setLoading(false);
                    return;
                }
                const isSellerSession = sellerLogin || startSellingFlow;
                persistUser(data, { email: formData.email, fullName: data.fullName || formData.fullName, dob: formData.dob }, isSellerSession);
                
                // Check if there's a pending Buy Now - redirect to checkout immediately
                const pendingBuyNow = localStorage.getItem('pendingBuyNow');
                if (pendingBuyNow && !sellerLogin && !startSellingFlow) {
                    try {
                        const buyNowItem = JSON.parse(pendingBuyNow);
                        localStorage.removeItem('pendingBuyNow');
                        if (onSuccess) onSuccess(data);
                        handleClose();
                        // Navigate after modal closes
                        setTimeout(() => {
                            navigate('/checkout', { state: { buyNowProduct: buyNowItem } });
                        }, 100);
                        return;
                    } catch (error) {
                        console.error('Error parsing pending Buy Now:', error);
                        localStorage.removeItem('pendingBuyNow');
                    }
                }
                
                // Normal flow - no pending Buy Now
                redirectByRole(data, navigate, sellerLogin || startSellingFlow);
                
                if (onSuccess) onSuccess(data);
                handleClose();
            } else {
                setError(data.message || 'Login failed');
            }
        } catch (err) {
            console.error('Email Login Error:', err);
            const msgs = { 'auth/wrong-password': 'Incorrect password.', 'auth/operation-not-allowed': 'Email/Password auth not enabled in Firebase.', 'auth/weak-password': 'Password too weak (min 6 chars).', 'auth/email-already-in-use': 'Email already in use.' };
            setError(msgs[err.code] || err.message || 'Authentication failed.');
        } finally { setLoading(false); }
    };

    const handleRegisterDirectly = async (e) => {
        if (e) e.preventDefault();
        setError('');

        // Basic field validation
        if (!formData.email.trim()) {
            setError('Please enter your email address');
            return;
        }

        // Only require password for standard email registration (not Google)
        if (!isGoogleRegistration) {
            if (!formData.password.trim()) { setError('Please enter a password'); return; }
            if (formData.password.length < 6) { setError('Password must be at least 6 characters'); return; }
            if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
        }


        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) { setError('Please enter a valid email address'); return; }

        setLoading(true);
        try {
            let idToken = isGoogleRegistration ? googleIdToken : null;
            let isTestMode = false;

            if (!isGoogleRegistration) {
                try {
                    const cred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                    await updateProfile(cred.user, { displayName: "User" });
                    idToken = await cred.user.getIdToken();
                } catch (fbErr) {
                    if (fbErr.code === 'auth/operation-not-allowed') isTestMode = true;
                    else if (fbErr.code === 'auth/email-already-in-use') {
                        const { signInWithEmailAndPassword } = await import('firebase/auth');
                        const cred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                        idToken = await cred.user.getIdToken();
                    }
                    else throw fbErr;
                }
            }

            const response = await authFetch('/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken,
                    isTest: isTestMode,
                    email: formData.email,
                    phone: isEmailSignup && !isGoogleRegistration ? null : (phone ? `+91${phone}` : null),
                    password: formData.password || null,
                    fullName: formData.fullName,
                    dob: formData.dob
                })
            });

            const data = await response.json();
            const isSellerSession = sellerLogin || startSellingFlow;
            if (data.success) {
                persistUser(data, {
                    phone: phone ? `+91${phone}` : null,
                    email: formData.email,
                    isDevMode: isTestMode,
                    fullName: formData.fullName,
                    dob: formData.dob
                }, isSellerSession);
                sessionStorage.setItem('loginContext', sellerLogin || startSellingFlow ? 'SELLER' : 'CONSUMER');
                
                // Check if there's a pending Buy Now - redirect to checkout immediately
                const pendingBuyNow = localStorage.getItem('pendingBuyNow');
                if (pendingBuyNow && !sellerLogin && !startSellingFlow) {
                    try {
                        const buyNowItem = JSON.parse(pendingBuyNow);
                        localStorage.removeItem('pendingBuyNow');
                        if (onSuccess) onSuccess(data);
                        handleClose();
                        // Navigate after modal closes
                        setTimeout(() => {
                            navigate('/checkout', { state: { buyNowProduct: buyNowItem } });
                        }, 100);
                        return;
                    } catch (error) {
                        console.error('Error parsing pending Buy Now:', error);
                        localStorage.removeItem('pendingBuyNow');
                    }
                }
                
                // Normal flow - no pending Buy Now
                navigate(startSellingFlow ? '/seller/register' : '/');
                
                if (onSuccess) onSuccess(data);
                handleClose();
            } else setError(data.message || 'Registration failed');
        } catch (err) {
            console.error('Registration Error:', err);
            const msg = err.code === 'auth/email-already-in-use'
                ? 'This email is already registered. If you forgot your password, please use Forgot Password or login with other methods.'
                : err.code === 'auth/weak-password'
                    ? 'The password is too weak. Please use at least 6 characters.'
                    : err.code === 'auth/invalid-email'
                        ? 'The email address is not valid.'
                        : err.code === 'auth/operation-not-allowed'
                            ? 'Email registration is currently unavailable. Please try Phone login.'
                            : err.message || 'Registration failed. Please try again.';
            setError(msg);
        }
        finally { setLoading(false); }
    };

    const headerTitle = isEmailLogin ? 'Login with' : isEmailSignup ? 'Register with' : step === 'phone' ? (isRegistering ? 'Create' : 'Welcome to') : 'Verify';
    const headerBrand = isEmailSignup || isEmailLogin ? 'Email' : 'Goodkart';
    const headerSub = isEmailLogin ? 'Enter your credentials to login' : isEmailSignup ? 'Create an account using your email' : step === 'phone' ? (isRegistering ? 'Fill in your details to get started' : 'Login to your account') : `OTP sent to +91 ${phone}`;
    const HeaderIcon = isEmailSignup || isEmailLogin ? Mail : step === 'phone' ? UserIcon : ShieldCheck;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="auth-modal-overlay" onClick={handleClose} key="auth-modal-overlay">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="auth-modal-content"
                        style={{ width: '100%', maxWidth: isRegistering && step === 'phone' ? '500px' : '400px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button className="auth-close-btn" onClick={handleClose}><X size={20} /></button>

                        <div className="auth-header">
                            <div className="auth-icon-container"><HeaderIcon color="white" size={24} /></div>
                            <h2>{headerTitle} <span className="gradient-text">{headerBrand}</span></h2>
                            <p>{headerSub}</p>
                        </div>

                        {error && <div className="auth-error-msg">{error}</div>}

                        {(isEmailLogin || isEmailSignup) ? (
                            <EmailAuthForm
                                hideRegister={hideRegister}
                                isEmailLogin={isEmailLogin}
                                formData={formData} setFormData={setFormData}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                                dobFocused={dobFocused} setDobFocused={setDobFocused}
                                loading={loading}
                                onEmailLogin={handleEmailLogin}
                                onEmailSignup={handleRegisterDirectly}
                                step={emailOtpStep}
                                otp={emailOtp}
                                setOtp={setEmailOtp}
                                onVerifyOtp={handleRegisterDirectly} // The function handles both based on state
                                onSwitchToLogin={() => { setIsEmailSignup(false); setIsEmailLogin(true); setEmailOtpStep('details'); setError(''); }}
                                onSwitchToSignup={() => { setIsEmailLogin(false); setIsRegistering(true); setEmailOtpStep('details'); setError(''); }}
                                onBackToPhone={() => { setIsEmailLogin(false); setIsEmailSignup(false); setEmailOtpStep('details'); setError(''); }}
                            />
                        ) : (
                            <PhoneOtpForm
                                step={step} isRegistering={isRegistering}
                                phone={phone} setPhone={setPhone}
                                otp={otp} setOtp={setOtp}
                                formData={formData} setFormData={setFormData}
                                showPassword={showPassword} setShowPassword={setShowPassword}
                                showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
                                dobFocused={dobFocused} setDobFocused={setDobFocused}
                                loading={loading}
                                onSendOTP={handleSendOTP}
                                onVerify={handleVerifyOrRegister}
                                onRegisterDirect={handleRegisterDirectly}
                                onGoogleSignIn={handleGoogleSignIn}
                                onChangePhone={() => setStep('phone')}
                                onSwitchToEmailLogin={() => setIsEmailLogin(true)}
                            />
                        )}

                        {step === 'phone' && !isEmailSignup && !isEmailLogin && !hideRegister && (
                            <div className="auth-toggle">
                                {isRegistering
                                    ? <p>Already have an account? <button onClick={() => setIsRegistering(false)}>Login</button></p>
                                    : <p>New User? <button onClick={() => setIsRegistering(true)}>Register</button></p>
                                }
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

