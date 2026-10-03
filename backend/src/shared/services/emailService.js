const fs = require('fs');
const { db, admin } = require('../../config/firebase');

// ============================================================
// SITE CONFIGURATION (website uses hash routing: /#/path)
// ============================================================

const SITE_URL = 'https://www.goodkart.in';
const siteLink = (routePath = '') => `${SITE_URL}/#${routePath}`;
const CUSTOMER_DASHBOARD_URL = siteLink('/dashboard');
const SELLER_DASHBOARD_URL = siteLink('/seller/dashboard');
// Kept for backward compatibility; no longer used in the customer order confirmation email.
const trackOrderUrl = (orderId) =>
    siteLink(`/track?orderId=${encodeURIComponent(orderId ?? '')}`);

// ============================================================
// BRAND CONFIGURATION
// ============================================================

const BRAND_NAME = 'GoodKart';
const BRAND_TAGLINE = 'Your Shopping Partner';
const BRAND_COLOR = '#2563eb';
const BRAND_LOGO_URL =
    'https://res.cloudinary.com/dgabaplay/image/upload/v1789789701/6_zszpq7.png';

const SUPPORT_EMAIL = 'info@ssinphinite.org';
const SUPPORT_PHONE = '7996900699';

// ============================================================
// BREVO CONFIGURATION
// ============================================================

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

if (!BREVO_API_KEY) {
    console.warn(
        '⚠️ BREVO_API_KEY is not configured. Email sending will fail until it is added.'
    );
}

// Sender must be a verified sender / authenticated domain in Brevo.
const BREVO_FROM_EMAIL = process.env.BREVO_FROM_EMAIL || 'notification@goodkart.in';
const BREVO_FROM_NAME = process.env.BREVO_FROM_NAME || BRAND_NAME;

// Accepts "Name <email@x.com>" or "email@x.com"
const parseSender = (value) => {
    if (!value) return { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL };
    const match = String(value).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
    if (match) {
        return {
            name: match[1].replace(/^"|"$/g, '') || BREVO_FROM_NAME,
            email: match[2].trim()
        };
    }
    return { name: BREVO_FROM_NAME, email: String(value).trim() };
};

const DEFAULT_SENDER = { name: BREVO_FROM_NAME, email: BREVO_FROM_EMAIL };

// ============================================================
// SENDER CONFIGURATION
// ============================================================

// Reply-To is ALWAYS the support email (info@ssinphinite.org).
const getSenderConfig = async () => ({
    from: DEFAULT_SENDER,
    replyTo: SUPPORT_EMAIL
});

// ============================================================
// BREVO EMAIL SENDER
// ============================================================

const sendWithBrevo = async (mailOptions) => {
    if (!BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY is missing from environment variables.');
    }

    const sender =
        mailOptions.from && typeof mailOptions.from === 'object'
            ? mailOptions.from
            : parseSender(mailOptions.from);

    const recipients = (Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to])
        .filter(Boolean)
        .map((email) => ({ email: String(email).trim() }));

    const emailData = {
        sender,
        to: recipients,
        subject: mailOptions.subject,
        htmlContent: mailOptions.html
    };

    if (mailOptions.replyTo) {
        emailData.replyTo =
            typeof mailOptions.replyTo === 'object'
                ? mailOptions.replyTo
                : { email: String(mailOptions.replyTo).trim() };
    }

    // Attachments
    if (Array.isArray(mailOptions.attachments) && mailOptions.attachments.length) {
        const processed = [];
        for (const att of mailOptions.attachments) {
            try {
                if (att.content) {
                    const buf = Buffer.isBuffer(att.content)
                        ? att.content
                        : Buffer.from(att.content);
                    processed.push({ name: att.filename, content: buf.toString('base64') });
                } else if (att.path && /^https?:\/\//i.test(att.path)) {
                    processed.push({ name: att.filename, url: att.path });
                } else if (att.path && fs.existsSync(att.path)) {
                    processed.push({
                        name: att.filename,
                        content: fs.readFileSync(att.path).toString('base64')
                    });
                } else {
                    console.warn(`⚠️ Attachment skipped (file not found): ${att.path}`);
                }
            } catch (err) {
                console.error(
                    `⚠️ Attachment skipped (${att.filename}):`,
                    err.message
                );
            }
        }
        if (processed.length) emailData.attachment = processed;
    }

    // Retry on rate limit (HTTP 429)
    let data = null;
    let error = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
        data = null;
        error = null;

        try {
            const res = await fetch(BREVO_API_URL, {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/json',
                    'api-key': BREVO_API_KEY
                },
                body: JSON.stringify(emailData)
            });

            const text = await res.text();
            let json = {};
            try {
                json = text ? JSON.parse(text) : {};
            } catch {
                json = { message: text };
            }

            if (res.ok) {
                data = json;
            } else {
                error = {
                    statusCode: res.status,
                    code: json.code,
                    message: json.message || `Brevo request failed with status ${res.status}`
                };
            }
        } catch (networkErr) {
            error = { message: networkErr.message };
        }

        const rateLimited = error && error.statusCode === 429;
        if (!rateLimited) break;

        console.warn(`⚠️ Brevo rate limit hit (attempt ${attempt}/3), retrying...`);
        await new Promise((r) => setTimeout(r, 1000 * attempt));
    }

    if (error) {
        console.error('❌ Brevo API Error:', error);
        throw new Error(error.message || JSON.stringify(error));
    }

    console.log('✅ Brevo email sent successfully:', data?.messageId);
    return { ...(data || {}), messageId: data?.messageId };
};

