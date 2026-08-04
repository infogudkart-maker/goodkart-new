import './PolicyPage.css';

const EFFECTIVE_DATE = '27 March 2026';
const COMPANY = 'Goodkart';
const EMAIL = 'sumanhp31@gmail.com';

export default function Privacy() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Privacy Policy</h1>
                <p className="policy-meta">Effective Date: {EFFECTIVE_DATE}</p>

                <p className="policy-intro">
                    This Privacy Policy explains how {COMPANY} collects, uses, shares, and protects personal data when you use the Platform.
                </p>

                <Section title="1.1 Data We Collect">
                    <p className="policy-text">We may collect:</p>
                    <ul className="policy-bulletlist">
                        <li><strong>Identity &amp; Contact Data:</strong> name, email address, phone number.</li>
                        <li><strong>Address Data:</strong> shipping/billing address and delivery instructions.</li>
                        <li><strong>Transaction Data:</strong> order details, payment status, refund status, and payment-related metadata.</li>
                        <li><strong>Device &amp; Usage Data:</strong> IP address, device identifiers, browser type, operating system, logs, and analytics data.</li>
                        <li><strong>Customer Support Data:</strong> messages, complaints, and dispute-related communications.</li>
                    </ul>
                </Section>

                <Section title="1.2 Purposes of Processing">
                    <p className="policy-text">We use your data to:</p>
                    <ul className="policy-bulletlist">
                        <li>Provide Platform services and process Orders</li>
                        <li>Coordinate shipping and delivery</li>
                        <li>Communicate about Orders, refunds, service updates, and support queries</li>
                        <li>Detect and prevent fraud and abuse</li>
                        <li>Improve Platform performance, security, and user experience</li>
                        <li>Comply with legal obligations and enforce our Terms</li>
                    </ul>
                </Section>

                <Section title="1.3 Data Sharing">
                    <p className="policy-text">We may share limited necessary data with:</p>
                    <ul className="policy-bulletlist">
                        <li><strong>Payment Gateway:</strong> Razorpay (payment processing, fraud checks, refunds).</li>
                        <li><strong>Logistics Partners:</strong> Shiprocket and courier partners (pickups, shipping, delivery, returns).</li>
                        <li><strong>Sellers:</strong> order details necessary to fulfill the purchase.</li>
                        <li><strong>Service Providers:</strong> hosting, analytics, customer support tools, communication vendors, subject to confidentiality obligations.</li>
                        <li><strong>Authorities:</strong> when required by law, court orders, or regulatory requests.</li>
                    </ul>
                    <p className="policy-text">We do not sell personal data.</p>
                </Section>

                <Section title="1.4 Cookies and Tracking">
                    <p className="policy-text">
                        We use cookies and similar technologies for session management, authentication, analytics, and improving Platform usability. You can control cookies through browser/device settings, subject to feature limitations.
                    </p>
                </Section>

                <Section title="1.5 Data Security">
                    <p className="policy-text">
                        We implement reasonable administrative, technical, and organizational safeguards, including encryption in transit (HTTPS/TLS), access controls, logging, and monitoring. However, no method of transmission or storage is completely secure.
                    </p>
                </Section>

                <Section title="1.6 Data Retention">
                    <p className="policy-text">
                        We retain personal data for as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements, after which we securely delete or anonymize it where feasible.
                    </p>
                </Section>

                <Section title="1.7 Your Rights">
                    <p className="policy-text">
                        Subject to applicable law, you may request access, correction, and deletion (where legally permissible), and withdraw consent for optional processing (where applicable). Requests may be submitted to: <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
                    </p>
                </Section>

                <Section title="1.8 Children's Privacy">
                    <p className="policy-text">
                        The Platform is not intended for persons under 18 years. We do not knowingly collect personal data of minors.
                    </p>
                </Section>

                <Section title="1.9 Changes">
                    <p className="policy-text">
                        We may update this Privacy Policy periodically. Continued use indicates acceptance of the updated version.
                    </p>
                </Section>

                <div className="policy-footer">
                    <p>For privacy requests: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
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

