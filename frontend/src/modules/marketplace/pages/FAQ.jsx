import './PolicyPage.css';
import './FAQ.css';

const customerFAQs = [
    {
        q: 'What is Goodkart?',
        a: 'Goodkart is an online marketplace where home artists and creators can sell their handmade products, and customers can discover unique handcrafted items.'
    },
    {
        q: 'Are the products handmade?',
        a: 'Yes. Most products on Goodkart are handmade or created by independent home artists and small creators.'
    },
    {
        q: 'How do I place an order?',
        list: ['Browse products', 'Add items to cart', 'Proceed to checkout', 'Enter delivery address', 'Complete payment'],
        ordered: true
    },
    {
        q: 'How can I track my order?',
        a: <span>Once your order is shipped, you will receive a tracking ID and can track your delivery from the <strong>My Orders</strong> section.</span>
    },
    {
        q: 'What payment methods are available?',
        a: 'We support:',
        list: ['UPI', 'Debit / Credit Cards', 'Net Banking', 'Cash on Delivery (if available)']
    },
    {
        q: 'How long will delivery take?',
        a: <span>Delivery usually takes <strong>3–7 business days</strong>, depending on your location and the seller's location.</span>
    },
    {
        q: 'Can I cancel my order?',
        a: <span>Yes, orders can be cancelled <strong>before the seller ships</strong> the product.</span>
    },
    {
        q: 'What if the product arrives damaged?',
        a: <span>Please contact support within <strong>48 hours</strong> with photos, and we will assist with replacement or refund.</span>
    },
    {
        q: 'Can I return handmade products?',
        a: 'Return policies may vary depending on the seller and product category.'
    },
];

const sellerFAQs = [
    {
        q: 'Who can sell on Goodkart?',
        a: 'Anyone who creates handmade products, crafts, or artistic items from home can register as a seller.'
    },
    {
        q: 'How do I become a seller?',
        a: <span>Click <strong>"Become a Seller"</strong>, fill in your details, upload required verification documents, and wait for admin approval.</span>
    },
    {
        q: 'Is there any registration fee?',
        a: <span>Currently, seller registration is <strong>free</strong>.</span>
    },
    {
        q: 'How do I list my products?',
        a: 'After approval:',
        list: ['Login to Seller Dashboard', 'Click Add Product', 'Upload images', 'Add description and price'],
        ordered: true
    },
    {
        q: 'How will I receive orders?',
        a: <span>When a customer places an order, you will receive a notification in your <strong>seller dashboard</strong>.</span>
    },
    {
        q: 'How does shipping work?',
        a: <span>Once you mark the item <strong>Ready for Pickup</strong>, our logistics partner will handle shipping.</span>
    },
    {
        q: 'How do I receive payments?',
        a: <span>Payments are transferred to your registered bank account <strong>after the order is delivered</strong>.</span>
    },
    {
        q: 'Can I manage my products?',
        a: 'Yes, sellers can:',
        list: ['Add products', 'Edit products', 'Update stock', 'View orders']
    },
];

function FAQEntry({ index, q, a, list, ordered }) {
    return (
        <div className="faq-entry">
            <p className="faq-q">Q{index}. {q}</p>
            {a && <p className="faq-a">{a}</p>}
            {list && (
                ordered
                    ? <ol className="faq-list">{list.map((item, i) => <li key={i}>{item}</li>)}</ol>
                    : <ul className="faq-list">{list.map((item, i) => <li key={i}>{item}</li>)}</ul>
            )}
        </div>
    );
}

export default function FAQ() {
    return (
        <div className="faq-page">
            <div className="faq-container">
                <section className="faq-section">
                    <h2 className="faq-section-title">Customer FAQs</h2>
                    {customerFAQs.map((item, i) => <FAQEntry key={i} index={i + 1} {...item} />)}
                </section>

                <section className="faq-section">
                    <h2 className="faq-section-title">Seller FAQs</h2>
                    {sellerFAQs.map((item, i) => <FAQEntry key={i} index={i + 1} {...item} />)}
                </section>

                <div className="faq-footer">
                    <p>Goodkart Help Center · For support, visit our website or contact us through the app</p>
                    <p>© 2025 Goodkart. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}