// ============================================================
// EMAIL TEMPLATE HELPERS
// ============================================================

const esc = (v) =>
    String(v ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

const money = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const FONT_STACK =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const p = (html, extra = '') =>
    `<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;color:#475569;${extra}">${html}</p>`;

const h3 = (text) =>
    `<h3 style="margin:24px 0 10px 0;font-size:17px;line-height:24px;color:#0f172a;">${text}</h3>`;

const button = (href, label, color = BRAND_COLOR) => `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:24px auto;">
        <tr>
            <td align="center" style="border-radius:8px;background:${color};">
                <a href="${href}" target="_blank"
                   style="display:inline-block;padding:14px 32px;font-family:${FONT_STACK};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:8px;">
                    ${label}
                </a>
            </td>
        </tr>
    </table>
`;

const notice = (html, bg, border, color) => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
        <tr>
            <td style="background:${bg};border-left:4px solid ${border};border-radius:6px;padding:14px 16px;font-size:14px;line-height:22px;color:${color};">
                ${html}
            </td>
        </tr>
    </table>
`;

const list = (items, ordered = false) => {
    const tag = ordered ? 'ol' : 'ul';
    return `
        <${tag} style="margin:0 0 16px 0;padding-left:22px;font-size:15px;line-height:26px;color:#475569;">
            ${items.map((i) => `<li style="margin-bottom:4px;">${i}</li>`).join('')}
        </${tag}>
    `;
};

const detailBox = (title, rows, bg = '#f8fafc', border = '#e2e8f0') => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:20px 0;background:${bg};border:1px solid ${border};border-radius:10px;">
        <tr>
            <td style="padding:18px 18px 8px 18px;font-size:13px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#334155;">
                ${title}
            </td>
        </tr>
        <tr>
            <td style="padding:0 18px 14px 18px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${rows
                        .filter(Boolean)
                        .map(
                            ([label, value, valueColor]) => `
                        <tr>
                            <td style="padding:8px 0;font-size:14px;color:#64748b;border-top:1px solid ${border};">${label}</td>
                            <td align="right" style="padding:8px 0;font-size:14px;font-weight:600;color:${valueColor || '#0f172a'};border-top:1px solid ${border};">${value}</td>
                        </tr>`
                        )
                        .join('')}
                </table>
            </td>
        </tr>
    </table>
`;

const renderItems = (items = []) => {
    if (!Array.isArray(items) || items.length === 0) return '';

    return items
        .map((item) => {
            const qty = Number(item.quantity || 1);
            const hasDiscount =
                item.originalPrice && item.originalPrice > item.price;

            const priceHtml = hasDiscount
                ? `<span style="display:block;font-size:12px;color:#94a3b8;text-decoration:line-through;">${money(item.originalPrice * qty)}</span>
                   <span style="display:block;font-size:15px;font-weight:700;color:#16a34a;">${money(item.price * qty)}</span>`
                : `<span style="display:block;font-size:15px;font-weight:700;color:#0f172a;">${money(item.price * qty)}</span>`;

            const sel = item.selections || {};
            const variantParts = [
                sel.color ? `Color: ${esc(sel.color)}` : '',
                sel.size ? `Size: ${esc(sel.size)}` : '',
                sel.storage ? `Storage: ${esc(sel.storage)}` : ''
            ].filter(Boolean);

            const img = item.imageUrl || item.image || '';

            return `
                <tr>
                    <td style="padding:14px 0;border-top:1px solid #e2e8f0;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                            <tr>
                                <td width="64" valign="top" style="width:64px;padding-right:12px;">
                                    ${
                                        img
                                            ? `<img src="${esc(img)}" alt="${esc(item.name)}" width="60" height="60"
                                                    style="display:block;width:60px;height:60px;object-fit:cover;border-radius:8px;border:1px solid #e2e8f0;" />`
                                            : `<div style="width:60px;height:60px;border-radius:8px;background:#f1f5f9;"></div>`
                                    }
                                </td>
                                <td valign="top" style="font-size:14px;line-height:20px;color:#0f172a;">
                                    <div style="font-weight:600;">${esc(item.name)}</div>
                                    ${
                                        variantParts.length
                                            ? `<div style="font-size:12px;color:#64748b;margin-top:2px;">${variantParts.join(' | ')}</div>`
                                            : ''
                                    }
                                    <div style="font-size:12px;color:#64748b;margin-top:2px;">Qty: ${qty}</div>
                                </td>
                                <td align="right" valign="top" style="white-space:nowrap;padding-left:8px;">
                                    ${priceHtml}
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            `;
        })
        .join('');
};

const itemsBox = (title, items, totalLabel, totalAmount) => {
    const rows = renderItems(items);
    if (!rows) return '';

    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="margin:20px 0;border:1px solid #e2e8f0;border-radius:10px;">
            <tr>
                <td style="padding:16px 18px 4px 18px;font-size:13px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;color:#334155;">
                    ${title}
                </td>
            </tr>
            <tr>
                <td style="padding:0 18px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                        ${rows}
                        ${
                            totalAmount !== undefined
                                ? `<tr>
                                    <td style="padding:14px 0 16px 0;border-top:2px solid #e2e8f0;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-size:15px;font-weight:700;color:#0f172a;">${totalLabel}</td>
                                                <td align="right" style="font-size:18px;font-weight:800;color:#16a34a;">${money(totalAmount)}</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>`
                                : ''
                        }
                    </table>
                </td>
            </tr>
        </table>
    `;
};

const helpSection = () => `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="margin:28px 0 0 0;background:#f1f5f9;border-radius:10px;">
        <tr>
            <td style="padding:18px;font-size:14px;line-height:24px;color:#334155;">
                <div style="font-size:16px;font-weight:700;color:#0f172a;margin-bottom:6px;">Need Help?</div>
                Our support team is happy to assist you.<br>
                📧 Email:
                <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLOR};font-weight:600;text-decoration:none;">${SUPPORT_EMAIL}</a><br>
                📞 Phone:
                <a href="tel:+91${SUPPORT_PHONE}" style="color:${BRAND_COLOR};font-weight:600;text-decoration:none;">${SUPPORT_PHONE}</a>
            </td>
        </tr>
    </table>
`;

const emailLayout = ({
    preheader = '',
    accent = BRAND_COLOR,
    icon = '',
    title = '',
    subtitle = '',
    body = ''
}) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
    <title>${esc(title)}</title>
    <style>
        body, table, td, a { -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
        table, td { mso-table-lspace:0pt; mso-table-rspace:0pt; }
        img { -ms-interpolation-mode:bicubic; border:0; outline:none; text-decoration:none; }
        body { margin:0 !important; padding:0 !important; width:100% !important; background:#f1f5f9; }
        a { word-break:break-word; }
        @media only screen and (max-width:620px) {
            .container { width:100% !important; max-width:100% !important; }
            .outer-pad { padding:0 !important; }
            .px { padding-left:18px !important; padding-right:18px !important; }
            .hero-title { font-size:22px !important; line-height:30px !important; }
            .hero-sub { font-size:14px !important; }
            .logo { height:34px !important; }
        }
    </style>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:${FONT_STACK};">

    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">
        ${esc(preheader)}
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
        <tr>
            <td align="center" class="outer-pad" style="padding:24px 12px;">

                <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0"
                       style="width:600px;max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(15,23,42,0.08);">

                    <tr>
                        <td align="center" class="px" style="padding:22px 28px;background:#ffffff;border-bottom:1px solid #e2e8f0;">
                            <a href="${SITE_URL}" target="_blank" style="text-decoration:none;">
                                <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" class="logo" height="42"
                                     style="display:block;height:42px;width:auto;margin:0 auto;" />
                            </a>
                        </td>
                    </tr>

                    <tr>
                        <td align="center" class="px" style="padding:30px 28px;background:${accent};">
                            ${icon ? `<div style="font-size:38px;line-height:44px;margin-bottom:8px;">${icon}</div>` : ''}
                            <h1 class="hero-title" style="margin:0;font-size:26px;line-height:34px;font-weight:800;color:#ffffff;">${title}</h1>
                            ${subtitle ? `<p class="hero-sub" style="margin:8px 0 0 0;font-size:15px;line-height:22px;color:rgba(255,255,255,0.92);">${subtitle}</p>` : ''}
                        </td>
                    </tr>

                    <tr>
                        <td class="px" style="padding:28px;">
                            ${body}
                            ${helpSection()}
                        </td>
                    </tr>

                    <tr>
                        <td align="center" class="px" style="padding:22px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                            <p style="margin:0 0 6px 0;font-size:14px;font-weight:700;color:#334155;">${BRAND_NAME}</p>
                            <p style="margin:0 0 10px 0;font-size:12px;color:#64748b;">${BRAND_TAGLINE}</p>
                            <p style="margin:0;font-size:12px;line-height:18px;color:#94a3b8;">
                                &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br>
                                <a href="${SITE_URL}" style="color:#94a3b8;text-decoration:underline;">Visit Website</a>
                                &nbsp;|&nbsp;
                                <a href="mailto:${SUPPORT_EMAIL}" style="color:#94a3b8;text-decoration:underline;">Contact Us</a>
                            </p>
                        </td>
                    </tr>

                </table>

            </td>
        </tr>
    </table>
</body>
</html>
`;

// ============================================================
// SMALL SHARED HELPERS
// ============================================================

const shippingAddressBox = (order, title = '📦 Delivering To', bg = '#eff6ff', border = '#bfdbfe', color = '#1e3a8a') => {
    const a = order.shippingAddress;
    if (!a) return '';
    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
            <tr>
                <td style="background:${bg};border:1px solid ${border};border-radius:10px;padding:16px 18px;font-size:14px;line-height:22px;color:${color};">
                    <div style="font-size:13px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:6px;">${title}</div>
                    <strong>${esc(order.customerName)}</strong><br>
                    ${esc(a.addressLine || '')}<br>
                    ${esc(a.city || '')}, ${esc(a.state || '')} - ${esc(a.pincode || '')}
                    ${order.phone ? `<br>Phone: ${esc(order.phone)}` : ''}
                </td>
            </tr>
        </table>
    `;
};

// Generic email sender wrapper - eliminates the try/catch boilerplate
const sendEmail = async (label, to, subject, layoutOptions, extra = {}) => {
    try {
        const senderConfig = await getSenderConfig();
        const mailOptions = {
            ...senderConfig,
            to,
            subject,
            html: emailLayout(layoutOptions),
            ...extra
        };
        const result = await sendWithBrevo(mailOptions);
        console.log(`✅ ${label} sent:`, result.messageId);
        return result;
    } catch (error) {
        console.error(`❌ ${label} Error:`, error);
        return null;
    }
};

// ============================================================
// ORDER CONFIRMATION (CUSTOMER)
// ============================================================

exports.sendOrderConfirmation = async (email, order, invoicePath) => {
    console.log(
        `📧 Sending order confirmation email to ${email} for order ${order.orderId}`
    );

    const body = `
        ${p(`Hi <strong style="color:#0f172a;">${esc(order.customerName)}</strong>,`, 'font-size:16px;')}
        ${p(`Thank you for shopping with us! Your order <strong style="color:#0f172a;">#${esc(order.orderId)}</strong> has been received and is being processed.`)}

        ${detailBox('Order Summary', [
            ['Order ID', `#${esc(order.orderId)}`],
            ['Order Total', money(order.total)],
            ['Status', 'Confirmed', '#059669']
        ])}

        ${itemsBox('Items in Your Order', order.items)}

        ${shippingAddressBox(order)}

        ${p(invoicePath
            ? 'Your official invoice is attached to this email. Use the button below to open your customer dashboard.'
            : 'Use the button below to open your customer dashboard. You can download your invoice from your customer dashboard.', 'font-size:14px;')}

        ${button(CUSTOMER_DASHBOARD_URL, 'Go to Customer Dashboard')}
    `;

    return sendEmail(
        'Order confirmation email',
        email,
        `Order Confirmed: #${order.orderId} - ${BRAND_NAME}`,
        {
            preheader: `Your order #${order.orderId} is confirmed. Thank you for shopping with ${BRAND_NAME}!`,
            accent: '#16a34a',
            icon: '🛍️',
            title: 'Order Confirmed!',
            subtitle: 'Thank you for your order',
            body
        },
        invoicePath
            ? {
                attachments: [
                    { filename: `Invoice-${order.orderId}.pdf`, path: invoicePath }
                ]
            }
            : {}
    );
};

