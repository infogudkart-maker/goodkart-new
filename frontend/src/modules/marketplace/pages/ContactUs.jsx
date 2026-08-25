import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import './PolicyPage.css';

const COMPANY = 'Goodkart';
const SUPPORT_EMAIL = 'goodkart@gmail.com';

export default function ContactUs() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Contact Us</h1>
                <p className="policy-intro">
                    Have a question about an order, a product, or your account? We're happy to help.
                    Reach out using any of the options below and our team will get back to you as soon as possible.
                </p>

                <div className="policy-section" style={{ borderTop: '1px solid #f1f3f6' }}>
                    <h2 className="policy-section-title">Get in touch</h2>
                    <ul className="policy-bulletlist" style={{ listStyle: 'none', paddingLeft: 0 }}>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <Mail size={16} />
                            <span>Email: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <Phone size={16} />
                            <span>Phone: +91 90000 00000 (Mon–Sat, 10 AM – 6 PM IST)</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                            <MapPin size={16} />
                            <span>Address: {COMPANY} Support, Bengaluru, Karnataka, India</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <Clock size={16} />
                            <span>Response time: within 24–48 hours</span>
                        </li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h2 className="policy-section-title">Order-related queries</h2>
                    <p className="policy-text">
                        For questions about an existing order, please have your Order ID ready — you can find it under
                        "My Orders" in your dashboard, or use the <a href="/#/track">Track Order</a> page.
                    </p>
                </div>

                <div className="policy-footer">
                    <p>For support, email us at: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
                    <p>© 2026 {COMPANY}. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}