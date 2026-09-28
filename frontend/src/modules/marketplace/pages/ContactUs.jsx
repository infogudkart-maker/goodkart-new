import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import './PolicyPage.css';

const COMPANY = 'Madhwa Infotech & S S Inphinite LLP';

const SUPPORT_EMAIL = 'goodkart@gmail.com';
const BUSINESS_EMAIL = 'business@madhwainfotech.com';
const INFO_EMAIL = 'info@ssinphinite.org';

const PHONE_PRIMARY = '+91 79969 00699';
const PHONE_SECONDARY = '+91 70263 70266';

export default function ContactUs() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Contact Us</h1>

                <p className="policy-intro">
                    Have a question about an order, a product, or your account? We're happy to help.
                    Reach out using any of the options below and our team will get back to you as soon as possible.
                </p>

                <div
                    className="policy-section"
                    style={{ borderTop: '1px solid #f1f3f6' }}
                >
                    <h2 className="policy-section-title">Get in touch</h2>

                    <ul
                        className="policy-bulletlist"
                        style={{
                            listStyle: 'none',
                            paddingLeft: 0
                        }}
                    >
                        {/* Goodkart Email */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <Mail size={16} />
                            <span>
                                Email:{' '}
                                <a href={`mailto:${SUPPORT_EMAIL}`}>
                                    {SUPPORT_EMAIL}
                                </a>
                            </span>
                        </li>

                        {/* Business Email */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <Mail size={16} />
                            <span>
                                Business Email:{' '}
                                <a href={`mailto:${BUSINESS_EMAIL}`}>
                                    {BUSINESS_EMAIL}
                                </a>
                            </span>
                        </li>

                        {/* Information Email */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <Mail size={16} />
                            <span>
                                Information Email:{' '}
                                <a href={`mailto:${INFO_EMAIL}`}>
                                    {INFO_EMAIL}
                                </a>
                            </span>
                        </li>

                        {/* Primary Phone */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <Phone size={16} />
                            <span>
                                Phone:{' '}
                                <a href={`tel:${PHONE_PRIMARY.replace(/\s/g, '')}`}>
                                    {PHONE_PRIMARY}
                                </a>
                            </span>
                        </li>

                        {/* Secondary Phone */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <Phone size={16} />
                            <span>
                                Phone:{' '}
                                <a href={`tel:${PHONE_SECONDARY.replace(/\s/g, '')}`}>
                                    {PHONE_SECONDARY}
                                </a>
                            </span>
                        </li>

                        {/* Address */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                marginBottom: '0.75rem'
                            }}
                        >
                            <MapPin size={16} />
                            <span>
                                Address: {COMPANY} Support, Bengaluru, Karnataka, India
                            </span>
                        </li>

                        {/* Response Time */}
                        <li
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem'
                            }}
                        >
                            <Clock size={16} />
                            <span>
                                Response time: within 24–48 hours
                            </span>
                        </li>
                    </ul>
                </div>

                <div className="policy-section">
                    <h2 className="policy-section-title">
                        Order-related queries
                    </h2>

                    <p className="policy-text">
                        For questions about an existing order, please have your Order ID ready — you can find it under
                        "My Orders" in your dashboard, or use the{' '}
                        <a href="/#/track">Track Order</a> page.
                    </p>
                </div>

                <div className="policy-footer">
                    <p>
                        For support, email us at:{' '}
                        <a href={`mailto:${SUPPORT_EMAIL}`}>
                            {SUPPORT_EMAIL}
                        </a>
                    </p>

                    <p>
                        Business enquiries:{' '}
                        <a href={`mailto:${BUSINESS_EMAIL}`}>
                            {BUSINESS_EMAIL}
                        </a>
                    </p>

                    <p>
                        General enquiries:{' '}
                        <a href={`mailto:${INFO_EMAIL}`}>
                            {INFO_EMAIL}
                        </a>
                    </p>

                    <p>
                        © 2026 {COMPANY}. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    );
}