// ============================================================
// SELLER ORDER NOTIFICATION
// ============================================================

exports.sendSellerNotification = async (sellerEmail, order, sellerItems) => {
    console.log(`📧 Sending seller notification to ${sellerEmail}`);

    const totalAmount = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const orderDate = new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    const body = `
        ${p('A new order has been received. Please prepare the following items for shipment. The delivery partner will collect the package soon. Open your Seller Dashboard to view and manage this order.', 'font-size:16px;color:#1e293b;')}

        ${detailBox('Order Details', [
            ['Order ID', `#${esc(order.orderId)}`],
            ['Customer', esc(order.customerName)],
            ['Payment Method', esc(order.paymentMethod || 'COD')],
            ['Order Date', orderDate]
        ])}

        ${itemsBox('Your Products', sellerItems, 'Total', totalAmount)}

        ${shippingAddressBox(order, '📦 Shipping Address')}

        ${notice(
            '<strong>⚡ Action Required:</strong> Please prepare these items for shipment. The delivery partner will collect the package soon.',
            '#fef3c7',
            '#f59e0b',
            '#92400e'
        )}

        ${button(SELLER_DASHBOARD_URL, 'Go to Seller Dashboard')}
    `;

    return sendEmail(
        'Seller notification',
        sellerEmail,
        `🎉 New Order Received: #${order.orderId} - ${BRAND_NAME}`,
        {
            preheader: `New order #${order.orderId} received. Please prepare the items for shipment.`,
            accent: '#16a34a',
            icon: '🎉',
            title: 'New Order Alert!',
            subtitle: `Order #${esc(order.orderId)}`,
            body
        }
    );
};

