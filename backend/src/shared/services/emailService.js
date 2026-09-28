const nodemailer = require('nodemailer');
const path = require('path');
const { getAdminConfig } = require('./adminConfigService');
const { db } = require('../../config/firebase');
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://sellsathifrontend.onrender.com';


// Configure credentials via env variables
const MAILER_CONFIG = {
    user: process.env.MAILER_GOOGLE_USER_EMAIL,
    pass: process.env.MAILER_GOOGLE_USER_PASSWORD,
    service: 'gmail'
};

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: MAILER_CONFIG.service,
    auth: {
        user: MAILER_CONFIG.user,
        pass: MAILER_CONFIG.pass
    }
});

/**
 * Get sender email configuration
 * Gmail requires the authenticated email as sender, but we can set admin email in replyTo
 */
const getSenderConfig = async () => {
    const adminConfig = await getAdminConfig();
    return {
        from: `"${adminConfig.websiteName}" <${MAILER_CONFIG.user}>`, // Must use authenticated email
        replyTo: adminConfig.email // Admin email for replies
    };
};

exports.sendOrderConfirmation = async (email, order, invoiceUrl) => {
    try {
        console.log(`📧 Sending order confirmation email to ${email} for order ${order.orderId}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: email,
            subject: `Order Confirmed: #${order.orderId} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="color: #1e293b; margin-top: 0;">Thank you for your order!</h2>
                        <p>Hi <strong>${order.customerName}</strong>,</p>
                        <p>We're excited to let you know that your order <strong>#${order.orderId}</strong> has been received and is being processed.</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Order Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Order Total:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">₹${order.total}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Status:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #059669; font-weight: 600;">Confirmed</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">
                            We have attached your official invoice to this email. You can also view your order status and manage your account by visiting your dashboard.
                        </p>

                        <div style="text-align: center;">
                            <a href="${FRONTEND_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: `Invoice-${order.orderId}.pdf`,
                    path: invoiceUrl
                }
            ]
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Email Error:', error);
        return null;
    }
};

