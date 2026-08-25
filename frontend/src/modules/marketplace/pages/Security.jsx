import './PolicyPage.css';

const EFFECTIVE_DATE = '27 March 2026';
const COMPANY = 'Goodkart';
const EMAIL = 'sumanhp31@gmail.com';

export default function Security() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Security Statement</h1>
                <p className="policy-meta">Effective Date: {EFFECTIVE_DATE}</p>

                <p className="policy-intro">
                    {COMPANY} uses commercially reasonable security practices designed to protect Platform integrity and User data.
                </p>

                <Section title="1.1 Measures We Implement">
                    <ul className="policy-bulletlist">
                        <li>HTTPS/TLS encryption for data in transit</li>
                        <li>Secure authentication and session controls</li>
                        <li>Encryption of sensitive data at rest where appropriate</li>
                        <li>Least-privilege access and role-based controls</li>
                        <li>Monitoring, logging, and anomaly detection</li>
                        <li>Periodic security reviews and patching practices</li>
                    </ul>
                </Section>

                <Section title="1.2 User Responsibilities">
                    <p className="policy-text">Users must:</p>
                    <ul className="policy-bulletlist">
                        <li>Maintain confidentiality of passwords and OTPs</li>
                        <li>Use strong, unique passwords</li>
                        <li>Notify {COMPANY} promptly of suspicious activity</li>
                        <li>Refrain from attempting to bypass security controls</li>
                    </ul>
                </Section>

                <Section title="1.3 Disclaimer">
                    <p className="policy-text">
                        While we take reasonable measures, no system is entirely secure. {COMPANY} shall not be liable for security incidents caused by user negligence (including credential/OTP sharing), compromised devices, third-party network failures, or sophisticated attacks beyond reasonable controls, subject to applicable law.
                    </p>
                </Section>

                <div className="policy-footer">
                    <p>For security concerns: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
                    <p>© 2026 {COMPANY}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="policy-section">
            <h2 className="policy-section-title">{title}</h2>
            {children}
        </div>
    );
}