// ============================================================
// SELLER BLOCKED EMAIL
// ============================================================

exports.sendSellerBlockedEmail = async (
    sellerEmail,
    sellerName,
    shopName,
    blockReason = 'Policy violation'
) => {
    console.log(`📧 Sending seller blocked notification to ${sellerEmail}`);

    const body = `
        ${p(`Dear <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`We regret to inform you that your seller account for <strong style="color:#0f172a;">${esc(shopName)}</strong> has been temporarily blocked by our admin team.`)}

        ${notice(`<strong>Reason:</strong> ${esc(blockReason)}`, '#fef3c7', '#f59e0b', '#92400e')}

        ${h3('What This Means')}
        ${list([
            'Your products are no longer visible to customers',
            'You cannot list new products',
            'You cannot process orders',
            'Your account access is restricted'
        ])}

        ${h3('Next Steps')}
        ${list([
            `Review our <a href="${siteLink('/terms')}" style="color:${BRAND_COLOR};">Terms of Service</a> and <a href="${siteLink('/seller-policies')}" style="color:${BRAND_COLOR};">Seller Policies</a>`,
            'Contact our support team to discuss the block',
            'Provide any necessary documentation or clarification',
            'Wait for admin review and potential unblock'
        ], true)}

        ${p('We take these actions seriously to maintain the quality and trust of our marketplace. If you believe this is a mistake, please contact us immediately.', 'font-size:14px;color:#64748b;')}
    `;

    return sendEmail(
        'Seller blocked email',
        sellerEmail,
        `Account Blocked - Action Required - ${BRAND_NAME}`,
        {
            preheader: 'Your seller account has been temporarily blocked. Action required.',
            accent: '#dc2626',
            icon: '🚫',
            title: 'Account Blocked',
            subtitle: 'Your seller account has been temporarily restricted',
            body
        }
    );
};

// ============================================================
// SELLER UNBLOCKED EMAIL
// ============================================================

exports.sendSellerUnblockedEmail = async (sellerEmail, sellerName, shopName) => {
    console.log(`📧 Sending seller unblocked notification to ${sellerEmail}`);

    const body = `
        ${p(`Dear <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`Good news! Your seller account for <strong style="color:#0f172a;">${esc(shopName)}</strong> has been unblocked by our admin team.`)}

        ${notice('<strong>Current Status:</strong> Pending Re-approval', '#dbeafe', '#2563eb', '#1e40af')}

        ${h3('What Happens Next')}
        ${list([
            'Your account has been moved to <strong>Pending Approvals</strong>',
            'Our admin team will review your account again',
            'Once approved, you can resume selling on our platform',
            'You will receive another email when your account is approved'
        ], true)}

        ${h3('Important Reminders')}
        ${list([
            `Please ensure compliance with all <a href="${siteLink('/seller-policies')}" style="color:${BRAND_COLOR};">Seller Policies</a>`,
            'Maintain high-quality product listings',
            'Provide excellent customer service',
            'Respond promptly to customer inquiries',
            'Ship orders on time'
        ])}

        ${notice(
            '<strong>⚠️ Please Note:</strong> Future violations may result in permanent account suspension. We encourage you to review our policies carefully.',
            '#fef3c7',
            '#f59e0b',
            '#92400e'
        )}

        ${button(SELLER_DASHBOARD_URL, 'Go to Seller Dashboard')}

        ${p('Thank you for your patience and understanding. We look forward to having you back as an active seller on our platform!', 'font-size:14px;color:#64748b;')}
    `;

    return sendEmail(
        'Seller unblocked email',
        sellerEmail,
        `Account Unblocked - Pending Re-approval - ${BRAND_NAME}`,
        {
            preheader: 'Your seller account has been unblocked and is pending re-approval.',
            accent: '#16a34a',
            icon: '✅',
            title: 'Account Unblocked',
            subtitle: 'Your account is now pending re-approval',
            body
        }
    );
};

// ============================================================
// SELLER APPROVAL EMAIL
// ============================================================

exports.sendSellerApprovalEmail = async (sellerEmail, sellerName, shopName) => {
    console.log(`📧 Sending seller approval notification to ${sellerEmail}`);

    const body = `
        ${p(`Dear <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`Congratulations! We're thrilled to inform you that your seller account for <strong style="color:#0f172a;">${esc(shopName)}</strong> has been approved by our admin team!`)}

        ${notice('<strong>Status:</strong> ✅ APPROVED - You can now start selling!', '#dbeafe', '#2563eb', '#1e40af')}

        ${h3('What You Can Do Now')}
        ${list([
            '✅ List your products on our marketplace',
            '✅ Manage your inventory and pricing',
            '✅ Receive and process customer orders',
            '✅ Track your sales and earnings',
            '✅ Access seller analytics and reports'
        ])}

        ${h3('Getting Started')}
        ${list([
            'Log in to your seller dashboard',
            'Complete your shop profile',
            'Add your first products',
            'Set up your payment and shipping details',
            'Start receiving orders!'
        ], true)}

        ${button(SELLER_DASHBOARD_URL, 'Go to Seller Dashboard')}

        ${notice(
            `<strong>📋 Important:</strong> Please review our <a href="${siteLink('/seller-policies')}" style="color:${BRAND_COLOR};">Seller Policies</a> and <a href="${siteLink('/terms')}" style="color:${BRAND_COLOR};">Terms of Service</a> to ensure compliance.`,
            '#fef3c7',
            '#f59e0b',
            '#92400e'
        )}

        ${p(`Welcome to the ${BRAND_NAME} family! We're excited to have you as a seller and look forward to your success on our platform.`, 'font-size:14px;color:#64748b;')}
    `;

    return sendEmail(
        'Seller approval email',
        sellerEmail,
        `🎉 Congratulations! Your Seller Account is Approved - ${BRAND_NAME}`,
        {
            preheader: 'Congratulations! Your seller account is approved. Start selling today.',
            accent: '#16a34a',
            icon: '🎉',
            title: 'Account Approved!',
            subtitle: 'Welcome aboard, you can now start selling',
            body
        }
    );
};

// ============================================================
// SELLER REJECTION EMAIL
// ============================================================

exports.sendSellerRejectionEmail = async (
    sellerEmail,
    sellerName,
    shopName,
    rejectionReason = 'Application did not meet our requirements'
) => {
    console.log(`📧 Sending seller rejection notification to ${sellerEmail}`);

    const body = `
        ${p(`Dear <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`Thank you for your interest in becoming a seller on ${BRAND_NAME}. After careful review of your application for <strong style="color:#0f172a;">${esc(shopName)}</strong>, we regret to inform you that we are unable to approve your seller account at this time.`)}

        ${notice(`<strong>Reason:</strong> ${esc(rejectionReason)}`, '#fef3c7', '#f59e0b', '#92400e')}

        ${h3('What This Means')}
        ${list([
            'Your seller application has not been approved',
            'You cannot list products on our marketplace',
            'Your account remains as a regular customer account',
            'You can still shop on our platform'
        ])}

        ${h3('Next Steps')}
        ${p('If you believe this decision was made in error or would like to reapply in the future, please:')}
        ${list([
            `Review our <a href="${siteLink('/seller-requirements')}" style="color:${BRAND_COLOR};">Seller Requirements</a>`,
            'Ensure all documentation is complete and accurate',
            'Contact our support team for clarification',
            'Consider reapplying after addressing the concerns'
        ], true)}

        ${notice(
            '<strong>💡 Tip:</strong> Make sure your business documentation is complete, your product categories are clear, and your shop information is accurate before reapplying.',
            '#dbeafe',
            '#2563eb',
            '#1e40af'
        )}

        ${p(`We appreciate your interest in ${BRAND_NAME} and hope to work with you in the future. Thank you for your understanding.`, 'font-size:14px;color:#64748b;')}
    `;

    return sendEmail(
        'Seller rejection email',
        sellerEmail,
        `Application Status Update - ${BRAND_NAME}`,
        {
            preheader: 'An update on your seller application.',
            accent: '#475569',
            icon: '📄',
            title: 'Application Status Update',
            subtitle: 'Your seller application has been reviewed',
            body
        }
    );
};

// ============================================================
// NOTIFY SELLERS
// ============================================================

exports.notifySellers = async (orderData) => {
    try {
        const items = orderData.items || [];
        if (items.length === 0) return;

        const sellerItemsMap = {};

        // Use order-level sellerId only if no item has its own sellerId
        const orderLevelSellerId = items.some((i) => i && i.sellerId)
            ? null
            : orderData.sellerId;

        items.forEach((item) => {
            const sellerId = item.sellerId || orderLevelSellerId;
            if (
                !sellerId ||
                sellerId === 'system_generated' ||
                sellerId === 'official'
            )
                return;
            (sellerItemsMap[sellerId] ||= []).push(item);
        });

        const sellerIds = Object.keys(sellerItemsMap);
        if (sellerIds.length === 0) {
            console.log('[NotifySellers] No valid sellers to notify');
            return;
        }

        console.log(
            `[NotifySellers] Notifying ${sellerIds.length} seller(s) for order ${orderData.orderId}`
        );

        const isEmail = (v) =>
            typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

        const firstEmail = (...candidates) => {
            const found = candidates.find(isEmail);
            return found ? found.trim() : null;
        };

        const emailFromSellerDoc = (d = {}) =>
            firstEmail(
                d.contactEmail,
                d.businessInfo?.contactEmail,
                d.emailId,
                d.email,
                d.sellerEmail,
                d.personalInfo?.email
            );

        const getUserEmail = async (uid) => {
            try {
                const userDoc = await db.collection('users').doc(uid).get();
                const userExists =
                    typeof userDoc.exists === 'function'
                        ? userDoc.exists()
                        : userDoc.exists;
                if (userExists) {
                    const d = userDoc.data() || {};
                    const fromUser = firstEmail(d.contactEmail, d.email);
                    if (fromUser) return fromUser;
                }
            } catch (err) {
                console.error(
                    `[NotifySellers] users lookup failed for ${uid}:`,
                    err.message
                );
            }

            try {
                const authUser = await admin.auth().getUser(uid);
                if (isEmail(authUser?.email)) return authUser.email.trim();
            } catch {
                // Not a Firebase Auth user
            }

            return null;
        };

        const sellerEmails = {};
        const foundInSellers = new Set();

        // Firestore 'in' query supports up to 10 items
        for (let i = 0; i < sellerIds.length; i += 10) {
            const batch = sellerIds.slice(i, i + 10);
            try {
                const sellersSnap = await db
                    .collection('sellers')
                    .where('__name__', 'in', batch)
                    .get();

                for (const doc of sellersSnap.docs) {
                    foundInSellers.add(doc.id);
                    const sellerData = doc.data();

                    const status = String(sellerData.sellerStatus || '').toUpperCase();
                    if (status !== 'APPROVED') {
                        console.warn(
                            `[NotifySellers] Seller ${doc.id} skipped - status is "${sellerData.sellerStatus}" (needs APPROVED)`
                        );
                        continue;
                    }

                    let email = emailFromSellerDoc(sellerData);
                    if (!email) email = await getUserEmail(doc.id);

                    if (email) sellerEmails[doc.id] = email;
                    else
                        console.warn(
                            `[NotifySellers] Seller ${doc.id} has no email in sellers or users`
                        );
                }
            } catch (batchError) {
                console.error(
                    `[NotifySellers] Error fetching batch ${i / 10 + 1}:`,
                    batchError
                );
            }
        }

        // Fallback: sellers missing from 'sellers' collection
        for (const sellerId of sellerIds) {
            if (foundInSellers.has(sellerId)) continue;
            console.warn(
                `[NotifySellers] Seller ${sellerId} not found in 'sellers' collection, trying users`
            );
            const fallbackEmail = await getUserEmail(sellerId);
            if (fallbackEmail) sellerEmails[sellerId] = fallbackEmail;
        }

        // Send emails
        const emailPromises = [];
        for (const [sellerId, sellerItems] of Object.entries(sellerItemsMap)) {
            const sellerEmail = sellerEmails[sellerId];
            if (sellerEmail) {
                emailPromises.push(
                    exports
                        .sendSellerNotification(sellerEmail, orderData, sellerItems)
                        .catch((err) =>
                            console.error(
                                `[NotifySellers] Failed to send to ${sellerEmail}:`,
                                err
                            )
                        )
                );
            } else {
                console.warn(
                    `[NotifySellers] No email found for seller ${sellerId}`
                );
            }
        }

        await Promise.all(emailPromises);
        console.log(
            `[NotifySellers] Sent ${emailPromises.length} seller notification(s)`
        );
    } catch (error) {
        console.error('[NotifySellers] Error:', error);
    }
};

// ============================================================
// ORDER CANCELLATION
// ============================================================

exports.sendOrderCancellation = async (email, order) => {
    console.log(
        `📧 Sending order cancellation email to ${email} for order ${order.orderId}`
    );

    const body = `
        ${p(`Hi <strong style="color:#0f172a;">${esc(order.customerName)}</strong>,`, 'font-size:16px;')}
        ${p(`This email confirms that your order <strong style="color:#0f172a;">#${esc(order.orderId)}</strong> has been successfully cancelled.`)}

        ${detailBox('Order Summary', [
            ['Order ID', `#${esc(order.orderId)}`],
            ['Order Total', money(order.total)],
            ['Status', 'Cancelled', '#ef4444']
        ], '#fff1f2', '#fecdd3')}

        ${itemsBox('Cancelled Items', order.items)}

        ${p('The refund (if any) will be processed according to our refund policy. You can check the status of your refund in your dashboard.', 'font-size:14px;')}

        ${button(CUSTOMER_DASHBOARD_URL, 'Go to Dashboard')}

        ${p('We hope to serve you again soon. Happy shopping!', 'font-size:14px;color:#64748b;text-align:center;')}
    `;

    return sendEmail(
        'Cancellation email',
        email,
        `Order Cancelled: #${order.orderId} - ${BRAND_NAME}`,
        {
            preheader: `Your order #${order.orderId} has been cancelled.`,
            accent: '#ef4444',
            icon: '❌',
            title: 'Order Cancelled',
            subtitle: `Order #${esc(order.orderId)}`,
            body
        }
    );
};