exports.sendSellerNotification = async (sellerEmail, order, sellerItems) => {
    try {
        console.log(`📧 Sending seller notification to ${sellerEmail}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const itemsHtml = sellerItems.map(item => {
            const hasDiscount = item.originalPrice && item.originalPrice > item.price;
            const priceDisplay = hasDiscount
                ? `<div style="display: flex; align-items: center; gap: 8px; justify-content: flex-end;">
                     <span style="text-decoration: line-through; color: #94a3b8; font-size: 14px;">₹${(item.originalPrice * item.quantity).toFixed(2)}</span>
                     <span style="font-weight: 600; color: #16a34a;">₹${(item.price * item.quantity).toFixed(2)}</span>
                   </div>`
                : `₹${(item.price * item.quantity).toFixed(2)}`;

            return `
            <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 12px 8px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <img src="${item.imageUrl || item.image || ''}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 8px;" />
                        <div>
                            <div style="font-weight: 600; color: #1e293b;">${item.name}</div>
                            ${item.selections ? `<div style="font-size: 12px; color: #64748b; margin-top: 4px;">
                                ${item.selections.color ? `Color: ${item.selections.color}` : ''}
                                ${item.selections.size ? ` | Size: ${item.selections.size}` : ''}
                                ${item.selections.storage ? ` | Storage: ${item.selections.storage}` : ''}
                            </div>` : ''}
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 8px; text-align: center; color: #475569;">x${item.quantity}</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: 600; color: #1e293b;">${priceDisplay}</td>
            </tr>
        `;
        }).join('');

        const totalAmount = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `🎉 New Order Received: #${order.orderId} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    
                    <div style="background: white; border: 2px solid #86efac; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #16a34a; margin: 0; font-size: 24px;">🎉 New Order Alert!</h2>
                        </div>
                        
                        <p style="font-size: 16px; color: #1e293b;">You have received a new order. Please prepare the following items for shipment:</p>
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 24px 0;">
                            <h3 style="margin-top: 0; color: #334155; font-size: 16px;">Order Details</h3>
                            <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Order ID:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">#${order.orderId}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Customer Name:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${order.customerName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Payment Method:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${order.paymentMethod || 'COD'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Order Date:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                </tr>
                            </table>
                        </div>

                        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; margin: 24px 0; overflow: hidden;">
                            <h3 style="margin: 0; padding: 16px; background: #f8fafc; color: #334155; font-size: 16px; border-bottom: 1px solid #e2e8f0;">Your Products</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                                        <th style="padding: 12px 8px; text-align: left; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase;">Product</th>
                                        <th style="padding: 12px 8px; text-align: center; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase;">Qty</th>
                                        <th style="padding: 12px 8px; text-align: right; color: #64748b; font-weight: 600; font-size: 12px; text-transform: uppercase;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${itemsHtml}
                                    <tr style="background: #f8fafc;">
                                        <td colspan="2" style="padding: 16px 8px; text-align: right; font-weight: 600; color: #1e293b; font-size: 16px;">Total:</td>
                                        <td style="padding: 16px 8px; text-align: right; font-weight: 700; color: #16a34a; font-size: 18px;">₹${totalAmount.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 24px 0; border-radius: 4px;">
                            <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px;">📦 Shipping Address</h4>
                            <p style="margin: 0; color: #1e40af; line-height: 1.6;">
                                <strong>${order.customerName}</strong><br>
                                ${order.shippingAddress?.addressLine || ''}<br>
                                ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''} - ${order.shippingAddress?.pincode || ''}<br>
                                ${order.phone ? `Phone: ${order.phone}` : ''}
                            </p>
                        </div>

                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>⚡ Action Required:</strong> Please prepare these items for shipment. The delivery partner will collect the package soon.
                            </p>
                        </div>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Need Help?</strong><br>
                                Contact support at <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong>` : ''}
                            </p>
                        </div>
                    </div>
                    
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Seller email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Seller Email Error:', error);
        return null;
    }
};

exports.sendSellerBlockedEmail = async (sellerEmail, sellerName, shopName, blockReason = 'Policy violation') => {
    try {
        console.log(`📧 Sending seller blocked notification to ${sellerEmail}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `Account Blocked - Action Required - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #dc2626; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 2px solid #fca5a5; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #dc2626; margin: 0; font-size: 24px;">🚫 Account Blocked</h2>
                        </div>
                        
                        <p>Dear <strong>${sellerName}</strong>,</p>
                        
                        <p>We regret to inform you that your seller account for <strong>${shopName}</strong> has been temporarily blocked by our admin team.</p>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${blockReason}</p>
                        </div>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What This Means:</h3>
                        <ul style="color: #475569; line-height: 1.8;">
                            <li>Your products are no longer visible to customers</li>
                            <li>You cannot list new products</li>
                            <li>You cannot process orders</li>
                            <li>Your account access is restricted</li>
                        </ul>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Next Steps:</h3>
                        <ol style="color: #475569; line-height: 1.8;">
                            <li>Review our <a href="${FRONTEND_URL}/terms" style="color: #2563eb;">Terms of Service</a> and <a href="${FRONTEND_URL}/seller-policies" style="color: #2563eb;">Seller Policies</a></li>
                            <li>Contact our support team to discuss the block</li>
                            <li>Provide any necessary documentation or clarification</li>
                            <li>Wait for admin review and potential unblock</li>
                        </ol>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Need Help?</strong><br>
                                Contact our support team at <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong><br>` : ''}
                                Admin: <strong>${adminConfig.name}</strong>
                            </p>
                        </div>

                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                            We take these actions seriously to maintain the quality and trust of our marketplace. If you believe this is a mistake, please contact us immediately.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Seller blocked email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Seller Blocked Email Error:', error);
        return null;
    }
};

