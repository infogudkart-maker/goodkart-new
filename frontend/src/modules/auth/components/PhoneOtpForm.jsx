import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, Eye, EyeOff, Mail, User as UserIcon, Calendar, ArrowRight, ShieldCheck, Send, CheckCircle2 } from 'lucide-react';

// How long the "Sending OTP..." animation plays before the (mock/dev) OTP code is revealed.
const OTP_SEND_DELAY_MS = 2400;

/**
 * PhoneOtpForm — handles the phone number entry + OTP verification steps.
 * Also renders the "Register" variant (extra fields) and the Google sign-in button.
 * All handlers are passed from AuthModal; this is pure UI.
 */
export default function PhoneOtpForm({
    step,
    isRegistering,
    phone,
    setPhone,
    otp,
    setOtp,
    generatedOtp,
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    dobFocused,
    setDobFocused,
    loading,
    onSendOTP,
    onVerify,
    onRegisterDirect,
    onGoogleSignIn,
    onChangePhone,
    onSwitchToEmailLogin,
}) {
    const dateMax = new Date().toISOString().split('T')[0];

    // The on-screen (mock/dev) OTP is not shown instantly: a short "Sending OTP..." animation plays
    // first, then the code is revealed. Real SMS OTPs (generatedOtp === '') skip this entirely.
    const [otpRevealed, setOtpRevealed] = useState(false);
    useEffect(() => {
        setOtpRevealed(false);
        if (step !== 'otp' || !generatedOtp) return undefined;
        const timer = setTimeout(() => setOtpRevealed(true), OTP_SEND_DELAY_MS);
        return () => clearTimeout(timer);
    }, [step, generatedOtp]);
    const waitingForOtp = step === 'otp' && !!generatedOtp && !otpRevealed;

    const registrationFields = (
        <>
            <div className="auth-input-group">
                <UserIcon size={18} className="auth-field-icon" />
                <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                    required
                />
            </div>
            <div className="auth-input-group date-input-wrapper">
                <Calendar size={18} className="auth-field-icon" />
                {!formData.dob && !dobFocused && <span className="date-placeholder">DOB</span>}
                <input
                    type="date"
                    value={formData.dob}
                    onChange={e => setFormData({ ...formData, dob: e.target.value })}
                    onFocus={() => setDobFocused(true)}
                    onBlur={() => setDobFocused(false)}
                    max={dateMax}
                    required
                />
            </div>
            <div className="auth-input-group">
                <Mail size={18} className="auth-field-icon" />
                <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>
        </>
    );

    const passwordFields = (
        <>
            <div className="auth-input-group">
                <Lock size={18} className="auth-field-icon" />
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
            <div className="auth-input-group">
                <Lock size={18} className="auth-field-icon" />
                <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                />
                <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>
        </>
    );

    return (
        <>
            <form
                onSubmit={step === 'phone' ? (isRegistering ? onRegisterDirect : onSendOTP) : onVerify}
                className="auth-form"
            >
                {step === 'phone' ? (
                    <div className="auth-fields-grid">
                        {isRegistering && registrationFields}

                        <div className="auth-input-group phone-input-standard">
                            <Phone size={18} className="auth-field-icon" style={{ position: 'absolute', left: '1rem', zIndex: 1 }} />
                            <div className="phone-prefix-box">+91</div>
                            <input
                                type="tel"
                                placeholder="Mobile Number"
                                value={phone}
                                onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                required
                                disabled={loading}
                                className="phone-main-input"
                            />
                        </div>

                        {isRegistering && passwordFields}

                        <button type="submit" className="auth-submit-btn" disabled={phone.length < 10 || loading}>
                            {loading ? 'Processing...' : (isRegistering ? 'Register' : 'Get OTP')}
                        </button>
                    </div>
                ) : (
                    /* OTP step */
                    <div className="auth-fields-grid">
                        {generatedOtp && (
                            <AnimatePresence mode="wait">
                                {!otpRevealed ? (
                                    <motion.div
                                        key="otp-sending"
                                        className="otp-sending-card"
                                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -8, scale: 0.94 }}
                                        transition={{ duration: 0.3 }}
                                        style={{
                                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                            border: '1.5px solid #bae6fd',
                                            borderRadius: '1rem',
                                            padding: '1.1rem 0.85rem',
                                            textAlign: 'center',
                                            marginBottom: '0.5rem',
                                            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.12)'
                                        }}
                                    >
                                        {/* pulsing rings around a floating "send" icon */}
                                        <div style={{ position: 'relative', width: 56, height: 56, margin: '0 auto 0.7rem' }}>
                                            {[0, 1].map(i => (
                                                <motion.span
                                                    key={i}
                                                    style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid #38bdf8' }}
                                                    initial={{ scale: 0.7, opacity: 0.7 }}
                                                    animate={{ scale: 1.8, opacity: 0 }}
                                                    transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.8, ease: 'easeOut' }}
                                                />
                                            ))}
                                            <motion.div
                                                animate={{ y: [0, -4, 0] }}
                                                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                                                style={{
                                                    position: 'relative', width: 56, height: 56, borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    boxShadow: '0 6px 16px rgba(2, 132, 199, 0.35)'
                                                }}
                                            >
                                                <Send size={24} color="#ffffff" />
                                            </motion.div>
                                        </div>

                                        <div style={{ color: '#0369a1', fontWeight: 600, fontSize: '0.9rem' }}>
                                            Sending OTP to +91 {phone}
                                        </div>

                                        {/* bouncing dots */}
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, margin: '0.6rem 0 0.7rem' }}>
                                            {[0, 1, 2].map(i => (
                                                <motion.span
                                                    key={i}
                                                    style={{ width: 8, height: 8, borderRadius: '50%', background: '#0ea5e9', display: 'block' }}
                                                    animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
                                                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
                                                />
                                            ))}
                                        </div>

                                        {/* progress bar that fills while the OTP is "on its way" */}
                                        <div style={{ height: 4, borderRadius: 4, background: 'rgba(14, 165, 233, 0.18)', overflow: 'hidden' }}>
                                            <motion.div
                                                initial={{ width: '0%' }}
                                                animate={{ width: '100%' }}
                                                transition={{ duration: OTP_SEND_DELAY_MS / 1000, ease: 'easeInOut' }}
                                                style={{ height: '100%', borderRadius: 4, background: 'linear-gradient(90deg, #38bdf8, #0284c7)' }}
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="otp-revealed"
                                        className="otp-popup-card"
                                        initial={{ opacity: 0, scale: 0.85, y: 16 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                                        style={{
                                            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                            border: '1.5px solid #7dd3fc',
                                            borderRadius: '1rem',
                                            padding: '1rem 0.85rem',
                                            textAlign: 'center',
                                            marginBottom: '0.5rem',
                                            boxShadow: '0 4px 14px rgba(14, 165, 233, 0.12)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#0369a1', fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                            <motion.span
                                                initial={{ scale: 0, rotate: -90 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.1 }}
                                                style={{ display: 'flex' }}
                                            >
                                                <CheckCircle2 size={18} style={{ color: '#16a34a' }} />
                                            </motion.span>
                                            <span>OTP sent - your verification code</span>
                                        </div>
                                        {/* digits flip in one after another, then the box gives a soft glow */}
                                        <motion.div
                                            animate={{ boxShadow: ['0 0 0 0 rgba(56, 189, 248, 0)', '0 0 0 8px rgba(56, 189, 248, 0.22)', '0 0 0 0 rgba(56, 189, 248, 0)'] }}
                                            transition={{ duration: 1.1, delay: 0.25 + generatedOtp.length * 0.09, ease: 'easeOut' }}
                                            style={{
                                                fontSize: '1.8rem',
                                                fontWeight: 800,
                                                color: '#0c4a6e',
                                                fontFamily: 'monospace',
                                                background: '#ffffff',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '0.75rem',
                                                border: '1.5px dashed #38bdf8',
                                                display: 'inline-flex',
                                                gap: '0.35rem',
                                                margin: '0.2rem 0',
                                                perspective: 400
                                            }}
                                        >
                                            {generatedOtp.split('').map((digit, i) => (
                                                <motion.span
                                                    key={i}
                                                    initial={{ opacity: 0, y: 14, rotateX: -90 }}
                                                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.25 + i * 0.09 }}
                                                    style={{ display: 'inline-block' }}
                                                >
                                                    {digit}
                                                </motion.span>
                                            ))}
                                        </motion.div>
                                        <p style={{ fontSize: '0.78rem', color: '#0369a1', marginTop: '0.3rem', marginBottom: 0, fontWeight: 500 }}>
                                            Please enter the code shown above to verify & sign in
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}

                        <div className="otp-input-container">
                            <input
                                type="text"
                                placeholder="0 0 0 0 0 0"
                                value={otp}
                                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                disabled={loading || waitingForOtp}
                            />
                        </div>
                        <button type="submit" className="auth-submit-btn" disabled={otp.length < 6 || loading || waitingForOtp}>
                            {loading ? 'Verifying...' : (isRegistering ? 'Complete Registration' : 'Login')} <ArrowRight size={18} />
                        </button>
                        <button
                            type="button"
                            className="auth-back-link"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChangePhone();
                            }}
                        >
                            Change Phone Number
                        </button>
                    </div>
                )}
            </form>

            {/* Google Sign-In + Email toggle — only shown on phone step */}
            {step === 'phone' && (
                <>
                    <div className="auth-divider"><span>OR</span></div>

                    <button type="button" className="auth-google-btn" onClick={onGoogleSignIn} disabled={loading}>
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {!isRegistering && (
                        <button
                            type="button"
                            className="auth-email-btn"
                            onClick={onSwitchToEmailLogin}
                            disabled={loading}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                padding: '0.875rem',
                                background: 'white',
                                border: '1px solid #e2e8f0',
                                borderRadius: '1rem',
                                color: '#334155',
                                fontWeight: 600,
                                fontSize: '0.95rem',
                                cursor: 'pointer',
                                transition: '0.2s',
                                marginTop: '0.75rem'
                            }}
                        >
                            <Mail size={20} />
                            Login with Email
                        </button>
                    )}
                </>
            )}

            <div id="recaptcha-container"></div>
        </>
    );
}