// ============================================================
// OUT OF STOCK NOTIFICATION
// ============================================================

exports.sendOutOfStockNotification = async (
    sellerEmail,
    sellerName,
    productName,
    productDetails = {}
) => {
    console.log(
        `📧 Sending out-of-stock notification to ${sellerEmail} for product "${productName}"`
    );

    const body = `
        ${p(`Dear <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`This is an important notification from the admin team. Your product listed on <strong style="color:#0f172a;">${BRAND_NAME}</strong> is currently <strong>out of stock</strong>.`)}

        ${detailBox('Product Details', [
            ['Product Name', esc(productName)],
            ['Category', esc(productDetails.category || 'N/A')],
            ['Price', productDetails.price ? money(productDetails.price) : 'N/A'],
            ['Current Stock', '0 units', '#dc2626']
        ], '#fffbeb', '#fde68a')}

        ${h3('Action Required')}
        ${list([
            'Please restock this product as soon as possible',
            'Update the stock quantity in your seller dashboard',
            'Customers are unable to purchase this product until it is restocked'
        ])}

        ${notice(
            '<strong>⚡ Urgent:</strong> Out-of-stock products affect your sales and customer satisfaction. Please update your inventory at the earliest.',
            '#fee2e2',
            '#dc2626',
            '#991b1b'
        )}

        ${button(SELLER_DASHBOARD_URL, 'Update Stock Now')}
    `;

    return sendEmail(
        'Out-of-stock email',
        sellerEmail,
        `⚠️ Product Out of Stock: ${productName} - ${BRAND_NAME}`,
        {
            preheader: `${productName} is out of stock. Please restock soon.`,
            accent: '#d97706',
            icon: '⚠️',
            title: 'Product Out of Stock',
            subtitle: 'Restock needed to continue selling',
            body
        }
    );
};

// ============================================================
// PRODUCT REMOVED NOTIFICATION
// ============================================================

exports.sendProductRemovedNotification = async (
    sellerEmail,
    sellerName,
    productName,
    productDetails = {}
) => {
    console.log(
        `📧 Sending product removal notification to ${sellerEmail} for product: ${productName}`
    );

    const body = `
        ${p(`Hi <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`We're writing to inform you that your product <strong style="color:#0f172a;">"${esc(productName)}"</strong> has been removed from the website by the admin.`)}

        ${detailBox('Product Details', [
            ['Product Name', esc(productName)],
            productDetails.category ? ['Category', esc(productDetails.category)] : null,
            productDetails.price ? ['Price', money(productDetails.price)] : null,
            ['Status', 'Removed by Admin', '#dc2626']
        ], '#fef2f2', '#fecaca')}

        ${p('This product is no longer visible to customers on the website. If you believe this was done in error or have questions, please contact us using the details below.', 'font-size:14px;')}

        ${button(SELLER_DASHBOARD_URL, 'Go to Seller Dashboard')}
    `;

    return sendEmail(
        'Product removal notification',
        sellerEmail,
        `Product Removed: ${productName} - ${BRAND_NAME}`,
        {
            preheader: `${productName} has been removed from the website.`,
            accent: '#dc2626',
            icon: '🗑️',
            title: 'Product Removed',
            subtitle: 'A product was removed from the website',
            body
        }
    );
};

// ============================================================
// PRODUCT RESTORED NOTIFICATION
// ============================================================

exports.sendProductRestoredNotification = async (
    sellerEmail,
    sellerName,
    productName,
    productDetails = {}
) => {
    console.log(
        `📧 Sending product restored notification to ${sellerEmail} for product: ${productName}`
    );

    const body = `
        ${p(`Hi <strong style="color:#0f172a;">${esc(sellerName)}</strong>,`, 'font-size:16px;')}
        ${p(`Great news! Your product <strong style="color:#0f172a;">"${esc(productName)}"</strong> has been restored and is now live on the website again.`)}

        ${detailBox('Product Details', [
            ['Product Name', esc(productName)],
            productDetails.category ? ['Category', esc(productDetails.category)] : null,
            productDetails.price ? ['Price', money(productDetails.price)] : null,
            ['Status', 'Active & Live', '#16a34a']
        ], '#f0fdf4', '#bbf7d0')}

        ${p('Your product is now visible to customers and available for purchase. You can manage your products and view sales in your seller dashboard.', 'font-size:14px;')}

        ${button(SELLER_DASHBOARD_URL, 'Go to Seller Dashboard', '#16a34a')}
    `;

    return sendEmail(
        'Product restored notification',
        sellerEmail,
        `Product Restored: ${productName} - ${BRAND_NAME}`,
        {
            preheader: `${productName} is live on the website again.`,
            accent: '#16a34a',
            icon: '✅',
            title: 'Product Restored',
            subtitle: 'Your product is live again',
            body
        }
    );
};