exports.sendSellerUnblockedEmail = async (sellerEmail, sellerName, shopName) => {
    try {
        console.log(`📧 Sending seller unblocked notification to ${sellerEmail}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `Account Unblocked - Pending Re-approval - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 2px solid #86efac; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #16a34a; margin: 0; font-size: 24px;">✅ Account Unblocked</h2>
                        </div>
                        
                        <p>Dear <strong>${sellerName}</strong>,</p>
                        
                        <p>Good news! Your seller account for <strong>${shopName}</strong> has been unblocked by our admin team.</p>
                        
                        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #1e40af;"><strong>Current Status:</strong> Pending Re-approval</p>
                        </div>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What Happens Next:</h3>
                        <ol style="color: #475569; line-height: 1.8;">
                            <li>Your account has been moved to <strong>Pending Approvals</strong></li>
                            <li>Our admin team will review your account again</li>
                            <li>Once approved, you can resume selling on our platform</li>
                            <li>You will receive another email when your account is approved</li>
                        </ol>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Important Reminders:</h3>
                        <ul style="color: #475569; line-height: 1.8;">
                            <li>Please ensure compliance with all <a href="${FRONTEND_URL}/seller-policies" style="color: #2563eb;">Seller Policies</a></li>
                            <li>Maintain high-quality product listings</li>
                            <li>Provide excellent customer service</li>
                            <li>Respond promptly to customer inquiries</li>
                            <li>Ship orders on time</li>
                        </ul>

                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>⚠️ Please Note:</strong> Future violations may result in permanent account suspension. We encourage you to review our policies carefully.
                            </p>
                        </div>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Questions?</strong><br>
                                Contact our support team at <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong><br>` : ''}
                                Admin: <strong>${adminConfig.name}</strong>
                            </p>
                        </div>

                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                            Thank you for your patience and understanding. We look forward to having you back as an active seller on our platform!
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Seller unblocked email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Seller Unblocked Email Error:', error);
        return null;
    }
};

exports.sendSellerApprovalEmail = async (sellerEmail, sellerName, shopName) => {
    try {
        console.log(`📧 Sending seller approval notification to ${sellerEmail}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `🎉 Congratulations! Your Seller Account is Approved - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 2px solid #86efac; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #dcfce7; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #16a34a; margin: 0; font-size: 24px;">🎉 Account Approved!</h2>
                        </div>
                        
                        <p>Dear <strong>${sellerName}</strong>,</p>
                        
                        <p>Congratulations! We're thrilled to inform you that your seller account for <strong>${shopName}</strong> has been approved by our admin team!</p>
                        
                        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #1e40af;"><strong>Status:</strong> ✅ APPROVED - You can now start selling!</p>
                        </div>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What You Can Do Now:</h3>
                        <ul style="color: #475569; line-height: 1.8;">
                            <li>✅ List your products on our marketplace</li>
                            <li>✅ Manage your inventory and pricing</li>
                            <li>✅ Receive and process customer orders</li>
                            <li>✅ Track your sales and earnings</li>
                            <li>✅ Access seller analytics and reports</li>
                        </ul>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Getting Started:</h3>
                        <ol style="color: #475569; line-height: 1.8;">
                            <li>Log in to your seller dashboard</li>
                            <li>Complete your shop profile</li>
                            <li>Add your first products</li>
                            <li>Set up your payment and shipping details</li>
                            <li>Start receiving orders!</li>
                        </ol>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>

                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e;">
                                <strong>📋 Important:</strong> Please review our <a href="${FRONTEND_URL}/seller-policies" style="color: #2563eb;">Seller Policies</a> and <a href="${FRONTEND_URL}/terms" style="color: #2563eb;">Terms of Service</a> to ensure compliance.
                            </p>
                        </div>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Need Help?</strong><br>
                                Our support team is here to help you succeed!<br>
                                Email: <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong><br>` : ''}
                                Admin: <strong>${adminConfig.name}</strong>
                            </p>
                        </div>

                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                            Welcome to the ${adminConfig.websiteName} family! We're excited to have you as a seller and look forward to your success on our platform.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Seller approval email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Seller Approval Email Error:', error);
        return null;
    }
};

