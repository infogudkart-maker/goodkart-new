import { Eye, EyeOff, Mail, Lock, User as UserIcon, Calendar } from 'lucide-react';

/**
 * EmailAuthForm — handles both email login and email signup flows.
 * All state and handlers live in AuthModal (the parent); this component
 * just renders the form UI and calls the provided callbacks.
 */
export default function EmailAuthForm({
    hideRegister,
    isEmailLogin,
    formData,
    setFormData,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    dobFocused,
    setDobFocused,
    loading,
    onEmailLogin,
    onEmailSignup,
    onSwitchToLogin,
    onSwitchToSignup,
    onBackToPhone,
    step = 'details', // 'details' | 'otp'
    otp,
    setOtp,
    onVerifyOtp
}) {
    const dateMax = new Date().toISOString().split('T')[0];

    const emailField = (
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
    );

    const passwordField = (
        <div className="auth-input-group">
            <Lock size={18} className="auth-field-icon" />
            <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
            />
            <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
            >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    );

    const registrationOnlyFields = null;

    if (isEmailLogin) {
        return (
            <form onSubmit={onEmailLogin} className="auth-form">
                <div className="auth-fields-grid">
                    {emailField}
                    {passwordField}
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login with Email'}
                    </button>
                    <div className="auth-form-footer">
                        {!hideRegister && <p>Don't have an account? <button type="button" onClick={onSwitchToSignup}>Register</button></p>}
                        <button type="button" className="auth-back-link" onClick={onBackToPhone}>Back to Phone Login</button>
                    </div>
                </div>
            </form>
        );
    }

    // Email Signup form
    return (
        <form onSubmit={onEmailSignup} className="auth-form">
            <div className="auth-fields-grid">
                {registrationOnlyFields}
                {!formData.isGoogleRegistration && emailField}
                {!formData.isGoogleRegistration && (
                    <>
                        {passwordField}
                        <div className="auth-input-group">
                            <Lock size={18} className="auth-field-icon" />
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <button
                                type="button"
                                className="password-toggle-btn"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </>
                )}

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? 'Processing...' : 'Register'}
                </button>

                <div className="auth-form-footer">
                    <p>Already have an account? <button type="button" onClick={onSwitchToLogin}>Login</button></p>
                    <button type="button" className="auth-back-link" onClick={onBackToPhone}>Back to Phone Login</button>
                </div>
            </div>
        </form>
    );
}

