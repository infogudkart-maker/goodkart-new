// ============================================================
// 1) GENERATE INVOICE
//
// generateInvoice() now returns:
// {
//     invoiceUrl: Cloudinary URL,
//     pdfBuffer: actual generated PDF
// }
//
// The PDF buffer is kept in memory and sent directly to Brevo.
// ============================================================

let invoiceUrl = null;
let invoicePdfBuffer = null;

try {
    const invoiceResult =
        await invoiceService.generateInvoice(fullOrder);

    if (invoiceResult) {
        invoiceUrl = invoiceResult.invoiceUrl || null;
        invoicePdfBuffer = invoiceResult.pdfBuffer || null;
    }

    if (invoiceUrl) {
        await orderRef.update({
            invoiceGenerated: true,
            invoicePath: invoiceUrl
        });

        console.log(
            `[PlaceOrder] Invoice saved for ${fullOrder.orderId}: ${invoiceUrl}`
        );
    }

    if (invoicePdfBuffer) {
        console.log(
            `[PlaceOrder] Invoice PDF buffer ready for email: ${invoicePdfBuffer.length} bytes`
        );
    }
} catch (e) {
    console.error(
        `[PlaceOrder] Invoice generation failed for ${fullOrder.orderId}:`,
        e
    );
}


// ============================================================
// 2) CUSTOMER ORDER CONFIRMATION
//
// IMPORTANT:
// Send the actual PDF buffer.
// Do NOT send the Cloudinary URL to Brevo.
// ============================================================

if (customerEmail) {
    emailService
        .sendOrderConfirmation(
            customerEmail,
            fullOrder,
            invoicePdfBuffer
        )
        .then((result) => {
            if (!result) {
                console.error(
                    `[PlaceOrder] Customer confirmation FAILED for order ${fullOrder.orderId}`
                );
            } else {
                console.log(
                    `[PlaceOrder] Customer confirmation email accepted by Brevo for ${fullOrder.orderId}`
                );
            }
        })
        .catch((err) => {
            console.error(
                '[PlaceOrder] Customer email error:',
                err
            );
        });
} else {
    console.warn(
        `[PlaceOrder] No customer email found for uid ${uid}, order ${fullOrder.orderId}`
    );
}