exports.sendSellerRejectionEmail = async (sellerEmail, sellerName, shopName, rejectionReason = 'Application did not meet our requirements') => {
    try {
        console.log(`📧 Sending seller rejection notification to ${sellerEmail}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `Application Status Update - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 2px solid #fca5a5; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #fee2e2; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #dc2626; margin: 0; font-size: 24px;">Application Status Update</h2>
                        </div>
                        
                        <p>Dear <strong>${sellerName}</strong>,</p>
                        
                        <p>Thank you for your interest in becoming a seller on ${adminConfig.websiteName}. After careful review of your application for <strong>${shopName}</strong>, we regret to inform you that we are unable to approve your seller account at this time.</p>
                        
                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e;"><strong>Reason:</strong> ${rejectionReason}</p>
                        </div>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">What This Means:</h3>
                        <ul style="color: #475569; line-height: 1.8;">
                            <li>Your seller application has not been approved</li>
                            <li>You cannot list products on our marketplace</li>
                            <li>Your account remains as a regular customer account</li>
                            <li>You can still shop on our platform</li>
                        </ul>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Next Steps:</h3>
                        <p style="color: #475569;">If you believe this decision was made in error or if you would like to reapply in the future, please:</p>
                        <ol style="color: #475569; line-height: 1.8;">
                            <li>Review our <a href="${FRONTEND_URL}/seller-requirements" style="color: #2563eb;">Seller Requirements</a></li>
                            <li>Ensure all documentation is complete and accurate</li>
                            <li>Contact our support team for clarification</li>
                            <li>Consider reapplying after addressing the concerns</li>
                        </ol>

                        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #1e40af;">
                                <strong>💡 Tip:</strong> Make sure your business documentation is complete, your product categories are clear, and your shop information is accurate before reapplying.
                            </p>
                        </div>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Questions?</strong><br>
                                Contact our support team for more information:<br>
                                Email: <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong><br>` : ''}
                                Admin: <strong>${adminConfig.name}</strong>
                            </p>
                        </div>

                        <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
                            We appreciate your interest in ${adminConfig.websiteName} and hope to work with you in the future. Thank you for your understanding.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Seller rejection email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Seller Rejection Email Error:', error);
        return null;
    }
};


/**
 * Notify sellers about new orders
 * Groups items by seller and sends individual emails
 * Optimized with batch email fetching (max 10 sellers per query)
 */
exports.notifySellers = async (orderData) => {
    try {
        const items = orderData.items || [];
        if (items.length === 0) return;

        // Group items by sellerId
        const sellerItemsMap = {};
        items.forEach(item => {
            const sellerId = item.sellerId;
            if (!sellerId || sellerId === 'system_generated' || sellerId === 'official') return;

            if (!sellerItemsMap[sellerId]) {
                sellerItemsMap[sellerId] = [];
            }
            sellerItemsMap[sellerId].push(item);
        });

        const sellerIds = Object.keys(sellerItemsMap);
        if (sellerIds.length === 0) {
            console.log('[NotifySellers] No valid sellers to notify');
            return;
        }

        console.log(`[NotifySellers] Notifying ${sellerIds.length} seller(s) for order ${orderData.orderId}`);

        // Batch fetch seller emails (Firestore 'in' query supports up to 10 items)
        const sellerEmails = {};

        // Process in batches of 10
        for (let i = 0; i < sellerIds.length; i += 10) {
            const batch = sellerIds.slice(i, i + 10);

            try {
                const sellersSnap = await db.collection('sellers')
                    .where('__name__', 'in', batch)
                    .get();

                for (const doc of sellersSnap.docs) {
                    const sellerData = doc.data();
                    if (sellerData.sellerStatus === 'APPROVED') {
                        // Try to get email from seller document first
                        let email = sellerData.email || sellerData.contactEmail;

                        // If not found, fetch from users collection
                        if (!email) {
                            const userDoc = await db.collection('users').doc(doc.id).get();
                            if (userDoc.exists()) {
                                email = userDoc.data().email;
                            }
                        }

                        if (email) {
                            sellerEmails[doc.id] = email;
                        }
                    }
                }
            } catch (batchError) {
                console.error(`[NotifySellers] Error fetching batch ${i / 10 + 1}:`, batchError);
            }
        }

        // Send emails to each seller
        const emailPromises = [];
        for (const [sellerId, items] of Object.entries(sellerItemsMap)) {
            const sellerEmail = sellerEmails[sellerId];
            if (sellerEmail) {
                emailPromises.push(
                    exports.sendSellerNotification(sellerEmail, orderData, items)
                        .catch(err => console.error(`[NotifySellers] Failed to send to ${sellerEmail}:`, err))
                );
            } else {
                console.warn(`[NotifySellers] No email found for seller ${sellerId}`);
            }
        }

        await Promise.all(emailPromises);
        console.log(`[NotifySellers] Sent ${emailPromises.length} seller notification(s)`);

    } catch (error) {
        console.error('[NotifySellers] Error:', error);
    }
};

exports.sendOrderCancellation = async (email, order) => {
    try {
        console.log(`📧 Sending order cancellation email to ${email} for order ${order.orderId}`);

        // Get admin configuration and sender config
        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: email,
            subject: `Order Cancelled: #${order.orderId} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #ef4444; margin: 0;">Sellsathi</h1>
                        <p style="color: #64748b; margin: 5px 0;">Your Shopping Partner</p>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="color: #1e293b; margin-top: 0;">Order Cancelled</h2>
                        <p>Hi <strong>${order.customerName}</strong>,</p>
                        <p>This email is to confirm that your order <strong>#${order.orderId}</strong> has been successfully cancelled.</p>
                        
                        <div style="background: #fff1f2; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #fecdd3;">
                            <h3 style="margin-top: 0; color: #9f1239; font-size: 16px;">Order Summary</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Order Total:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">₹${order.total}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Status:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #ef4444; font-weight: 600;">Cancelled</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">
                            The refund (if any) will be processed according to our refund policy. You can check the status of your refund in your dashboard.
                        </p>

                        <div style="text-align: center;">
                            <a href="${FRONTEND_URL}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Dashboard</a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 Sellsathi Marketplace. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Cancellation email sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Cancellation Email Error:', error);
        return null;
    }
};

exports.sendOutOfStockNotification = async (sellerEmail, sellerName, productName, productDetails) => {
    try {
        console.log(`📧 Sending out-of-stock notification to ${sellerEmail} for product "${productName}"`);

        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `⚠️ Product Out of Stock: ${productName} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 2px solid #fde68a; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <div style="background: #fffbeb; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                            <h2 style="color: #d97706; margin: 0; font-size: 24px;">⚠️ Product Out of Stock</h2>
                        </div>

                        <p>Dear <strong>${sellerName}</strong>,</p>

                        <p>This is an important notification from the admin team. Your product listed on <strong>${adminConfig.websiteName}</strong> is currently <strong>out of stock</strong>.</p>

                        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px;">Product Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 6px 0; color: #92400e; font-weight: 600;">Product Name:</td>
                                    <td style="padding: 6px 0; color: #78350f;">${productName}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #92400e; font-weight: 600;">Category:</td>
                                    <td style="padding: 6px 0; color: #78350f;">${productDetails.category || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #92400e; font-weight: 600;">Price:</td>
                                    <td style="padding: 6px 0; color: #78350f;">₹${productDetails.price || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 6px 0; color: #92400e; font-weight: 600;">Current Stock:</td>
                                    <td style="padding: 6px 0; color: #dc2626; font-weight: 700;">0 units</td>
                                </tr>
                            </table>
                        </div>

                        <h3 style="color: #1e293b; font-size: 18px; margin-top: 24px;">Action Required:</h3>
                        <ul style="color: #475569; line-height: 1.8;">
                            <li>Please restock this product as soon as possible</li>
                            <li>Update the stock quantity in your seller dashboard</li>
                            <li>Customers are unable to purchase this product until it is restocked</li>
                        </ul>

                        <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #991b1b;">
                                <strong>⚡ Urgent:</strong> Out-of-stock products affect your sales and customer satisfaction. Please update your inventory at the earliest.
                            </p>
                        </div>

                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>

                        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 24px 0;">
                            <p style="margin: 0; color: #334155; font-size: 14px;">
                                <strong>Need Help?</strong><br>
                                Contact support at <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a><br>
                                ${adminConfig.phone !== 'Not provided' ? `Phone: <strong>${adminConfig.phone}</strong>` : ''}
                            </p>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Out-of-stock email sent successfully:', result.messageId);
        return result;
    } catch (error) {
        console.error('❌ Out-of-Stock Email Error:', error);
        return null;
    }
};


/**
 * Send product removal notification to seller
 */
exports.sendProductRemovedNotification = async (sellerEmail, sellerName, productName, productDetails = {}) => {
    try {
        console.log(`📧 Sending product removal notification to ${sellerEmail} for product: ${productName}`);

        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `Product Removed: ${productName} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="color: #dc2626; margin-top: 0;">⚠️ Product Removed from Website</h2>
                        <p>Hi <strong>${sellerName}</strong>,</p>
                        <p>We're writing to inform you that your product <strong>"${productName}"</strong> has been removed from the website by the admin.</p>
                        
                        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #fecaca;">
                            <h3 style="margin-top: 0; color: #991b1b; font-size: 16px;">Product Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Product Name:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${productName}</td>
                                </tr>
                                ${productDetails.category ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Category:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b;">${productDetails.category}</td>
                                </tr>` : ''}
                                ${productDetails.price ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Price:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b;">₹${productDetails.price}</td>
                                </tr>` : ''}
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Status:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #dc2626; font-weight: 600;">Removed by Admin</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">
                            This product is no longer visible to customers on the website. If you believe this was done in error or have questions, please contact the admin at <a href="mailto:${adminConfig.email}" style="color: #2563eb;">${adminConfig.email}</a>.
                        </p>

                        <div style="text-align: center;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                        <p>Contact Admin: ${adminConfig.email}</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Product removal notification sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Product removal notification error:', error);
        return null;
    }
};

/**
 * Send product restored notification to seller
 */
exports.sendProductRestoredNotification = async (sellerEmail, sellerName, productName, productDetails = {}) => {
    try {
        console.log(`📧 Sending product restored notification to ${sellerEmail} for product: ${productName}`);

        const adminConfig = await getAdminConfig();
        const senderConfig = await getSenderConfig();

        const mailOptions = {
            ...senderConfig,
            to: sellerEmail,
            subject: `Product Restored: ${productName} - ${adminConfig.websiteName}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #2563eb; margin: 0;">${adminConfig.websiteName}</h1>
                        <p style="color: #64748b; margin: 5px 0;">${adminConfig.websiteInfo}</p>
                    </div>
                    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                        <h2 style="color: #16a34a; margin-top: 0;">✅ Product Restored to Website</h2>
                        <p>Hi <strong>${sellerName}</strong>,</p>
                        <p>Great news! Your product <strong>"${productName}"</strong> has been restored and is now live on the website again.</p>
                        
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 24px 0; border: 1px solid #bbf7d0;">
                            <h3 style="margin-top: 0; color: #166534; font-size: 16px;">Product Details</h3>
                            <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Product Name:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b; font-weight: 600;">${productName}</td>
                                </tr>
                                ${productDetails.category ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Category:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b;">${productDetails.category}</td>
                                </tr>` : ''}
                                ${productDetails.price ? `
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Price:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #1e293b;">₹${productDetails.price}</td>
                                </tr>` : ''}
                                <tr>
                                    <td style="padding: 8px 0; color: #64748b;">Status:</td>
                                    <td style="padding: 8px 0; text-align: right; color: #16a34a; font-weight: 600;">Active & Live</td>
                                </tr>
                            </table>
                        </div>

                        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">
                            Your product is now visible to customers and available for purchase. You can manage your products and view sales in your seller dashboard.
                        </p>

                        <div style="text-align: center;">
                            <a href="${FRONTEND_URL}/seller/dashboard" style="background: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Go to Seller Dashboard</a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 24px; color: #94a3b8; font-size: 12px;">
                        <p>&copy; 2026 ${adminConfig.websiteName}. All rights reserved.</p>
                        <p>Contact Admin: ${adminConfig.email}</p>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Product restored notification sent successfully:', result.messageId);
        return result;

    } catch (error) {
        console.error('❌ Product restored notification error:', error);
        return null;
    }
};
