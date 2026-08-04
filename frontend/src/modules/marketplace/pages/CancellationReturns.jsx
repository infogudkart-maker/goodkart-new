import './PolicyPage.css';

const EFFECTIVE_DATE = '27 March 2026';
const COMPANY = 'Goodkart';
const EMAIL = 'sumanhp31@gmail.com';

export default function CancellationReturns() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Cancellation &amp; Returns Policy</h1>
                <p className="policy-meta">Effective Date: {EFFECTIVE_DATE}</p>

                <p className="policy-intro">
                    This Cancellation &amp; Returns Policy ("Policy") applies to purchases made on {COMPANY} and must be read with the Terms of Use.
                </p>

                <Section title="1.1 Cancellation Policy">
                    <ol className="policy-numlist">
                        <li>
                            <strong>Before Shipment / Pickup Marking:</strong> Customers may request cancellation before the Seller marks the Order as "Ready for Pickup" (or equivalent status).
                        </li>
                        <li>
                            <strong>After Shipment:</strong> Once shipped, cancellation may not be possible. In such cases, Customers may be eligible for return/refund only in accordance with this Policy.
                        </li>
                        <li>
                            <strong>Seller / Platform Cancellations:</strong> Orders may be cancelled by {COMPANY} or the Seller for reasons including suspected fraud, non-availability, pricing error, or policy breach. Eligible payments will be refunded in accordance with the "Refunds" section.
                        </li>
                    </ol>
                </Section>

                <Section title="1.2 Return Policy">
                    <div className="policy-subsection">
                        <p className="policy-subheading">Return Eligibility</p>
                        <p className="policy-text">Returns are accepted only if the Product:</p>
                        <ul className="policy-bulletlist">
                            <li>is received in a damaged condition; or</li>
                            <li>is incorrect (different from what was ordered); or</li>
                            <li>materially differs from the description shown on the Platform.</li>
                        </ul>
                    </div>

                    <div className="policy-subsection">
                        <p className="policy-subheading">Return Window</p>
                        <p className="policy-text">Return requests must be raised within <strong>48 hours</strong> of delivery.</p>
                    </div>

                    <div className="policy-subsection">
                        <p className="policy-subheading">Evidence Requirement</p>
                        <p className="policy-text">Customers must provide clear proof (photos and/or unedited unboxing video where reasonably required) showing the issue and packaging condition.</p>
                    </div>

                    <div className="policy-subsection">
                        <p className="policy-subheading">Condition of Returned Products</p>
                        <p className="policy-text">Returned Products must be unused and in original condition (unless damaged/defective on arrival) and accompanied by original packaging, tags, invoices, and accessories (if applicable).</p>
                    </div>

                    <div className="policy-subsection">
                        <p className="policy-subheading">Non-Returnable Items <span style={{ fontWeight: 400 }}>(except where required by law)</span></p>
                        <ul className="policy-bulletlist">
                            <li>Custom-made products</li>
                            <li>Personalized products</li>
                            <li>Perishable items</li>
                            <li>Intimate or hygiene-sensitive items (if applicable)</li>
                            <li>Any category explicitly marked "non-returnable" on the Platform</li>
                        </ul>
                    </div>
                </Section>

                <Section title="1.3 Refunds">
                    <ol className="policy-numlist">
                        <li><strong>Verification:</strong> Refunds are processed after Seller verification and/or pickup confirmation, as applicable.</li>
                        <li><strong>Timeline:</strong> Refunds are typically processed within <strong>5–10 business days</strong> after verification/approval; actual credit timelines depend on the payment method and Razorpay/bank processing.</li>
                        <li><strong>Mode:</strong> Refunds are issued to the original payment method unless otherwise required by law.</li>
                        <li><strong>Shipping/Fees:</strong> Shipping charges, COD charges, and convenience fees may be non-refundable unless the return is due to Seller error, damaged goods, incorrect product delivered, or unless required by applicable law.</li>
                    </ol>
                </Section>

                <div className="policy-footer">
                    <p>For support: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
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

