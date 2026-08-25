import './PolicyPage.css';

const EFFECTIVE_DATE = '27 March 2026';
const LAST_UPDATED = '27 March 2026';
const COMPANY = 'Goodkart';
const OFFICE = 'Bangalore';
const EMAIL = 'sumanhp31@gmail.com';
const CITY_STATE = 'Bangalore, Karnataka, India';

export default function TermsOfUse() {
    return (
        <div className="policy-page">
            <div className="policy-container">
                <h1 className="policy-title">Terms of Use</h1>
                <p className="policy-meta">
                    Effective Date: {EFFECTIVE_DATE} &nbsp;|&nbsp; Last Updated: {LAST_UPDATED}
                </p>

                <p className="policy-intro">
                    These Terms of Use ("Terms") constitute a legally binding agreement between <strong>{COMPANY}</strong>, a company incorporated under the laws of India, having its registered office at <strong>{OFFICE}</strong> ("{COMPANY}", "Company", "we", "us", "our") and any person who accesses, browses, registers on, or otherwise uses the Platform ("you", "your", "User").
                </p>
                <p className="policy-intro">
                    By accessing or using {COMPANY}'s website, mobile application, or any related services (collectively, the "Platform"), you acknowledge that you have read, understood, and agree to be bound by these Terms and all policies referenced herein (including the Privacy Policy, Cancellation &amp; Returns Policy, and Security Statement). If you do not agree, you must not access or use the Platform.
                </p>

                <Section title="1.1 Definitions">
                    <DefList items={[
                        ['"Customer"', 'means a User purchasing or seeking to purchase products listed on the Platform.'],
                        ['"Seller"', 'means an independent third-party seller, artisan, creator, or merchant who lists and sells products to Customers via the Platform.'],
                        ['"Product(s)"', 'means goods listed by Sellers on the Platform.'],
                        ['"Order"', 'means a purchase request placed by a Customer for Products listed by a Seller.'],
                        ['"Third-Party Service Providers"', 'include payment gateways (e.g., Razorpay), logistics/shipment partners (e.g., Shiprocket), and other third parties engaged for Platform operations.'],
                    ]} />
                </Section>

                <Section title="1.2 Platform Nature; Intermediary Status">
                    <NumList items={[
                        `${COMPANY} operates solely as a technology and marketplace intermediary platform that enables Sellers and Customers to connect and transact. ${COMPANY} does not manufacture, stock, warehouse, sell, resell, or own inventory of Products listed by Sellers, unless explicitly stated otherwise for a specific category.`,
                        `To the maximum extent permitted under applicable law (including the Information Technology Act, 2000 and rules thereunder), ${COMPANY} acts as an intermediary and is not a party to any contract of sale between the Seller and Customer, except to the limited extent mandated by law.`,
                        'The Seller is solely responsible for the Products, including without limitation: product quality, authenticity, safety, legality, packaging, labeling, warranties, and compliance with applicable laws (including GST, consumer laws, and any sector-specific requirements).',
                    ]} />
                </Section>

                <Section title="1.3 Eligibility; User Representations">
                    <NumList items={[
                        'You must be at least 18 years of age and competent to contract under the Indian Contract Act, 1872 to use the Platform.',
                        'You represent and warrant that all information submitted by you is accurate, current, complete, and not misleading. You agree to promptly update information as necessary.',
                        'You agree not to use the Platform for any unlawful, fraudulent, harmful, or abusive purpose, and not to violate any applicable laws, third-party rights, or these Terms.',
                    ]} />
                </Section>

                <Section title="1.4 User Account; Access; Security">
                    <NumList items={[
                        `Certain features require registration. You are responsible for maintaining the confidentiality of your credentials and for all activities conducted through your account.`,
                        `You agree to immediately notify ${COMPANY} of any unauthorized access or suspected breach of your account.`,
                        `${COMPANY} may suspend or restrict access to the Platform if it reasonably believes account activity is unauthorized, fraudulent, unlawful, or harmful to the Platform or other Users.`,
                    ]} />
                </Section>

                <Section title="1.5 Listings; Pricing; Product Information">
                    <NumList items={[
                        'Sellers are responsible for ensuring that product listings are truthful, accurate, and complete (including descriptions, pricing, images, shipping timelines, and applicable taxes).',
                        `Prices are determined by Sellers unless otherwise specified. ${COMPANY} does not guarantee that Product descriptions, images, or Seller-provided information are accurate.`,
                    ]} />
                </Section>

                <Section title="1.6 Orders; Acceptance; Cancellations">
                    <NumList items={[
                        'Orders placed by Customers are subject to Seller acceptance and availability.',
                        `${COMPANY} reserves the right to cancel, hold, or review Orders in cases of suspected fraud, policy violation, payment irregularity, or risk to Platform integrity.`,
                        'Order cancellations, returns, and refunds are governed by the Cancellation & Returns Policy set out below and any Seller-specific conditions disclosed on the Platform, to the extent not inconsistent with applicable law.',
                    ]} />
                </Section>

                <Section title="1.7 Payments (Razorpay Integration)">
                    <NumList items={[
                        `Payments are processed through third-party payment gateway(s), including Razorpay. ${COMPANY} does not store full card details or sensitive payment instrument data on its servers, except as permitted under applicable law and required for transaction processing.`,
                        "You agree that payment processing is subject to the payment gateway's terms, privacy practices, and dispute resolution policies.",
                        'Refund timelines may vary depending on the payment method, issuing bank, and gateway processing standards.',
                    ]} />
                </Section>

                <Section title="1.8 Logistics & Delivery (Shiprocket / Couriers)">
                    <NumList items={[
                        `Shipping and delivery may be facilitated through third-party logistics providers, including Shiprocket and its courier partners.`,
                        `Delivery timelines displayed are estimates. ${COMPANY} is not responsible for delays caused by couriers, force majeure events, address issues, regulatory checks, or circumstances beyond ${COMPANY}'s reasonable control.`,
                        "Risk of loss and title transfer for Products shall be as per applicable shipping terms and the Seller's arrangements, and may transfer upon handover to the logistics provider, except where consumer protection laws mandate otherwise.",
                    ]} />
                </Section>

                <Section title="1.9 Intellectual Property">
                    <NumList items={[
                        `All Platform content and materials owned or licensed by ${COMPANY}, including the Platform design, software, source code, logos, trademarks, and user interface ("${COMPANY} IP"), are protected by applicable intellectual property laws. No rights are granted except as expressly stated herein.`,
                        `Sellers retain ownership of their product images, trademarks, and listing content ("Seller Content"), but grant ${COMPANY} a worldwide, royalty-free, nonexclusive license to host, display, reproduce, distribute, and market such Seller Content for Platform operations and promotion.`,
                        `You shall not copy, modify, reverse engineer, distribute, or create derivative works of ${COMPANY} IP without prior written consent.`,
                    ]} />
                </Section>

                <Section title="1.10 Prohibited Conduct">
                    <p className="policy-text">You agree not to:</p>
                    <BulletList items={[
                        'Violate laws or third-party rights, including IP rights',
                        'Upload malicious code, attempt unauthorized access, or disrupt the Platform',
                        'Post false, deceptive, defamatory, obscene, or infringing content',
                        'Engage in scraping, harvesting, or automated extraction without permission',
                        'Manipulate reviews/ratings or attempt to circumvent Platform controls',
                    ]} />
                </Section>

                <Section title="1.11 Disclaimer of Warranties">
                    <NumList items={[
                        'The Platform is provided on an "as is" and "as available" basis.',
                        `To the maximum extent permitted by law, ${COMPANY} disclaims all warranties, express or implied, including merchantability, fitness for a particular purpose, non-infringement, and that the Platform will be uninterrupted or error-free.`,
                    ]} />
                </Section>

                <Section title="1.12 Limitation of Liability">
                    <NumList items={[
                        `To the maximum extent permitted by law, ${COMPANY} shall not be liable for indirect, incidental, consequential, punitive, or special damages, including loss of profits, revenue, goodwill, or data.`,
                        `Without limiting the foregoing, ${COMPANY} is not liable for: Seller misconduct, misrepresentation, product defects, authenticity issues, or statutory non-compliance by Sellers; delivery delays or courier failures; third-party service failures (payment gateway, logistics partners, telecom networks); User negligence, including credential sharing or OTP sharing.`,
                        `Where liability cannot be excluded, ${COMPANY}'s aggregate liability shall be limited to the total platform fee (if any) actually received by ${COMPANY} for the relevant transaction giving rise to the claim, subject to applicable law.`,
                    ]} />
                </Section>

                <Section title="1.13 Indemnity">
                    <p className="policy-text">
                        You agree to indemnify, defend, and hold harmless {COMPANY} and its directors, officers, employees, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: your breach of these Terms; your misuse of the Platform; infringement of third-party rights by your content or conduct; violation of law.
                    </p>
                </Section>

                <Section title="1.14 Termination; Suspension">
                    <p className="policy-text">
                        {COMPANY} may suspend or terminate your account and access, with or without notice, if you violate these Terms, applicable policies, or applicable laws, or if required by legal/regulatory authorities.
                    </p>
                </Section>

                <Section title="1.15 Force Majeure">
                    <p className="policy-text">
                        {COMPANY} shall not be liable for failure or delay in performance due to events beyond its reasonable control, including natural disasters, government actions, strikes, logistics disruptions, or failures of third-party networks/services.
                    </p>
                </Section>

                <Section title="1.16 Governing Law; Jurisdiction">
                    <p className="policy-text">
                        These Terms shall be governed by the laws of India. Subject to applicable law, courts at <strong>{CITY_STATE}</strong> shall have exclusive jurisdiction.
                    </p>
                </Section>

                <Section title="1.17 Contact">
                    <p className="policy-text">For questions, disputes, or legal notices:</p>
                    <p className="policy-text">Email: <a href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
                    <p className="policy-text">Address: {OFFICE}</p>
                </Section>

                <div className="policy-footer">
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

function NumList({ items }) {
    return (
        <ol className="policy-numlist">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ol>
    );
}

function BulletList({ items }) {
    return (
        <ul className="policy-bulletlist">
            {items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
    );
}

function DefList({ items }) {
    return (
        <dl className="policy-deflist">
            {items.map(([term, def], i) => (
                <div key={i} className="policy-defitem">
                    <dt>{term}</dt>
                    <dd>{def}</dd>
                </div>
            ))}
        </dl>
    );
}

