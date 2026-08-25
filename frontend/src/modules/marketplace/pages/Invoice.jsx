import { ArrowLeft, Download, Mail, Phone } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/modules/shared/config/firebase';
import html2pdf from 'html2pdf.js';

export default function Invoice() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoBase64, setLogoBase64] = useState('');

    useEffect(() => {
        const fetchOrder = async () => {
            if (!orderId) {
                setLoading(false);
                return;
            }

            try {
                // First, try to find by document ID
                let orderDoc = await getDoc(doc(db, 'orders', orderId));

                if (orderDoc.exists()) {
                    setOrder({ id: orderDoc.id, ...orderDoc.data() });
                } else {
                    // If not found by document ID, search by orderId field
                    const ordersRef = collection(db, 'orders');
                    const q = query(ordersRef, where('orderId', '==', orderId));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        setOrder({ id: doc.id, ...doc.data() });
                    } else {
                        setOrder(null);
                    }
                }
            } catch (error) {
                // Error fetching order - silent fail
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId]);

    useEffect(() => {
        // Preload logo as base64 so html2canvas can embed it in PDF
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            setLogoBase64(canvas.toDataURL('image/png'));
        };
        img.src = '/goodkart-logo.png';
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('download') === 'true' && order) {
            // Give a small delay for contents to settle
            setTimeout(handleDownload, 1000);
        }
    }, [location, order]);

    const handleDownload = () => {
        if (!order) return;
        
        const element = document.getElementById('invoice-card');
        const opt = {
            margin: [0.2, 0.3, 0.2, 0.3], // Reduced top/bottom margins to maximize space
            filename: `Goodkart_Invoice_${order.orderId || order.id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                allowTaint: true, 
                logging: false,
                windowHeight: element.scrollHeight,
                windowWidth: element.scrollWidth
            },
            jsPDF: { 
                unit: 'in', 
                format: 'a4', 
                orientation: 'portrait',
                compress: true
            },
            pagebreak: { 
                mode: ['css', 'legacy']
            }
        };

        html2pdf().from(element).set(opt).save();
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="container" style={{ padding: '4rem 0', minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <h2>Invoice not found</h2>
                <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                    Go to Dashboard
                </button>
            </div>
        );
    }

    const formatDate = (timestamp) => {
        if (!timestamp) return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        
        try {
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                return timestamp.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            const date = new Date(timestamp);
            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            }
            return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch (error) {
            return new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        }
    };

    // --- Sub-components for cleaned up structure ---

    const InvoiceHeader = ({ title = "Bill of Supply" }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #000' }}>
            <div>
                <h1 style={{ fontSize: '2rem', fontWeight: '700', margin: 0, letterSpacing: '0', color: '#000', textTransform: 'uppercase' }}>{title}</h1>
                <p style={{ color: '#000', fontSize: '1rem', marginTop: '0.25rem', fontWeight: '600' }}>#{order.orderId || order.id}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <img src={logoBase64 || '/goodkart-logo.png'} alt="Goodkart" style={{ width: '55px', height: '55px', objectFit: 'contain' }} />
                <span style={{ lineHeight: 1, letterSpacing: '-0.3px', display: 'flex', flexDirection: 'column' }}>
                    <span>
                        <span style={{ fontSize: '1.6rem', fontWeight: 900, color: '#1800AD' }}>Good</span><span style={{ fontSize: '1.6rem', fontWeight: 400, color: '#5BB8FF' }}>kart</span>
                    </span>
                    <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#1800AD', letterSpacing: '0.3px', textAlign: 'center', marginTop: '2px' }}>Good Deals. Good Life</span>
                </span>
            </div>
        </div>
    );

    const InvoiceDetails = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1rem', fontSize: '11px' }}>
            <div>
                <h3 style={{ fontSize: '11px', fontWeight: '700', color: '#000', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>Bill of Supply Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    <div><span style={{ fontWeight: '700', color: '#000' }}>Bill of Supply Number:</span> <span style={{ color: '#000' }}>{order.orderId || order.id}</span></div>
                    <div><span style={{ fontWeight: '700', color: '#000' }}>Bill of Supply Date:</span> <span style={{ color: '#000' }}>{formatDate(order.createdAt)}</span></div>
                    <div><span style={{ fontWeight: '700', color: '#000' }}>Order Number:</span> <span style={{ color: '#000' }}>{order.orderId || order.id}</span></div>
                </div>
            </div>
            <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1.5rem' }}>
                    <div><span style={{ fontWeight: '700', color: '#000' }}>Nature of transaction:</span> <span style={{ color: '#000' }}>INTRA</span></div>
                    <div><span style={{ fontWeight: '700', color: '#000' }}>Nature Of Supply:</span> <span style={{ color: '#000' }}>Service</span></div>
                </div>
            </div>
        </div>
    );

    const BilledFromTo = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', fontSize: '11px' }}>
            <div>
                <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Billed From</label>
                <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>Goodkart Private Limited</p>
                <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                    No. 123, MG Road, Koramangala<br />
                    Bangalore, Karnataka, India<br />
                    Bangalore, 560034, Karnataka, IN-KA, IN- 560034<br />
                    <span style={{ fontWeight: '700', color: '#000' }}>GSTIN:</span> 29AABCS1234M1ZX<br />
                    <span style={{ fontWeight: '700', color: '#000' }}>PAN:</span> AABCS1234M
                </p>
            </div>
            <div>
                <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Billed To</label>
                <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>
                    {order.billingAddress ? `${order.billingAddress.firstName || ''} ${order.billingAddress.lastName || ''}`.trim() : order.customerName || 'Customer'}
                </p>
                <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                    {order.billingAddress?.addressLine || order.shippingAddress?.addressLine || order.address?.addressLine || 'N/A'}<br />
                    {order.billingAddress?.city || order.shippingAddress?.city || order.address?.city || 'N/A'}, {order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'Karnataka'} - {order.billingAddress?.pincode || order.shippingAddress?.pincode || order.address?.pincode || 'N/A'}<br />
                    {(order.customerInfo?.gstNumber || order.gstNumber) && (
                        <><span style={{ fontWeight: '700', color: '#000' }}>GSTIN:</span> {order.customerInfo?.gstNumber || order.gstNumber}<br /></>
                    )}
                    {(order.businessName || order.customerInfo?.businessName) && (
                        <><span style={{ color: '#000' }}>Business: </span><span style={{ fontWeight: '700', color: '#000' }}>{order.businessName || order.customerInfo?.businessName}</span><br /></>
                    )}
                    <span style={{ fontWeight: '700', color: '#000' }}>State:</span> {order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'Karnataka'}<br />
                    <span style={{ fontWeight: '700', color: '#000' }}>State Code:</span> IN-KA<br />
                    <span style={{ fontWeight: '700', color: '#000' }}>Place of Supply:</span> {(order.billingAddress?.state || order.shippingAddress?.state || order.address?.state || 'KARNATAKA').toUpperCase()}
                </p>
            </div>
        </div>
    );

    const ShippedFromTo = () => (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #000', fontSize: '11px' }}>
            <div>
                <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Shipped From</label>
                <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                    {order.sellerAddress?.addressLine || 'Survey No. 48, 486, 487, 488, 489, 490, 491, 492, 493, 494, 54,'}<br />
                    {order.sellerAddress?.city ? `${order.sellerAddress.city}, ${order.sellerAddress.state || 'Karnataka'} - ${order.sellerAddress.pincode || '580011'}` : 'Kotur Dharwad Dist., Karnataka - 580011,'}<br />
                    {order.sellerAddress?.state || 'KARNATAKA'}, IN-KA,<br />
                    India - {order.sellerAddress?.pincode || '580011'}
                </p>
            </div>
            <div>
                <label style={{ color: '#000', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', letterSpacing: '0.5px' }}>Shipped To</label>
                <p style={{ fontWeight: '700', fontSize: '12px', marginBottom: '0.2rem', color: '#000' }}>
                    {order.shippingAddress ? `${order.shippingAddress.firstName || ''} ${order.shippingAddress.lastName || ''}`.trim() : order.customerName || 'Customer'}
                </p>
                <p style={{ color: '#000', lineHeight: '1.6', margin: 0 }}>
                    {order.shippingAddress?.addressLine || order.address?.addressLine || 'N/A'}<br />
                    {order.shippingAddress?.city || order.address?.city || 'N/A'}, {order.shippingAddress?.state || order.address?.state || 'Karnataka'}, IN-KA,<br />
                    India - {order.shippingAddress?.pincode || order.address?.pincode || 'N/A'}
                </p>
            </div>
        </div>
    );

    const ItemsTable = ({ showPlatformFee = false }) => {
        // Calculate platform fee percentage based on order data or default 3.5%
        const platformFeeBreakdown = order.platformFeeBreakdown || {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        };
        
        const platformFeePercent = Object.values(platformFeeBreakdown).reduce((sum, val) => {
            const num = typeof val === 'number' ? val : (val && typeof val === 'object' ? (val.percent || 0) : 0);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);
        
        // Effective percent includes 18% GST on the fee
        const effectivePlatformFeePercent = platformFeePercent * 1.18;

        // Cumulative totals
        let totalQty = 0;
        let totalGross = 0;
        let totalTaxable = 0;
        let totalSGST = 0;
        let totalCGST = 0;
        let totalPFee = 0;

        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000', background: '#f9fafb' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Particulars</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SAC</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Qty</th>
                            {showPlatformFee && (
                                <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Platform Fees<br/>(Incl. GST)</th>
                            )}
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Gross Amount</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Taxable Value</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>CGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items && order.items.map((item, index) => {
                            const qty = item.quantity || 1;
                            const inclusivePrice = item.priceWithGST || item.price || 0;
                            const gstPercent = item.gstPercent || 18;
                            
                            // Back out taxable value from inclusive price
                            const taxableUnitPrice = inclusivePrice / (1 + (gstPercent / 100));
                            const taxableAmount = taxableUnitPrice * qty;
                            const totalAmount = inclusivePrice * qty;
                            const totalTax = totalAmount - taxableAmount;
                            const sgst = totalTax / 2;
                            const cgst = totalTax / 2;
                            
                            const platformFeeAmount = showPlatformFee ? (taxableAmount * effectivePlatformFeePercent) / 100 : 0;
                            const finalRowTotal = totalAmount + platformFeeAmount;

                            // Update cumulative totals
                            totalQty += qty;
                            totalGross += totalAmount;
                            totalTaxable += taxableAmount;
                            totalSGST += sgst;
                            totalCGST += cgst;
                            totalPFee += platformFeeAmount;
                            
                            return (
                                <tr key={index} style={{ borderBottom: '1px solid #000' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: '500', color: '#000', border: '1px solid #000' }}>
                                        {item.name || item.title || 'Product'}
                                        <div style={{ fontSize: '8px', color: '#666', marginTop: '0.15rem' }}>
                                            SAC: 996511 | GST {gstPercent}% ({(gstPercent/2).toFixed(1)}% + {(gstPercent/2).toFixed(1)}%)
                                        </div>
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>996511</td>
                                    <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>{qty.toFixed(1)}</td>
                                    {showPlatformFee && (
                                        <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeAmount.toFixed(2)}</td>
                                    )}
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{taxableAmount.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{sgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{cgst.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '600', color: '#000', border: '1px solid #000' }}>₹{finalRowTotal.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                        <tr style={{ background: '#f9fafb', fontWeight: '700' }}>
                            <td colSpan="2" style={{ padding: '0.5rem', color: '#000', border: '1px solid #000' }}>Subtotal (Items)</td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>{totalQty.toFixed(1)}</td>
                            {showPlatformFee && (
                                <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalPFee.toFixed(2)}</td>
                            )}
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalGross.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalTaxable.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalSGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{totalCGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{(totalGross + totalPFee).toFixed(2)}</td>
                        </tr>
                        {/* Grand Total - Products Only (No Platform Fee, No Shipping) */}
                        <tr style={{ background: '#f3f4f6', fontWeight: '800', fontSize: '11px' }}>
                            <td colSpan={showPlatformFee ? 8 : 7} style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#000', border: '1px solid #000', textTransform: 'uppercase' }}>Grand Total (Products)</td>
                            <td style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: '#111827', border: '1px solid #000', fontSize: '12px' }}>₹{totalGross.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                {showPlatformFee && (
                    <div style={{ marginTop: '0.3rem', fontSize: '8px', color: '#666' }}>
                        * Platform Fee calculation based on base value (Taxable Value) of items.
                    </div>
                )}
            </div>
        );
    };

    const PlatformFeesTable = () => {
        // Calculate platform fee percentage based on order data or default 3.5%
        const platformFeeBreakdown = order.platformFeeBreakdown || {
            digitalSecurityFee: 1.2,
            merchantVerification: 1.0,
            transitCare: 0.8,
            platformMaintenance: 0.5,
            qualityHandling: 0.0
        };
        
        const platformFeePercent = Object.values(platformFeeBreakdown).reduce((sum, val) => {
            const num = typeof val === 'number' ? val : (val && typeof val === 'object' ? (val.percent || 0) : 0);
            return sum + (isNaN(num) ? 0 : num);
        }, 0);

        // Calculate total product taxable value (sum of all items' taxable values)
        let totalProductTaxable = 0;
        if (order.items) {
            order.items.forEach(item => {
                const qty = item.quantity || 1;
                const inclusivePrice = item.priceWithGST || item.price || 0;
                const gstPercent = item.gstPercent || 18;
                const taxableUnitPrice = inclusivePrice / (1 + (gstPercent / 100));
                const taxableAmount = taxableUnitPrice * qty;
                totalProductTaxable += taxableAmount;
            });
        }

        // Platform fee calculations (base amount before GST)
        const platformFeeBase = (totalProductTaxable * platformFeePercent) / 100;
        const platformFeeCGST = platformFeeBase * 0.09; // 9% CGST
        const platformFeeSGST = platformFeeBase * 0.09; // 9% SGST
        const platformFeeTotalWithGST = platformFeeBase + platformFeeCGST + platformFeeSGST;

        // Other charges
        const shippingCharges = order.estimatedShippingCharge || 0;
        const discount = order.couponDiscount || order.discountValue || 0;

        // Grand Total = Platform Fee (base) + CGST + SGST + Shipping - Discount
        const grandTotal = platformFeeBase + platformFeeCGST + platformFeeSGST + shippingCharges - discount;

        return (
            <div style={{ marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #000' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #000', background: '#f9fafb' }}>
                            <th style={{ textAlign: 'left', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Particulars</th>
                            <th style={{ textAlign: 'center', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SAC</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Platform Fee</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Taxable Value</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>CGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>SGST</th>
                            <th style={{ textAlign: 'right', padding: '0.5rem', color: '#000', fontWeight: '700', fontSize: '10px', border: '1px solid #000' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Platform Fee Row */}
                        <tr style={{ borderBottom: '1px solid #000' }}>
                            <td style={{ padding: '0.5rem', fontWeight: '500', color: '#000', border: '1px solid #000' }}>
                                Platform Service Fee
                                <div style={{ fontSize: '8px', color: '#666', marginTop: '0.15rem' }}>
                                    SAC: 998314 | GST 18% (9% + 9%)
                                </div>
                            </td>
                            <td style={{ textAlign: 'center', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>998314</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeBase.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeBase.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeCGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeSGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', fontWeight: '600', color: '#000', border: '1px solid #000' }}>₹{platformFeeTotalWithGST.toFixed(2)}</td>
                        </tr>

                        {/* Subtotal Row */}
                        <tr style={{ background: '#f9fafb', fontWeight: '700' }}>
                            <td colSpan="2" style={{ padding: '0.5rem', color: '#000', border: '1px solid #000' }}>Subtotal (Platform Charges)</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeBase.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeBase.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeCGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeSGST.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', padding: '0.5rem', color: '#000', border: '1px solid #000' }}>₹{platformFeeTotalWithGST.toFixed(2)}</td>
                        </tr>

                        {/* Shipping Charges */}
                        <tr style={{ fontWeight: '500' }}>
                            <td colSpan="6" style={{ padding: '0.4rem 0.5rem', textAlign: 'right', color: '#000', border: '1px solid #000' }}>Shipping Charges</td>
                            <td style={{ textAlign: 'right', padding: '0.4rem 0.5rem', color: '#000', border: '1px solid #000' }}>₹{shippingCharges.toFixed(2)}</td>
                        </tr>

                        {/* Discount if applicable */}
                        {discount > 0 && (
                            <tr style={{ background: '#f0fdf4', fontWeight: '700', color: '#059669' }}>
                                <td colSpan="6" style={{ padding: '0.5rem', textAlign: 'right', border: '1px solid #000' }}>DISCOUNT VALUE (COUPON)</td>
                                <td style={{ textAlign: 'right', padding: '0.5rem', border: '1px solid #000' }}>-₹{discount.toFixed(2)}</td>
                            </tr>
                        )}

                        {/* Grand Total */}
                        <tr style={{ background: '#f3f4f6', fontWeight: '800', fontSize: '11px' }}>
                            <td colSpan="6" style={{ padding: '0.6rem 0.5rem', textAlign: 'right', color: '#000', border: '1px solid #000', textTransform: 'uppercase' }}>Grand Total (Platform Charges)</td>
                            <td style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: '#111827', border: '1px solid #000', fontSize: '12px' }}>₹{grandTotal.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
                <div style={{ marginTop: '0.3rem', fontSize: '8px', color: '#666' }}>
                    * Platform Fee ({platformFeePercent.toFixed(2)}%) calculated on product taxable value of ₹{totalProductTaxable.toFixed(2)}
                </div>
            </div>
        );
    };

    const InvoiceFooter = () => (
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '2px solid #000', fontSize: '11px' }}>
            <div style={{ 
                padding: '1rem', 
                background: order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected' 
                    ? 'rgba(16, 185, 129, 0.1)' 
                    : 'rgba(245, 158, 11, 0.1)',
                border: `1px solid ${
                    order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected'
                        ? 'rgba(16, 185, 129, 0.3)' 
                        : 'rgba(245, 158, 11, 0.3)'
                }`,
                borderRadius: '8px',
                marginBottom: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#666', fontWeight: '600' }}>PAYMENT METHOD</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '12px', fontWeight: '700', color: '#000', textTransform: 'uppercase' }}>
                        {order.paymentMethod || 'N/A'}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: '10px', color: '#666', fontWeight: '600' }}>PAYMENT STATUS</p>
                    <p style={{ 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '12px', 
                        fontWeight: '700',
                        color: order.paymentStatus === 'Completed' || order.paymentStatus === 'Collected' 
                            ? '#059669' 
                            : '#d97706'
                    }}>
                        {order.paymentStatus === 'Completed' 
                            ? 'PAID ONLINE' 
                            : order.paymentStatus === 'Collected'
                            ? 'PAYMENT COLLECTED'
                            : order.paymentMethod === 'COD' 
                            ? 'PAY ON DELIVERY' 
                            : 'PAID ONLINE'}
                    </p>
                </div>
            </div>
            
            <p style={{ fontStyle: 'italic', color: '#666666', fontSize: '10px', textAlign: 'center', marginBottom: '1rem' }}>
                This is a computer generated invoice, no need for digital signature
            </p>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <p style={{ fontWeight: '700', marginBottom: '0.3rem', color: '#000' }}>Thank you for Shopping!</p>
                    <p style={{ color: '#000', fontSize: '10px', marginBottom: '0' }}>Please contact support if you have any questions.</p>
                </div>
                <div style={{
                    width: '80px', height: '80px', background: '#f9fafb',
                    borderRadius: '4px', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', border: '1px solid #000',
                    fontSize: '10px', color: '#000', textAlign: 'center', fontWeight: '700',
                    flexShrink: 0
                }}>
                    QR<br/>CODE
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
                <p style={{ fontWeight: '700', color: '#000', fontSize: '11px', margin: 0 }}>Goodkart Private Limited - Empowering Local Sellers</p>
                <div style={{ display: 'flex', gap: '1rem', color: '#000', fontSize: '10px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Phone size={12} /> +91 98765 43210</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Mail size={12} /> support@Goodkart.com</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container animate-fade-in" style={{ padding: '4rem 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Action Bar - Non-printable */}
            <div className="no-print flex justify-between items-center" style={{ width: '100%', maxWidth: '850px', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(`/track?orderId=${order.orderId || order.id}`)}
                    className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors text-sm font-medium"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                    <ArrowLeft size={16} />
                    Back to Tracking
                </button>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownload}
                        className="btn flex items-center gap-2"
                        style={{ 
                            padding: '0.6rem 1.2rem', 
                            background: '#10b981', 
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={18} />
                        Download PDF
                    </button>
                </div>
            </div>

            {/* Professional Invoice Card (Single Container for both pages) */}
            <div id="invoice-card" className="invoice-container" style={{
                background: 'white',
                width: '100%',
                maxWidth: '850px',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                color: '#000',
                position: 'relative',
                fontFamily: "'Arial', 'Helvetica', sans-serif",
                fontSize: '12px',
                lineHeight: '1.5'
            }}>
                {/* --- PAGE 1: ORIGINAL INVOICE --- */}
                <div className="invoice-page" style={{ 
                    padding: '1rem 1.5rem', // Tighter padding to save space
                    pageBreakAfter: 'always',
                    position: 'relative'
                }}>
                    <InvoiceHeader title="Bill of Supply" />
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #000' }}>
                        <InvoiceDetails />
                        <BilledFromTo />
                        <ShippedFromTo />
                    </div>
                    <ItemsTable showPlatformFee={false} />
                    <InvoiceFooter />
                </div>

                {/* (Page break is handled by CSS page-break-after on invoice-page) */}

                {/* --- PAGE 2: PLATFORM CHARGES BREAKDOWN --- */}
                <div className="invoice-page" style={{ 
                    padding: '1rem 1.5rem', // Tighter padding to save space
                    position: 'relative'
                }}>
                    <InvoiceHeader title="Bill of Supply - Platform Charges" />
                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #000' }}>
                        <InvoiceDetails />
                        <BilledFromTo />
                    </div>
                    <PlatformFeesTable />
                    <InvoiceFooter />
                </div>
            </div>

            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        body { background: white !important; padding: 0 !important; margin: 0 !important; }
                        .container { padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
                        #invoice-card { 
                            box-shadow: none !important; 
                            border: none !important;
                            width: 100% !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                        }
                        .invoice-page { 
                            page-break-after: always !important;
                            page-break-inside: avoid !important;
                            position: relative !important;
                            box-sizing: border-box !important;
                        }
                        .invoice-page:last-child {
                            page-break-after: auto !important;
                        }
                        .page-break { 
                            display: none !important;
                            height: 0 !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }
                        table { page-break-inside: auto !important; }
                        tr { page-break-inside: avoid !important; page-break-after: auto !important; }
                        thead { display: table-header-group !important; }
                        tfoot { display: table-footer-group !important; }
                    }
                    
                    /* Ensure proper page breaks for PDF generation */
                    .invoice-page {
                        page-break-after: always;
                        page-break-inside: avoid;
                    }
                    
                    .invoice-page:last-child {
                        page-break-after: auto;
                    }
                `}
            </style>
        </div>
    );
}
